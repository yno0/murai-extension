import express from 'express';
import DetectedWord from '../models/detectedWordModel.js';
import { authenticateToken } from '../middleware/authMiddleware.js';
import mongoose from 'mongoose';

const router = express.Router();

// Get home screen statistics for authenticated user
router.get('/home-stats', authenticateToken, async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.id);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get overall statistics (all time)
    const overallStats = await DetectedWord.aggregate([
      { $match: { userId: userId } },
      {
        $group: {
          _id: null,
          totalThreatsBlocked: { $sum: 1 },
          uniqueSitesMonitored: { $addToSet: '$url' },
          averageAccuracy: { $avg: '$accuracy' }
        }
      }
    ]);

    // Get today's statistics
    const todayStats = await DetectedWord.aggregate([
      { 
        $match: { 
          userId: userId,
          createdAt: { $gte: today, $lt: tomorrow }
        }
      },
      {
        $group: {
          _id: null,
          inappropriateWordsFlagged: { $sum: 1 }
        }
      }
    ]);

    // Extract results
    const overall = overallStats[0] || { 
      totalThreatsBlocked: 0, 
      uniqueSitesMonitored: [], 
      averageAccuracy: 0 
    };
    
    const todayData = todayStats[0] || { inappropriateWordsFlagged: 0 };

    // Calculate unique sites count
    const uniqueSitesCount = overall.uniqueSitesMonitored.length;

    // Format average accuracy as percentage
    const averageAccuracy = Math.round((overall.averageAccuracy || 0) * 100);

    res.json({
      success: true,
      data: {
        overall: {
          threatsBlocked: overall.totalThreatsBlocked,
          sitesMonitored: uniqueSitesCount,
          averageAccuracy: averageAccuracy
        },
        today: {
          inappropriateWordsFlagged: todayData.inappropriateWordsFlagged
        }
      }
    });

  } catch (error) {
    console.error('Error fetching home stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch home statistics',
      error: error.message
    });
  }
});

export default router;
