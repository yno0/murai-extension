import dotenv from 'dotenv';
import mongoose from 'mongoose';
import DetectedWord from '../models/detectedWordModel.js';
import Notification from '../models/notificationModel.js';
import UserActivity from '../models/userActivityLogs.js';
import User from '../models/userModel.js';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI;

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

function getRandomDate(daysAgo) {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  date.setHours(getRandomNumber(0, 23), getRandomNumber(0, 59), getRandomNumber(0, 59));
  return date;
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
  'walang modo', 'basura', 'dumi', 'amoy', 'mabaho', 'panget',

  // Taglish combinations
  'gago ka', 'tanga mo', 'bobo naman', 'what the putangina', 'tangina naman',
  'pakyu ka', 'gago this', 'tanga yan', 'bobo talaga', 'ulol ka ba',
  'stupid ka', 'ang tanga mo', 'gago ka talaga', 'bobo mo naman',
  'what the gago', 'tangina mo', 'putangina naman', 'ulol mo',
  'bwisit ka', 'peste ka naman', 'kadiri mo', 'panget mo'
];

const contexts = [
  // English contexts
  'Social media comment',
  'Chat message',
  'Forum post',
  'Email content',
  'Website review',
  'Video comment',
  'Blog comment',
  'Direct message',
  'Threatening message in comment section',
  'Inappropriate language in chat',
  'Bullying behavior detected',
  'Hate speech in post content',

  // Tagalog contexts
  'Nagsabi ng masasamang salita sa comment',
  'Nang-aaway sa group chat',
  'Nambubully sa mga kaklase',
  'Nagsabi ng putangina sa post',
  'Nag-trash talk sa laro',
  'Nanlalait sa itsura ng iba',
  'Nag-curse sa live stream',
  'Nambabash sa social media',
  'Nag-threat sa DM',
  'Nanlalait ng kapamilya',
  'Nagsabi ng gago sa comment',
  'Nang-aaway dahil sa politics',
  'Nag-mura sa Facebook post',
  'Nanlalait sa TikTok video',
  'Nag-bash sa Instagram story',
  'Nag-away sa Twitter thread',
  'Nambubully sa Discord server',
  'Nag-toxic sa online game',
  'Nanlalait sa YouTube comment',
  'Nag-harass sa Messenger',
  'Nag-cyberbully sa classmate',
  'Nag-body shame sa photo',

  // Taglish contexts
  'Nagsabi ng what the putangina sa chat',
  'Nag-comment ng gago ka naman',
  'Said tanga mo sa group',
  'Posted bobo naman yan sa wall',
  'Nag-reply ng pakyu ka sa thread',
  'Commented tangina naman sa photo',
  'Said ulol ka ba sa livestream',
  'Nag-post ng bwisit na yan',
  'Nag-chat ng stupid ka naman',
  'Posted ang tanga mo sa timeline',
  'Commented gago ka talaga sa video',
  'Said bobo mo naman sa stream',
  'Nag-reply ng what the gago sa post',
  'Commented kadiri mo naman sa pic',
  'Said panget mo sa live',
  'Posted peste ka naman sa group'
];

const websites = [
  'https://facebook.com',
  'https://twitter.com',
  'https://instagram.com',
  'https://youtube.com',
  'https://reddit.com',
  'https://discord.com',
  'https://tiktok.com',
  'https://linkedin.com'
];

const activityTypes = ['login', 'logout', 'update', 'visit', 'report', 'group_join', 'group_leave', 'flagged'];

