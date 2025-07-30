import mongoose from 'mongoose';

const groupActivitySchema = new mongoose.Schema({
  groupId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group',
    required: true,
    index: true
  },
  type: {
    type: String,
    required: true,
    enum: [
      'group_created',
      'group_updated',
      'group_deleted',
      'member_joined',
      'member_left',
      'member_removed',
      'member_promoted',
      'member_demoted',
      'settings_updated',
      'code_regenerated',
      'detection',
      'report_generated',
      'content_flagged',
      'warning_issued'
    ]
  },
  message: {
    type: String,
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  userName: {
    type: String,
    required: true
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: true
});

// Index for efficient querying
groupActivitySchema.index({ groupId: 1, createdAt: -1 });
groupActivitySchema.index({ type: 1, createdAt: -1 });

// Static method to record activity
groupActivitySchema.statics.recordActivity = async function(groupId, type, message, userId, userName, metadata = {}) {
  try {
    const activity = new this({
      groupId,
      type,
      message,
      userId,
      userName,
      metadata
    });
    
    await activity.save();
    return activity;
  } catch (error) {
    console.error('Error recording group activity:', error);
    throw error;
  }
};

// Static method to get activities for a group
groupActivitySchema.statics.getGroupActivities = async function(groupId, limit = 50, skip = 0) {
  try {
    const activities = await this.find({ groupId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip)
      .populate('userId', 'name username email')
      .lean();
    
    return activities;
  } catch (error) {
    console.error('Error fetching group activities:', error);
    throw error;
  }
};

// Static method to get activities by type
groupActivitySchema.statics.getActivitiesByType = async function(groupId, type, limit = 20) {
  try {
    const activities = await this.find({ groupId, type })
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('userId', 'name username email')
      .lean();
    
    return activities;
  } catch (error) {
    console.error('Error fetching activities by type:', error);
    throw error;
  }
};

// Static method to clean old activities (optional - for maintenance)
groupActivitySchema.statics.cleanOldActivities = async function(daysToKeep = 90) {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
    
    const result = await this.deleteMany({
      createdAt: { $lt: cutoffDate }
    });
    
    console.log(`Cleaned ${result.deletedCount} old activities`);
    return result;
  } catch (error) {
    console.error('Error cleaning old activities:', error);
    throw error;
  }
};

export default mongoose.model('GroupActivity', groupActivitySchema);
