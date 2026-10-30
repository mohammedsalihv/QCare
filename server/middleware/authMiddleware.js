const { normalizeRole } = require('../utils/roles');
const jwt = require("jsonwebtoken");
const User = require("../models/users");

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || "default_secret");

      req.user = await User.findById(decoded.id).select("-password");
      if (!req.user) return res.status(401).json({ message: "Not authorized, user no longer exists" });
      if (req.user.isActive === false || ['blocked', 'inactive'].includes(req.user.status)) return res.status(403).json({ message: "Your account is inactive or blocked" });
      req.user.role = normalizeRole(req.user.role);
      next();
    } catch (error) {
      console.error(error);
      res.status(401).json({ message: "Not authorized, token failed" });
    }
  }

  if (!token) {
    res.status(401).json({ message: "Not authorized, no token" });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.some(role => normalizeRole(role) === normalizeRole(req.user.role))) {
      return res.status(403).json({
        message: `User role ${req.user.role} is not authorized to access this route`
      });
    }
    next();
  };
};

const admin = authorize('admin', 'superadmin', 'SuperAdmin');
const superAdmin = authorize('superadmin', 'SuperAdmin');

module.exports = { protect, admin, superAdmin, authorize };
