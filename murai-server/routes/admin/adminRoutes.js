import bcrypt from "bcryptjs";
import express from "express";
import { adminAuth } from "../../middleware/authMiddleware.js";
import AdminLogs from "../../models/adminLogsMode.js";
import Report from "../../models/reportModel.js";
import UserInfo from "../../models/userInfoModel.js";
import User from "../../models/userModel.js";

const router = express.Router();

// Helper function to create notification for report status updates
async function createReportStatusNotification(
  userId,
  reportId,
  status,
  adminName
) {
  try {
    // Dynamic import to avoid issues with static imports
    const { default: Notification } = await import(
      "../../models/notificationModel.js"
    );

    let title, message, type;

    switch (status) {
      case "resolved":
        title = "✅ Report Resolved";
        message = `Your report has been reviewed and resolved by ${adminName}. Thank you for helping us maintain a safe environment.`;
        type = "success";
        break;
      case "rejected":
        title = "❌ Report Rejected";
        message = `Your report has been reviewed and rejected by ${adminName}. The content was determined to not violate our guidelines.`;
        type = "warning";
        break;
      case "in_progress":
        title = "🔄 Report Under Review";
        message = `Your report is currently being reviewed by ${adminName}. We'll update you once the review is complete.`;
        type = "info";
        break;
      case "pending":
        title = "⏳ Report Status Updated";
        message = `Your report status has been updated to pending by ${adminName}. It will be reviewed soon.`;
        type = "info";
        break;
      default:
        title = "📋 Report Status Updated";
        message = `Your report status has been updated by ${adminName}.`;
        type = "info";
    }

    const notification = new Notification({
      userId: userId,
      title: title,
      message: message,
      type: type,
      isRead: false,
      isGlobal: false,
    });

    await notification.save();
    console.log(
      `✅ Notification created for user ${userId} about report ${reportId} status: ${status}`
    );

    return notification;
  } catch (error) {
    console.error("❌ Error creating report status notification:", error);
    // Don't throw error to avoid breaking the main report update flow
    return null;
  }
}

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

// Helper function to log admin actions
async function logAdminAction(
  adminId,
  action,
  activityType,
  targetType,
  targetId,
  details,
  status = "success",
  errorMessage = null
) {
  try {
    const adminLog = new AdminLogs({
      adminId,
      action,
      activityType,
      targetType,
      targetId,
      details,
      status,
      errorMessage,
    });
    await adminLog.save();
  } catch (error) {
    console.error("Failed to log admin action:", error);
  }
}