// Helper function to detect language from word and context
function detectLanguageFromContent(word, context) {
  const text = `${word} ${context}`.toLowerCase();

  // Check for Tagalog words
  const tagalogWords = ['putangina', 'gago', 'tanga', 'bobo', 'ulol', 'tarantado', 'buwisit',
                       'pakyu', 'tangina', 'leche', 'peste', 'hudas', 'kingina', 'punyeta',
                       'hayop', 'bastos', 'lintik', 'pucha', 'hinayupak', 'pangit', 'kadiri', 'yawa',
                       'puta', 'puke', 'tae', 'demonyo', 'bruha', 'salot', 'walang', 'sira', 'baliw',
                       'abnoy', 'gunggong', 'hangal', 'modo', 'basura', 'dumi', 'amoy', 'mabaho',
                       'nagsabi', 'nang-aaway', 'nambubully', 'nanlalait', 'nag-curse', 'nambabash',
                       'nag-threat', 'nag-harass', 'nag-mura', 'nag-bash', 'nag-away', 'nag-toxic',
                       'nag-cyberbully', 'nag-body', 'sa', 'ng', 'mga', 'ang', 'naman', 'talaga',
                       'mo', 'ka', 'yan', 'ba', 'dahil', 'classmate', 'kaklase'];

  // Check for English words
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

async function generateDataForUser(user) {
  console.log(`Generating data for user: ${user.name} (${user.email})`);

  // Clear existing data for this user
  await DetectedWord.deleteMany({ userId: user._id });
  await UserActivity.deleteMany({ userId: user._id });
  await Notification.deleteMany({ userId: user._id });

  console.log('Cleared existing user data');

    // Generate detected words for the last 30 days
    const detectedWords = [];
    for (let day = 0; day < 30; day++) {
      const date = getRandomDate(day);
      const dailyCount = getRandomNumber(2, 8); // 2-8 detections per day

      for (let i = 0; i < dailyCount; i++) {
        const selectedWord = getRandomElement(harmfulWords);
        const selectedContext = getRandomElement(contexts);
        const detectedLanguage = detectLanguageFromContent(selectedWord, selectedContext);

        const detectedWord = new DetectedWord({
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
          createdAt: date
        });
        detectedWords.push(detectedWord);
      }
    }
    
    await DetectedWord.insertMany(detectedWords);
    console.log(`Generated ${detectedWords.length} detected words`);
    
    // Generate user activities for the last 30 days
    const activities = [];
    for (let day = 0; day < 30; day++) {
      const date = getRandomDate(day);
      const dailyActivityCount = getRandomNumber(3, 10); // 3-10 activities per day
      
      for (let i = 0; i < dailyActivityCount; i++) {
        const activityType = getRandomElement(activityTypes);
        let activityDetails = '';
        
        switch (activityType) {
          case 'login':
            activityDetails = 'User logged into the platform';
            break;
          case 'logout':
            activityDetails = 'User logged out of the platform';
            break;
          case 'update':
            activityDetails = 'User updated their profile settings';
            break;
          case 'visit':
            activityDetails = `User visited ${getRandomElement(websites)}`;
            break;
          case 'report':
            activityDetails = 'User submitted a content report';
            break;
          case 'group_join':
            activityDetails = 'User joined a monitoring group';
            break;
          case 'group_leave':
            activityDetails = 'User left a monitoring group';
            break;
          case 'flagged':
            activityDetails = `Flagged content detected: ${getRandomElement(harmfulWords)}`;
            break;
          default:
            activityDetails = 'General platform activity';
        }
        
        const activity = new UserActivity({
          userId: user._id,
          activityType,
          activityDetails,
          activityCategory: getRandomElement(['security', 'content', 'system', 'user']),
          createdAt: date
        });
        activities.push(activity);
      }
    }
    
    await UserActivity.insertMany(activities);
    console.log(`Generated ${activities.length} user activities`);
    
    // Generate notifications for the user
    const notifications = [];
    for (let i = 0; i < 8; i++) {
      const notification = new Notification({
        userId: user._id,
        title: `Security Alert ${i + 1}`,
        message: `Harmful content detected on ${getRandomElement(websites)}. Your digital safety is our priority.`,
        isRead: Math.random() > 0.6, // 40% chance of being read
        type: getRandomElement(['info', 'warning', 'alert', 'success']),
        isGlobal: false,
        createdAt: getRandomDate(getRandomNumber(1, 15))
      });
      notifications.push(notification);
    }
    
    await Notification.insertMany(notifications);
    console.log(`Generated ${notifications.length} notifications`);
    
  console.log(`✅ Data generated for: ${user.name} (${user.email})`);
  console.log(`- Detected Words: ${detectedWords.length}`);
  console.log(`- User Activities: ${activities.length}`);
  console.log(`- Notifications: ${notifications.length}`);

  return {
    detectedWords: detectedWords.length,
    activities: activities.length,
    notifications: notifications.length
  };
}

async function generateUserSpecificData(userEmail = null) {
  try {
    await connectDB();

    let users = [];

    if (userEmail) {
      // Find specific user
      const user = await User.findOne({ email: userEmail });
      if (!user) {
        console.error(`User with email ${userEmail} not found`);
        process.exit(1);
      }
      users = [user];
    } else {
      // Find all regular users (non-admin)
      users = await User.find({ role: { $ne: 'admin' } });
      console.log(`Found ${users.length} regular users`);

      if (users.length === 0) {
        console.log('No regular users found. Please create some users first.');
        return;
      }
    }

    let totalStats = {
      detectedWords: 0,
      activities: 0,
      notifications: 0
    };

    // Generate data for each user
    for (const user of users) {
      const userStats = await generateDataForUser(user);
      totalStats.detectedWords += userStats.detectedWords;
      totalStats.activities += userStats.activities;
      totalStats.notifications += userStats.notifications;
    }

    console.log('\n🎉 User-specific data generation completed!');
    console.log(`📊 Total Summary:`);
    console.log(`- Users processed: ${users.length}`);
    console.log(`- Total Detected Words: ${totalStats.detectedWords}`);
    console.log(`- Total User Activities: ${totalStats.activities}`);
    console.log(`- Total Notifications: ${totalStats.notifications}`);

  } catch (error) {
    console.error('Error generating user-specific data:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Get user email from command line arguments (optional)
const userEmail = process.argv[2];
if (userEmail) {
  console.log(`Generating data for specific user: ${userEmail}`);
} else {
  console.log('Generating data for all regular users...');
}

generateUserSpecificData(userEmail);
