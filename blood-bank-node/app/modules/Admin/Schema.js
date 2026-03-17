/**
 * ============================================
 * ADMIN SCHEMA
 * ============================================
 * Stores admin user credentials and metadata
 * 
 * Features:
 * - Hashed passwords using bcryptjs
 * - Role-based access control
 * - Activity logging
 * - Soft delete support
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const AdminSchema = new mongoose.Schema(
  {
    // Basic Info
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      comment: 'Admin full name'
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      index: true,
      comment: 'Admin email address'
    },

    password: {
      type: String,
      required: true,
      minlength: 6,
      select: false, // Don't return password by default
      comment: 'Hashed password'
    },

    // Permissions
    role: {
      type: String,
      enum: ['super_admin', 'admin', 'moderator'],
      default: 'admin',
      comment: 'Admin role level (super_admin > admin > moderator)'
    },

    permissions: {
      manageDonors: { type: Boolean, default: true },
      manageRequests: { type: Boolean, default: true },
      manageFeedback: { type: Boolean, default: true },
      manageChat: { type: Boolean, default: false },
      manageAdmins: { type: Boolean, default: false },
      viewStatistics: { type: Boolean, default: true }
    },

    // Activity Tracking
    lastLogin: {
      type: Date,
      comment: 'Last login timestamp'
    },

    loginCount: {
      type: Number,
      default: 0,
      comment: 'Total number of logins'
    },

    ipAddress: {
      type: String,
      comment: 'Last known IP address'
    },

    // Status
    isActive: {
      type: Boolean,
      default: true,
      index: true,
      comment: 'Is admin account active'
    },

    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
      comment: 'Soft delete flag'
    },

    deletedAt: {
      type: Date,
      comment: 'When admin account was deleted'
    },

    deletedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
      comment: 'Which admin deleted this account'
    }
  },
  {
    timestamps: true,
    comment: 'Admin users collection'
  }
);

// Hash password before saving
AdminSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

/**
 * Compare password with hash
 */
AdminSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

/**
 * Get safe admin object (without password)
 */
AdminSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

/**
 * Indexes for efficient queries
 */
AdminSchema.index({ email: 1, isDeleted: 1 });
AdminSchema.index({ role: 1, isActive: 1 });
AdminSchema.index({ lastLogin: -1 });

module.exports = mongoose.model('Admin', AdminSchema);
