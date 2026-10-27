const User = require("../models/users");
const Settings = require("../models/Settings");
const { authenticateLDAP } = require("../utils/ldapAuth");
const jwt = require("jsonwebtoken");
const AuditLog = require("../models/AuditLog");

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  try {
    const { employeeId, password } = req.body;
    const loginIdentifier = employeeId; // Could be employeeId, username, or email

    // Load LDAP settings early
    const settings = await Settings.findOne();
    const ldapEnabled = settings && settings.ldapConfigs && settings.ldapConfigs.some(c => c.ldapEnabled);

    // If LDAP is enabled, attempt LDAP authentication first
    if (ldapEnabled) {
      try {
        const ldapUser = await authenticateLDAP(loginIdentifier, password);
        if (ldapUser) {
          console.log("LDAP Auth Success. ldapUser:", JSON.stringify(ldapUser));
          // Provision or update local user based on LDAP info using canonical identifiers
          const canonicalEmployeeId = ldapUser.sAMAccountName || ldapUser.userPrincipalName || loginIdentifier;
          const canonicalEmail = ldapUser.email;
          console.log("canonicalEmployeeId:", canonicalEmployeeId, "canonicalEmail:", canonicalEmail);

          let userDoc = await User.findOne({ employeeId: canonicalEmployeeId });
          console.log("Found userDoc:", userDoc ? userDoc._id : "null");

          const fullName = ldapUser.name ||
            (ldapUser.firstName && ldapUser.lastName ? `${ldapUser.firstName} ${ldapUser.lastName}` : canonicalEmployeeId);

          if (!userDoc) {
            userDoc = await User.create({
              employeeId: canonicalEmployeeId,
              employeeName: fullName,
              username: canonicalEmployeeId,
              email: canonicalEmail || `${canonicalEmployeeId}@example.com`,
              password: password, // stored hashed via pre‑save hook if present
              role: 'user',
              department: ldapUser.department || ldapUser.office || 'Unassigned',
              designation: ldapUser.designation || 'LDAP User',
              status: 'active',
              authSource: ldapUser.authSource || 'LDAP'
            });
          } else {
            let updated = false;
            if (fullName && userDoc.employeeName !== fullName) { userDoc.employeeName = fullName; updated = true; }
            if (canonicalEmail && userDoc.email !== canonicalEmail) {
              userDoc.email = canonicalEmail;
              updated = true;
            }
            if (ldapUser.department && userDoc.department !== ldapUser.department) { userDoc.department = ldapUser.department; updated = true; }
            if (ldapUser.designation && userDoc.designation !== ldapUser.designation) { userDoc.designation = ldapUser.designation; updated = true; }
            if (userDoc.authSource !== (ldapUser.authSource || 'LDAP')) { userDoc.authSource = ldapUser.authSource || 'LDAP'; updated = true; }
            if (updated) await userDoc.save();
          }

          // Account status checks
          if (userDoc.status === 'blocked' || userDoc.status === 'inactive' || userDoc.isActive === false) {
            return res.status(403).json({ message: "Your account is restricted. Contact administrator." });
          }

          const token = jwt.sign(
            { id: userDoc._id, role: userDoc.role },
            process.env.JWT_SECRET || "default_secret",
            { expiresIn: "30d" }
          );

          userDoc.lastLogin = new Date();
          await userDoc.save();

          // Log successful login to AuditLog
          await AuditLog.create({
            action: 'USER_LOGGED_IN',
            module: 'Main Master',
            pageName: 'Login',
            activity: `User '${userDoc.employeeName}' Logged In`,
            performedBy: userDoc._id,
            ipAddress: req.ip || req.headers['x-forwarded-for'] || '127.0.0.1'
          });

          return res.json({
            _id: userDoc._id,
            employeeId: userDoc.employeeId,
            employeeName: userDoc.employeeName,
            email: userDoc.email,
            role: userDoc.role,
            department: userDoc.department,
            designation: userDoc.designation,
            token,
          });
        }
      } catch (ldapError) {
        console.error("LDAP auth error:", ldapError.message);
        // Continue to local auth fallback
      }
    }

    // Local authentication fallback
    let user = await User.findOne({
      $or: [
        { employeeId: loginIdentifier },
        { username: loginIdentifier }
      ]
    });
    if (!user) {
      const emailMatches = await User.find({ email: loginIdentifier.toLowerCase() }).limit(2);
      if (emailMatches.length > 1) {
        return res.status(400).json({ message: "This email is shared. Please sign in with your employee ID or username." });
      }
      user = emailMatches[0];
    }

    if (user && (await user.matchPassword(password))) {
      // Check if user account is blocked or inactive
      if (user.status === 'blocked') {
        return res.status(403).json({ message: "Your account has been blocked. Please contact your administrator." });
      }
      if (user.status === 'inactive') {
        return res.status(403).json({ message: "Your account is inactive. Please contact your administrator." });
      }
      // Legacy fallback: check isActive boolean for old accounts
      if (user.isActive === false) {
        return res.status(403).json({ message: "Your account has been deactivated. Please contact your administrator." });
      }

      // Generate Token
      const token = jwt.sign(
        { id: user._id, role: user.role },
        process.env.JWT_SECRET || "default_secret",
        { expiresIn: "30d" }
      );

      // Update lastLogin
      user.lastLogin = new Date();
      await user.save();

      // Log successful login to AuditLog
      await AuditLog.create({
        action: 'USER_LOGGED_IN',
        module: 'Main Master',
        pageName: 'Login',
        activity: `User '${user.employeeName}' Logged In`,
        performedBy: user._id,
        ipAddress: req.ip || req.headers['x-forwarded-for'] || '127.0.0.1'
      });

      res.json({
        _id: user._id,
        employeeId: user.employeeId,
        employeeName: user.employeeName,
        email: user.email,
        role: user.role,
        department: user.department,
        designation: user.designation,
        photo: user.photo,
        status: user.status,
        lastLogin: user.lastLogin,
        token: token,
      });
    } else {
      // Log failed/unauthorized login to AuditLog
      await AuditLog.create({
        action: 'UNAUTHORIZED_ACCESS',
        module: 'Main Master',
        pageName: 'Login',
        activity: `Unauthorized Access - Tried to Login with Invalid Employee ID/Password`,
        performedBy: null,
        ipAddress: req.ip || req.headers['x-forwarded-for'] || '127.0.0.1',
        details: { loginIdentifier }
      });
      res.status(401).json({ message: "Invalid Username/Email or Password" });
    }
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ message: "Server error during login" });
  }
};


