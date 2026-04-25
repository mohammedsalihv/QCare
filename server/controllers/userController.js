const User = require("../models/users");
const jwt = require("jsonwebtoken");

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  try {
    const { employeeId, password } = req.body;

    // Find user by employeeId
    const user = await User.findOne({ employeeId });

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
  deleteUser,
};
