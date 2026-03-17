/**
 * CREATE TEST USER SCRIPT
 * Run this script to create a sample user for testing login
 *
 * Usage: node createTestUser.js
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config({path:'.env.dev'});

const { Users } = require('./app/modules/User/Schema');
const config = require('./configs/configs');

/**
 * Connect to MongoDB
 */
async function connectDB() {
  try {
    await mongoose.connect(config.db, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ Connected to MongoDB');
  } catch (err) {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  }
}

/**
 * Create sample test user
 */
async function createTestUser() {
  try {
    // Check if test user already exists
    const existingUser = await Users.findOne({ emailId: 'test@example.com' });

    if (existingUser) {
      console.log('⚠️  Test user already exists with email: test@example.com');
      console.log('📧 Email: test@example.com');
      console.log('🔐 Password: Test@123');
      return;
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash('Test@123', saltRounds);

    // Create new test user
    const testUser = new Users({
      userName: 'Test User',
      emailId: 'test@example.com',
      phoneNumber: '+1234567890',
      pincode: '123456',
      bloodGroup: 'O+',
      role: 'Donor',
      password: hashedPassword,
      isActive: true,
      isPhoneVerified: true, // Skip phone verification for testing
      firebaseUid: null // Skip Firebase auth for testing
    });

    await testUser.save();

    console.log('✅ Test user created successfully!');
    console.log('📧 Email: test@example.com');
    console.log('🔐 Password: Test@123');
    console.log('📱 Phone: +1234567890');
    console.log('');
    console.log('-------------------------------------------');
    console.log('You can now login at: http://localhost:3000/login');
    console.log('-------------------------------------------');

  } catch (err) {
    console.error('❌ Error creating test user:', err);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Database disconnected');
  }
}

/**
 * Run the script
 */
async function main() {
  console.log('🚀 Creating Test User...');
  console.log('');

  await connectDB();
  await createTestUser();
}

main();