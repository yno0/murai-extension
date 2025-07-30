import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from '../models/userModel.js';
import UserInfo from '../models/userInfoModel.js';
import DetectedWord from '../models/detectedWordModel.js';
import Report from '../models/reportModel.js';
import Group from '../models/groupModel.js';
import GroupMember from '../models/groupUserModel.js';
import GroupCode from '../models/groupCode.js';
import UserActivity from '../models/userActivityLogs.js';
import Notification from '../models/notificationModel.js';
import AdminLogs from '../models/adminLogsMode.js';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI;

async function connectDB() {
  try {
    await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ Error connecting to MongoDB:', error);
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

function getTodayDate() {
  const today = new Date();
  today.setHours(getRandomNumber(8, 18), getRandomNumber(0, 59), getRandomNumber(0, 59));
  return today;
}

function generateRandomCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// Sample data for today
const todayHarmfulWords = [
  'hate', 'stupid', 'idiot', 'kill', 'die', 'loser', 'ugly', 'worthless',
  'putangina', 'gago', 'tanga', 'bobo', 'ulol', 'tarantado', 'buwisit',
  'pakyu', 'tangina', 'leche', 'peste', 'hudas', 'kingina', 'punyeta',
  'what the putangina', 'gago ka', 'tanga mo', 'bobo naman'
];

const todayContexts = [
  'Detected in Facebook comment today',
  'Found in Twitter reply this morning',
  'Flagged in Instagram story today',
  'Caught in TikTok comment section',
  'Identified in YouTube live chat',
  'Spotted in Discord server message',
  'Found in WhatsApp group chat',
  'Detected in Telegram channel today',
  'Nagsabi ng masama sa Facebook ngayon',
  'Nag-comment ng pangit sa Instagram',
  'Nag-bash sa TikTok video ngayong umaga',
  'Nag-toxic sa online game kanina'
];

const websites = [
  'https://facebook.com',
  'https://twitter.com',
  'https://instagram.com',
  'https://youtube.com',
  'https://tiktok.com',
  'https://discord.com',
  'https://reddit.com',
  'https://linkedin.com'
];

const groupNames = [
  'MURAi Monitoring Team Alpha',
  'Digital Safety Squad',
  'Content Moderation Unit',
  'Cyberbullying Prevention Group',
  'Online Safety Advocates',
  'Digital Wellness Community',
  'Safe Space Guardians',
  'Anti-Toxicity Alliance'
];

const groupDescriptions = [
  'Dedicated to monitoring and preventing online harassment',
  'Focused on creating safer digital environments',
  'Community-driven content moderation initiative',
  'Preventing cyberbullying across social platforms',
  'Promoting positive online interactions',
  'Building awareness about digital wellness',
  'Protecting users from harmful content',
  'Fighting against online toxicity together'
];

// Create new users for today
async function createTodayUsers() {
  console.log('📝 Creating new users for today...');
  
  const newUsers = [
    {
      email: 'newuser1@example.com',
      name: 'Maria Santos',
      password: 'password123',
      role: 'user',
      isVerified: true,
      status: 'active',
      isActive: true,
      joinedAt: getTodayDate(),
      lastActive: getTodayDate()
    },
    {
      email: 'newuser2@example.com', 
      name: 'Juan Dela Cruz',
      password: 'password123',
      role: 'user',
      isVerified: true,
      status: 'active',
      isActive: true,
      joinedAt: getTodayDate(),
      lastActive: getTodayDate()
    },
    {
      email: 'newuser3@example.com',
      name: 'Anna Reyes',
      password: 'password123',
      role: 'user',
      isVerified: true,
      status: 'active',
      isActive: true,
      joinedAt: getTodayDate(),
      lastActive: getTodayDate()
    }
  ];

  const createdUsers = [];
  for (const userData of newUsers) {
    try {
      // Check if user already exists
      const existingUser = await User.findOne({ email: userData.email });
      if (!existingUser) {
        const user = new User(userData);
        await user.save();
        createdUsers.push(user);
        console.log(`✅ Created user: ${user.name} (${user.email})`);
        
        // Create UserInfo for the new user
        const userInfo = new UserInfo({
          userId: user._id,
          phone: `+639${getRandomNumber(100000000, 999999999)}`,
          address: 'Manila, Philippines',
          department: 'Digital Safety',
          position: 'Content Monitor',
          employeeId: `EMP${getRandomNumber(1000, 9999)}`,
          bio: 'New member of the MURAi community focused on digital safety.',
          preferences: {
            theme: getRandomElement(['light', 'dark']),
            language: 'en',
            timezone: 'Asia/Manila',
            notifications: {
              email: true,
              push: true,
              sms: false
            }
          }
        });
        await userInfo.save();
      } else {
        createdUsers.push(existingUser);
        console.log(`ℹ️  User already exists: ${existingUser.name} (${existingUser.email})`);
      }
    } catch (error) {
      console.error(`❌ Error creating user ${userData.email}:`, error.message);
    }
  }
  
  return createdUsers;
}

// Generate today's detection reports for specific user
async function generateTodayDetections(user, count = 15) {
  console.log(`🔍 Generating ${count} detection reports for ${user.name} today...`);
  
  const detections = [];
  for (let i = 0; i < count; i++) {
    const selectedWord = getRandomElement(todayHarmfulWords);
    const selectedContext = getRandomElement(todayContexts);
    
    const detection = new DetectedWord({
      word: selectedWord,
      userId: user._id,
      context: selectedContext,
      sentimentScore: getRandomFloat(-0.9, -0.3),
      url: getRandomElement(websites),
      accuracy: getRandomFloat(0.85, 0.98),
      responseTime: getRandomFloat(45, 200),
      patternType: getRandomElement(['profanity', 'harassment', 'toxicity', 'hate_speech']),
      language: selectedWord.includes('putangina') || selectedWord.includes('gago') ? 'Tagalog' : 'English',
      severity: getRandomElement(['medium', 'high']),
      siteType: getRandomElement(['social', 'forum', 'chat']),
      createdAt: getTodayDate()
    });
    
    detections.push(detection);
  }
  
  await DetectedWord.insertMany(detections);
  console.log(`✅ Created ${detections.length} detection reports for ${user.name}`);
  return detections;
}

// Generate today's reports
async function generateTodayReports(users) {
  console.log('📋 Generating today\'s reports...');
  
  const reports = [];
  for (let i = 0; i < 5; i++) {
    const user = getRandomElement(users);
    const report = new Report({
      userId: user._id,
      type: getRandomElement(['false_negative', 'false_positive']),
      description: `Report submitted today regarding content moderation accuracy`,
      category: getRandomElement(['harassment', 'profanity', 'spam', 'hate_speech', 'toxicity']),
      reportedText: `Sample reported content from ${getRandomElement(websites)} today`,
      status: 'pending',
      createdAt: getTodayDate(),
      updatedAt: getTodayDate()
    });
    reports.push(report);
  }
  
  await Report.insertMany(reports);
  console.log(`✅ Created ${reports.length} reports for today`);
  return reports;
}

// Create groups with members for today
async function createTodayGroups(users) {
  console.log('👥 Creating groups with members for today...');
  
  const groups = [];
  for (let i = 0; i < 3; i++) {
    const adminUser = getRandomElement(users);
    const group = new Group({
      name: getRandomElement(groupNames),
      description: getRandomElement(groupDescriptions),
      userId: adminUser._id,
      memberCount: 0,
      status: 'active',
      type: 'public',
      createAt: getTodayDate(),
      updateAt: getTodayDate()
    });
    
    await group.save();
    groups.push(group);
    console.log(`✅ Created group: ${group.name}`);
    
    // Create group code
    const groupCode = new GroupCode({
      groupId: group._id,
      code: generateRandomCode(),
      createAt: getTodayDate(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
    });
    await groupCode.save();
    
    // Add members to the group
    const memberCount = getRandomNumber(3, 8);
    const selectedUsers = users.slice(0, memberCount);
    
    for (const user of selectedUsers) {
      const groupMember = new GroupMember({
        userId: user._id,
        groupId: group._id,
        joinedAt: getTodayDate()
      });
      await groupMember.save();
    }
    
    // Update group member count
    group.memberCount = memberCount;
    await group.save();
    
    console.log(`✅ Added ${memberCount} members to ${group.name}`);
  }
  
  return groups;
}

// Generate today's user activities
async function generateTodayActivities(user, count = 10) {
  console.log(`📊 Generating ${count} activities for ${user.name} today...`);
  
  const activities = [];
  const activityTypes = ['login', 'logout', 'update', 'visit', 'report', 'group_join', 'flagged'];
  
  for (let i = 0; i < count; i++) {
    const activityType = getRandomElement(activityTypes);
    let activityDetails = '';
    
    switch (activityType) {
      case 'login':
        activityDetails = 'User logged into MURAi platform today';
        break;
      case 'logout':
        activityDetails = 'User logged out of MURAi platform';
        break;
      case 'update':
        activityDetails = 'User updated profile settings today';
        break;
      case 'visit':
        activityDetails = `User visited ${getRandomElement(websites)} and content was monitored`;
        break;
      case 'report':
        activityDetails = 'User submitted a content report today';
        break;
      case 'group_join':
        activityDetails = 'User joined a new monitoring group today';
        break;
      case 'flagged':
        activityDetails = `Harmful content flagged: "${getRandomElement(todayHarmfulWords)}" detected today`;
        break;
      default:
        activityDetails = 'General platform activity today';
    }
    
    const activity = new UserActivity({
      userId: user._id,
      activityType,
      activityDetails,
      activityCategory: getRandomElement(['security', 'content', 'system', 'user']),
      createdAt: getTodayDate(),
      updatedAt: getTodayDate()
    });
    activities.push(activity);
  }
  
  await UserActivity.insertMany(activities);
  console.log(`✅ Created ${activities.length} activities for ${user.name}`);
  return activities;
}

// Generate today's notifications
async function generateTodayNotifications(users) {
  console.log('🔔 Generating today\'s notifications...');
  
  const notifications = [];
  for (const user of users) {
    for (let i = 0; i < 3; i++) {
      const notification = new Notification({
        userId: user._id,
        title: `Daily Security Alert ${i + 1}`,
        message: `Today's monitoring detected ${getRandomNumber(5, 15)} instances of harmful content. Your digital safety is our priority.`,
        isRead: Math.random() > 0.7,
        type: getRandomElement(['info', 'warning', 'alert']),
        isGlobal: false,
        createdAt: getTodayDate()
      });
      notifications.push(notification);
    }
  }
  
  await Notification.insertMany(notifications);
  console.log(`✅ Created ${notifications.length} notifications for today`);
  return notifications;
}

// Main function to generate all today's data
async function generateAllTodayData() {
  try {
    await connectDB();
    
    console.log('🚀 Starting today\'s data generation...');
    console.log(`📅 Date: ${new Date().toLocaleDateString()}`);
    
    // Create new users for today
    const newUsers = await createTodayUsers();
    
    // Get existing users including rblatco@gmail.com
    const existingUsers = await User.find({ 
      email: { $in: ['rblatco@gmail.com'] }
    });
    
    if (existingUsers.length === 0) {
      console.log('⚠️  rblatco@gmail.com not found, creating it...');
      const rblUser = new User({
        email: 'rblatco@gmail.com',
        name: 'RBL Admin',
        password: 'password123',
        role: 'admin',
        isVerified: true,
        status: 'active',
        isActive: true,
        joinedAt: new Date('2024-01-01'),
        lastActive: getTodayDate()
      });
      await rblUser.save();
      existingUsers.push(rblUser);
      
      // Create UserInfo for rblatco@gmail.com
      const rblUserInfo = new UserInfo({
        userId: rblUser._id,
        phone: '+639123456789',
        address: 'Manila, Philippines',
        department: 'Administration',
        position: 'System Administrator',
        employeeId: 'ADMIN001',
        bio: 'System Administrator for MURAi platform.',
        preferences: {
          theme: 'dark',
          language: 'en',
          timezone: 'Asia/Manila',
          notifications: {
            email: true,
            push: true,
            sms: true
          }
        }
      });
      await rblUserInfo.save();
      console.log('✅ Created rblatco@gmail.com user and profile');
    }
    
    const allUsers = [...newUsers, ...existingUsers];
    
    // Generate specific data for rblatco@gmail.com
    const rblUser = allUsers.find(u => u.email === 'rblatco@gmail.com');
    if (rblUser) {
      await generateTodayDetections(rblUser, 20); // More detections for admin
      await generateTodayActivities(rblUser, 15); // More activities for admin
    }
    
    // Generate data for other users
    for (const user of newUsers) {
      await generateTodayDetections(user, getRandomNumber(8, 15));
      await generateTodayActivities(user, getRandomNumber(5, 12));
    }
    
    // Generate reports, groups, and notifications
    await generateTodayReports(allUsers);
    await createTodayGroups(allUsers);
    await generateTodayNotifications(allUsers);
    
    // Generate summary
    const todayStats = {
      users: await User.countDocuments({ joinedAt: { $gte: new Date().setHours(0, 0, 0, 0) } }),
      detections: await DetectedWord.countDocuments({ createdAt: { $gte: new Date().setHours(0, 0, 0, 0) } }),
      reports: await Report.countDocuments({ createdAt: { $gte: new Date().setHours(0, 0, 0, 0) } }),
      groups: await Group.countDocuments({ createAt: { $gte: new Date().setHours(0, 0, 0, 0) } }),
      activities: await UserActivity.countDocuments({ createdAt: { $gte: new Date().setHours(0, 0, 0, 0) } }),
      notifications: await Notification.countDocuments({ createdAt: { $gte: new Date().setHours(0, 0, 0, 0) } })
    };
    
    console.log('\n🎉 Today\'s data generation completed successfully!');
    console.log('📊 Today\'s Summary:');
    console.log(`- New Users: ${todayStats.users}`);
    console.log(`- Detection Reports: ${todayStats.detections}`);
    console.log(`- User Reports: ${todayStats.reports}`);
    console.log(`- New Groups: ${todayStats.groups}`);
    console.log(`- User Activities: ${todayStats.activities}`);
    console.log(`- Notifications: ${todayStats.notifications}`);
    console.log(`\n✅ Special data generated for rblatco@gmail.com`);
    
  } catch (error) {
    console.error('❌ Error generating today\'s data:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the script
generateAllTodayData();
