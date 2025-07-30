import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from '../models/userModel.js';

// Load environment variables
dotenv.config();

const MONGO_URI = process.env.MONGO_URI;

async function createAdminUser() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGO_URI, { 
      useNewUrlParser: true, 
      useUnifiedTopology: true 
    });
    console.log('Connected to MongoDB');

    // Check if admin user already exists
    const existingAdmin = await User.findOne({ email: 'admin@murai.com' });
    if (existingAdmin) {
      console.log('Admin user already exists:', existingAdmin.email);
      process.exit(0);
    }

    // Create admin user
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('admin123', salt);

    const adminUser = new User({
      name: 'Admin User',
      email: 'admin@murai.com',
      password: hashedPassword,
      role: 'admin',
      status: 'active',
      isVerified: true,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    await adminUser.save();
    console.log('Admin user created successfully!');
    console.log('Email: admin@murai.com');
    console.log('Password: admin123');
    console.log('Role: admin');

    // Create a few test users
    const testUsers = [
      {
        name: 'John Doe',
        email: 'john@example.com',
        role: 'user',
        status: 'active'
      },
      {
        name: 'Jane Smith',
        email: 'jane@example.com',
        role: 'user',
        status: 'inactive'
      },
      {
        name: 'Bob Wilson',
        email: 'bob@example.com',
        role: 'premium',
        status: 'active'
      }
    ];

    for (const userData of testUsers) {
      const existingUser = await User.findOne({ email: userData.email });
      if (!existingUser) {
        const userPassword = await bcrypt.hash('password123', salt);
        const user = new User({
          ...userData,
          password: userPassword,
          isVerified: true,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        await user.save();
        console.log(`Test user created: ${userData.email}`);
      }
    }

    console.log('\nSetup complete! You can now:');
    console.log('1. Start the server: npm start');
    console.log('2. Login with admin@murai.com / admin123');
    console.log('3. Test user management functionality');

  } catch (error) {
    console.error('Error creating admin user:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

createAdminUser();
