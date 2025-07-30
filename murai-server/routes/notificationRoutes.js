import express from "express";
import { authenticateToken } from "../middleware/authMiddleware.js";
import Notification from "../models/notificationModel.js";

const router = express.Router();



// Get all notifications for the logged-in user
router.get("/", authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 20, unreadOnly = false } = req.query;
    const skip = (page - 1) * limit;

    // Build filter for user's notifications
    const filter = { userId: req.user.id };
    if (unreadOnly === "true") {
      filter.isRead = false;
    }

    const notifications = await Notification.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const totalNotifications = await Notification.countDocuments(filter);
    const unreadCount = await Notification.countDocuments({
      userId: req.user.id,
      isRead: false,
    });

    res.json({
      notifications,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalNotifications / limit),
        totalNotifications,
        hasNextPage: skip + notifications.length < totalNotifications,
        hasPrevPage: page > 1,
      },
      unreadCount,
    });
  } catch (err) {
    console.error("Get notifications error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Mark a notification as read
router.put("/:id/read", authenticateToken, async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id }, // Ensure user can only update their own notifications
      { isRead: true },
      { new: true }
    );
    if (!notification)
      return res.status(404).json({ message: "Notification not found" });
    res.json(notification);
  } catch (err) {
    console.error("Mark notification as read error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Mark all notifications as read for the user
router.put("/mark-all-read", authenticateToken, async (req, res) => {
  try {
    const result = await Notification.updateMany(
      { userId: req.user.id, isRead: false },
      { isRead: true }
    );
    res.json({
      message: "All notifications marked as read",
      modifiedCount: result.modifiedCount,
    });
  } catch (err) {
    console.error("Mark all notifications as read error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Create a notification (for testing/admin)
router.post("/", authenticateToken, async (req, res) => {
  try {
    const { title, message, type = "info" } = req.body;
    const notification = new Notification({
      userId: req.user.id,
      title,
      message,
      type,
    });
    await notification.save();
    res.status(201).json(notification);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// Test endpoint to get notifications without authentication (for development)
router.get("/test", async (req, res) => {
  try {
    const notifications = await Notification.find({})
      .sort({ createdAt: -1 })
      .limit(10);
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
