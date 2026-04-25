const Notification = require("../models/Notification");

// @desc    Get all notifications for current user
// @route   GET /api/notifications
// @access  Private
const getNotifications = async (req, res) => {
  try {
    if (req.user.role === 'superadmin') {
      roleQuery = {
        $or: [
          { recipientRole: "all" },
          { recipientRole: "admin" },
          { recipientRole: "superadmin" },
          { recipientId: req.user._id }
        ]
      };
    } else if (req.user.role === 'admin') {
      roleQuery = {
        $or: [
          { recipientRole: "all" },
          { recipientRole: "admin" },
          { recipientId: req.user._id }
        ]
      };
    } else {
      roleQuery = { recipientId: req.user._id };
    }

    // Filter out notifications deleted by this specific user
    const query = {
      ...roleQuery,
      deletedBy: { $ne: req.user._id }
    };

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(100);

    // Format the notifications for the frontend (add isRead based on readBy array)
    const formattedNotifications = notifications.map(n => ({
      ...n.toObject(),
      isRead: n.readBy.includes(req.user._id)
    }));
    
    res.json(formattedNotifications);
  } catch (error) {
    res.status(500).json({ message: "Error fetching notifications", error: error.message });
  }
};

// @desc    Mark notification as read
// @route   PATCH /api/notifications/:id/read
// @access  Private
const markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    
    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    // Add user to readBy if not already there
    if (!notification.readBy.includes(req.user._id)) {
      notification.readBy.push(req.user._id);
      await notification.save();
    }
    
    res.json({ ...notification.toObject(), isRead: true });
  } catch (error) {
    res.status(500).json({ message: "Error updating notification", error: error.message });
  }
};

// @desc    Delete notification (Soft delete for current user)
// @route   DELETE /api/notifications/:id
// @access  Private
const deleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    
    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    // Add user to deletedBy if not already there
    if (!notification.deletedBy.includes(req.user._id)) {
      notification.deletedBy.push(req.user._id);
      await notification.save();
    }

    res.json({ message: "Notification removed from your view" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting notification", error: error.message });
  }
};

// @desc    Clear all notifications (Soft delete for current user)
// @route   DELETE /api/notifications/clear-all
// @access  Private
const clearAllNotifications = async (req, res) => {
  try {
    let roleQuery;
    if (req.user.role === 'admin' || req.user.role === 'superadmin') {
      roleQuery = {
        $or: [
          { recipientRole: "all" },
          { recipientRole: req.user.role === "superadmin" ? "superadmin" : "admin" },
          { recipientId: req.user._id }
        ]
      };
    } else {
      roleQuery = { recipientId: req.user._id };
    }

    // Add current user to deletedBy for all notifications matching the role query
    await Notification.updateMany(
      { ...roleQuery, deletedBy: { $ne: req.user._id } },
      { $addToSet: { deletedBy: req.user._id } }
    );

    res.json({ message: "Your notifications have been cleared" });
  } catch (error) {
    res.status(500).json({ message: "Error clearing notifications", error: error.message });
  }
};

module.exports = {
  getNotifications,
  markAsRead,
  deleteNotification,
  clearAllNotifications,
};
