import dotenv from 'dotenv';
import mongoose from 'mongoose';
import DetectedWord from '../models/detectedWordModel.js';
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

function getDateForTimeRange(timeRange, dayOffset = 0) {
  const now = new Date();
  let targetDate;
  
  switch (timeRange) {
    case 'today':
      targetDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      targetDate.setHours(getRandomNumber(0, 23), getRandomNumber(0, 59), getRandomNumber(0, 59));
      break;
    case 'last_7_days':
      targetDate = new Date(now.getTime() - (dayOffset * 24 * 60 * 60 * 1000));
      targetDate.setHours(getRandomNumber(0, 23), getRandomNumber(0, 59), getRandomNumber(0, 59));
      break;
    case 'last_30_days':
      targetDate = new Date(now.getTime() - (dayOffset * 24 * 60 * 60 * 1000));
      targetDate.setHours(getRandomNumber(0, 23), getRandomNumber(0, 59), getRandomNumber(0, 59));
      break;
    case 'all_time':
      // Generate data from 2-6 months ago
      const monthsAgo = getRandomNumber(2, 6);
      targetDate = new Date(now.getFullYear(), now.getMonth() - monthsAgo, getRandomNumber(1, 28));
      targetDate.setHours(getRandomNumber(0, 23), getRandomNumber(0, 59), getRandomNumber(0, 59));
      break;
    default:
      targetDate = now;
  }
  
  return targetDate;
}

// Language-specific data
const languageData = {
  'English': {
    words: ['hate', 'stupid', 'idiot', 'kill', 'die', 'loser', 'ugly', 'worthless', 'trash', 'garbage'],
    contexts: [
      'You are so stupid and worthless',
      'I hate you so much, just die',
      'What an ugly loser you are',
      'This is complete garbage trash',
      'Stop being such an idiot'
    ],
    patternTypes: ['profanity', 'harassment', 'toxicity', 'hate_speech'],
    siteTypes: ['social', 'forum', 'chat', 'email']
  },
  'Tagalog': {
    words: ['putangina', 'gago', 'tanga', 'bobo', 'ulol', 'tarantado', 'buwisit', 'peste', 'leche', 'tangina'],
    contexts: [
      'Putangina mo gago ka',
      'Ang tanga mo naman bobo',
      'Ulol ka tarantado',
      'Buwisit ka peste',
      'Leche ka tangina'
    ],
    patternTypes: ['profanity', 'harassment', 'toxicity'],
    siteTypes: ['social', 'forum', 'chat']
  },
  'Cebuano': {
    words: ['yawa', 'piste', 'buang', 'bogo', 'animal', 'hayop', 'putang', 'giatay'],
    contexts: [
      'Yawa ka piste',
      'Buang ka bogo',
      'Animal ka hayop',
      'Putang yawa giatay',
      'Piste ka buang'
    ],
    patternTypes: ['profanity', 'harassment', 'toxicity'],
    siteTypes: ['social', 'forum', 'chat']
  },
  'Spanish': {
    words: ['idiota', 'estupido', 'basura', 'odio', 'maldito', 'pendejo', 'cabron'],
    contexts: [
      'Eres un idiota estupido',
      'Que basura de persona',
      'Te odio maldito',
      'Pendejo cabron'
    ],
    patternTypes: ['profanity', 'harassment', 'toxicity'],
    siteTypes: ['social', 'forum', 'chat']
  }
};

const websites = [
  'https://facebook.com',
  'https://twitter.com',
  'https://instagram.com',
  'https://youtube.com',
  'https://reddit.com',
  'https://discord.com',
  'https://telegram.org',
  'https://whatsapp.com'
];

