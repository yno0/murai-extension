import express from 'express';
import mongoose from 'mongoose';
import { authenticateToken } from '../../middleware/authMiddleware.js';
import DetectedWord from '../../models/detectedWordModel.js';
import UserActivity from '../../models/userActivityLogs.js';

const router = express.Router();



// GET /api/user-dashboard/overview - User-specific dashboard overview
router.get('/overview', authenticateToken, async (req, res) => {
  try {
    const { timeRange = 'today' } = req.query;
    const userId = new mongoose.Types.ObjectId(req.user.id); // Get current user ID from JWT
    let dateFilter = { userId }; // Filter by current user
    
    const now = new Date();
    switch (timeRange.toLowerCase()) {
      case 'today':
        // Today only
        const startOfDay = new Date(now);
        startOfDay.setHours(0, 0, 0, 0);
        dateFilter.createdAt = {
          $gte: startOfDay
        };
        break;
      case 'week':
        // Last 7 days
        dateFilter.createdAt = {
          $gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        };
        break;
      case 'month':
        // Last 12 months
        const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1);
        dateFilter.createdAt = {
          $gte: twelveMonthsAgo
        };
        break;
      case 'year':
        // Current year or all time for this user
        dateFilter.createdAt = {
          $gte: new Date(now.getFullYear(), 0, 1)
        };
        break;
      default:
        dateFilter = { userId };
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
          $gte: new Date(now.getTime() - (
            timeRange === 'today' ? 14 * 24 * 60 * 60 * 1000 : // Previous 2 weeks for comparison
            timeRange === 'month' ? 365 * 24 * 60 * 60 * 1000 : // Previous year for comparison
            2 * 365 * 24 * 60 * 60 * 1000 // Previous 2 years for comparison
          )),
          $lt: dateFilter.createdAt?.$gte || new Date(0)
        }
      })
    ]);

    const protectionEffectiveness = avgAccuracy.length > 0 ? avgAccuracy[0].avgAccuracy * 100 : 0;
    const detectionChange = previousDetections > 0 ? ((userDetections - previousDetections) / previousDetections * 100) : 0;

    // Calculate previous websites for comparison
    const previousWebsites = await DetectedWord.distinct('url', {
      userId,
      createdAt: {
        $gte: new Date(now.getTime() - (
          timeRange === 'today' ? 14 * 24 * 60 * 60 * 1000 : // Previous 2 weeks for comparison
          timeRange === 'month' ? 365 * 24 * 60 * 60 * 1000 : // Previous year for comparison
          2 * 365 * 24 * 60 * 60 * 1000 // Previous 2 years for comparison
        )),
        $lt: dateFilter.createdAt?.$gte || new Date(0)
      }
    }).then(urls => urls.length);

    const websiteChange = previousWebsites > 0 ? userWebsites - previousWebsites : userWebsites;

    res.json({
      harmfulContentDetected: {
        value: userDetections.toString(),
        change: `${detectionChange > 0 ? '+' : ''}${detectionChange.toFixed(0)}%`
      },
      websitesMonitored: {
        value: userWebsites.toString(),
        change: `${websiteChange > 0 ? '+' : ''}${websiteChange}`
      },
      protectionEffectiveness: {
        value: `${protectionEffectiveness.toFixed(1)}%`,
        change: protectionEffectiveness > 0 ? `+${(protectionEffectiveness - 95).toFixed(1)}%` : '0%'
      }
    });
  } catch (err) {
    console.error('User dashboard overview error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/user-dashboard/activity-chart - User-specific activity chart data
router.get('/activity-chart', authenticateToken, async (req, res) => {
  try {
    const { timeRange = 'day', year } = req.query;
    const userId = new mongoose.Types.ObjectId(req.user.id); // Get current user ID from JWT

    const chartData = [];
    const labels = [];

    if (timeRange.toLowerCase() === 'today') {
      // Show today by hours (24 hours)
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      for (let hour = 0; hour < 24; hour++) {
        const startHour = new Date(today);
        startHour.setHours(hour);

        const endHour = new Date(today);
        endHour.setHours(hour + 1);

        const detections = await DetectedWord.countDocuments({
          userId,
          createdAt: { $gte: startHour, $lt: endHour }
        });

        chartData.push({ protected: detections, monitored: 0 });
        labels.push(`${hour.toString().padStart(2, '0')}:00`);
      }
    } else if (timeRange.toLowerCase() === 'week') {
      // Show last 7 days
      const today = new Date();

      for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        date.setHours(0, 0, 0, 0);

        const nextDate = new Date(date);
        nextDate.setDate(nextDate.getDate() + 1);

        const detections = await DetectedWord.countDocuments({
          userId,
          createdAt: { $gte: date, $lt: nextDate }
        });

        chartData.push({ protected: detections, monitored: 0 });
        labels.push(date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }));
      }
    } else if (timeRange.toLowerCase() === 'month') {
      // Show last 12 months (monthly breakdown)
      const now = new Date();
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                         'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

      for (let i = 11; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const nextMonth = new Date(date.getFullYear(), date.getMonth() + 1, 1);

        const detections = await DetectedWord.countDocuments({
          userId,
          createdAt: { $gte: date, $lt: nextMonth }
        });

        chartData.push({ protected: detections, monitored: 0 });
        labels.push(monthNames[date.getMonth()]);
      }
    } else if (timeRange.toLowerCase() === 'year') {
      // Show yearly data (2024, 2025, etc.)
      const currentYear = new Date().getFullYear();

      // Get all years that have detection data
      const yearsWithData = await DetectedWord.aggregate([
        { $match: { userId: new mongoose.Types.ObjectId(userId) } },
        { $group: { _id: { $year: '$createdAt' } } },
        { $sort: { '_id': 1 } }
      ]);

      if (yearsWithData.length === 0) {
        // If no data, show current year
        chartData.push({ protected: 0, monitored: 0 });
        labels.push(currentYear.toString());
      } else {
        for (const yearData of yearsWithData) {
          const yearValue = yearData._id;
          const startDate = new Date(yearValue, 0, 1);
          const endDate = new Date(yearValue + 1, 0, 1);

          const detections = await DetectedWord.countDocuments({
            userId: new mongoose.Types.ObjectId(userId),
            createdAt: { $gte: startDate, $lt: endDate }
          });

          chartData.push({ protected: detections, monitored: 0 });
          labels.push(yearValue.toString());
        }
      }
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

// GET /api/user-dashboard/user-activity - Current user's recent activity
router.get('/user-activity', authenticateToken, async (req, res) => {
  try {
    const { timeRange = 'today' } = req.query;
    const userId = new mongoose.Types.ObjectId(req.user.id); // Get current user ID from JWT
    let dateFilter = { userId }; // Filter by current user

    const now = new Date();
    switch (timeRange.toLowerCase()) {
      case 'today':
        // Today only
        const startOfDay = new Date(now);
        startOfDay.setHours(0, 0, 0, 0);
        dateFilter.createdAt = {
          $gte: startOfDay
        };
        break;
      case 'week':
        // Last 7 days
        dateFilter.createdAt = {
          $gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        };
        break;
      case 'month':
        // Last 12 months
        const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1);
        dateFilter.createdAt = {
          $gte: twelveMonthsAgo
        };
        break;
      case 'year':
        // Last year + current year
        dateFilter.createdAt = {
          $gte: new Date(now.getFullYear() - 1, 0, 1)
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

// GET /api/user-dashboard/available-years - Get years with detection data for current user
router.get('/available-years', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const yearsWithData = await DetectedWord.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId) } },
      { $group: { _id: { $year: '$createdAt' } } },
      { $sort: { '_id': -1 } } // Most recent first
    ]);

    const years = yearsWithData.map(item => item._id);

    // If no data, include current year
    if (years.length === 0) {
      years.push(new Date().getFullYear());
    }

    res.json({ years });
  } catch (err) {
    console.error('Available years error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/user-dashboard/detected-words - Get detected words for current user with analytics data
router.get('/detected-words', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { timeRange = 'week', includeLanguage = false, includePatterns = false } = req.query;

    let dateFilter = { userId: new mongoose.Types.ObjectId(userId) };

    const now = new Date();
    switch (timeRange.toLowerCase()) {
      case 'today':
        dateFilter.createdAt = {
          $gte: new Date(now.getFullYear(), now.getMonth(), now.getDate())
        };
        break;
      case 'week':
        dateFilter.createdAt = {
          $gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        };
        break;
      case 'month':
        dateFilter.createdAt = {
          $gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        };
        break;
      case 'year':
        dateFilter.createdAt = {
          $gte: new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
        };
        break;
    }

    const [detectedWords, totalCount] = await Promise.all([
      DetectedWord.find(dateFilter)
        .sort({ createdAt: -1 })
        .limit(100)
        .populate('userId', 'name email'),
      DetectedWord.countDocuments(dateFilter)
    ]);

    // Process detected words to include language and pattern information
    const processedWords = detectedWords.map(word => {
      const result = {
        id: word._id,
        word: word.word,
        context: word.context,
        url: word.url,
        sentimentScore: word.sentimentScore,
        accuracy: word.accuracy,
        responseTime: word.responseTime,
        createdAt: word.createdAt,
        user: word.userId?.name || 'You'
      };

      // Add language information if requested
      if (includeLanguage === 'true') {
        result.language = word.language || detectLanguageFromText(word.context || word.word);
      }

      // Add pattern information if requested
      if (includePatterns === 'true') {
        result.patternType = word.patternType || 'General';
        result.severity = word.severity || determineSeverityFromSentiment(word.sentimentScore);
        result.siteType = word.siteType || 'Unknown';
      }

      return result;
    });

    res.json({
      detectedWords: processedWords,
      totalCount
    });
  } catch (err) {
    console.error('Detected words error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Helper function to detect language from text
function detectLanguageFromText(text) {
  if (!text) return 'Unknown';

  // Check for mixed English-Tagalog (Taglish)
  const hasEnglish = /\b(the|and|or|but|in|on|at|to|for|of|with|by)\b/i.test(text);
  const hasTagalog = /\b(ang|ng|sa|mga|ako|ikaw|siya|kami|kayo|sila|na|pa|po|opo)\b/i.test(text);

  if (hasEnglish && hasTagalog) {
    return 'Taglish';
  } else if (hasTagalog || /[ñáéíóúü]/i.test(text)) {
    return 'Tagalog';
  } else if (/^[a-zA-Z\s.,!?'"()-]+$/.test(text)) {
    return 'English';
  } else {
    return 'Other';
  }
}

// Helper function to determine severity from sentiment score
function determineSeverityFromSentiment(sentimentScore) {
  if (sentimentScore < -0.5) return 'high';
  if (sentimentScore < -0.2) return 'medium';
  return 'low';
}

// GET /api/user-dashboard/threat-distribution - Get threat distribution with URL deduplication
router.get('/threat-distribution', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { timeRange = 'week' } = req.query;

    let dateFilter = { userId: new mongoose.Types.ObjectId(userId) };

    const now = new Date();
    switch (timeRange.toLowerCase()) {
      case 'today':
        dateFilter.createdAt = {
          $gte: new Date(now.getFullYear(), now.getMonth(), now.getDate())
        };
        break;
      case 'week':
        dateFilter.createdAt = {
          $gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        };
        break;
      case 'month':
        dateFilter.createdAt = {
          $gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        };
        break;
      case 'year':
        dateFilter.createdAt = {
          $gte: new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
        };
        break;
    }

    // Aggregate threats by URL to ensure each URL is counted only once
    const threatsByUrl = await DetectedWord.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: '$url',
          maxSeverity: { $max: '$severity' },
          avgSentiment: { $avg: '$sentimentScore' },
          detectionCount: { $sum: 1 },
          languages: { $addToSet: '$language' },
          patterns: { $addToSet: '$patternType' },
          siteTypes: { $addToSet: '$siteType' },
          lastDetection: { $max: '$createdAt' }
        }
      }
    ]);

    // Process threat distribution counts
    const severityCount = { low: 0, medium: 0, high: 0 };
    const languageCount = {};
    const patternCount = {};
    const siteTypeCount = {};

    threatsByUrl.forEach(threat => {
      // Determine final severity (use max severity or calculate from sentiment)
      let severity = threat.maxSeverity;
      if (!severity) {
        if (threat.avgSentiment < -0.5) severity = 'high';
        else if (threat.avgSentiment < -0.2) severity = 'medium';
        else severity = 'low';
      }

      // Count unique threats by severity
      severityCount[severity] = (severityCount[severity] || 0) + 1;

      // Count unique threats by language (take first language if multiple)
      const language = threat.languages[0] || 'Unknown';
      languageCount[language] = (languageCount[language] || 0) + 1;

      // Count unique threats by pattern (take first pattern if multiple)
      const pattern = threat.patterns[0] || 'General';
      patternCount[pattern] = (patternCount[pattern] || 0) + 1;

      // Count unique threats by site type (take first site type if multiple)
      const siteType = threat.siteTypes[0] || 'Unknown';
      siteTypeCount[siteType] = (siteTypeCount[siteType] || 0) + 1;
    });

    res.json({
      severityDistribution: severityCount,
      languageDistribution: languageCount,
      patternDistribution: patternCount,
      siteTypeDistribution: siteTypeCount,
      totalUniqueThreats: threatsByUrl.length,
      totalDetections: threatsByUrl.reduce((sum, threat) => sum + threat.detectionCount, 0)
    });
  } catch (err) {
    console.error('Threat distribution error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/user-dashboard/websites - Get website analytics for current user
router.get('/websites', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { timeRange = 'week' } = req.query;

    let dateFilter = { userId: new mongoose.Types.ObjectId(userId) };

    const now = new Date();
    switch (timeRange.toLowerCase()) {
      case 'today':
        dateFilter.createdAt = {
          $gte: new Date(now.getFullYear(), now.getMonth(), now.getDate())
        };
        break;
      case 'week':
        dateFilter.createdAt = {
          $gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        };
        break;
      case 'month':
        dateFilter.createdAt = {
          $gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        };
        break;
      case 'year':
        dateFilter.createdAt = {
          $gte: new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
        };
        break;
    }

    // Get website analytics aggregated by URL
    const websiteStats = await DetectedWord.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: '$url',
          detectionCount: { $sum: 1 },
          avgSentiment: { $avg: '$sentimentScore' },
          avgAccuracy: { $avg: '$accuracy' },
          lastDetection: { $max: '$createdAt' },
          patterns: { $addToSet: '$patternType' },
          severities: { $push: '$severity' }
        }
      },
      { $sort: { detectionCount: -1 } },
      { $limit: 20 }
    ]);

    // Calculate previous period data for comparison
    let previousDateFilter = { userId: new mongoose.Types.ObjectId(userId) };
    const previousPeriodStart = new Date();

    switch (timeRange.toLowerCase()) {
      case 'today':
        // Compare with yesterday
        previousPeriodStart.setDate(previousPeriodStart.getDate() - 1);
        previousDateFilter.createdAt = {
          $gte: new Date(previousPeriodStart.getFullYear(), previousPeriodStart.getMonth(), previousPeriodStart.getDate()),
          $lt: new Date(now.getFullYear(), now.getMonth(), now.getDate())
        };
        break;
      case 'week':
        // Compare with previous week
        previousDateFilter.createdAt = {
          $gte: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000),
          $lt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        };
        break;
      case 'month':
        // Compare with previous month
        previousDateFilter.createdAt = {
          $gte: new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000),
          $lt: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        };
        break;
      case 'year':
        // Compare with previous year
        previousDateFilter.createdAt = {
          $gte: new Date(now.getTime() - 2 * 365 * 24 * 60 * 60 * 1000),
          $lt: new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
        };
        break;
    }

    // Get previous period data for comparison
    const previousWebsiteStats = await DetectedWord.aggregate([
      { $match: previousDateFilter },
      {
        $group: {
          _id: '$url',
          detectionCount: { $sum: 1 }
        }
      }
    ]);

    // Create a map for quick lookup of previous data
    const previousDataMap = {};
    previousWebsiteStats.forEach(site => {
      previousDataMap[site._id] = site.detectionCount;
    });

    // Process website data with accurate change calculations
    const topWebsites = websiteStats.map(site => {
      const domain = site._id.replace(/^https?:\/\//, '').replace(/\/.*$/, '');

      // Determine risk level based on sentiment and detection count
      let riskLevel = 'low';
      if (site.avgSentiment < -0.5 || site.detectionCount > 10) {
        riskLevel = 'high';
      } else if (site.avgSentiment < -0.2 || site.detectionCount > 5) {
        riskLevel = 'medium';
      }

      // Calculate accurate change from previous period
      const previousCount = previousDataMap[site._id] || 0;
      const change = site.detectionCount - previousCount;
      const changeText = change > 0 ? `+${change}` : change < 0 ? `${change}` : '0';

      return {
        domain,
        url: site._id,
        detectionCount: site.detectionCount,
        riskLevel,
        accuracy: Math.round(site.avgAccuracy * 100),
        lastDetection: site.lastDetection,
        patterns: site.patterns.filter(p => p), // Remove null/undefined patterns
        threats: site.detectionCount,
        change: changeText
      };
    });

    // Get overall statistics for current and previous periods
    const [
      totalWebsites,
      totalDetections,
      avgAccuracy,
      previousTotalWebsites,
      previousTotalDetections,
      previousAvgAccuracy
    ] = await Promise.all([
      DetectedWord.distinct('url', dateFilter).then(urls => urls.length),
      DetectedWord.countDocuments(dateFilter),
      DetectedWord.aggregate([
        { $match: dateFilter },
        { $group: { _id: null, avgAccuracy: { $avg: '$accuracy' } } }
      ]),
      DetectedWord.distinct('url', previousDateFilter).then(urls => urls.length),
      DetectedWord.countDocuments(previousDateFilter),
      DetectedWord.aggregate([
        { $match: previousDateFilter },
        { $group: { _id: null, avgAccuracy: { $avg: '$accuracy' } } }
      ])
    ]);

    // Calculate monitoring stats with accurate changes
    const highRiskSites = topWebsites.filter(site => site.riskLevel === 'high').length;
    const activeMonitoring = totalWebsites;
    const aiAccuracy = avgAccuracy.length > 0 ? avgAccuracy[0].avgAccuracy * 100 : 0;

    // Calculate changes from previous period
    const websiteChange = totalWebsites - previousTotalWebsites;
    const detectionChange = totalDetections - previousTotalDetections;
    const previousAiAccuracy = previousAvgAccuracy.length > 0 ? previousAvgAccuracy[0].avgAccuracy * 100 : 0;
    const accuracyChange = aiAccuracy - previousAiAccuracy;

    res.json({
      topWebsites,
      totalWebsites,
      totalDetections,
      monitoringStats: {
        activeMonitoring,
        highRiskSites,
        aiAccuracy: Math.round(aiAccuracy * 10) / 10, // Round to 1 decimal place
        changes: {
          websites: websiteChange > 0 ? `+${websiteChange}` : websiteChange < 0 ? `${websiteChange}` : '0',
          detections: detectionChange > 0 ? `+${detectionChange}` : detectionChange < 0 ? `${detectionChange}` : '0',
          accuracy: accuracyChange > 0 ? `+${accuracyChange.toFixed(1)}%` : accuracyChange < 0 ? `${accuracyChange.toFixed(1)}%` : '0%'
        }
      }
    });
  } catch (err) {
    console.error('User website analytics error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
