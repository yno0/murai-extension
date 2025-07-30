import dotenv from 'dotenv';
import mongoose from 'mongoose';
import DetectedWord from '../models/detectedWordModel.js';
import Group from '../models/groupModel.js';
import GroupMember from '../models/groupUserModel.js';
import Notification from '../models/notificationModel.js';
import Report from '../models/reportModel.js';
import UserActivity from '../models/userActivityLogs.js';
import UserInfo from '../models/userInfoModel.js';
import User from '../models/userModel.js';

dotenv.config();
console.log('Loaded MONGO_URI:', process.env.MONGO_URI);
const MONGO_URI = process.env.MONGO_URI;

const harmfulWords = [
  // English harmful words
  'hate', 'violence', 'threat', 'bullying', 'harassment', 'abuse', 'insult',
  'discrimination', 'racism', 'sexism', 'toxic', 'offensive', 'aggressive',
  'cruel', 'mean', 'nasty', 'vicious', 'malicious', 'hostile', 'attack',

  // Tagalog profanity and harmful words
  'putangina', 'gago', 'tanga', 'bobo', 'ulol', 'tarantado', 'buwisit',
  'pakyu', 'tangina', 'leche', 'peste', 'hudas', 'kingina', 'punyeta',
  'hayop', 'walang hiya', 'bastos', 'sira ulo', 'lintik', 'pucha',
  'bwisit', 'hinayupak', 'walang kwenta', 'pangit', 'kadiri', 'yawa',

  // Taglish combinations
  'gago ka', 'tanga mo', 'bobo naman', 'what the putangina', 'tangina naman',
  'pakyu ka', 'gago this', 'tanga yan', 'bobo talaga', 'ulol ka ba'
];
const patternTypes = ['Profanity', 'Hate Speech', 'Sensitive', 'Threat', 'Harassment', 'Insult'];
const languages = ['English', 'Tagalog', 'Cebuano', 'Other'];
const severities = ['low', 'medium', 'high'];
const siteTypes = ['Social Media', 'Forum', 'Blog', 'News Site', 'Other'];
const websites = [
  'https://facebook.com/groups/example',
  'https://twitter.com/user/status',
  'https://instagram.com/p/example',
  'https://reddit.com/r/community',
  'https://youtube.com/watch?v=example',
  'https://discord.com/channels/server',
  'https://tiktok.com/@user/video',
  'https://linkedin.com/in/profile',
  'https://snapchat.com/add/user',
  'https://telegram.org/chat',
  'https://whatsapp.com/chat',
  'https://signal.org/group',
  'https://slack.com/workspace',
  'https://github.com/repo/issues',
  'https://stackoverflow.com/questions'
];
const contexts = [
  // English contexts
  'Threatening message in comment section',
  'Inappropriate language in chat',
  'Bullying behavior detected',
  'Hate speech in post content',
  'Harassment in direct messages',
  'Discriminatory language found',
  'Offensive content in video description',
  'Toxic behavior in community discussion',
  'Inappropriate comment on photo',
  'Aggressive language in forum post',
  'Cyberbullying incident reported',
  'Hostile behavior in group chat',
  'Inappropriate language in live stream',
  'Offensive content shared in story',
  'Threatening behavior observed',

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
  'Nambubully ng mga bata',
  'Nagsabi ng tanga sa forum',
  'Nag-harass sa messenger',

  // Taglish contexts
  'Nagsabi ng what the putangina sa chat',
  'Nag-comment ng gago ka naman',
  'Said tanga mo sa group',
  'Posted bobo naman yan sa wall',
  'Nag-reply ng pakyu ka sa thread',
  'Commented tangina naman sa photo',
  'Said ulol ka ba sa livestream',
  'Nag-post ng bwisit na yan',
  'Replied with gago this person',
  'Nagsabi ng kadiri naman yan'
];
const activityTypes = ['login', 'logout', 'update', 'visit', 'report', 'group_join', 'group_leave', 'flagged', 'other'];
const activityCategories = ['security', 'content', 'system', 'user', 'group'];
const sampleUsers = [
  { name: 'John Doe', email: 'john.doe@example.com', firstName: 'John', lastName: 'Doe' },
  { name: 'Jane Smith', email: 'jane.smith@example.com', firstName: 'Jane', lastName: 'Smith' },
  { name: 'Mike Johnson', email: 'mike.johnson@example.com', firstName: 'Mike', lastName: 'Johnson' },
  { name: 'Sarah Wilson', email: 'sarah.wilson@example.com', firstName: 'Sarah', lastName: 'Wilson' },
  { name: 'David Brown', email: 'david.brown@example.com', firstName: 'David', lastName: 'Brown' },
  { name: 'Emily Davis', email: 'emily.davis@example.com', firstName: 'Emily', lastName: 'Davis' },
  { name: 'Alex Garcia', email: 'alex.garcia@example.com', firstName: 'Alex', lastName: 'Garcia' },
  { name: 'Lisa Martinez', email: 'lisa.martinez@example.com', firstName: 'Lisa', lastName: 'Martinez' },
  { name: 'Tom Anderson', email: 'tom.anderson@example.com', firstName: 'Tom', lastName: 'Anderson' },
  { name: 'Maria Rodriguez', email: 'maria.rodriguez@example.com', firstName: 'Maria', lastName: 'Rodriguez' }
];
const groupTypes = ['public', 'private'];

