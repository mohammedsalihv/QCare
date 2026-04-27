const express = require("express");
const { 
  getUsers, 
  createUser, 
  updateUser, 
  toggleUserStatus,
  updateUserProfile,
  deleteUser 
} = require("../controllers/userController");
const { protect, admin, superAdmin } = require("../middleware/authMiddleware");
const path = require("path");
const multer = require("multer");
const fs = require("fs");

const storage = multer.diskStorage({
  destination(req, file, cb) {
    const dir = path.join(__dirname, "../uploads/profiles/");
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename(req, file, cb) {
    cb(
      null,
      `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`
    );
  },
});

function checkFileType(file, cb) {
  const filetypes = /jpg|jpeg|png/;
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = filetypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb("Images only!");
  }
}

const upload = multer({
  storage,
  fileFilter: function (req, file, cb) {
    checkFileType(file, cb);
  },
});

const router = express.Router();

// Apply protection to all routes in this file
router.use(protect);

router.put("/profile", (req, res, next) => {
  upload.single("photo")(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      console.error("Multer error:", err);
      return res.status(400).json({ message: `Multer upload error: ${err.message}` });
    } else if (err) {
      console.error("Unknown upload error:", err);
      return res.status(400).json({ message: err });
    }
    next();
  });
}, updateUserProfile);

router.route("/")
  .get(admin, getUsers)        // Admins and SuperAdmins can view users
  .post(admin, createUser);    // Admins and SuperAdmins can create users

router.patch("/:id/toggle-status", admin, toggleUserStatus); // Toggle active/inactive

router.route("/:id")
  .put(admin, updateUser)      // Admins and SuperAdmins can update
  .delete(admin, deleteUser);  // Admins and SuperAdmins can delete users

module.exports = router;
