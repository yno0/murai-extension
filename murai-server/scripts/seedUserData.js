import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

// Load environment variables
dotenv.config();

// Import models
import DetectedWord from '../models/detectedWordModel.js';
import GroupCode from '../models/groupCode.js';
import Group from '../models/groupModel.js';
import GroupMember from '../models/groupUserModel.js';
import Notification from '../models/notificationModel.js';
import Preference from '../models/preferenceModel.js';
import UserActivity from '../models/userActivityLogs.js';
import UserInfo from '../models/userInfoModel.js';
import User from '../models/userModel.js';

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// Sample data generators
const generateRandomDate = (daysBack) => {
  const date = new Date();
  date.setDate(date.getDate() - Math.floor(Math.random() * daysBack));
  return date;
};

const websites = [
  'facebook.com', 'twitter.com', 'instagram.com', 'youtube.com', 'reddit.com',
  'discord.com', 'twitch.tv', 'tiktok.com', 'linkedin.com', 'pinterest.com',
  'snapchat.com', 'whatsapp.com', 'telegram.org', 'medium.com', 'quora.com'
];

const harmfulWords = [
  'inappropriate', 'offensive', 'harmful', 'toxic', 'bullying', 'harassment',
  'spam', 'scam', 'phishing', 'malware', 'virus', 'threat', 'abuse',
  'violence', 'hate', 'discrimination', 'cyberbullying', 'trolling'
];

const activityTypes = [
  'login', 'logout', 'flagged', 'visit', 'report', 'group_join', 'group_leave',
  'update', 'other'
];

