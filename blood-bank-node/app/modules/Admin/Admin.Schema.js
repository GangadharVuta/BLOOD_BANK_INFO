/**
 * ============================================
 * ADMIN SCHEMA
 * ============================================
 * Database schema for admin users
 * Features:
 * - Secure password hashing with bcryptjs
 * - Role-based access control
 * - Timestamp tracking
 * - Activity logging
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const AdminSchema = new mongoose.Schema(
  {
    // Basic Information
    name: {
      type: String,
      required: [true, 'Admin name is required'],
      trim: true
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: 6,
      select: false // Never return password by default
    },

    // Permissions & Access
    role: {
      type: String,
      enum: ['Super Admin', 'Admin', 'Moderator'],
      default: 'Admin'
    },
    permissions: {
      manageDonors: { type: Boolean, default: true },
      manageRequests: { type: Boolean, default: true },
      manageFeedback: { type: Boolean, default: true },
      viewAnalytics: { type: Boolean, default: true },
      manageAdmins: { type: Boolean, default: false },
      bulkOperations: { type: Boolean, default: false }
    },

    // Status & Activity
    isActive: {
      type: Boolean,
      default: true
    },
    lastLogin: {
      type: Date,
      default: null
    },
    lastActivity: {
      type: Date,
      default: null
    },
    loginAttempts: {
      type: Number,
      default: 0
    },
    lockedUntil: {
      type: Date,
      default: null
    },

    // Audit Fields
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User', // Reference to admin who created this admin
      default: null
    },
    isDeleted: {
      type: Boolean,
      default: false
    },
    deletedAt: {
      type: Date,
      default: null
    },
    deletedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    }
  },
  {
    timestamps: true,
    collection: 'admins'
  }
);

/**
 * Indexes
 */
AdminSchema.index({ email: 1 });
AdminSchema.index({ isActive: 1 });
AdminSchema.index({ createdAt: -1 });
AdminSchema.index({ lastLogin: -1 });

/**
 * Hash password before saving
 * Only hash if password is modified
 */
AdminSchema.pre('save', async function (next) {
  // Only hash if password is modified
  if (!this.isModified('password')) {
    return next();
  }

  try {
    // Generate salt
    const salt = await bcrypt.genSalt(10);
    // Hash password
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

/**
 * Compare password with hash
 * Used during login
 */
AdminSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

/**
 * Get admin data without sensitive fields
 */
AdminSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.loginAttempts;
  delete obj.lockedUntil;
  return obj;
};

/**
 * Increment failed login attempts
 */
AdminSchema.methods.incrementLoginAttempts = async function () {
  // If we have a previous failed attempt within 30 minutes, lock the account
  if (this.lockedUntil && this.lockedUntil > new Date()) {
    return;
  }

  // Otherwise we reset at 30 minutes past the last attempt
  const updates = { loginAttempts: this.loginAttempts + 1 };

  // Lock account on 5 failed attempts for 30 minutes
  if (updates.loginAttempts >= 5) {
    updates.lockedUntil = new Date(Date.now() + 30 * 60 * 1000);
  }

  return this.updateOne(updates);
};

/**
 * Reset login attempts on successful login
 */
AdminSchema.methods.resetLoginAttempts = async function () {
  return this.updateOne({
    loginAttempts: 0,
    lockedUntil: null,
    lastLogin: new Date()
  });
};

/**
 * Check if account is locked
 */
AdminSchema.methods.isLocked = function () {
  return this.lockedUntil && this.lockedUntil > new Date();
};

// Export model
module.exports = mongoose.model('Admin', AdminSchema);
