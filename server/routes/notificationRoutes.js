const express = require("express");
const router = express.Router();
const {
  getNotifications,
  markAsRead,
  deleteNotification,
  clearAllNotifications,
} = require("../controllers/notificationController");
const { protect, admin } = require("../middleware/authMiddleware");

router.use(protect);

router.get("/", getNotifications);
router.delete("/clear-all", clearAllNotifications);
router.patch("/:id/read", markAsRead);
router.delete("/:id", deleteNotification);

module.exports = router;
