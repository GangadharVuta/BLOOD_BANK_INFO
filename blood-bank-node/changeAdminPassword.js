/**
 * ============================================
 * CHANGE ADMIN PASSWORD SCRIPT
 * ============================================
 * Run this script to change the admin password
 *
 * Usage: node changeAdminPassword.js [newPassword]
 * If no password provided, it will prompt for one
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const readline = require('readline');
require('dotenv').config();

const Admin = require('./app/modules/Admin/Schema');
const config = require('./configs/configs');

/**
 * Create readline interface for user input
 */
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

/**
 * Prompt for password
 */
function promptPassword() {
  return new Promise((resolve) => {
    rl.question('Enter new admin password (min 8 characters): ', (password) => {
      if (password.length < 8) {
        console.log('❌ Password must be at least 8 characters long');
        resolve(promptPassword());
      } else {
        rl.question('Confirm new password: ', (confirmPassword) => {
          if (password !== confirmPassword) {
            console.log('❌ Passwords do not match');
            resolve(promptPassword());
          } else {
            rl.close();
            resolve(password);
          }
        });
      }
    });
  });
}

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
 * Change admin password
 */
async function changeAdminPassword(newPassword = null) {
  try {
    const email = 'admin@bloodconnect.com';

    // Get password from argument or prompt
    let password = newPassword;
    if (!password) {
      password = await promptPassword();
    }

    // Find admin
    const admin = await Admin.findOne({ email });

    if (!admin) {
      console.log('❌ Admin user not found');
      return;
    }

    // Hash new password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Update password
    admin.password = hashedPassword;
    await admin.save();

    console.log('✅ Admin password changed successfully!');
    console.log('📧 Email: admin@bloodconnect.com');
    console.log('🔐 New Password:', password);
    console.log('');
    console.log('⚠️  IMPORTANT: Keep this password secure and do not share it!');
    console.log('-------------------------------------------');
    console.log('Login at: http://localhost:3000/admin/login');
    console.log('-------------------------------------------');

  } catch (err) {
    console.error('❌ Error changing password:', err);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Database disconnected');
  }
}

// Run the script
connectDB().then(() => {
  const newPassword = process.argv[2]; // Get password from command line argument
  changeAdminPassword(newPassword);
});