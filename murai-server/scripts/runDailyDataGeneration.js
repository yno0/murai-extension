#!/usr/bin/env node

import dotenv from 'dotenv';
import mongoose from 'mongoose';
import DetectedWord from '../models/detectedWordModel.js';
import GroupCode from '../models/groupCode.js';
import Group from '../models/groupModel.js';
import GroupMember from '../models/groupUserModel.js';
import Notification from '../models/notificationModel.js';
import Report from '../models/reportModel.js';
import UserActivity from '../models/userActivityLogs.js';
import User from '../models/userModel.js';

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
  const now = new Date();
  now.setHours(getRandomNumber(8, 18), getRandomNumber(0, 59), getRandomNumber(0, 59));
  return now;
}

// Sample data arrays
const harmfulWords = [
  'hate', 'stupid', 'idiot', 'kill', 'die', 'loser', 'ugly', 'worthless',
  'putangina', 'gago', 'tanga', 'bobo', 'ulol', 'tarantado', 'buwisit',
  'pakyu', 'tangina', 'leche', 'peste', 'hudas', 'kingina', 'punyeta',
  'what the putangina', 'gago ka', 'tanga mo', 'bobo naman', 'ulol ka'
];

const contexts = [
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
  'Nag-toxic sa online game kanina',
  'Nag-harass sa Messenger today',
  'Nag-cyberbully sa classmate ngayon'
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

async function generateTodayDetectionsForUser(user, count = 10) {
  console.log(`🔍 Generating ${count} detections for ${user.name} (${user.email})`);
  
  const detections = [];
  for (let i = 0; i < count; i++) {
    const selectedWord = getRandomElement(harmfulWords);
    const selectedContext = getRandomElement(contexts);
    
    // Determine language based on word
    let language = 'English';
    if (['putangina', 'gago', 'tanga', 'bobo', 'ulol', 'tarantado', 'buwisit', 'pakyu', 'tangina', 'leche', 'peste', 'hudas', 'kingina', 'punyeta'].some(word => selectedWord.includes(word))) {
      language = 'Tagalog';
    } else if (selectedWord.includes('what the') || selectedWord.includes('ka') || selectedWord.includes('mo')) {
      language = 'Taglish';
    }
    
    const detection = new DetectedWord({
      word: selectedWord,
      userId: user._id,
      context: selectedContext,
      sentimentScore: getRandomFloat(-0.95, -0.4),
      url: getRandomElement(websites),
      accuracy: getRandomFloat(0.85, 0.99),
      responseTime: getRandomFloat(45, 180),
      patternType: getRandomElement(['profanity', 'harassment', 'toxicity', 'hate_speech']),
      language: language,
      severity: getRandomElement(['medium', 'high']),
      siteType: getRandomElement(['social', 'forum', 'chat']),
      createdAt: getTodayDateTime()
    });
    
    detections.push(detection);
  }
  
  await DetectedWord.insertMany(detections);
  console.log(`✅ Created ${detections.length} detections for ${user.name}`);
  return detections;
}

async function generateTodayActivitiesForUser(user, count = 8) {
  console.log(`📊 Generating ${count} activities for ${user.name}`);
  
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
        activityDetails = `User visited ${getRandomElement(websites)} - content monitored`;
        break;
      case 'report':
        activityDetails = 'User submitted a content report today';
        break;
      case 'group_join':
        activityDetails = 'User joined a monitoring group today';
        break;
      case 'flagged':
        activityDetails = `Content flagged: "${getRandomElement(harmfulWords)}" detected today`;
        break;
      default:
        activityDetails = 'General platform activity today';
    }
    
    const activity = new UserActivity({
      userId: user._id,
      activityType,
      activityDetails,
      activityCategory: getRandomElement(['security', 'content', 'system', 'user']),
      createdAt: getTodayDateTime(),
      updatedAt: getTodayDateTime()
    });
    activities.push(activity);
  }
  
  await UserActivity.insertMany(activities);
  console.log(`✅ Created ${activities.length} activities for ${user.name}`);
  return activities;
}

async function generateTodayReports(users, count = 5) {
  console.log(`📋 Generating ${count} reports for today`);
  
  const reports = [];
  for (let i = 0; i < count; i++) {
    const user = getRandomElement(users);
    const report = new Report({
      userId: user._id,
      type: getRandomElement(['false_negative', 'false_positive']),
      description: `Daily report ${i + 1} - Content moderation feedback submitted today`,
      category: getRandomElement(['harassment', 'profanity', 'spam', 'hate_speech', 'toxicity']),
      reportedText: `"${getRandomElement(harmfulWords)}" - reported from ${getRandomElement(websites)}`,
      status: 'pending',
      createdAt: getTodayDateTime(),
      updatedAt: getTodayDateTime()
    });
    reports.push(report);
  }
  
  await Report.insertMany(reports);
  console.log(`✅ Created ${reports.length} reports for today`);
  return reports;
}

async function generateTodayNotifications(users) {
  console.log('🔔 Generating today\'s notifications');
  
  const notifications = [];
  for (const user of users) {
    // Generate 2-3 notifications per user for today
    const notifCount = getRandomNumber(2, 3);
    for (let i = 0; i < notifCount; i++) {
      const notification = new Notification({
        userId: user._id,
        title: `Daily Alert ${i + 1}`,
        message: `Today's scan detected ${getRandomNumber(3, 12)} instances of harmful content. Stay safe online!`,
        isRead: Math.random() > 0.6,
        type: getRandomElement(['info', 'warning', 'alert']),
        isGlobal: false,
        createdAt: getTodayDateTime()
      });
      notifications.push(notification);
    }
  }
  
  await Notification.insertMany(notifications);
  console.log(`✅ Created ${notifications.length} notifications for today`);
  return notifications;
}

