/**
 * ============================================
 * CREATE ADMIN USER SCRIPT
 * ============================================
 * Run this script to create a sample admin user
 * 
 * Usage: node createAdmin.js
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const Admin = require('./app/modules/Admin/Schema');
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
 * Create sample admin user
 */
async function createAdmin() {
  try {
    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ email: 'admin@bloodconnect.com' });
    
    if (existingAdmin) {
      console.log('⚠️  Admin user already exists with email: admin@bloodconnect.com');
      return;
    }

    // Create new admin
    const adminData = {
      name: 'System Administrator',
      email: 'admin@bloodconnect.com',
      password: 'Admin@123', // Change this password in production!
      role: 'super_admin',
      permissions: {
        manageDonors: true,
        manageRequests: true,
        manageFeedback: true,
        manageChat: true,
        manageAdmins: true,
        viewStatistics: true
      },
      isActive: true
    };

    const admin = new Admin(adminData);
    await admin.save();

    console.log('✅ Admin user created successfully!');
    console.log('📧 Email: admin@bloodconnect.com');
    console.log('🔐 Password: Admin@123');
    console.log('⚠️  IMPORTANT: Change this password immediately after your first login!');
    console.log('');
    console.log('-------------------------------------------');
    console.log('Login at: http://localhost:3000/admin/login');
    console.log('-------------------------------------------');

  } catch (err) {
    console.error('❌ Error creating admin:', err);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Database disconnected');
  }
}

/**
 * Run the script
 */
async function main() {
  console.log('🚀 Creating Admin User...');
  console.log('');
  
  await connectDB();
  await createAdmin();
}

main();