// GET /api/admin/users - Get all users with pagination and filtering
router.get("/users", adminAuth, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      search = "",
      status = "",
      role = "",
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    // Build filter object
    const filter = {};

    if (search) {
      // Handle role-specific search with @ prefix
      if (search.toLowerCase().startsWith("@admin")) {
        filter.role = "admin";
      } else if (search.toLowerCase().startsWith("@user")) {
        filter.role = "user";
      } else {
        // Regular search in name and email
        filter.$or = [
          { name: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
        ];
      }
    }

    if (status && status !== "all") {
      filter.status = status;
    }

    if (role && role !== "all") {
      filter.role = role;
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === "desc" ? -1 : 1;

    // Get users with pagination
    const users = await User.find(filter)
      .select("-password -otp") // Exclude sensitive fields
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    // Get total count for pagination
    const totalUsers = await User.countDocuments(filter);

    // Get user info for each user (optional additional data)
    const userIds = users.map((user) => user._id);
    const userInfos = await UserInfo.find({ userId: { $in: userIds } }).lean();

    // Merge user info with users
    const usersWithInfo = users.map((user) => {
      const userInfo = userInfos.find(
        (info) => info.userId.toString() === user._id.toString()
      );
      return {
        ...user,
        userInfo: userInfo || null,
      };
    });

    // Log admin action
    await logAdminAction(
      req.adminUser._id,
      "View Users List",
      "user",
      "system",
      null,
      `Viewed users list with filters: ${JSON.stringify({
        search,
        status,
        role,
      })}`
    );

    res.json({
      users: usersWithInfo,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalUsers / parseInt(limit)),
        totalUsers,
        hasNextPage: skip + users.length < totalUsers,
        hasPrevPage: parseInt(page) > 1,
      },
    });
  } catch (error) {
    console.error("Get users error:", error);

    await logAdminAction(
      req.adminUser._id,
      "View Users List",
      "user",
      "system",
      null,
      "Failed to retrieve users list",
      "failed",
      error.message
    );

    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// GET /api/admin/users/:id - Get specific user details
router.get("/users/:id", adminAuth, async (req, res) => {
  try {
    const userId = req.params.id;

    const user = await User.findById(userId).select("-password -otp").lean();
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Get additional user info
    const userInfo = await UserInfo.findOne({ userId }).lean();

    const userWithInfo = {
      ...user,
      userInfo: userInfo || null,
    };

    // Log admin action
    await logAdminAction(
      req.adminUser._id,
      "View User Details",
      "user",
      "user",
      userId,
      `Viewed details for user: ${user.email}`
    );

    res.json(userWithInfo);
  } catch (error) {
    console.error("Get user details error:", error);

    await logAdminAction(
      req.adminUser._id,
      "View User Details",
      "user",
      "user",
      req.params.id,
      "Failed to retrieve user details",
      "failed",
      error.message
    );

    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// PUT /api/admin/users/:id - Update user (status, role, etc.)
router.put("/users/:id", adminAuth, async (req, res) => {
  try {
    const userId = req.params.id;
    const { status, role, name, email, isPremium } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Store original values for logging
    const originalValues = {
      status: user.status,
      role: user.role,
      name: user.name,
      email: user.email,
      isPremium: user.isPremium,
    };

    // Update allowed fields
    const updates = {};
    if (status !== undefined) updates.status = status;
    if (role !== undefined) updates.role = role;
    if (name !== undefined) updates.name = name;
    if (email !== undefined) updates.email = email;
    if (isPremium !== undefined) updates.isPremium = isPremium;
    updates.updatedAt = new Date();

    // If status is being changed to active, update lastActive
    if (status === "active" && originalValues.status !== "active") {
      updates.lastActive = new Date();
    }

    const updatedUser = await User.findByIdAndUpdate(userId, updates, {
      new: true,
      runValidators: true,
    }).select("-password -otp");

    // Log admin action
    const changes = Object.keys(updates)
      .filter((key) => key !== "updatedAt")
      .map((key) => `${key}: ${originalValues[key]} → ${updates[key]}`)
      .join(", ");

    await logAdminAction(
      req.adminUser._id,
      "Update User",
      "update",
      "user",
      userId,
      `Updated user ${user.email}: ${changes}`
    );

    // Log user activity for the updated user
    await logUserActivity(
      userId,
      "update",
      `Account updated by admin ${
        req.adminUser.name || req.adminUser.email
      }: ${changes}`,
      "account_management"
    );

    res.json({
      message: "User updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Update user error:", error);

    await logAdminAction(
      req.adminUser._id,
      "Update User",
      "update",
      "user",
      req.params.id,
      "Failed to update user",
      "failed",
      error.message
    );

    if (error.code === 11000) {
      return res.status(400).json({ message: "Email already exists" });
    }

    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// POST /api/admin/users - Create new user
router.post("/users", adminAuth, async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      role = "user",
      status = "active",
      isPremium = false,
    } = req.body;

    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ message: "Name, email, and password are required" });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res
        .status(400)
        .json({ message: "User with this email already exists" });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const user = new User({
      name,
      email,
      password: hashedPassword,
      role,
      status,
      isPremium,
      isVerified: true, // Admin-created users are auto-verified
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await user.save();

    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password;
    delete userResponse.otp;

    // Log admin action
    await logAdminAction(
      req.adminUser._id,
      "Create User",
      "user",
      "user",
      user._id,
      `Created new user: ${email} with role: ${role}, status: ${status}, premium: ${isPremium}`
    );

    // Log user activity for the newly created user
    await logUserActivity(
      user._id,
      "other",
      `Account created by admin ${req.adminUser.name || req.adminUser.email}`,
      "account_management"
    );

    res.status(201).json({
      message: "User created successfully",
      user: userResponse,
    });
  } catch (error) {
    console.error("Create user error:", error);

    await logAdminAction(
      req.adminUser._id,
      "Create User",
      "user",
      "user",
      null,
      "Failed to create user",
      "failed",
      error.message
    );

    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// DELETE /api/admin/users/:id - Delete user (soft delete by setting status to suspended)
router.delete("/users/:id", adminAuth, async (req, res) => {
  try {
    const userId = req.params.id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Prevent admin from deleting themselves
    if (userId === req.adminUser._id.toString()) {
      return res
        .status(400)
        .json({ message: "Cannot delete your own account" });
    }

    // Soft delete by setting status to suspended
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        status: "suspended",
        updatedAt: new Date(),
      },
      { new: true }
    ).select("-password -otp");

    // Log admin action
    await logAdminAction(
      req.adminUser._id,
      "Delete User",
      "user",
      "user",
      userId,
      `Suspended user: ${user.email}`
    );

    // Log user activity for the suspended user
    await logUserActivity(
      userId,
      "other",
      `Account suspended by admin ${req.adminUser.name || req.adminUser.email}`,
      "account_management"
    );

    res.json({
      message: "User suspended successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Delete user error:", error);

    await logAdminAction(
      req.adminUser._id,
      "Delete User",
      "user",
      "user",
      req.params.id,
      "Failed to suspend user",
      "failed",
      error.message
    );

    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// ===== REPORTS MANAGEMENT ROUTES =====

// GET /api/admin/reports/overview - Get reports overview statistics
router.get("/reports/overview", adminAuth, async (req, res) => {
  try {
    const { search = "", status = "", type = "", category = "" } = req.query;

    // Build filter object (same as reports endpoint for consistency)
    const filter = {};

    if (search) {
      filter.$or = [
        { reportedText: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { category: { $regex: search, $options: "i" } },
      ];
    }

    if (status && status !== "all") {
      filter.status = status;
    }

    if (type && type !== "all") {
      filter.type = type;
    }

    if (category && category !== "all") {
      filter.category = category;
    }

    // Get total counts for each status
    const [totalReports, pendingReports, resolvedReports, rejectedReports] =
      await Promise.all([
        Report.countDocuments(filter),
        Report.countDocuments({ ...filter, status: "pending" }),
        Report.countDocuments({ ...filter, status: "resolved" }),
        Report.countDocuments({ ...filter, status: "rejected" }),
      ]);

    // Get total counts for each type
    const [falsePositiveReports, falseNegativeReports] = await Promise.all([
      Report.countDocuments({ ...filter, type: "false_positive" }),
      Report.countDocuments({ ...filter, type: "false_negative" }),
    ]);

    // Get category breakdown
    const categoryStats = await Report.aggregate([
      { $match: filter },
      { $group: { _id: "$category", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    // Calculate resolution rate
    const resolutionRate =
      totalReports > 0
        ? (((resolvedReports + rejectedReports) / totalReports) * 100).toFixed(
            1
          )
        : 0;

    // Log admin action
    await logAdminAction(
      req.adminUser._id,
      "View Reports Overview",
      "report",
      "system",
      null,
      `Viewed reports overview statistics`
    );

    res.json({
      total: totalReports,
      pending: pendingReports,
      resolved: resolvedReports,
      rejected: rejectedReports,
      falsePositives: falsePositiveReports,
      falseNegatives: falseNegativeReports,
      resolutionRate: parseFloat(resolutionRate),
      categoryStats: categoryStats.map((cat) => ({
        category: cat._id,
        count: cat.count,
        percentage:
          totalReports > 0 ? ((cat.count / totalReports) * 100).toFixed(1) : 0,
      })),
    });
  } catch (error) {
    console.error("Get reports overview error:", error);

    await logAdminAction(
      req.adminUser._id,
      "View Reports Overview",
      "report",
      "system",
      null,
      "Failed to retrieve reports overview",
      "failed",
      error.message
    );

    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// GET /api/admin/reports - Get all reports with pagination and filtering
router.get("/reports", adminAuth, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      search = "",
      status = "",
      type = "",
      category = "",
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    // Build filter object
    const filter = {};

    if (search) {
      filter.$or = [
        { reportedText: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { category: { $regex: search, $options: "i" } },
      ];
    }

    if (status && status !== "all") {
      filter.status = status;
    }

    if (type && type !== "all") {
      filter.type = type;
    }

    if (category && category !== "all") {
      filter.category = category;
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === "desc" ? -1 : 1;

    // Get reports with pagination and populate user data
    const reports = await Report.find(filter)
      .populate("userId", "name email")
      .populate("reviewedBy", "name email")
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    // Get total count for pagination
    const totalReports = await Report.countDocuments(filter);

    // Log admin action
    await logAdminAction(
      req.adminUser._id,
      "View Reports List",
      "report",
      "system",
      null,
      `Viewed reports list with filters: ${JSON.stringify({
        search,
        status,
        type,
        category,
      })}`
    );

    res.json({
      reports,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalReports / parseInt(limit)),
        totalReports,
        hasNextPage: skip + reports.length < totalReports,
        hasPrevPage: parseInt(page) > 1,
      },
    });
  } catch (error) {
    console.error("Get reports error:", error);

    await logAdminAction(
      req.adminUser._id,
      "View Reports List",
      "report",
      "system",
      null,
      "Failed to retrieve reports list",
      "failed",
      error.message
    );

    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// GET /api/admin/reports/:id - Get specific report details
router.get("/reports/:id", adminAuth, async (req, res) => {
  try {
    const reportId = req.params.id;

    const report = await Report.findById(reportId)
      .populate("userId", "name email")
      .populate("reviewedBy", "name email")
      .lean();

    if (!report) {
      return res.status(404).json({ message: "Report not found" });
    }

    // Log admin action
    await logAdminAction(
      req.adminUser._id,
      "View Report Details",
      "report",
      "report",
      reportId,
      `Viewed details for report: ${reportId}`
    );

    res.json(report);
  } catch (error) {
    console.error("Get report details error:", error);

    await logAdminAction(
      req.adminUser._id,
      "View Report Details",
      "report",
      "report",
      req.params.id,
      "Failed to retrieve report details",
      "failed",
      error.message
    );

    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// PUT /api/admin/reports/:id - Update report status and details
router.put("/reports/:id", adminAuth, async (req, res) => {
  try {
    const reportId = req.params.id;
    const { status, reviewedBy, description, category } = req.body;

    const report = await Report.findById(reportId);
    if (!report) {
      return res.status(404).json({ message: "Report not found" });
    }

    // Store original values for logging
    const originalValues = {
      status: report.status,
      reviewedBy: report.reviewedBy,
      description: report.description,
      category: report.category,
    };

    // Update allowed fields
    const updates = {};
    if (status !== undefined) {
      updates.status = status;
      if (status === "resolved" || status === "in_progress") {
        updates.reviewedBy = req.adminUser._id;
        updates.reviewedAt = new Date();
      }
    }
    if (description !== undefined) updates.description = description;
    if (category !== undefined) updates.category = category;
    updates.updatedAt = new Date();

    const updatedReport = await Report.findByIdAndUpdate(reportId, updates, {
      new: true,
      runValidators: true,
    })
      .populate("userId", "name email")
      .populate("reviewedBy", "name email");

    // Log admin action
    const changes = Object.keys(updates)
      .filter((key) => key !== "updateAt")
      .map((key) => `${key}: ${originalValues[key]} → ${updates[key]}`)
      .join(", ");

    await logAdminAction(
      req.adminUser._id,
      "Update Report",
      "update",
      "report",
      reportId,
      `Updated report ${reportId}: ${changes}`
    );

    // Create notification for user if status was updated
    if (status !== undefined && status !== originalValues.status) {
      const adminName = req.adminUser.name || req.adminUser.email || "Admin";
      await createReportStatusNotification(
        updatedReport.userId._id,
        reportId,
        status,
        adminName
      );

      // Log user activity for report status change
      await logUserActivity(
        updatedReport.userId._id,
        "report",
        `Report status changed from ${originalValues.status} to ${status} by admin`,
        "report_management"
      );
    }

    res.json({
      message: "Report updated successfully",
      report: updatedReport,
    });
  } catch (error) {
    console.error("Update report error:", error);

    await logAdminAction(
      req.adminUser._id,
      "Update Report",
      "update",
      "report",
      req.params.id,
      "Failed to update report",
      "failed",
      error.message
    );

    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// ===== PROFILE MANAGEMENT ROUTES =====

// GET /api/admin/profile - Get current admin profile
router.get("/profile", adminAuth, async (req, res) => {
  try {
    const adminId = req.adminUser._id;

    // Get admin user with additional profile information
    const adminProfile = await User.findById(adminId)
      .select("-password")
      .lean();

    if (!adminProfile) {
      return res.status(404).json({ message: "Admin profile not found" });
    }

    // Get additional profile info if exists
    const profileInfo = await UserInfo.findOne({ userId: adminId }).lean();

    // Combine user and profile info
    const fullProfile = {
      ...adminProfile,
      ...profileInfo,
      // Ensure we have default values for admin-specific fields
      department: profileInfo?.department || "Administration",
      position: profileInfo?.position || "System Administrator",
      employeeId:
        profileInfo?.employeeId || `ADM${adminId.toString().slice(-3)}`,
    };

    // Log admin action
    await logAdminAction(
      adminId,
      "View Profile",
      "profile",
      "profile",
      adminId,
      "Viewed own profile information"
    );

    res.json(fullProfile);
  } catch (error) {
    console.error("Get admin profile error:", error);

    await logAdminAction(
      req.adminUser._id,
      "View Profile",
      "profile",
      "profile",
      req.adminUser._id,
      "Failed to retrieve profile information",
      "failed",
      error.message
    );

    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// PUT /api/admin/profile - Update admin profile
router.put("/profile", adminAuth, async (req, res) => {
  try {
    const adminId = req.adminUser._id;
    const {
      name,
      email,
      phone,
      address,
      emergencyContact,
      emergencyPhone,
      // Admin-specific fields (read-only from frontend but can be updated by super admin)
      department,
      position,
      employeeId,
    } = req.body;

    // Validate required fields
    if (!name || !email) {
      return res.status(400).json({ message: "Name and email are required" });
    }

    // Check if email is already taken by another user
    const existingUser = await User.findOne({
      email: email.toLowerCase(),
      _id: { $ne: adminId },
    });

    if (existingUser) {
      return res
        .status(400)
        .json({ message: "Email is already in use by another user" });
    }

    // Store original values for logging
    const originalUser = await User.findById(adminId)
      .select("-password")
      .lean();
    const originalInfo = await UserInfo.findOne({ userId: adminId }).lean();

    // Update user basic information
    const updatedUser = await User.findByIdAndUpdate(
      adminId,
      {
        name: name.trim(),
        email: email.toLowerCase().trim(),
        updatedAt: new Date(),
      },
      { new: true, runValidators: true }
    ).select("-password");

    // Update or create extended profile information
    const profileUpdateData = {
      userId: adminId,
      phone: phone?.trim() || "",
      address: address?.trim() || "",
      emergencyContact: emergencyContact?.trim() || "",
      emergencyPhone: emergencyPhone?.trim() || "",
      department: department || "Administration",
      position: position || "System Administrator",
      employeeId: employeeId || `ADM${adminId.toString().slice(-3)}`,
      updatedAt: new Date(),
    };

    const updatedInfo = await UserInfo.findOneAndUpdate(
      { userId: adminId },
      profileUpdateData,
      { new: true, upsert: true, runValidators: true }
    );

    // Combine updated data
    const fullProfile = {
      ...updatedUser.toObject(),
      ...updatedInfo.toObject(),
    };

    // Log the changes
    const changes = [];
    if (originalUser.name !== name)
      changes.push(`name: ${originalUser.name} → ${name}`);
    if (originalUser.email !== email)
      changes.push(`email: ${originalUser.email} → ${email}`);
    if ((originalInfo?.phone || "") !== (phone || ""))
      changes.push(
        `phone: ${originalInfo?.phone || "empty"} → ${phone || "empty"}`
      );
    if ((originalInfo?.address || "") !== (address || ""))
      changes.push(`address updated`);
    if ((originalInfo?.emergencyContact || "") !== (emergencyContact || ""))
      changes.push(`emergency contact updated`);

    await logAdminAction(
      adminId,
      "Update Profile",
      "update",
      "profile",
      adminId,
      `Updated profile: ${
        changes.length > 0 ? changes.join(", ") : "no changes detected"
      }`
    );

    res.json({
      message: "Profile updated successfully",
      profile: fullProfile,
    });
  } catch (error) {
    console.error("Update admin profile error:", error);

    await logAdminAction(
      req.adminUser._id,
      "Update Profile",
      "update",
      "profile",
      req.adminUser._id,
      "Failed to update profile",
      "failed",
      error.message
    );

    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// GET /api/admin/profile/activity - Get admin activity logs
router.get("/profile/activity", adminAuth, async (req, res) => {
  try {
    const adminId = req.adminUser._id;
    const { page = 1, limit = 20 } = req.query;

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get admin's activity logs
    const activities = await AdminLogs.find({ adminId })
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    // Get total count
    const totalActivities = await AdminLogs.countDocuments({ adminId });

    // Log this action
    await logAdminAction(
      adminId,
      "View Activity Logs",
      "profile",
      "logs",
      adminId,
      `Viewed activity logs (page ${page})`
    );

    res.json({
      activities,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalActivities / parseInt(limit)),
        totalActivities,
        hasNextPage: skip + activities.length < totalActivities,
        hasPrevPage: parseInt(page) > 1,
      },
    });
  } catch (error) {
    console.error("Get admin activity error:", error);

    await logAdminAction(
      req.adminUser._id,
      "View Activity Logs",
      "profile",
      "logs",
      req.adminUser._id,
      "Failed to retrieve activity logs",
      "failed",
      error.message
    );

    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// GET /api/admin/system-logs - Get comprehensive system logs (admin + user activities)
router.get("/system-logs", adminAuth, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      type = "all", // 'admin', 'user', 'all'
      level = "all", // 'success', 'failed', 'pending', 'all'
      activityType = "all", // specific activity types or 'all'
      startDate,
      endDate,
    } = req.query;

    // Dynamic import for UserActivity
    const { default: UserActivity } = await import(
      "../../models/userActivityLogs.js"
    );

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const limitNum = parseInt(limit);

    // Build date filter
    const dateFilter = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) dateFilter.createdAt.$gte = new Date(startDate);
      if (endDate) dateFilter.createdAt.$lte = new Date(endDate);
    }

    let allLogs = [];

    // Fetch admin logs if requested
    if (type === "all" || type === "admin") {
      const adminFilter = { ...dateFilter };
      if (level !== "all") adminFilter.status = level;
      if (activityType !== "all") adminFilter.activityType = activityType;

      const adminLogs = await AdminLogs.find(adminFilter)
        .populate("adminId", "name email")
        .populate("targetId")
        .sort({ createdAt: -1 })
        .lean();

      const transformedAdminLogs = adminLogs.map((log) => ({
        id: log._id,
        timestamp: log.createdAt,
        type: "admin",
        action: log.action,
        activityType: log.activityType,
        user: log.adminId?.name || log.adminId?.email || "Unknown Admin",
        userId: log.adminId?._id,
        userType: "admin",
        details: log.details || "No details available",
        level: log.status || "success",
        category: log.targetType || "system",
        targetType: log.targetType,
        targetId: log.targetId,
        ipAddress: log.ipAddress,
        userAgent: log.userAgent,
        errorMessage: log.errorMessage,
      }));

      allLogs.push(...transformedAdminLogs);
    }

    // Fetch user logs if requested
    if (type === "all" || type === "user") {
      const userFilter = { ...dateFilter };
      if (activityType !== "all") userFilter.activityType = activityType;

      const userLogs = await UserActivity.find(userFilter)
        .populate("userId", "name email")
        .sort({ createdAt: -1 })
        .lean();

      const transformedUserLogs = userLogs.map((log) => ({
        id: log._id,
        timestamp: log.createdAt,
        type: "user",
        action: log.activityDetails || `User ${log.activityType}`,
        activityType: log.activityType,
        user: log.userId?.name || log.userId?.email || "Unknown User",
        userId: log.userId?._id,
        userType: "user",
        details: log.activityDetails || "No details available",
        level: "info", // User activities are generally info level
        category: log.activityCategory || log.activityType || "user_activity",
        targetType: "user",
        targetId: log.userId?._id,
      }));

      allLogs.push(...transformedUserLogs);
    }

    // Sort all logs by timestamp (newest first)
    allLogs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    // Apply pagination
    const paginatedLogs = allLogs.slice(skip, skip + limitNum);
    const totalLogs = allLogs.length;

    // Get statistics
    const stats = {
      total: totalLogs,
      adminActions: allLogs.filter((log) => log.type === "admin").length,
      userActivities: allLogs.filter((log) => log.type === "user").length,
      successfulActions: allLogs.filter((log) => log.level === "success")
        .length,
      failedActions: allLogs.filter((log) => log.level === "failed").length,
      recentActivity: allLogs.slice(0, 10),
    };

    // Activity breakdown
    const activityBreakdown = {};
    allLogs.forEach((log) => {
      const key = log.activityType;
      activityBreakdown[key] = (activityBreakdown[key] || 0) + 1;
    });

    // Log this admin action
    await logAdminAction(
      req.adminUser._id,
      "View System Logs",
      "view",
      "system",
      null,
      `Viewed system logs (page ${page}, type: ${type}, level: ${level})`
    );

    res.json({
      logs: paginatedLogs,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalLogs / limitNum),
        totalLogs,
        hasNextPage: skip + paginatedLogs.length < totalLogs,
        hasPrevPage: page > 1,
        limit: limitNum,
      },
      stats,
      activityBreakdown: Object.entries(activityBreakdown)
        .map(([type, count]) => ({ type, count }))
        .sort((a, b) => b.count - a.count),
    });
  } catch (error) {
    console.error("Get system logs error:", error);

    await logAdminAction(
      req.adminUser._id,
      "View System Logs",
      "view",
      "system",
      null,
      "Failed to retrieve system logs",
      "failed",
      error.message
    );

    res.status(500).json({ message: "Server error", error: error.message });
  }
});

export default router;
