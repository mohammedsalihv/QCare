const User = require("../models/users");
const Settings = require("../models/Settings");
const { authenticateLDAP } = require("../utils/ldapAuth");
const jwt = require("jsonwebtoken");

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  try {
    const { employeeId, password } = req.body;
    const loginIdentifier = employeeId; // Contains either EMP ID, Username, or Email

    // Find user by employeeId, username (stored in employeeId for AD), or email
    const user = await User.findOne({
      $or: [
        { employeeId: loginIdentifier },
        { email: loginIdentifier.toLowerCase() }
      ]
    });

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
      // If local authentication fails, check LDAP
      const settings = await Settings.findOne();
      if (settings && settings.ldapEnabled) {
        try {
          // If the user was found locally by email, use their stored employeeId (AD username) for LDAP bind
          const ldapLookupId = user ? user.employeeId : loginIdentifier;
          
          const ldapUser = await authenticateLDAP(ldapLookupId, password);
          if (ldapUser) {
            // Find or provision user locally using the canonical LDAP ID
            let userDoc = await User.findOne({ employeeId: ldapLookupId });
            
            // Construct best-effort name from AD fields if standard name field is missing
            const fullName = ldapUser.name || 
                             (ldapUser.firstName && ldapUser.lastName ? `${ldapUser.firstName} ${ldapUser.lastName}` : null) || 
                             ldapLookupId;

            if (!userDoc) {
              // JIT Provisioning for LDAP users
              userDoc = await User.create({
                employeeId: ldapLookupId,
                employeeName: fullName,
                email: ldapUser.email || `${ldapLookupId}@internal.com`,
                password: password, // Store encrypted for local fallback if desired
                role: 'user', // Default role (fixed from 'staff' which was not in enum)
                department: ldapUser.department || ldapUser.office || 'Unassigned',
                designation: ldapUser.designation || 'LDAP User',
                status: 'active'
              });
            } else {
              // Optional: Update local user data with fresh AD data on each login
              let updated = false;
              if (fullName !== ldapLookupId && userDoc.employeeName !== fullName) { userDoc.employeeName = fullName; updated = true; }
              if (ldapUser.email && userDoc.email !== ldapUser.email) { userDoc.email = ldapUser.email; updated = true; }
              if (ldapUser.department && userDoc.department !== ldapUser.department) { userDoc.department = ldapUser.department; updated = true; }
              if (ldapUser.designation && userDoc.designation !== ldapUser.designation) { userDoc.designation = ldapUser.designation; updated = true; }
              
              if (updated) {
                await userDoc.save();
              }
            }

            // Standard login logic for the LDAP user
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

            return res.json({
              _id: userDoc._id,
              employeeId: userDoc.employeeId,
              employeeName: userDoc.employeeName,
              email: userDoc.email,
              role: userDoc.role,
              department: userDoc.department,
              designation: userDoc.designation,
              token: token,
            });
          }
        } catch (ldapError) {
          console.error("LDAP Auth Failed:", ldapError.message);
        }
      }
      res.status(401).json({ message: "Invalid Employee ID or Password" });
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
      user.employeeName = req.body.employeeName || user.employeeName;
      user.email = req.body.email || user.email;
      user.role = req.body.role || user.role;
      user.department = req.body.department || user.department;
      user.designation = req.body.designation || user.designation;

      if (req.body.password) {
        user.password = req.body.password;
      }

      const updatedUser = await user.save();

      res.json({
        _id: updatedUser._id,
        employeeName: updatedUser.employeeName,
        email: updatedUser.email,
        role: updatedUser.role,
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
    if (requesterId === targetId && requesterRole !== 'superadmin') {
      return res.status(403).json({ message: "You cannot change your own account status." });
    }

    // Rule 2: Only superadmin can change another superadmin's status
    if (user.role === 'superadmin' && requesterRole !== 'superadmin') {
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
      
      if (req.file) {
        user.photo = `/uploads/profiles/${req.file.filename}`;
      }

      if (req.body.password) {
        user.password = req.body.password;
      }

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
  createUser,
  updateUser,
  toggleUserStatus,
  updateUserProfile,
  deleteUser,
};
