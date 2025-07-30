import bcrypt from "bcryptjs";
import express from "express";
import { authenticateToken } from "../../middleware/authMiddleware.js";
import DetectedWord from "../../models/detectedWordModel.js";
import GroupCode from "../../models/groupCode.js";
import Group from "../../models/groupModel.js";
import GroupMember from "../../models/groupUserModel.js";
import Preference from "../../models/preferenceModel.js";
import Report from "../../models/reportModel.js";
import UserInfo from "../../models/userInfoModel.js";
import User from "../../models/userModel.js";

const router = express.Router();

// Helper function to log user activities
async function logUserActivity(
  userId,
  activityType,
  activityDetails,
  activityCategory = null
) {
  try {
    // Dynamic import for UserActivity
    const { default: UserActivity } = await import(
      "../../models/userActivityLogs.js"
    );

    const userActivity = new UserActivity({
      userId,
      activityType,
      activityDetails,
      activityCategory: activityCategory || activityType,
    });

    await userActivity.save();
    console.log(`✅ User activity logged: ${activityType} for user ${userId}`);
    return userActivity;
  } catch (error) {
    console.error("❌ Failed to log user activity:", error);
    return null;
  }
}



// GET /api/users/me
router.get("/me", authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("name email");
    if (!user) return res.status(404).json({ message: "User not found" });

    // Get additional user info including phone
    const userInfo = await UserInfo.findOne({ userId: req.user.id });
    const phone = userInfo?.phone || "";

    res.json({
      id: user._id,
      name: user.name,
      email: user.email,
      phone: phone,
    });
  } catch (err) {
    console.error("Get user error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// PUT /api/users/me - Update user profile
router.put("/me", authenticateToken, async (req, res) => {
  try {
    const { name, email, phone } = req.body;

    // Validate required fields
    if (!name || !email) {
      return res.status(400).json({ message: "Name and email are required" });
    }

    // Validate email format
    const emailRegex = /\S+@\S+\.\S+/;
    if (!emailRegex.test(email)) {
      return res
        .status(400)
        .json({ message: "Please enter a valid email address" });
    }

    // Check if email is already taken by another user
    const existingUser = await User.findOne({
      email: email.toLowerCase(),
      _id: { $ne: req.user.id },
    });

    if (existingUser) {
      return res
        .status(400)
        .json({ message: "Email is already in use by another user" });
    }

    // Update user basic information
    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      {
        name: name.trim(),
        email: email.toLowerCase().trim(),
        updatedAt: new Date(),
      },
      { new: true, runValidators: true }
    ).select("-password");

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // Update or create UserInfo if phone is provided
    if (phone !== undefined) {
      await UserInfo.findOneAndUpdate(
        { userId: req.user.id },
        {
          phone: phone.trim(),
          updatedAt: new Date(),
        },
        {
          upsert: true,
          new: true,
          setDefaultsOnInsert: true,
        }
      );
    }

    // Log user activity for profile update
    await logUserActivity(
      req.user.id,
      "update",
      `User updated profile: name=${name}, email=${email}${
        phone ? `, phone=${phone}` : ""
      }`,
      "profile_management"
    );

    res.json({
      message: "Profile updated successfully",
      user: {
        id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        phone: phone,
      },
    });
  } catch (err) {
    console.error("Update profile error:", err);

    if (err.code === 11000) {
      return res.status(400).json({ message: "Email already exists" });
    }

    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// GET /api/users/preferences
router.get("/preferences", authenticateToken, async (req, res) => {
  try {
    const pref = await Preference.findOne({ userId: req.user.id });
    if (!pref)
      return res.status(404).json({ message: "Preferences not found" });
    res.json(pref);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// PUT /api/users/preferences
router.put("/preferences", authenticateToken, async (req, res) => {
  try {
    const update = req.body;
    let pref = await Preference.findOne({ userId: req.user.id });
    if (!pref) {
      pref = new Preference({ userId: req.user.id, ...update });
    } else {
      Object.assign(pref, update);
      pref.updatedAt = new Date();
    }
    await pref.save();

    // Log user activity for preferences update
    await logUserActivity(
      req.user.id,
      "update",
      "User updated preferences",
      "preferences_management"
    );

    res.json(pref);
  } catch (err) {
    console.error("Preference save error:", err); // Log the real error
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// POST /api/users/extension-sync - Track extension sync activity
router.post("/extension-sync", authenticateToken, async (req, res) => {
  try {
    const { syncType = 'manual', extensionVersion, userAgent } = req.body;

    // Log extension sync activity
    await logUserActivity(
      req.user.id,
      "sync",
      `Extension synced settings (${syncType})`,
      "extension_sync",
      {
        extensionVersion,
        userAgent,
        syncType,
        timestamp: new Date()
      }
    );

    // Get current preferences to return
    const pref = await Preference.findOne({ userId: req.user.id });

    res.json({
      message: "Extension sync logged successfully",
      syncTime: new Date().toISOString(),
      preferences: pref
    });
  } catch (err) {
    console.error("Extension sync error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// PUT /api/users/extension-toggle - Toggle extension enabled state
router.put("/extension-toggle", authenticateToken, async (req, res) => {
  try {
    const { enabled } = req.body;

    if (typeof enabled !== 'boolean') {
      return res.status(400).json({ message: "Invalid enabled value. Must be boolean." });
    }

    let pref = await Preference.findOne({ userId: req.user.id });
    if (!pref) {
      pref = new Preference({ userId: req.user.id, extensionEnabled: enabled });
    } else {
      pref.extensionEnabled = enabled;
      pref.updatedAt = new Date();
    }
    await pref.save();

    // Log user activity for extension toggle
    await logUserActivity(
      req.user.id,
      "update",
      `Extension ${enabled ? 'enabled' : 'disabled'}`,
      "extension_control",
      {
        extensionEnabled: enabled,
        timestamp: new Date()
      }
    );

    res.json({
      message: `Extension ${enabled ? 'enabled' : 'disabled'} successfully`,
      extensionEnabled: pref.extensionEnabled,
      preferences: pref
    });
  } catch (err) {
    console.error("Extension toggle error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// GET /api/users/extension-status - Get extension status
router.get("/extension-status", authenticateToken, async (req, res) => {
  try {
    const pref = await Preference.findOne({ userId: req.user.id });

    if (!pref) {
      return res.json({
        extensionEnabled: true, // Default value
        message: "No preferences found, using default"
      });
    }

    res.json({
      extensionEnabled: pref.extensionEnabled,
      lastUpdated: pref.updatedAt,
      preferences: pref
    });
  } catch (err) {
    console.error("Extension status error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// GET /api/users/active-time
router.get("/active-time", authenticateToken, async (req, res) => {
  try {
    const pref = await Preference.findOne({ userId: req.user.id });
    if (!pref)
      return res.status(404).json({ message: "Preferences not found" });

    // Calculate current session time
    const now = new Date();
    const sessionStart = new Date(pref.sessionStartTime);
    const sessionMinutes = Math.floor((now - sessionStart) / (1000 * 60));

    // Total active time including current session
    const totalActiveMinutes = pref.totalActiveTime + sessionMinutes;

    // Format time for display
    const hours = Math.floor(totalActiveMinutes / 60);
    const minutes = totalActiveMinutes % 60;
    const formattedTime = `${hours}h ${minutes}m`;

    res.json({
      totalActiveTime: formattedTime,
      totalMinutes: totalActiveMinutes,
      sessionStartTime: pref.sessionStartTime,
      lastActiveStart: pref.lastActiveStart,
    });
  } catch (err) {
    console.error("Active time error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// POST /api/users/start-session
router.post("/start-session", authenticateToken, async (req, res) => {
  try {
    let pref = await Preference.findOne({ userId: req.user.id });
    if (!pref) {
      pref = new Preference({ userId: req.user.id });
    }

    pref.sessionStartTime = new Date();
    pref.lastActiveStart = new Date();
    await pref.save();

    // Log user activity for session start
    await logUserActivity(
      req.user.id,
      "login",
      "User started monitoring session",
      "session_management"
    );

    res.json({
      message: "Session started",
      sessionStartTime: pref.sessionStartTime,
    });
  } catch (err) {
    console.error("Start session error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// POST /api/users/stop-session
router.post("/stop-session", authenticateToken, async (req, res) => {
  try {
    const pref = await Preference.findOne({ userId: req.user.id });
    if (!pref)
      return res.status(404).json({ message: "Preferences not found" });

    const now = new Date();
    const sessionStart = new Date(pref.sessionStartTime);
    const sessionMinutes = Math.floor((now - sessionStart) / (1000 * 60));

    // Add session time to total
    pref.totalActiveTime += sessionMinutes;
    pref.sessionStartTime = now; // Reset session start
    await pref.save();

    // Log user activity for session stop
    await logUserActivity(
      req.user.id,
      "logout",
      `User stopped monitoring session (${sessionMinutes} minutes)`,
      "session_management"
    );

    res.json({
      message: "Session stopped",
      sessionMinutes,
      totalActiveTime: pref.totalActiveTime,
    });
  } catch (err) {
    console.error("Stop session error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// POST /api/users/groups - create a new group
router.post("/groups", authenticateToken, async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name)
      return res.status(400).json({ message: "Group name is required" });
    const group = new Group({
      name,
      description,
      userId: req.user.id,
    });
    await group.save();
    // Generate a unique group code
    const code = Math.random().toString(36).substr(2, 6).toUpperCase();
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days from now
    const groupCode = new GroupCode({ groupId: group._id, code, expiresAt });
    await groupCode.save();
    // Attach code to group object for response
    const groupObj = group.toObject();
    groupObj.shortCode = code;
    groupObj.createdAt = groupObj.createAt; // Alias for frontend compatibility
    res.status(201).json(groupObj);
  } catch (err) {
    console.error("Create group error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// GET /api/users/groups - list groups the user is a member of or created
router.get("/groups", authenticateToken, async (req, res) => {
  try {
    // Find groups where user is creator
    const createdGroups = await Group.find({ userId: req.user.id });
    // Find groups where user is a member
    const memberLinks = await GroupMember.find({ userId: req.user.id });
    const memberGroupIds = memberLinks.map((link) => link.groupId);
    const memberGroups = await Group.find({ _id: { $in: memberGroupIds } });
    // Merge and deduplicate
    const allGroups = [...createdGroups, ...memberGroups].filter(
      (group, idx, arr) =>
        arr.findIndex((g) => g._id.toString() === group._id.toString()) === idx
    );
    // Attach code and createdAt alias for each group
    const groupsWithCode = await Promise.all(
      allGroups.map(async (group) => {
        const groupObj = group.toObject();
        groupObj.createdAt = groupObj.createAt;
        const groupCode = await GroupCode.findOne({ groupId: group._id });
        groupObj.shortCode = groupCode ? groupCode.code : "";
        return groupObj;
      })
    );
    res.json(groupsWithCode);
  } catch (err) {
    console.error("List groups error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// GET /api/users/groups/:id - get group details
router.get("/groups/:id", authenticateToken, async (req, res) => {
  try {
    const groupId = req.params.id;
    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ message: "Group not found" });

    // Get group code
    const groupCode = await GroupCode.findOne({ groupId: group._id });

    // Get admin info (from Group.userId)
    const adminUser = await User.findById(group.userId);

    // Get members (from GroupUserModel only - admin should NOT be here)
    const memberLinks = await GroupMember.find({ groupId: group._id });
    const userIds = memberLinks.map((link) => link.userId);
    const users = await User.find({ _id: { $in: userIds } });

    // Build members array - ALL are members (no admin here)
    const members = users.map((user) => {
      const link = memberLinks.find(
        (l) => l.userId.toString() === user._id.toString()
      );
      return {
        id: user._id,
        userId: user._id, // Add userId field for consistency
        name: user.name,
        joinedAt: link ? link.joinedAt : group.createAt,
      };
    });

    res.json({
      id: group._id,
      name: group.name,
      shortCode: groupCode ? groupCode.code : "",
      createAt: group.createAt, // Use original field name
      createdAt: group.createAt, // Also provide alias
      userId: group.userId, // The admin ID
      adminInfo: adminUser ? {
        id: adminUser._id,
        name: adminUser.name,
        username: adminUser.username,
        email: adminUser.email
      } : null,
      members, // Only members from GroupUserModel
      memberCount: members.length,
    });
  } catch (err) {
    console.error("Get group details error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// PUT /api/users/groups/:id - update group name (admin only)
router.put("/groups/:id", authenticateToken, async (req, res) => {
  try {
    const groupId = req.params.id;
    const { name } = req.body;
    if (!name)
      return res.status(400).json({ message: "Group name is required" });
    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ message: "Group not found" });
    if (group.userId.toString() !== req.user.id)
      return res
        .status(403)
        .json({ message: "Only the group admin can update the group" });
    group.name = name;
    await group.save();
    res.json({ message: "Group name updated", group });
  } catch (err) {
    console.error("Update group error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// DELETE /api/users/groups/:id - delete group (admin only)
router.delete("/groups/:id", authenticateToken, async (req, res) => {
  try {
    const groupId = req.params.id;
    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ message: "Group not found" });
    if (group.userId.toString() !== req.user.id)
      return res
        .status(403)
        .json({ message: "Only the group admin can delete the group" });
    await GroupMember.deleteMany({ groupId });
    await GroupCode.deleteMany({ groupId });
    await group.deleteOne();
    res.json({ message: "Group deleted" });
  } catch (err) {
    console.error("Delete group error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// DELETE /api/users/groups/:id/members/:userId - remove member (admin only)
router.delete(
  "/groups/:id/members/:userId",
  authenticateToken,
  async (req, res) => {
    try {
      const groupId = req.params.id;
      const userId = req.params.userId;

      console.log('Remove member request:');
      console.log('- groupId:', groupId);
      console.log('- userId to remove:', userId);
      console.log('- admin user ID:', req.user.id);

      const group = await Group.findById(groupId);
      if (!group) {
        console.log('Group not found');
        return res.status(404).json({ message: "Group not found" });
      }

      console.log('- group.userId (admin):', group.userId.toString());
      console.log('- is admin?', group.userId.toString() === req.user.id);

      if (group.userId.toString() !== req.user.id) {
        console.log('Permission denied - not admin');
        return res
          .status(403)
          .json({ message: "Only the group admin can remove members" });
      }

      // Check if member exists before deletion
      const existingMember = await GroupMember.findOne({ groupId, userId });
      console.log('- existing member:', existingMember);

      if (!existingMember) {
        console.log('Member not found in group');
        return res.status(404).json({ message: "Member not found in group" });
      }

      const deleteResult = await GroupMember.deleteOne({ groupId, userId });
      console.log('- delete result:', deleteResult);

      res.json({ message: "Member removed", deletedCount: deleteResult.deletedCount });
    } catch (err) {
      console.error("Remove member error:", err);
      res.status(500).json({ message: "Server error", error: err.message });
    }
  }
);

// POST /api/users/groups/:id/regenerate-code - regenerate group code (admin only)
router.post(
  "/groups/:id/regenerate-code",
  authenticateToken,
  async (req, res) => {
    try {
      const groupId = req.params.id;
      const group = await Group.findById(groupId);
      if (!group) return res.status(404).json({ message: "Group not found" });
      if (group.userId.toString() !== req.user.id)
        return res
          .status(403)
          .json({ message: "Only the group admin can regenerate codes" });

      // Generate new code
      const newCode = Math.random().toString(36).substr(2, 6).toUpperCase();
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days from now

      // Update existing group code or create new one
      await GroupCode.findOneAndUpdate(
        { groupId },
        { code: newCode, expiresAt, updateAt: new Date() },
        { upsert: true }
      );

      res.json({
        message: "Group code regenerated successfully",
        shortCode: newCode
      });
    } catch (err) {
      console.error("Regenerate code error:", err);
      res.status(500).json({ message: "Server error", error: err.message });
    }
  }
);

// POST /api/users/groups/join - join a group by code
router.post("/groups/join", authenticateToken, async (req, res) => {
  try {
    const { code } = req.body;
    if (!code)
      return res.status(400).json({ message: "Group code is required" });
    // Find group by code
    const groupCode = await GroupCode.findOne({ code });
    if (!groupCode)
      return res.status(404).json({ message: "Invalid group code" });
    const groupId = groupCode.groupId;
    // Check if already a member
    const existing = await GroupMember.findOne({
      userId: req.user.id,
      groupId,
    });
    if (existing)
      return res
        .status(400)
        .json({ message: "Already a member of this group" });
    // Add membership
    const member = new GroupMember({ userId: req.user.id, groupId });
    await member.save();
    // Return group info
    const group = await Group.findById(groupId);
    res.json(group);
  } catch (err) {
    console.error("Join group error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Change password endpoint
router.post("/change-password", authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res
        .status(400)
        .json({ message: "Current and new password required" });
    }
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch)
      return res.status(401).json({ message: "Current password is incorrect" });

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    res.json({ message: "Password updated successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// POST /api/users/reports - Create a new report
router.post("/reports", authenticateToken, async (req, res) => {
  try {
    const { type, description, category, reportedText } = req.body;

    // Validate required fields
    if (!type || !description) {
      return res.status(400).json({
        message: "Type and description are required",
      });
    }

    // Validate type enum
    if (!["false_negative", "false_positive"].includes(type)) {
      return res.status(400).json({
        message: "Type must be either 'false_negative' or 'false_positive'",
      });
    }

    // Validate description length
    if (description.length > 1000) {
      return res.status(400).json({
        message: "Description must be 1000 characters or less",
      });
    }

    // Validate reportedText length
    if (reportedText && reportedText.length > 500) {
      return res.status(400).json({
        message: "Reported text must be 500 characters or less",
      });
    }

    // Validate category (optional but if provided, should be valid)
    const validCategories = [
      'false_positive', 'missed_content', 'context_issue', 'other', 'general',
      'harassment', 'profanity', 'hate_speech', 'spam', 'inappropriate_content'
    ];

    if (category && !validCategories.includes(category)) {
      return res.status(400).json({
        message: `Category must be one of: ${validCategories.join(', ')}`,
      });
    }

    // DetectedWord model is imported at the top of the file
    console.log('✅ Using DetectedWord model for duplicate check');

    // Check for recent duplicate detection (server-side safety)
    const oneHourAgo = new Date(Date.now() - 3600000); // 1 hour ago
    const existingDetection = await DetectedWord.findOne({
      userId: req.user.id,
      word: word.toLowerCase().trim(),
      url: url.trim(),
      createdAt: { $gte: oneHourAgo }
    });

    if (existingDetection) {
      console.log('⚠️ Duplicate detection prevented on server side:', {
        word: word.toLowerCase().trim(),
        url: url.trim(),
        lastDetected: existingDetection.createdAt
      });

      return res.status(200).json({
        message: "Detection already logged recently",
        detection: {
          id: existingDetection._id,
          word: existingDetection.word,
          createdAt: existingDetection.createdAt,
          isDuplicate: true
        }
      });
    }

    // Create new report
    const report = new Report({
      userId: req.user.id,
      type,
      description: description.trim(),
      category: category || "general",
      reportedText: reportedText ? reportedText.trim() : "",
      status: "pending",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    console.log('Attempting to save report:', {
      userId: req.user.id,
      type,
      description: description.substring(0, 50) + '...',
      category: category || "general"
    });

    await report.save();

    console.log('✅ Report saved successfully:', {
      id: report._id,
      type: report.type,
      category: report.category,
      status: report.status
    });

    // Log user activity for report creation
    await logUserActivity(
      req.user.id,
      "report",
      `User created ${type} report: ${description.substring(0, 100)}${
        description.length > 100 ? "..." : ""
      }`,
      "content_moderation"
    );

    res.status(201).json({
      message: "Report created successfully",
      report: {
        id: report._id,
        type: report.type,
        description: report.description,
        category: report.category,
        reportedText: report.reportedText,
        status: report.status,
        createdAt: report.createdAt,
        updatedAt: report.updatedAt,
      },
      meta: {
        userId: req.user.id,
        reportNumber: `RPT-${report._id.toString().slice(-8).toUpperCase()}`,
        estimatedReviewTime: "24-48 hours",
        nextSteps: "Your report will be reviewed by our moderation team. You will be notified of any updates."
      }
    });
  } catch (error) {
    console.error("❌ Create report error:", error);
    console.error("Error details:", {
      message: error.message,
      stack: error.stack,
      name: error.name
    });

    // Log failed report creation
    try {
      await logUserActivity(
        req.user.id,
        "report",
        `Failed to create report: ${error.message}`,
        "content_moderation"
      );
    } catch (logError) {
      console.error("Failed to log activity:", logError);
    }

    res.status(500).json({
      message: "Server error",
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// GET /api/users/reports - Get user's reports
router.get("/reports", authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 20, status = "", type = "" } = req.query;

    // Report model is imported at the top of the file

    // Build filter
    const filter = { userId: req.user.id };
    if (status && status !== "all") filter.status = status;
    if (type && type !== "all") filter.type = type;

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get reports
    const reports = await Report.find(filter)
      .populate("reviewedBy", "name email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const totalReports = await Report.countDocuments(filter);

    // Log user activity for viewing reports
    await logUserActivity(
      req.user.id,
      "visit",
      "User viewed their reports list",
      "content_moderation"
    );

    res.json({
      reports,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalReports / parseInt(limit)),
        totalReports,
        hasNextPage: skip + reports.length < totalReports,
        hasPrevPage: page > 1,
      },
    });
  } catch (error) {
    console.error("Get user reports error:", error);
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
});

// POST /api/users/detected-words - Log detected inappropriate content
router.post("/detected-words", authenticateToken, async (req, res) => {
  try {
    const {
      word,
      context,
      sentimentScore,
      url,
      accuracy,
      responseTime,
      patternType,
      language,
      severity,
      siteType
    } = req.body;

    // Validate required fields
    if (!word || !context || !url) {
      return res.status(400).json({
        message: "Word, context, and URL are required"
      });
    }

    // Validate numeric fields
    if (sentimentScore !== undefined && (typeof sentimentScore !== 'number' || sentimentScore < -1 || sentimentScore > 1)) {
      return res.status(400).json({
        message: "Sentiment score must be a number between -1 and 1"
      });
    }

    if (accuracy !== undefined && (typeof accuracy !== 'number' || accuracy < 0 || accuracy > 1)) {
      return res.status(400).json({
        message: "Accuracy must be a number between 0 and 1"
      });
    }

    if (responseTime !== undefined && (typeof responseTime !== 'number' || responseTime < 0)) {
      return res.status(400).json({
        message: "Response time must be a positive number"
      });
    }

    // Validate severity enum
    if (severity && !['low', 'medium', 'high'].includes(severity)) {
      return res.status(400).json({
        message: "Severity must be 'low', 'medium', or 'high'"
      });
    }

    // DetectedWord model is imported at the top of the file

    // Create new detected word entry with extension-provided values
    const detectedWord = new DetectedWord({
      userId: req.user.id,
      word: word.toLowerCase().trim(),
      context: context.trim(),
      url: url.trim(),
      sentimentScore: sentimentScore !== undefined ? sentimentScore : -0.5, // Default negative sentiment
      accuracy: accuracy !== undefined ? accuracy : 0.7, // Default moderate accuracy
      responseTime: responseTime !== undefined ? responseTime : 100, // Default 100ms
      patternType: patternType || 'Inappropriate Content',
      language: language || 'English',
      severity: severity || 'medium',
      siteType: siteType || 'Website',
      createdAt: new Date()
    });

    await detectedWord.save();

    // Log user activity for content detection
    await logUserActivity(
      req.user.id,
      "detection",
      `Inappropriate content detected: "${word}" on ${url}`,
      "content_detection",
      {
        word,
        context: context.substring(0, 100),
        url,
        patternType,
        severity
      }
    );

    res.status(201).json({
      message: "Detection logged successfully",
      detection: {
        id: detectedWord._id,
        word: detectedWord.word,
        context: detectedWord.context.substring(0, 100) + (detectedWord.context.length > 100 ? '...' : ''),
        sentimentScore: detectedWord.sentimentScore,
        accuracy: detectedWord.accuracy,
        responseTime: detectedWord.responseTime,
        patternType: detectedWord.patternType,
        language: detectedWord.language,
        severity: detectedWord.severity,
        siteType: detectedWord.siteType,
        url: detectedWord.url,
        createdAt: detectedWord.createdAt
      }
    });

  } catch (error) {
    console.error("Log detected word error:", error);
    res.status(500).json({
      message: "Server error",
      error: error.message
    });
  }
});

// GET /api/users/detected-words - Get user's detected words
router.get("/detected-words", authenticateToken, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      severity = "",
      patternType = "",
      language = "",
      startDate = "",
      endDate = ""
    } = req.query;

    // DetectedWord model is imported at the top of the file

    // Build filter
    const filter = { userId: req.user.id };
    if (severity && severity !== "all") filter.severity = severity;
    if (patternType && patternType !== "all") filter.patternType = patternType;
    if (language && language !== "all") filter.language = language;

    // Date range filter
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get detected words
    const detectedWords = await DetectedWord.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const totalDetections = await DetectedWord.countDocuments(filter);

    // Get summary statistics
    const stats = await DetectedWord.aggregate([
      { $match: { userId: req.user.id } },
      {
        $group: {
          _id: null,
          totalDetections: { $sum: 1 },
          avgSentimentScore: { $avg: "$sentimentScore" },
          avgAccuracy: { $avg: "$accuracy" },
          avgResponseTime: { $avg: "$responseTime" },
          severityBreakdown: {
            $push: "$severity"
          },
          patternBreakdown: {
            $push: "$patternType"
          }
        }
      }
    ]);

    res.json({
      detectedWords,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalDetections / parseInt(limit)),
        totalDetections,
        hasNextPage: skip + detectedWords.length < totalDetections,
        hasPrevPage: page > 1
      },
      statistics: stats[0] || {
        totalDetections: 0,
        avgSentimentScore: 0,
        avgAccuracy: 0,
        avgResponseTime: 0,
        severityBreakdown: [],
        patternBreakdown: []
      }
    });

  } catch (error) {
    console.error("Get detected words error:", error);
    res.status(500).json({
      message: "Server error",
      error: error.message
    });
  }
});

// GET /api/users/export-data - Export all user data
router.get("/export-data", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get user basic info
    const user = await User.findById(userId).select("-password -otp").lean();
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Get additional user info
    const userInfo = await UserInfo.findOne({ userId }).lean();

    // Get user preferences
    const preferences = await Preference.findOne({ userId }).lean();

    // Get user activity logs
    const activities = await UserActivity.find({ userId })
      .sort({ createdAt: -1 })
      .limit(1000) // Limit to last 1000 activities
      .lean();

    // Get detected words
    const detectedWords = await DetectedWord.find({ userId })
      .sort({ createdAt: -1 })
      .limit(1000) // Limit to last 1000 detections
      .lean();

    // Get user groups
    const groupMemberships = await GroupMember.find({ userId })
      .populate('groupId', 'name description')
      .lean();

    // Get user reports
    const reports = await Report.find({ userId })
      .sort({ createdAt: -1 })
      .limit(100) // Limit to last 100 reports
      .lean();

    // Compile all data
    const exportData = {
      exportInfo: {
        exportDate: new Date().toISOString(),
        userId: userId,
        dataTypes: ['profile', 'preferences', 'activities', 'detections', 'groups', 'reports']
      },
      profile: {
        ...user,
        additionalInfo: userInfo
      },
      preferences: preferences || {},
      activities: activities || [],
      detectedWords: detectedWords || [],
      groupMemberships: groupMemberships || [],
      reports: reports || [],
      summary: {
        totalActivities: activities?.length || 0,
        totalDetections: detectedWords?.length || 0,
        totalGroups: groupMemberships?.length || 0,
        totalReports: reports?.length || 0,
        accountCreated: user.createdAt,
        lastActivity: activities?.[0]?.createdAt || user.updatedAt
      }
    };

    // Log the export activity
    await logUserActivity(
      userId,
      "export",
      "User exported their data",
      "data_management",
      {
        exportSize: JSON.stringify(exportData).length,
        dataTypes: exportData.exportInfo.dataTypes
      }
    );

    res.json(exportData);
  } catch (err) {
    console.error("Export data error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// DELETE /api/users/delete-all-data - Delete all user data (GDPR compliance)
router.delete("/delete-all-data", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get user info before deletion for logging
    const user = await User.findById(userId).select("name email").lean();
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Log the deletion request before deleting
    await logUserActivity(
      userId,
      "delete",
      "User requested complete data deletion",
      "data_management",
      {
        deletionTimestamp: new Date().toISOString(),
        userEmail: user.email
      }
    );

    // Delete all user-related data in order
    await Promise.all([
      // Delete user activities
      UserActivity.deleteMany({ userId }),

      // Delete detected words
      DetectedWord.deleteMany({ userId }),

      // Delete user preferences
      Preference.deleteMany({ userId }),

      // Delete user info
      UserInfo.deleteMany({ userId }),

      // Delete user reports
      Report.deleteMany({ userId }),

      // Remove user from groups (but don't delete groups they created)
      GroupMember.deleteMany({ userId }),

      // Delete user notifications
      Notification.deleteMany({ userId })
    ]);

    // Finally, delete the user account
    await User.findByIdAndDelete(userId);

    res.json({
      message: "All user data has been permanently deleted",
      deletedAt: new Date().toISOString(),
      userId: userId
    });
  } catch (err) {
    console.error("Delete all data error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

export default router;
