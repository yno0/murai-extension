import dotenv from 'dotenv';
import mongoose from 'mongoose';
import DetectedWord from '../models/detectedWordModel.js';
import Report from '../models/reportModel.js';
import User from '../models/userModel.js';

dotenv.config();

// Use deployed MongoDB URI
const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://mhrkp:mhrkp123@cluster0.ixhqy.mongodb.net/murai-db?retryWrites=true&w=majority&appName=Cluster0';

async function connectDB() {
  try {
    await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    process.exit(1);
  }
}

// Helper functions
function getRandomNumber(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomFloat(min, max) {
  return Math.random() * (max - min) + min;
}

function getRandomElement(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function getTodayDateTime() {
  // Get today's date in UTC to match server timezone
  const today = new Date();
  const utcToday = new Date(today.getTime() + (today.getTimezoneOffset() * 60000));

  // Generate random time throughout today
  const hours = getRandomNumber(0, 23);
  const minutes = getRandomNumber(0, 59);
  const seconds = getRandomNumber(0, 59);

  utcToday.setUTCHours(hours, minutes, seconds, 0);
  return utcToday;
}

// Sample data arrays
const harmfulWords = [
  // English harmful words
  'hate', 'stupid', 'idiot', 'kill', 'die', 'loser', 'ugly', 'worthless',
  'trash', 'garbage', 'pathetic', 'disgusting', 'annoying', 'terrible',
  'violence', 'threat', 'bullying', 'harassment', 'abuse', 'insult',

  // Tagalog profanity and harmful words
  'putangina', 'gago', 'tanga', 'bobo', 'ulol', 'tarantado', 'buwisit',
  'pakyu', 'tangina', 'leche', 'peste', 'hudas', 'kingina', 'punyeta',
  'hayop', 'walang hiya', 'bastos', 'sira ulo', 'lintik', 'pucha',
  'bwisit', 'hinayupak', 'walang kwenta', 'pangit', 'kadiri', 'yawa',
  'puta', 'puke', 'tae', 'demonyo', 'bruha', 'salot', 'peste ka',
  'walang utak', 'sira', 'baliw', 'abnoy', 'gunggong', 'hangal',

  // Taglish combinations
  'gago ka', 'tanga mo', 'bobo naman', 'what the putangina', 'tangina naman',
  'pakyu ka', 'gago this', 'tanga yan', 'bobo talaga', 'ulol ka ba',
  'stupid ka', 'ang tanga mo', 'gago ka talaga', 'bobo mo naman'
];

const contexts = [
  'Social media comment on Facebook post',
  'Chat message in group conversation',
  'Forum post discussion thread',
  'Email content review',
  'Website review comment',
  'Video comment on YouTube',
  'Blog comment section',
  'Direct message conversation',
  'Threatening message in comment section',
  'Inappropriate language in chat room',
  'Bullying behavior detected in post',
  'Hate speech in social media content',
  'Nagsabi ng masasamang salita sa comment',
  'Nang-aaway sa group chat',
  'Nambubully sa mga kaklase online',
  'Nagsabi ng putangina sa Facebook post',
  'Nag-trash talk sa online game',
  'Nanlalait sa itsura ng iba sa photo',
  'Nag-curse sa live stream chat',
  'Nambabash sa social media platform',
  'Nag-threat sa private message',
  'Nanlalait ng kapamilya sa post',
  'Nagsabi ng gago sa comment section',
  'Nang-aaway dahil sa political post',
  'Nag-mura sa Facebook status',
  'Nanlalait sa TikTok video comment'
];

const websites = [
  'https://facebook.com',
  'https://twitter.com',
  'https://instagram.com',
  'https://youtube.com',
  'https://reddit.com',
  'https://discord.com',
  'https://tiktok.com',
  'https://linkedin.com',
  'https://messenger.com',
  'https://whatsapp.com'
];

const reportCategories = [
  'harassment',
  'profanity', 
  'spam',
  'hate_speech',
  'toxicity',
  'cyberbullying',
  'inappropriate_content',
  'false_information'
];

const reportDescriptions = [
  'Content moderation system missed harmful language',
  'False positive detection on normal conversation',
  'Inappropriate content not flagged properly',
  'System incorrectly flagged educational content',
  'Missed detection of cyberbullying behavior',
  'False alarm on legitimate discussion',
  'Harmful content slipped through filters',
  'System flagged appropriate content incorrectly',
  'Missed hate speech in comment section',
  'False positive on cultural expression',
  'Inappropriate language not detected',
  'System error in content classification',
  'Missed toxic behavior in chat',
  'False detection on normal conversation',
  'Harmful content not properly flagged'
];

// Helper function to detect language from word and context
function detectLanguageFromContent(word, context) {
  const text = `${word} ${context}`.toLowerCase();

  const tagalogWords = ['putangina', 'gago', 'tanga', 'bobo', 'ulol', 'tarantado', 'buwisit',
                       'pakyu', 'tangina', 'leche', 'peste', 'hudas', 'kingina', 'punyeta',
                       'nagsabi', 'nang-aaway', 'nambubully', 'nanlalait', 'nag-curse', 'nambabash',
                       'sa', 'ng', 'mga', 'ang', 'naman', 'talaga', 'mo', 'ka', 'yan', 'ba'];

  const englishWords = ['hate', 'stupid', 'idiot', 'kill', 'die', 'loser', 'ugly', 'worthless',
                       'social', 'media', 'comment', 'chat', 'message', 'forum', 'post', 'threatening',
                       'what', 'the', 'said', 'posted', 'commented', 'replied'];

  const hasTagalog = tagalogWords.some(word => text.includes(word));
  const hasEnglish = englishWords.some(word => text.includes(word));

  if (hasTagalog && hasEnglish) {
    return 'Taglish';
  } else if (hasTagalog) {
    return 'Tagalog';
  } else if (hasEnglish) {
    return 'English';
  } else {
    return 'Other';
  }
}

async function generateTodayDetections(users, count = 30) {
  console.log(`🔍 Generating ${count} detections for today...`);
  
  const detections = [];
  for (let i = 0; i < count; i++) {
    const user = getRandomElement(users);
    const selectedWord = getRandomElement(harmfulWords);
    const selectedContext = getRandomElement(contexts);
    const detectedLanguage = detectLanguageFromContent(selectedWord, selectedContext);

    const detection = new DetectedWord({
      word: selectedWord,
      userId: user._id,
      context: selectedContext,
      sentimentScore: getRandomFloat(-1, 0.2),
      url: getRandomElement(websites),
      accuracy: getRandomFloat(0.75, 0.98),
      responseTime: getRandomFloat(50, 300),
      patternType: getRandomElement(['profanity', 'harassment', 'toxicity', 'hate_speech']),
      language: detectedLanguage,
      severity: getRandomElement(['low', 'medium', 'high']),
      siteType: getRandomElement(['social', 'forum', 'chat', 'email']),
      createdAt: getTodayDateTime()
    });
    detections.push(detection);
  }
  
  await DetectedWord.insertMany(detections);
  console.log(`✅ Generated ${detections.length} detections for today`);
  return detections;
}

async function generateTodayReports(users, count = 30) {
  console.log(`📋 Generating ${count} reports for today...`);
  
  const reports = [];
  for (let i = 0; i < count; i++) {
    const user = getRandomElement(users);
    const report = new Report({
      userId: user._id,
      type: getRandomElement(['false_negative', 'false_positive']),
      description: getRandomElement(reportDescriptions),
      category: getRandomElement(reportCategories),
      reportedText: `"${getRandomElement(harmfulWords)}" - reported from ${getRandomElement(websites)}`,
      status: getRandomElement(['pending', 'resolved', 'rejected']),
      createdAt: getTodayDateTime(),
      updatedAt: getTodayDateTime()
    });
    reports.push(report);
  }
  
  await Report.insertMany(reports);
  console.log(`✅ Generated ${reports.length} reports for today`);
  return reports;
}

async function generateTodayDetectionsAndReports() {
  try {
    await connectDB();

    // Get all users
    const users = await User.find({});
    if (users.length === 0) {
      console.log('No users found. Please create some users first.');
      return;
    }

    console.log(`Found ${users.length} users in database`);
    console.log('🚀 Starting generation of today\'s detections and reports...\n');

    // Generate exactly 30 detections and 30 reports for today
    const detections = await generateTodayDetections(users, 30);
    const reports = await generateTodayReports(users, 30);

    // Get today's statistics using UTC
    const today = new Date();
    const utcToday = new Date(today.getTime() + (today.getTimezoneOffset() * 60000));
    utcToday.setUTCHours(0, 0, 0, 0);
    const utcTomorrow = new Date(utcToday);
    utcTomorrow.setUTCDate(utcTomorrow.getUTCDate() + 1);

    const todayStats = {
      detections: await DetectedWord.countDocuments({
        createdAt: { $gte: utcToday, $lt: utcTomorrow }
      }),
      reports: await Report.countDocuments({
        createdAt: { $gte: utcToday, $lt: utcTomorrow }
      })
    };

    console.log('\n🎉 Today\'s data generation completed!');
    console.log(`📊 Today's Summary (${utcToday.toDateString()}):`);
    console.log(`- Total Detections: ${todayStats.detections}`);
    console.log(`- Total Reports: ${todayStats.reports}`);
    console.log(`- Users involved: ${users.length}`);

    // Show hourly distribution
    const hourlyDetections = await DetectedWord.aggregate([
      { $match: { createdAt: { $gte: utcToday, $lt: utcTomorrow } } },
      { $group: {
          _id: { $hour: "$createdAt" },
          count: { $sum: 1 }
        }
      },
      { $sort: { "_id": 1 } }
    ]);

    const hourlyReports = await Report.aggregate([
      { $match: { createdAt: { $gte: utcToday, $lt: utcTomorrow } } },
      { $group: {
          _id: { $hour: "$createdAt" },
          count: { $sum: 1 }
        }
      },
      { $sort: { "_id": 1 } }
    ]);

    console.log('\n⏰ Hourly Distribution:');
    console.log('Detections by hour:', hourlyDetections.map(h => `${h._id}:00 (${h.count})`).join(', '));
    console.log('Reports by hour:', hourlyReports.map(h => `${h._id}:00 (${h.count})`).join(', '));

  } catch (error) {
    console.error('Error generating today\'s data:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

// Run the script
generateTodayDetectionsAndReports();
