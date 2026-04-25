const express = require("express");
const { 
  getUsers, 
  createUser, 
  updateUser, 
  toggleUserStatus,
  deleteUser 
} = require("../controllers/userController");
const { protect, admin, superAdmin } = require("../middleware/authMiddleware");
const router = express.Router();

// Apply protection to all routes in this file
router.use(protect);

router.route("/")
  .get(admin, getUsers)        // Admins and SuperAdmins can view users
  .post(admin, createUser);    // Admins and SuperAdmins can create users

router.patch("/:id/toggle-status", admin, toggleUserStatus); // Toggle active/inactive

router.route("/:id")
  .put(admin, updateUser)      // Admins and SuperAdmins can update
  .delete(admin, deleteUser);  // Admins and SuperAdmins can delete users

module.exports = router;