async function generateLanguageTestData() {
  try {
    await connectDB();
    
    // Get users
    const users = await User.find({}).limit(10);
    if (users.length === 0) {
      console.log('No users found. Please create users first.');
      return;
    }
    
    console.log('🚀 Generating language test data for different time ranges...');
    
    const detections = [];
    
    // Generate data for TODAY (20 detections)
    console.log('📅 Generating TODAY data...');
    for (let i = 0; i < 20; i++) {
      const language = getRandomElement(Object.keys(languageData));
      const langData = languageData[language];
      const selectedWord = getRandomElement(langData.words);
      const selectedContext = getRandomElement(langData.contexts);
      
      const detection = new DetectedWord({
        word: selectedWord,
        userId: getRandomElement(users)._id,
        context: selectedContext,
        sentimentScore: getRandomFloat(-1, 0.2),
        url: getRandomElement(websites),
        accuracy: getRandomFloat(0.75, 0.98),
        responseTime: getRandomFloat(50, 300),
        patternType: getRandomElement(langData.patternTypes),
        language: language,
        severity: getRandomElement(['low', 'medium', 'high']),
        siteType: getRandomElement(langData.siteTypes),
        createdAt: getDateForTimeRange('today')
      });
      detections.push(detection);
    }
    
    // Generate data for LAST 7 DAYS (30 detections spread across 7 days)
    console.log('📅 Generating LAST 7 DAYS data...');
    for (let day = 1; day <= 7; day++) {
      for (let i = 0; i < 4; i++) {
        const language = getRandomElement(Object.keys(languageData));
        const langData = languageData[language];
        const selectedWord = getRandomElement(langData.words);
        const selectedContext = getRandomElement(langData.contexts);
        
        const detection = new DetectedWord({
          word: selectedWord,
          userId: getRandomElement(users)._id,
          context: selectedContext,
          sentimentScore: getRandomFloat(-1, 0.2),
          url: getRandomElement(websites),
          accuracy: getRandomFloat(0.75, 0.98),
          responseTime: getRandomFloat(50, 300),
          patternType: getRandomElement(langData.patternTypes),
          language: language,
          severity: getRandomElement(['low', 'medium', 'high']),
          siteType: getRandomElement(langData.siteTypes),
          createdAt: getDateForTimeRange('last_7_days', day)
        });
        detections.push(detection);
      }
    }
    
    // Generate data for LAST 30 DAYS (40 detections spread across 30 days)
    console.log('📅 Generating LAST 30 DAYS data...');
    for (let day = 8; day <= 30; day++) {
      if (day % 2 === 0) { // Every other day
        for (let i = 0; i < 2; i++) {
          const language = getRandomElement(Object.keys(languageData));
          const langData = languageData[language];
          const selectedWord = getRandomElement(langData.words);
          const selectedContext = getRandomElement(langData.contexts);
          
          const detection = new DetectedWord({
            word: selectedWord,
            userId: getRandomElement(users)._id,
            context: selectedContext,
            sentimentScore: getRandomFloat(-1, 0.2),
            url: getRandomElement(websites),
            accuracy: getRandomFloat(0.75, 0.98),
            responseTime: getRandomFloat(50, 300),
            patternType: getRandomElement(langData.patternTypes),
            language: language,
            severity: getRandomElement(['low', 'medium', 'high']),
            siteType: getRandomElement(langData.siteTypes),
            createdAt: getDateForTimeRange('last_30_days', day)
          });
          detections.push(detection);
        }
      }
    }
    
    // Generate data for ALL TIME (25 detections from months ago)
    console.log('📅 Generating ALL TIME data...');
    for (let i = 0; i < 25; i++) {
      const language = getRandomElement(Object.keys(languageData));
      const langData = languageData[language];
      const selectedWord = getRandomElement(langData.words);
      const selectedContext = getRandomElement(langData.contexts);
      
      const detection = new DetectedWord({
        word: selectedWord,
        userId: getRandomElement(users)._id,
        context: selectedContext,
        sentimentScore: getRandomFloat(-1, 0.2),
        url: getRandomElement(websites),
        accuracy: getRandomFloat(0.75, 0.98),
        responseTime: getRandomFloat(50, 300),
        patternType: getRandomElement(langData.patternTypes),
        language: language,
        severity: getRandomElement(['low', 'medium', 'high']),
        siteType: getRandomElement(langData.siteTypes),
        createdAt: getDateForTimeRange('all_time')
      });
      detections.push(detection);
    }
    
    // Insert all detections
    await DetectedWord.insertMany(detections);
    
    console.log(`✅ Generated ${detections.length} language test detections:`);
    console.log(`   📅 Today: 20 detections`);
    console.log(`   📅 Last 7 days: 28 detections (4 per day)`);
    console.log(`   📅 Last 30 days: 22 detections (spread across days 8-30)`);
    console.log(`   📅 All time: 25 detections (from months ago)`);
    
    // Show language distribution
    const languageCount = {};
    detections.forEach(d => {
      languageCount[d.language] = (languageCount[d.language] || 0) + 1;
    });
    
    console.log('\n📊 Language Distribution:');
    Object.entries(languageCount).forEach(([lang, count]) => {
      console.log(`   ${lang}: ${count} detections`);
    });
    
  } catch (error) {
    console.error('Error generating language test data:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

generateLanguageTestData();
