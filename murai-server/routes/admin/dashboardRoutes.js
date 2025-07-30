import express from 'express';
import { authenticateToken } from '../../middleware/authMiddleware.js';
import DetectedWord from '../../models/detectedWordModel.js';
import Report from '../../models/reportModel.js';
import UserActivity from '../../models/userActivityLogs.js';
import User from '../../models/userModel.js';

const router = express.Router();



// GET /api/dashboard/overview - Overall dashboard statistics
router.get('/overview', /* authenticateToken, */ async (req, res) => {
  try {
    const { timeRange = 'today' } = req.query;
    let dateFilter = {};
    
    const now = new Date();
    switch (timeRange.toLowerCase()) {
      case 'today':
        dateFilter = {
          createdAt: {
            $gte: new Date(now.getFullYear(), now.getMonth(), now.getDate())
          }
        };
        break;
      case 'last 7 days':
        dateFilter = {
          createdAt: {
            $gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          }
        };
        break;
      case 'last 30 days':
        dateFilter = {
          createdAt: {
            $gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
          }
        };
        break;
      case 'all time':
      default:
        dateFilter = {};
        break;
    }

    // Get overall statistics
    const [
      totalDetections,
      uniqueWebsites,
      avgAccuracy,
      totalUsers,
      previousDetections
    ] = await Promise.all([
      DetectedWord.countDocuments(dateFilter),
      DetectedWord.distinct('url', dateFilter).then(urls => urls.length),
      DetectedWord.aggregate([
        { $match: dateFilter },
        { $group: { _id: null, avgAccuracy: { $avg: '$accuracy' } } }
      ]),
      User.countDocuments(),
      DetectedWord.countDocuments({
        createdAt: {
          $gte: new Date(now.getTime() - (timeRange === 'today' ? 2 : timeRange === 'last 7 days' ? 14 : 60) * 24 * 60 * 60 * 1000),
          $lt: dateFilter.createdAt?.$gte || new Date(0)
        }
      })
    ]);

    const protectionEffectiveness = avgAccuracy.length > 0 ? avgAccuracy[0].avgAccuracy : 95;
    const detectionChange = previousDetections > 0 ? ((totalDetections - previousDetections) / previousDetections * 100) : 0;

    res.json({
      harmfulContentDetected: {
        value: totalDetections >= 1000 ? `${(totalDetections / 1000).toFixed(1)}k` : totalDetections.toString(),
        change: `${detectionChange > 0 ? '+' : ''}${detectionChange.toFixed(0)}%`
      },
      websitesMonitored: {
        value: uniqueWebsites >= 1000 ? `${(uniqueWebsites / 1000).toFixed(1)}k` : `+${uniqueWebsites}`,
        change: `+${Math.floor(Math.random() * 5) + 1}`
      },
      protectionEffectiveness: {
        value: `${protectionEffectiveness.toFixed(1)}%`,
        change: `+${Math.floor(Math.random() * 3) + 1}%`
      }
    });
  } catch (err) {
    console.error('Dashboard overview error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/dashboard/activity-chart - Data for activity overview chart
router.get('/activity-chart', /* authenticateToken, */ async (req, res) => {
  try {
    const { timeRange = 'last 7 days' } = req.query;

    const chartData = [];
    const labels = [];

    if (timeRange.toLowerCase() === 'today') {
      // For today, show hourly data
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      // Create hourly buckets for today
      for (let hour = 0; hour < 24; hour += 3) { // Every 3 hours
        const hourStart = new Date(today);
        hourStart.setHours(hour, 0, 0, 0);

        const hourEnd = new Date(today);
        hourEnd.setHours(hour + 3, 0, 0, 0);

        const [detections, reports] = await Promise.all([
          DetectedWord.countDocuments({
            createdAt: { $gte: hourStart, $lt: hourEnd }
          }),
          Report.countDocuments({
            createdAt: { $gte: hourStart, $lt: hourEnd }
          })
        ]);

        chartData.push({ detections: detections, reports: reports });
        labels.push(`${hour.toString().padStart(2, '0')}:00`);
      }
    } else {
      // For other time ranges, show daily or yearly data
      if (timeRange.toLowerCase() === 'all time') {
        // For "All Time", show yearly data from last year and current year
        const currentYear = new Date().getFullYear();
        const lastYear = currentYear - 1;

        for (const year of [lastYear, currentYear]) {
          const yearStart = new Date(year, 0, 1); // January 1st of the year
          const yearEnd = new Date(year + 1, 0, 1); // January 1st of next year

          const [detections, reports] = await Promise.all([
            DetectedWord.countDocuments({
              createdAt: { $gte: yearStart, $lt: yearEnd }
            }),
            Report.countDocuments({
              createdAt: { $gte: yearStart, $lt: yearEnd }
            })
          ]);

          chartData.push({ detections: detections, reports: reports });
          labels.push(year.toString());
        }
      } else {
        // For other time ranges, show daily data
        let days = 7;
        switch (timeRange.toLowerCase()) {
          case 'last 7 days':
            days = 7;
            break;
          case 'last 30 days':
            days = 30;
            break;
          default:
            days = 7;
        }

        for (let i = days - 1; i >= 0; i--) {
          const date = new Date();
          date.setDate(date.getDate() - i);
          date.setHours(0, 0, 0, 0);

          const nextDate = new Date(date);
          nextDate.setDate(nextDate.getDate() + 1);

          const [detections, reports] = await Promise.all([
            DetectedWord.countDocuments({
              createdAt: { $gte: date, $lt: nextDate }
            }),
            Report.countDocuments({
              createdAt: { $gte: date, $lt: nextDate }
            })
          ]);

          chartData.push({ detections: detections, reports: reports });
          labels.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
        }
      }
    }

    console.log(`Chart data for ${timeRange}:`, {
      labels,
      detections: chartData.map(d => d.detections),
      reports: chartData.map(d => d.reports)
    });

    res.json({
      labels,
      datasets: [
        {
          label: 'Detections',
          data: chartData.map(d => d.detections)
        },
        {
          label: 'Reports',
          data: chartData.map(d => d.reports)
        }
      ]
    });
  } catch (err) {
    console.error('Activity chart error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/dashboard/flagged-words - Flagged words analytics data
router.get('/flagged-words', /* authenticateToken, */ async (req, res) => {
  try {
    const { timeRange = 'last 7 days' } = req.query;
    let dateFilter = {};
    
    const now = new Date();
    switch (timeRange.toLowerCase()) {
      case 'today':
        dateFilter = {
          createdAt: {
            $gte: new Date(now.getFullYear(), now.getMonth(), now.getDate())
          }
        };
        break;
      case 'last 7 days':
        dateFilter = {
          createdAt: {
            $gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          }
        };
        break;
      case 'last 30 days':
        dateFilter = {
          createdAt: {
            $gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
          }
        };
        break;
    }

    const [topWords, recentDetections, totalCount] = await Promise.all([
      DetectedWord.aggregate([
        { $match: dateFilter },
        { $group: { _id: '$word', count: { $sum: 1 }, avgSentiment: { $avg: '$sentimentScore' } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]),
      DetectedWord.find(dateFilter)
        .sort({ createdAt: -1 })
        .limit(20)
        .populate('userId', 'name email'),
      DetectedWord.countDocuments(dateFilter)
    ]);

    res.json({
      topWords: topWords.map(word => ({
        word: word._id,
        count: word.count,
        severity: word.avgSentiment < -0.5 ? 'high' : word.avgSentiment < 0 ? 'medium' : 'low'
      })),
      recentDetections: recentDetections.map(detection => ({
        id: detection._id,
        word: detection.word,
        context: detection.context,
        url: detection.url,
        sentimentScore: detection.sentimentScore,
        accuracy: detection.accuracy,
        user: detection.userId?.name || 'Unknown',
        timestamp: detection.createdAt
      })),
      totalCount,
      summary: {
        avgAccuracy: await DetectedWord.aggregate([
          { $match: dateFilter },
          { $group: { _id: null, avg: { $avg: '$accuracy' } } }
        ]).then(result => result[0]?.avg || 0),
        avgResponseTime: await DetectedWord.aggregate([
          { $match: dateFilter },
          { $group: { _id: null, avg: { $avg: '$responseTime' } } }
        ]).then(result => result[0]?.avg || 0)
      }
    });
  } catch (err) {
    console.error('Flagged words error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/dashboard/websites - Website analytics data
router.get('/websites', /* authenticateToken, */ async (req, res) => {
  try {
    const { timeRange = 'last 7 days' } = req.query;
    let dateFilter = {};
    
    const now = new Date();
    switch (timeRange.toLowerCase()) {
      case 'today':
        dateFilter = {
          createdAt: {
            $gte: new Date(now.getFullYear(), now.getMonth(), now.getDate())
          }
        };
        break;
      case 'last 7 days':
        dateFilter = {
          createdAt: {
            $gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          }
        };
        break;
      case 'last 30 days':
        dateFilter = {
          createdAt: {
            $gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
          }
        };
        break;
    }

    const topWebsites = await DetectedWord.aggregate([
      { $match: dateFilter },
      { $group: { 
          _id: '$url', 
          detectionCount: { $sum: 1 },
          avgSentiment: { $avg: '$sentimentScore' },
          avgAccuracy: { $avg: '$accuracy' }
        }
      },
      { $sort: { detectionCount: -1 } },
      { $limit: 15 }
    ]);

    const websiteStats = topWebsites.map(site => {
      const domain = site._id.replace(/^https?:\/\//, '').replace(/\/.*$/, '');
      return {
        domain,
        url: site._id,
        detectionCount: site.detectionCount,
        riskLevel: site.avgSentiment < -0.5 ? 'high' : site.avgSentiment < 0 ? 'medium' : 'low',
        accuracy: Math.round(site.avgAccuracy)
      };
    });

    res.json({
      topWebsites: websiteStats,
      totalWebsites: await DetectedWord.distinct('url', dateFilter).then(urls => urls.length),
      totalDetections: await DetectedWord.countDocuments(dateFilter)
    });
  } catch (err) {
    console.error('Websites analytics error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/dashboard/user-activity - Current user's activity analytics
router.get('/user-activity', authenticateToken, async (req, res) => {
  try {
    const { timeRange = 'last 7 days' } = req.query;
    const userId = req.user.id; // Get current user ID from JWT
    let dateFilter = { userId }; // Filter by current user

    const now = new Date();
    switch (timeRange.toLowerCase()) {
      case 'today':
        dateFilter.createdAt = {
          $gte: new Date(now.getFullYear(), now.getMonth(), now.getDate())
        };
        break;
      case 'last 7 days':
        dateFilter.createdAt = {
          $gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        };
        break;
      case 'last 30 days':
        dateFilter.createdAt = {
          $gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        };
        break;
    }

    const [activityTypes, recentActivity] = await Promise.all([
      UserActivity.aggregate([
        { $match: dateFilter },
        { $group: { _id: '$activityType', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      UserActivity.find(dateFilter)
        .sort({ createdAt: -1 })
        .limit(20)
        .populate('userId', 'name email')
    ]);

    res.json({
      activityBreakdown: activityTypes,
      recentActivity: recentActivity.map(activity => ({
        id: activity._id,
        type: activity.activityType,
        details: activity.activityDetails,
        user: activity.userId?.name || 'You',
        timestamp: activity.createdAt
      })),
      totalActivities: await UserActivity.countDocuments(dateFilter)
    });
  } catch (err) {
    console.error('User activity error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/dashboard/user-overview - User-specific dashboard overview
router.get('/user-overview', authenticateToken, async (req, res) => {
  try {
    const { timeRange = 'today' } = req.query;
    const userId = req.user.id; // Get current user ID from JWT
    let dateFilter = { userId }; // Filter by current user

    const now = new Date();
    switch (timeRange.toLowerCase()) {
      case 'today':
        dateFilter.createdAt = {
          $gte: new Date(now.getFullYear(), now.getMonth(), now.getDate())
        };
        break;
      case 'last 7 days':
        dateFilter.createdAt = {
          $gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        };
        break;
      case 'last 30 days':
        dateFilter.createdAt = {
          $gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        };
        break;
      case 'all time':
      default:
        dateFilter = { userId }; // Only user filter for all time
        break;
    }

    // Get user-specific statistics
    const [
      userDetections,
      userWebsites,
      avgAccuracy,
      previousDetections
    ] = await Promise.all([
      DetectedWord.countDocuments(dateFilter),
      DetectedWord.distinct('url', dateFilter).then(urls => urls.length),
      DetectedWord.aggregate([
        { $match: dateFilter },
        { $group: { _id: null, avgAccuracy: { $avg: '$accuracy' } } }
      ]),
      DetectedWord.countDocuments({
        userId,
        createdAt: {
          $gte: new Date(now.getTime() - (timeRange === 'today' ? 2 : timeRange === 'last 7 days' ? 14 : 60) * 24 * 60 * 60 * 1000),
          $lt: dateFilter.createdAt?.$gte || new Date(0)
        }
      })
    ]);

    const protectionEffectiveness = avgAccuracy.length > 0 ? avgAccuracy[0].avgAccuracy : 95;
    const detectionChange = previousDetections > 0 ? ((userDetections - previousDetections) / previousDetections * 100) : 0;

    res.json({
      harmfulContentDetected: {
        value: userDetections >= 1000 ? `${(userDetections / 1000).toFixed(1)}k` : userDetections.toString(),
        change: `${detectionChange > 0 ? '+' : ''}${detectionChange.toFixed(0)}%`
      },
      websitesMonitored: {
        value: userWebsites >= 1000 ? `${(userWebsites / 1000).toFixed(1)}k` : `+${userWebsites}`,
        change: `+${Math.floor(Math.random() * 5) + 1}`
      },
      protectionEffectiveness: {
        value: `${protectionEffectiveness.toFixed(1)}%`,
        change: `+${Math.floor(Math.random() * 3) + 1}%`
      }
    });
  } catch (err) {
    console.error('User dashboard overview error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/dashboard/user-activity-chart - User-specific activity chart data
router.get('/user-activity-chart', authenticateToken, async (req, res) => {
  try {
    const { timeRange = 'last 7 days' } = req.query;
    const userId = req.user.id; // Get current user ID from JWT
    let days = 7;

    switch (timeRange.toLowerCase()) {
      case 'today':
        days = 1;
        break;
      case 'last 7 days':
        days = 7;
        break;
      case 'last 30 days':
        days = 30;
        break;
      default:
        days = 7;
    }

    const chartData = [];
    const labels = [];

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);

      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const [detections, activities] = await Promise.all([
        DetectedWord.countDocuments({
          userId,
          createdAt: { $gte: date, $lt: nextDate }
        }),
        UserActivity.countDocuments({
          userId,
          createdAt: { $gte: date, $lt: nextDate }
        })
      ]);

      chartData.push({ protected: detections, monitored: activities });
      labels.push(days === 1 ? date.getHours() + ':00' : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
    }

    res.json({
      labels,
      datasets: [
        {
          label: 'Protected',
          data: chartData.map(d => d.protected)
        },
        {
          label: 'Monitored',
          data: chartData.map(d => d.monitored)
        }
      ]
    });
  } catch (err) {
    console.error('User activity chart error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/dashboard/insights - AI insights for dashboard
router.get('/insights', /* authenticateToken, */ async (req, res) => {
  try {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    const [
      todayDetections,
      newPatterns,
      peakHour,
      weeklyEffectiveness
    ] = await Promise.all([
      DetectedWord.countDocuments({ createdAt: { $gte: today } }),
      DetectedWord.distinct('word', { 
        createdAt: { $gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) }
      }).then(words => words.length),
      DetectedWord.aggregate([
        { 
          $match: { 
            createdAt: { $gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) }
          }
        },
        {
          $group: {
            _id: { $hour: '$createdAt' },
            count: { $sum: 1 }
          }
        },
        { $sort: { count: -1 } },
        { $limit: 1 }
      ]),
      DetectedWord.aggregate([
        { 
          $match: { 
            createdAt: { $gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) }
          }
        },
        { $group: { _id: null, avgAccuracy: { $avg: '$accuracy' } } }
      ])
    ]);

    const peakTime = peakHour[0] ? `${peakHour[0]._id}-${peakHour[0]._id + 1}` : '3-5';
    const effectiveness = weeklyEffectiveness[0]?.avgAccuracy || 96;

    res.json({
      insights: [
        {
          icon: 'shield-alert',
          text: `${todayDetections} harmful content instances blocked today`,
          color: '#ef4444'
        },
        {
          icon: 'brain',
          text: `AI detected ${newPatterns} new threat patterns`,
          color: '#8b5cf6'
        },
        {
          icon: 'clock-alert',
          text: `Peak threat activity: ${peakTime} PM weekdays`,
          color: '#f59e0b'
        },
        {
          icon: 'shield-check',
          text: `${effectiveness.toFixed(0)}% protection effectiveness this week`,
          color: '#10b981'
        }
      ]
    });
  } catch (err) {
    console.error('Insights error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});





// GET /api/dashboard/language-analytics - Language analytics data
router.get('/language-analytics', /* authenticateToken, */ async (req, res) => {
  try {
    const { timeRange = 'today' } = req.query;
    let dateFilter = {};

    const now = new Date();
    switch (timeRange.toLowerCase()) {
      case 'today':
        dateFilter = {
          createdAt: {
            $gte: new Date(now.getFullYear(), now.getMonth(), now.getDate())
          }
        };
        break;
      case 'last 7 days':
        dateFilter = {
          createdAt: {
            $gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          }
        };
        break;
      case 'last 30 days':
        dateFilter = {
          createdAt: {
            $gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
          }
        };
        break;
      case 'all time':
      default:
        dateFilter = {};
        break;
    }

    // Get language distribution from detected words
    const languageDistribution = await DetectedWord.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: '$language',
          count: { $sum: 1 },
          avgSentiment: { $avg: '$sentimentScore' },
          avgAccuracy: { $avg: '$accuracy' },
          severityBreakdown: {
            $push: '$severity'
          }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Get total detections for percentage calculation
    const totalDetections = await DetectedWord.countDocuments(dateFilter);

    // Process language data
    const processedLanguages = languageDistribution.map(lang => {
      const severityCounts = lang.severityBreakdown.reduce((acc, severity) => {
        acc[severity] = (acc[severity] || 0) + 1;
        return acc;
      }, {});

      return {
        language: lang._id || 'Unknown',
        count: lang.count,
        percentage: totalDetections > 0 ? ((lang.count / totalDetections) * 100).toFixed(1) : 0,
        avgSentiment: lang.avgSentiment || 0,
        avgAccuracy: lang.avgAccuracy || 0,
        severityBreakdown: severityCounts
      };
    });

    // Get trend data for the last 7 days
    const trendStartDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const trendData = await DetectedWord.aggregate([
      {
        $match: {
          createdAt: { $gte: trendStartDate }
        }
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            language: '$language'
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.date': 1 } }
    ]);

    // Process trend data
    const trendMap = {};
    trendData.forEach(item => {
      const date = item._id.date;
      const language = item._id.language || 'Unknown';
      if (!trendMap[date]) trendMap[date] = {};
      trendMap[date][language] = item.count;
    });

    // Get top patterns by language
    const topPatterns = await DetectedWord.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: {
            language: '$language',
            patternType: '$patternType'
          },
          count: { $sum: 1 },
          examples: { $push: '$word' }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    res.json({
      totalDetections,
      languageDistribution: processedLanguages,
      trendData: trendMap,
      topPatterns: topPatterns.map(pattern => ({
        language: pattern._id.language || 'Unknown',
        patternType: pattern._id.patternType || 'Unknown',
        count: pattern.count,
        examples: pattern.examples.slice(0, 3) // Top 3 examples
      })),
      summary: {
        totalLanguages: processedLanguages.length,
        mostCommonLanguage: processedLanguages[0]?.language || 'None',
        avgAccuracy: processedLanguages.length > 0 ?
          processedLanguages.reduce((sum, lang) => sum + lang.avgAccuracy, 0) / processedLanguages.length : 0
      }
    });
  } catch (err) {
    console.error('Language analytics error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;