// Main seeding function
const seedUserData = async () => {
  try {
    console.log('🌱 Starting data seeding for Roberto Velasco...');

    // 1. Create or find the user
    console.log('👤 Creating user...');
    const hashedPassword = await bcrypt.hash('Robertopogi5456', 10);
    
    let user = await User.findOne({ email: 'rvlatco@gmail.com' });
    if (user) {
      console.log('User already exists, updating...');
      user.name = 'Roberto Velasco';
      user.password = hashedPassword;
      await user.save();
    } else {
      user = new User({
        name: 'Roberto Velasco',
        email: 'rvlatco@gmail.com',
        password: hashedPassword,
        isVerified: true,
        role: 'user',
        status: 'active',
        createdAt: generateRandomDate(30),
        updatedAt: new Date()
      });
      await user.save();
    }
    console.log(`✅ User created/updated: ${user.name}`);

    // 2. Create UserInfo
    console.log('📱 Creating user info...');
    let userInfo = await UserInfo.findOne({ userId: user._id });
    if (!userInfo) {
      userInfo = new UserInfo({
        userId: user._id,
        firstName: 'Roberto',
        lastName: 'Velasco',
        phoneNumber: '+639123456789',
        phone: '+639123456789',
        address: 'Manila, Philippines',
        dateOfBirth: new Date('1995-05-15'),
        gender: 'male',
        department: 'Software Development',
        position: 'Senior Developer',
        employeeId: 'EMP001',
        emergencyContact: 'Maria Velasco',
        emergencyPhone: '+639987654321'
      });
      await userInfo.save();
    }
    console.log('✅ User info created');

    // 3. Create Preferences
    console.log('⚙️ Creating preferences...');
    let preferences = await Preference.findOne({ userId: user._id });
    if (!preferences) {
      preferences = new Preference({
        userId: user._id,
        notifications: {
          email: true,
          push: true,
          sms: false,
          detectionAlerts: true,
          weeklyReports: true,
          securityUpdates: true
        },
        privacy: {
          shareData: false,
          publicProfile: false,
          allowAnalytics: true
        },
        security: {
          twoFactorAuth: false,
          loginAlerts: true,
          sessionTimeout: 30
        },
        display: {
          theme: 'light',
          language: 'en',
          timezone: 'Asia/Manila'
        }
      });
      await preferences.save();
    }
    console.log('✅ Preferences created');

    // 4. Create Groups (Roberto as admin/creator)
    console.log('👥 Creating groups...');
    const groupsData = [
      {
        name: 'Family Safety Circle',
        description: 'Keeping our family safe online',
        type: 'private'
      },
      {
        name: 'Work Team Protection',
        description: 'Professional online safety group',
        type: 'public'
      },
      {
        name: 'Gaming Community Watch',
        description: 'Safe gaming environment for all',
        type: 'public'
      }
    ];

    for (const groupData of groupsData) {
      let group = await Group.findOne({ name: groupData.name, userId: user._id });
      if (!group) {
        group = new Group({
          ...groupData,
          userId: user._id,
          memberCount: 1,
          createAt: generateRandomDate(20),
          updateAt: new Date(),
          isActive: true,
          status: 'active'
        });
        await group.save();

        // Create group code
        const code = Math.random().toString(36).substr(2, 6).toUpperCase();
        const groupCode = new GroupCode({
          groupId: group._id,
          code,
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        });
        await groupCode.save();

        // Add Roberto as group member
        const groupMember = new GroupMember({
          groupId: group._id,
          userId: user._id,
          role: 'admin',
          joinedAt: group.createdAt
        });
        await groupMember.save();
      }
    }
    console.log('✅ Groups created');

    // 5. Create DetectedWords (50+ entries)
    console.log('🚨 Creating detected words...');
    await DetectedWord.deleteMany({ userId: user._id }); // Clear existing
    
    const detectedWordsData = [];
    for (let i = 0; i < 55; i++) {
      const website = websites[Math.floor(Math.random() * websites.length)];
      const word = harmfulWords[Math.floor(Math.random() * harmfulWords.length)];
      const severity = ['low', 'medium', 'high'][Math.floor(Math.random() * 3)];
      
      detectedWordsData.push({
        userId: user._id,
        word: word,
        context: `Detected "${word}" in user content on ${website}`,
        url: `https://${website}/page${Math.floor(Math.random() * 1000)}`,
        sentimentScore: Math.random() * -1, // Negative score for harmful content
        accuracy: 0.85 + Math.random() * 0.15, // 85-100% accuracy
        responseTime: Math.floor(Math.random() * 500) + 50, // 50-550ms response time
        severity: severity,
        patternType: ['Profanity', 'Hate Speech', 'Harassment', 'Spam', 'Violence'][Math.floor(Math.random() * 5)],
        language: ['English', 'Tagalog', 'Mixed'][Math.floor(Math.random() * 3)],
        siteType: ['Social Media', 'Forum', 'News', 'Blog', 'Gaming'][Math.floor(Math.random() * 5)],
        createdAt: generateRandomDate(60)
      });
    }
    
    await DetectedWord.insertMany(detectedWordsData);
    console.log(`✅ Created ${detectedWordsData.length} detected words`);

    // 6. Create Notifications (20+ entries)
    console.log('🔔 Creating notifications...');
    await Notification.deleteMany({ userId: user._id }); // Clear existing

    const notificationTypes = ['alert', 'warning', 'info', 'success'];
    const notificationsData = [];

    for (let i = 0; i < 25; i++) {
      const type = notificationTypes[Math.floor(Math.random() * notificationTypes.length)];
      const isRead = Math.random() > 0.3; // 70% read, 30% unread

      let title, message;
      switch (type) {
        case 'alert':
          title = 'Security Alert';
          message = `Harmful content detected on ${websites[Math.floor(Math.random() * websites.length)]}`;
          break;
        case 'warning':
          title = 'Protection Warning';
          message = `Suspicious activity detected in your browsing session`;
          break;
        case 'info':
          title = 'Weekly Report';
          message = `Your weekly safety report is ready. ${Math.floor(Math.random() * 50)} threats blocked.`;
          break;
        case 'success':
          title = 'Protection Update';
          message = 'Your protection settings have been successfully updated';
          break;
      }

      notificationsData.push({
        userId: user._id,
        title,
        message,
        type,
        isRead,
        createdAt: generateRandomDate(30),
        readAt: isRead ? generateRandomDate(25) : null
      });
    }

    await Notification.insertMany(notificationsData);
    console.log(`✅ Created ${notificationsData.length} notifications`);

    // 7. Create User Activity Logs (40+ entries)
    console.log('📝 Creating user activity logs...');
    await UserActivity.deleteMany({ userId: user._id }); // Clear existing

    const userActivityData = [];
    for (let i = 0; i < 45; i++) {
      const activityType = activityTypes[Math.floor(Math.random() * activityTypes.length)];
      const website = websites[Math.floor(Math.random() * websites.length)];

      let details, metadata;
      switch (activityType) {
        case 'login':
          details = 'User logged into the application';
          metadata = { device: 'Mobile', browser: 'Chrome' };
          break;
        case 'logout':
          details = 'User logged out of the application';
          metadata = { sessionDuration: `${Math.floor(Math.random() * 120)} minutes` };
          break;
        case 'flagged':
          details = `Flagged content on ${website}`;
          metadata = { website, severity: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)] };
          break;
        case 'visit':
          details = `Visited ${website}`;
          metadata = { website, duration: `${Math.floor(Math.random() * 30)} minutes` };
          break;
        case 'report':
          details = `Generated safety report`;
          metadata = { reportType: 'weekly', threatsBlocked: Math.floor(Math.random() * 20) };
          break;
        case 'group_join':
          details = 'Joined a safety group';
          metadata = { groupName: 'Family Safety Circle' };
          break;
        default:
          details = `Performed ${activityType} action`;
          metadata = { source: 'mobile_app' };
      }

      userActivityData.push({
        userId: user._id,
        activityType: activityType,
        activityDetails: details,
        activityCategory: ['security', 'content', 'system', 'social'][Math.floor(Math.random() * 4)],
        createdAt: generateRandomDate(45),
        updatedAt: generateRandomDate(45)
      });
    }

    await UserActivity.insertMany(userActivityData);
    console.log(`✅ Created ${userActivityData.length} user activity logs`);

    console.log('🎉 Data seeding completed successfully!');
    console.log(`📊 Summary:`);
    console.log(`   - User: Roberto Velasco (rvlatco@gmail.com)`);
    console.log(`   - Groups: 3 (as admin/creator)`);
    console.log(`   - Detected Words: ${detectedWordsData.length}`);
    console.log(`   - Notifications: ${notificationsData.length}`);
    console.log(`   - User Activity Logs: ${userActivityData.length}`);
    console.log(`   - User Info: Complete profile`);
    console.log(`   - Preferences: All configured`);
    console.log(`   - Total Records: ${detectedWordsData.length + notificationsData.length + userActivityData.length + 6}`);

    // Login credentials for testing
    console.log(`\n🔑 Login Credentials:`);
    console.log(`   Email: rvlatco@gmail.com`);
    console.log(`   Password: Robertopogi5456`);

  } catch (error) {
    console.error('❌ Error seeding data:', error);
  }
};

// Run the seeding
const runSeed = async () => {
  await connectDB();
  await seedUserData();
  
  console.log('🔄 Closing database connection...');
  await mongoose.connection.close();
  console.log('✅ Database connection closed');
  process.exit(0);
};

runSeed();