// @desc    Get all users
// @route   GET /api/users
// @access  Private/Admin
const getUsers = async (req, res) => {
  try {
    const users = await User.find({}).select("-password");
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: "Error fetching users" });
  }
};

// Minimal directory for authenticated staff selectors, separate from user administration.
const getUserDirectory = async (req, res) => {
  try {
    const users = await User.find({ isActive: { $ne: false }, status: { $nin: ['blocked', 'inactive'] } })
      .select('_id employeeId employeeName department designation status isActive')
      .sort({ employeeName: 1, employeeId: 1 });
    res.json(users);
  } catch { res.status(500).json({ message: 'Could not load the staff directory. Please try again.' }); }
};

// @desc    Create new user
// @route   POST /api/users
// @access  Private/Admin
const createUser = async (req, res) => {
  try {
    const { employeeId, employeeName, email, password, role, department, designation } = req.body;

    // Validation
    const requiredFields = { employeeId, employeeName, email, password, department, designation };
    const missingFields = Object.keys(requiredFields).filter(field => !requiredFields[field]);
    
    if (missingFields.length > 0) {
      return res.status(400).json({ 
        message: `Please provide all required fields: ${missingFields.join(', ')}` 
      });
    }

    const userExists = await User.findOne({ employeeId });

    if (userExists) {
      return res.status(400).json({ message: "User already exists with this Employee ID" });
    }

    const user = await User.create({
      employeeId,
      username: req.body.username || employeeId, // Fallback to employeeId if no username provided
      employeeName,
      email,
      password,
      role,
      department,
      designation,
    });

    if (user) {
      res.status(201).json({
        _id: user._id,
        employeeId: user.employeeId,
        employeeName: user.employeeName,
        email: user.email,
        role: user.role,
      });
    } else {
      res.status(400).json({ message: "Invalid user data" });
    }
  } catch (error) {
    console.error("Create User Error:", error);
    res.status(500).json({ message: error.message || "Internal Server Error" });
  }
};

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private/Admin
const updateUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

      if (user) {
        // Only allow safe fields to be updated; AD-managed fields are immutable
        const allowedUpdates = ['department', 'designation', 'role'];
        allowedUpdates.forEach(field => {
          if (req.body[field] !== undefined) user[field] = req.body[field];
        });
        // password, employeeName, email, username remain unchanged
        const updatedUser = await user.save();
        res.json({
          _id: updatedUser._id,
          employeeName: updatedUser.employeeName,
          email: updatedUser.email,
          role: updatedUser.role,
          department: updatedUser.department,
          designation: updatedUser.designation,
          isActive: updatedUser.isActive,
        });
      } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Set user status (active / blocked / inactive)
