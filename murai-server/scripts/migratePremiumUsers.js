import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from '../models/userModel.js';

// Load environment variables
dotenv.config();

const MONGO_URI = process.env.MONGO_URI;

async function migratePremiumUsers() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGO_URI, { 
      useNewUrlParser: true, 
      useUnifiedTopology: true 
    });
    console.log('Connected to MongoDB');

    // Find all users with role 'premium'
    const premiumUsers = await User.find({ role: 'premium' });
    console.log(`Found ${premiumUsers.length} users with 'premium' role`);

    if (premiumUsers.length === 0) {
      console.log('No premium users found to migrate');
      return;
    }

    // Update each premium user
    for (const user of premiumUsers) {
      console.log(`Migrating user: ${user.email}`);
      
      // Update the user: change role to 'user' and set isPremium to true
      await User.findByIdAndUpdate(user._id, {
        role: 'user',
        isPremium: true,
        updatedAt: new Date()
      });
      
      console.log(`✅ Migrated ${user.email}: role 'premium' → 'user', isPremium: true`);
    }

    // Also ensure all other users have isPremium field set to false if not already set
    const usersWithoutPremiumField = await User.find({ 
      isPremium: { $exists: false } 
    });
    
    console.log(`\nFound ${usersWithoutPremiumField.length} users without isPremium field`);
    
    if (usersWithoutPremiumField.length > 0) {
      await User.updateMany(
        { isPremium: { $exists: false } },
        { 
          $set: { 
            isPremium: false,
            updatedAt: new Date()
          } 
        }
      );
      console.log(`✅ Set isPremium: false for ${usersWithoutPremiumField.length} users`);
    }

    console.log('\n🎉 Migration completed successfully!');
    console.log('\nSummary:');
    console.log(`- Converted ${premiumUsers.length} users from role 'premium' to role 'user' with isPremium: true`);
    console.log(`- Set isPremium: false for ${usersWithoutPremiumField.length} users without the field`);
    
    // Show final stats
    const totalUsers = await User.countDocuments();
    const premiumCount = await User.countDocuments({ isPremium: true });
    const regularCount = await User.countDocuments({ isPremium: false });
    const adminCount = await User.countDocuments({ role: 'admin' });
    const userCount = await User.countDocuments({ role: 'user' });
    
    console.log('\nFinal Statistics:');
    console.log(`- Total users: ${totalUsers}`);
    console.log(`- Premium users: ${premiumCount}`);
    console.log(`- Regular users: ${regularCount}`);
    console.log(`- Admin users: ${adminCount}`);
    console.log(`- Regular role users: ${userCount}`);

  } catch (error) {
    console.error('❌ Migration error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

migratePremiumUsers();