function getRandomElement(array) {
  return array[Math.floor(Math.random() * array.length)];
}
function getRandomNumber(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function getRandomFloat(min, max, decimals = 2) {
  return parseFloat((Math.random() * (max - min) + min).toFixed(decimals));
}
function getRandomDate(daysBack) {
  const now = new Date();
  const pastDate = new Date(now.getTime() - (daysBack * 24 * 60 * 60 * 1000));
  const randomTime = pastDate.getTime() + Math.random() * (now.getTime() - pastDate.getTime());
  return new Date(randomTime);
}
async function connectDB() {
  try {
    await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    process.exit(1);
  }
}
async function clearExistingData() {
  console.log('Clearing existing sample data...');
  await DetectedWord.deleteMany({});
  await UserActivity.deleteMany({});
  await User.deleteMany({ email: { $in: sampleUsers.map(u => u.email) } });
  await UserInfo.deleteMany({});
  await Report.deleteMany({});
  await Group.deleteMany({});
  await GroupMember.deleteMany({});
  await Notification.deleteMany({});
  console.log('Existing data cleared.');
}
async function createSampleUsers() {
  console.log('Creating sample users...');
  const createdUsers = [];
  for (const userData of sampleUsers) {
    try {
      const user = new User({
        ...userData,
        password: 'password123',
        role: getRandomElement(['user', 'admin', 'premium']),
        status: getRandomElement(['active', 'inactive']),
        lastActive: getRandomDate(5),
        joinedAt: getRandomDate(30),
        isActive: true,
        isVerified: true,
      });
      await user.save();
      const userInfo = new UserInfo({
        userId: user._id,
        phoneNumber: `+1${getRandomNumber(1000000000, 9999999999)}`,
        firstName: userData.firstName,
        lastName: userData.lastName,
        gender: getRandomElement(['male', 'female', 'other']),
        profilePicture: '',
        dateOfBirth: new Date(getRandomNumber(1980, 2000), getRandomNumber(0, 11), getRandomNumber(1, 28)),
        createAt: user.joinedAt,
        updateAt: new Date(),
      });
      await userInfo.save();
      createdUsers.push(user);
    } catch (error) {
      console.error(`Error creating user ${userData.email}:`, error.message);
    }
  }
  console.log(`Created ${createdUsers.length} sample users.`);
  return createdUsers;
}
async function createSampleGroups(users) {
  console.log('Creating sample groups...');
  const groups = [];
  for (let i = 0; i < 5; i++) {
    const adminUser = getRandomElement(users);
    const group = new Group({
      name: `Group ${String.fromCharCode(65 + i)}`,
      description: `Sample group for ${groupTypes[i % groupTypes.length]}`,
      userId: adminUser._id,
      createAt: getRandomDate(30),
      updateAt: new Date(),
      isActive: true,
      memberCount: 0, // Will update after adding members
      status: getRandomElement(['active', 'inactive', 'pending']),
      type: getRandomElement(groupTypes),
    });
    await group.save();
    groups.push(group);
  }
  console.log(`Created ${groups.length} groups.`);
  return groups;
}
async function createSampleGroupMembers(groups, users) {
  console.log('Adding members to groups...');
  let totalMembers = 0;
  for (const group of groups) {
    const memberCount = getRandomNumber(3, 7);
    const groupMembers = [];
    const shuffledUsers = users.sort(() => 0.5 - Math.random());
    for (let i = 0; i < memberCount; i++) {
      const user = shuffledUsers[i % users.length];
      const member = new GroupMember({
        userId: user._id,
        groupId: group._id,
        joinedAt: getRandomDate(30),
      });
      await member.save();
      groupMembers.push(member);
    }
    group.memberCount = groupMembers.length;
    await group.save();
    totalMembers += groupMembers.length;
  }
  console.log(`Added ${totalMembers} group members.`);
}
// Helper function to detect language from word and context
function detectLanguageFromContent(word, context) {
  const text = `${word} ${context}`.toLowerCase();

  // Check for Tagalog words
  const tagalogWords = ['putangina', 'gago', 'tanga', 'bobo', 'ulol', 'tarantado', 'buwisit',
                       'pakyu', 'tangina', 'leche', 'peste', 'hudas', 'kingina', 'punyeta',
                       'hayop', 'bastos', 'lintik', 'pucha', 'hinayupak', 'pangit', 'kadiri', 'yawa',
                       'nagsabi', 'nang-aaway', 'nambubully', 'nanlalait', 'nag-curse', 'nambabash',
                       'nag-threat', 'nag-harass', 'sa', 'ng', 'mga', 'ang', 'naman', 'talaga'];

  // Check for English words
  const englishWords = ['hate', 'violence', 'threat', 'bullying', 'harassment', 'abuse', 'insult',
                       'discrimination', 'racism', 'sexism', 'toxic', 'offensive', 'aggressive',
                       'threatening', 'inappropriate', 'behavior', 'detected', 'content', 'message'];

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

async function generateDetectedWords(users) {
  console.log('Generating detected words data...');
  const detectedWords = [];
  for (let day = 0; day < 30; day++) {
    const date = getRandomDate(day);
    const dailyCount = getRandomNumber(10, 30);
    for (let i = 0; i < dailyCount; i++) {
      const selectedWord = getRandomElement(harmfulWords);
      const selectedContext = getRandomElement(contexts);
      const detectedLanguage = detectLanguageFromContent(selectedWord, selectedContext);

      const detectedWord = new DetectedWord({
        word: selectedWord,
        userId: getRandomElement(users)._id,
        context: selectedContext,
        sentimentScore: getRandomFloat(-1, 0.5),
        url: getRandomElement(websites),
        accuracy: getRandomFloat(0.7, 0.99),
        responseTime: getRandomFloat(50, 500),
        patternType: getRandomElement(patternTypes),
        language: detectedLanguage,
        severity: getRandomElement(severities),
        siteType: getRandomElement(siteTypes),
        createdAt: date
      });
      detectedWords.push(detectedWord);
    }
  }
  await DetectedWord.insertMany(detectedWords);
  console.log(`Generated ${detectedWords.length} detected words.`);
}
async function generateUserActivity(users) {
  console.log('Generating user activity data...');
  const activities = [];
  for (let day = 0; day < 30; day++) {
    const date = getRandomDate(day);
    const dailyActivityCount = getRandomNumber(20, 50);
    for (let i = 0; i < dailyActivityCount; i++) {
      const activityType = getRandomElement(activityTypes);
      const activityCategory = getRandomElement(activityCategories);
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
        userId: getRandomElement(users)._id,
        activityType,
        activityDetails,
        activityCategory,
        createdAt: date
      });
      activities.push(activity);
    }
  }
  await UserActivity.insertMany(activities);
  console.log(`Generated ${activities.length} user activities.`);
}
async function generateReports(users) {
  console.log('Generating sample reports...');
  const categories = ['harassment', 'profanity', 'spam', 'hate_speech', 'toxicity'];
  const reports = [];
  for (let i = 0; i < 25; i++) {
    const reviewed = Math.random() > 0.5;
    const report = new Report({
      userId: getRandomElement(users)._id,
      type: getRandomElement(['false_negative', 'false_positive']),
      description: 'Sample report description for testing purposes',
      category: getRandomElement(categories),
      reportedText: `Reported text sample ${i + 1}`,
      reviewedBy: reviewed ? getRandomElement(users)._id : undefined,
      reviewedAt: reviewed ? getRandomDate(5) : undefined,
      status: getRandomElement(['pending', 'resolved', 'in_progress']),
      createAt: getRandomDate(getRandomNumber(1, 15)),
      updateAt: getRandomDate(getRandomNumber(0, 5))
    });
    reports.push(report);
  }
  await Report.insertMany(reports);
  console.log(`Generated ${reports.length} reports.`);
}
async function generateNotifications(users) {
  console.log('Generating notifications...');
  const notifications = [];
  // User-specific notifications
  for (const user of users) {
    for (let i = 0; i < 3; i++) {
      notifications.push(new Notification({
        userId: user._id,
        title: `Notification ${i + 1} for ${user.name}`,
        message: `This is a sample notification for ${user.name}.`,
        isRead: Math.random() > 0.5,
        type: getRandomElement(['info', 'warning', 'alert', 'success']),
        isGlobal: false,
        createdAt: getRandomDate(10)
      }));
    }
  }
  // Global notifications
  for (let i = 0; i < 5; i++) {
    notifications.push(new Notification({
      userId: users[0]._id, // Assign to admin or first user for reference
      title: `Global Notification ${i + 1}`,
      message: `This is a global notification for all admins/users.`,
      isRead: false,
      type: getRandomElement(['info', 'warning', 'alert', 'success']),
      isGlobal: true,
      createdAt: getRandomDate(5)
    }));
  }
  await Notification.insertMany(notifications);
  console.log(`Generated ${notifications.length} notifications.`);
}
async function generateSampleData() {
  try {
    await connectDB();
    console.log('Starting sample data generation...');
    await clearExistingData();
    const users = await createSampleUsers();
    if (users.length === 0) {
      console.error('No users created. Exiting...');
      process.exit(1);
    }
    const groups = await createSampleGroups(users);
    await createSampleGroupMembers(groups, users);
    await generateDetectedWords(users);
    await generateUserActivity(users);
    await generateReports(users);
    await generateNotifications(users);
    console.log('Sample data generation completed successfully!');
    console.log('\nGenerated data summary:');
    console.log(`- Users: ${await User.countDocuments()}`);
    console.log(`- Groups: ${await Group.countDocuments()}`);
    console.log(`- Group Members: ${await GroupMember.countDocuments()}`);
    console.log(`- Detected Words: ${await DetectedWord.countDocuments()}`);
    console.log(`- User Activities: ${await UserActivity.countDocuments()}`);
    console.log(`- Reports: ${await Report.countDocuments()}`);
    console.log(`- Notifications: ${await Notification.countDocuments()}`);
    console.log('\nYou can now start your server and test the dashboard with real data!');
  } catch (error) {
    console.error('Error generating sample data:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed.');
    process.exit(0);
  }
}
generateSampleData(); 