// @route   PATCH /api/users/:id/toggle-status
// @access  Private/Admin
const toggleUserStatus = async (req, res) => {
  try {
    const { status } = req.body; // 'active' | 'blocked' | 'inactive'
    const validStatuses = ['active', 'blocked', 'inactive'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status value. Use: active, blocked, or inactive." });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const requesterId = req.user._id.toString();
    const targetId   = user._id.toString();
    const requesterRole = req.user.role;

    // Rule 1: Only superadmin can change their own status
    if (requesterId === targetId && requesterRole?.toLowerCase() !== 'superadmin') {
      return res.status(403).json({ message: "You cannot change your own account status." });
    }

    // Rule 2: Only superadmin can change another superadmin's status
    if (user.role?.toLowerCase() === 'superadmin' && requesterRole?.toLowerCase() !== 'superadmin') {
      return res.status(403).json({ message: "Only a Super Admin can modify another Super Admin's status." });
    }

    user.status = status;
    user.isActive = (status === 'active');
    await user.save();

    const labels = { active: 'activated', blocked: 'blocked', inactive: 'deactivated' };
    res.json({
      _id: user._id,
      employeeName: user.employeeName,
      status: user.status,
      message: `User ${labels[status]} successfully`,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update own profile
// @route   PUT /api/users/profile
// @access  Private
const updateUserProfile = async (req, res) => {
  console.log("Update Profile Request received for user:", req.user?._id);
  console.log("File info:", req.file);
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      user.employeeName = req.body.employeeName || user.employeeName;
      user.email = req.body.email || user.email;
      
      if (req.body.removePhoto === 'true' || req.body.removePhoto === true) {
        user.photo = "";
      } else if (req.file) {
        user.photo = `/uploads/profiles/${req.file.filename}`;
      }

      // password updates are disabled - not editable

      const updatedUser = await user.save();

      res.json({
        _id: updatedUser._id,
        employeeId: updatedUser.employeeId,
        employeeName: updatedUser.employeeName,
        email: updatedUser.email,
        role: updatedUser.role,
        department: updatedUser.department,
        designation: updatedUser.designation,
        photo: updatedUser.photo,
        status: updatedUser.status,
        lastLogin: updatedUser.lastLogin,
        token: req.headers.authorization.split(' ')[1] // Send back the same token
      });
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private/SuperAdmin
const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (user) {
      await user.deleteOne();
      res.json({ message: "User removed successfully" });
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  loginUser,
  getUsers,
  getUserDirectory,
  createUser,
  updateUser,
  toggleUserStatus,
  updateUserProfile,
  deleteUser,
};