async function createTodayGroups(users) {
  console.log('👥 Creating groups with members for today');

  const groupNames = [
    'MURAi Monitoring Team Alpha',
    'Digital Safety Squad',
    'Content Moderation Unit',
    'Cyberbullying Prevention Group'
  ];

  const groupDescriptions = [
    'Dedicated to monitoring and preventing online harassment',
    'Focused on creating safer digital environments',
    'Community-driven content moderation initiative',
    'Preventing cyberbullying across social platforms'
  ];

  const groups = [];
  for (let i = 0; i < 2; i++) { // Create 2 groups for today
    const adminUser = getRandomElement(users);
    const group = new Group({
      name: getRandomElement(groupNames),
      description: getRandomElement(groupDescriptions),
      userId: adminUser._id,
      memberCount: 0,
      status: 'active',
      type: 'public',
      createAt: getTodayDateTime(),
      updateAt: getTodayDateTime()
    });

    await group.save();
    groups.push(group);
    console.log(`✅ Created group: ${group.name}`);

    // Create group code
    const groupCode = new GroupCode({
      groupId: group._id,
      code: Math.random().toString(36).substring(2, 8).toUpperCase(),
      createAt: getTodayDateTime(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
    });
    await groupCode.save();

    // Add members to the group
    const memberCount = getRandomNumber(3, 6);
    const selectedUsers = users.slice(0, memberCount);

    for (const user of selectedUsers) {
      const groupMember = new GroupMember({
        userId: user._id,
        groupId: group._id,
        joinedAt: getTodayDateTime()
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

async function ensureRblUserExists() {
  let rblUser = await User.findOne({ email: 'rblatco@gmail.com' });
  
  if (!rblUser) {
    console.log('⚠️  rblatco@gmail.com not found, creating user...');
    rblUser = new User({
      email: 'rblatco@gmail.com',
      name: 'RBL Admin',
      password: 'password123',
      role: 'admin',
      isVerified: true,
      status: 'active',
      isActive: true,
      joinedAt: new Date('2024-01-01'),
      lastActive: getTodayDateTime()
    });
    await rblUser.save();
    console.log('✅ Created rblatco@gmail.com user');
  } else {
    // Update last active to today
    rblUser.lastActive = getTodayDateTime();
    await rblUser.save();
    console.log('✅ Updated rblatco@gmail.com last active time');
  }
  
  return rblUser;
}

async function runDailyDataGeneration() {
  try {
    await connectDB();
    
    console.log('🚀 Starting daily data generation...');
    console.log(`📅 Date: ${new Date().toLocaleDateString()}`);
    console.log(`⏰ Time: ${new Date().toLocaleTimeString()}`);
    
    // Ensure rblatco@gmail.com exists
    const rblUser = await ensureRblUserExists();
    
    // Get some existing users for data generation
    const existingUsers = await User.find({ 
      role: { $in: ['user', 'admin'] },
      status: 'active'
    }).limit(10);
    
    console.log(`👥 Found ${existingUsers.length} active users`);
    
    // Generate specific data for rblatco@gmail.com (more data since it's admin)
    await generateTodayDetectionsForUser(rblUser, 15);
    await generateTodayActivitiesForUser(rblUser, 12);
    
    // Generate data for other users
    for (const user of existingUsers.slice(0, 5)) { // Limit to 5 users to avoid too much data
      if (user.email !== 'rblatco@gmail.com') {
        await generateTodayDetectionsForUser(user, getRandomNumber(5, 10));
        await generateTodayActivitiesForUser(user, getRandomNumber(4, 8));
      }
    }
    
    // Generate reports, groups, and notifications
    await generateTodayReports(existingUsers, 5);
    await createTodayGroups([rblUser, ...existingUsers.slice(0, 5)]);
    await generateTodayNotifications([rblUser, ...existingUsers.slice(0, 3)]);
    
    // Get today's statistics
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayStats = {
      detections: await DetectedWord.countDocuments({ createdAt: { $gte: today } }),
      reports: await Report.countDocuments({ createdAt: { $gte: today } }),
      groups: await Group.countDocuments({ createAt: { $gte: today } }),
      groupMembers: await GroupMember.countDocuments({ joinedAt: { $gte: today } }),
      activities: await UserActivity.countDocuments({ createdAt: { $gte: today } }),
      notifications: await Notification.countDocuments({ createdAt: { $gte: today } })
    };
    
    console.log('\n🎉 Daily data generation completed successfully!');
    console.log('📊 Today\'s Generated Data:');
    console.log(`- Detection Reports: ${todayStats.detections}`);
    console.log(`- User Reports: ${todayStats.reports}`);
    console.log(`- New Groups: ${todayStats.groups}`);
    console.log(`- Group Members Added: ${todayStats.groupMembers}`);
    console.log(`- User Activities: ${todayStats.activities}`);
    console.log(`- Notifications: ${todayStats.notifications}`);
    console.log(`\n✅ Special focus on rblatco@gmail.com with enhanced data`);
    
  } catch (error) {
    console.error('❌ Error in daily data generation:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the script
runDailyDataGeneration();
