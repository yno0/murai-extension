import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Report from '../models/reportModel.js';
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

async function generateSampleReports() {
  try {
    // Get some users to assign as reporters
    const users = await User.find().limit(5);
    if (users.length === 0) {
      console.log('No users found. Please create some users first.');
      return;
    }

    // Get admin users for reviewedBy field
    const adminUsers = await User.find({ role: 'admin' }).limit(2);

    const sampleReports = [
      {
        userId: users[0]._id,
        type: 'false_positive',
        description: 'System incorrectly flagged this as harassment',
        category: 'harassment',
        reportedText: 'This is a normal conversation about work projects',
        status: 'pending',
        createdAt: new Date('2024-01-20'),
        updatedAt: new Date('2024-01-20')
      },
      {
        userId: users[1]._id,
        type: 'false_negative',
        description: 'System missed detecting toxic language',
        category: 'toxicity',
        reportedText: 'You are such an idiot and should quit your job',
        status: 'resolved',
        reviewedBy: adminUsers[0]?._id,
        reviewedAt: new Date('2024-01-21'),
        createdAt: new Date('2024-01-19'),
        updatedAt: new Date('2024-01-21')
      },
      {
        userId: users[2]._id,
        type: 'false_positive',
        description: 'Content was flagged as spam but it is legitimate',
        category: 'spam',
        reportedText: 'Check out this amazing deal on our new product line',
        status: 'in_progress',
        reviewedBy: adminUsers[1]?._id,
        reviewedAt: new Date('2024-01-22'),
        createdAt: new Date('2024-01-18'),
        updatedAt: new Date('2024-01-22')
      },
      {
        userId: users[3]._id,
        type: 'false_negative',
        description: 'Hate speech was not detected by the system',
        category: 'hate_speech',
        reportedText: 'People from that country are all criminals and should be banned',
        status: 'pending',
        createdAt: new Date('2024-01-17'),
        updatedAt: new Date('2024-01-17')
      },
      {
        userId: users[4]._id,
        type: 'false_positive',
        description: 'Profanity filter was too aggressive',
        category: 'profanity',
        reportedText: 'This is a damn good project we are working on',
        status: 'resolved',
        reviewedBy: adminUsers[0]?._id,
        reviewedAt: new Date('2024-01-23'),
        createdAt: new Date('2024-01-16'),
        updatedAt: new Date('2024-01-23')
      },
      {
        userId: users[0]._id,
        type: 'false_negative',
        description: 'Cyberbullying content was not flagged',
        category: 'cyberbullying',
        reportedText: 'Nobody likes you and you should just disappear from here',
        status: 'in_progress',
        reviewedBy: adminUsers[1]?._id,
        reviewedAt: new Date('2024-01-24'),
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-01-24')
      },
      {
        userId: users[1]._id,
        type: 'false_positive',
        description: 'Medical discussion was flagged as inappropriate',
        category: 'medical',
        reportedText: 'I have been experiencing chest pain and shortness of breath',
        status: 'pending',
        createdAt: new Date('2024-01-14'),
        updatedAt: new Date('2024-01-14')
      },
      {
        userId: users[2]._id,
        type: 'false_negative',
        description: 'Discriminatory language was not detected',
        category: 'discrimination',
        reportedText: 'Women are not capable of handling technical jobs',
        status: 'resolved',
        reviewedBy: adminUsers[0]?._id,
        reviewedAt: new Date('2024-01-25'),
        createdAt: new Date('2024-01-13'),
        updatedAt: new Date('2024-01-25')
      }
    ];

    // Clear existing reports
    await Report.deleteMany({});
    console.log('Cleared existing reports');

    // Insert sample reports
    const insertedReports = await Report.insertMany(sampleReports);
    console.log(`✅ Generated ${insertedReports.length} sample reports`);

    // Display summary
    const statusCounts = await Report.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    
    const typeCounts = await Report.aggregate([
      { $group: { _id: '$type', count: { $sum: 1 } } }
    ]);

    console.log('\n📊 Report Summary:');
    console.log('By Status:');
    statusCounts.forEach(item => {
      console.log(`  ${item._id}: ${item.count}`);
    });
    
    console.log('\nBy Type:');
    typeCounts.forEach(item => {
      console.log(`  ${item._id}: ${item.count}`);
    });

  } catch (error) {
    console.error('Error generating sample reports:', error);
  }
}

async function main() {
  await connectDB();
  await generateSampleReports();
  await mongoose.disconnect();
  console.log('\n✅ Sample reports generation completed');
}

main().catch(console.error);
