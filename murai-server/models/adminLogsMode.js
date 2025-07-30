import { Schema, model } from "mongoose";

const adminLogsSchema = new Schema({
  adminId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  action: {
    type: String,
    required: true,
  },
  activityType: {
    type: String,
    enum: [
      "login",
      "logout",
      "update",
      "visit",
      "view",
      "report",
      "group_join",
      "group_leave",
      "flagged",
      "other",
      "user",
    ],
    required: true,
  },

  targetType: {
    type: String,
    enum: ["report", "user", "group", "system", "other"],
    required: true,
  },
  targetId: {
    type: Schema.Types.ObjectId,
  },
  details: {
    type: String,
  },
  ipAddress: {
    type: String,
  },
  userAgent: {
    type: String,
  },
  status: {
    type: String,
    enum: ["success", "failed", "pending"],
    default: "success",
  },
  errorMessage: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default model("AdminLogs", adminLogsSchema);
