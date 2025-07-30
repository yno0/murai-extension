import express from 'express';
import GroupActivity from '../../models/GroupActivity.js';
import Group from '../../models/groupModel.js';
import GroupMember from '../../models/groupUserModel.js';
import { authenticateToken } from '../../middleware/authMiddleware.js';

const router = express.Router();

// Get activities for a specific group
router.get('/groups/:id/activities', authenticateToken, async (req, res) => {
  try {
    const { id: groupId } = req.params;
    const { limit = 50, skip = 0, type } = req.query;
    
    // Check if user has access to this group
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }
    
    // Check if user is a member of the group or admin
    const isMember = await GroupMember.findOne({ 
      groupId: groupId, 
      userId: req.user.id 
    });
    
    if (!isMember && group.userId.toString() !== req.user.id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    let activities;
    if (type) {
      activities = await GroupActivity.getActivitiesByType(groupId, type, parseInt(limit));
    } else {
      activities = await GroupActivity.getGroupActivities(groupId, parseInt(limit), parseInt(skip));
    }
    
    res.json({
      success: true,
      activities,
      total: activities.length
    });
    
  } catch (error) {
    console.error('Error fetching group activities:', error);
    res.status(500).json({ 
      message: 'Failed to fetch group activities',
      error: error.message 
    });
  }
});

// Record a new activity for a group
router.post('/groups/:id/activities', authenticateToken, async (req, res) => {
  try {
    const { id: groupId } = req.params;
    const { type, message, metadata = {} } = req.body;
    
    // Validate required fields
    if (!type || !message) {
      return res.status(400).json({ 
        message: 'Type and message are required' 
      });
    }
    
    // Check if user has access to this group
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }
    
    // Check if user is a member of the group or admin
    const isMember = await GroupMember.findOne({ 
      groupId: groupId, 
      userId: req.user.id 
    });
    
    if (!isMember && group.userId.toString() !== req.user.id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    // Record the activity
    const activity = await GroupActivity.recordActivity(
      groupId,
      type,
      message,
      req.user.id,
      req.user.name || req.user.username || 'Unknown User',
      metadata
    );
    
    res.status(201).json({
      success: true,
      activity,
      message: 'Activity recorded successfully'
    });
    
  } catch (error) {
    console.error('Error recording group activity:', error);
    res.status(500).json({ 
      message: 'Failed to record group activity',
      error: error.message 
    });
  }
});

// Get activity statistics for a group
router.get('/groups/:id/activities/stats', authenticateToken, async (req, res) => {
  try {
    const { id: groupId } = req.params;
    const { days = 30 } = req.query;
    
    // Check if user has access to this group
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }
    
    // Check if user is a member of the group or admin
    const isMember = await GroupMember.findOne({ 
      groupId: groupId, 
      userId: req.user.id 
    });
    
    if (!isMember && group.userId.toString() !== req.user.id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - parseInt(days));
    
    // Get activity statistics
    const stats = await GroupActivity.aggregate([
      {
        $match: {
          groupId: group._id,
          createdAt: { $gte: cutoffDate }
        }
      },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);
    
    // Get daily activity counts
    const dailyStats = await GroupActivity.aggregate([
      {
        $match: {
          groupId: group._id,
          createdAt: { $gte: cutoffDate }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$createdAt'
            }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id': 1 }
      }
    ]);
    
    res.json({
      success: true,
      stats: {
        byType: stats,
        daily: dailyStats,
        period: `${days} days`
      }
    });
    
  } catch (error) {
    console.error('Error fetching group activity stats:', error);
    res.status(500).json({ 
      message: 'Failed to fetch group activity statistics',
      error: error.message 
    });
  }
});

export default router;
