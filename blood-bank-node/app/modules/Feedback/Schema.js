/**
 * ============================================
 * FEEDBACK SCHEMA
 * ============================================
 * Stores user feedback from donors and recipients
 * after successful blood donations
 * 
 * Features:
 * - Privacy-protected (no personal details stored)
 * - Admin approval system
 * - Rating and message storage
 * - Role-based feedback (Donor/Recipient)
 */

const mongoose = require('mongoose');

const FeedbackSchema = new mongoose.Schema(
  {
    // User Reference
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Users',
      required: true,
      index: true,
      comment: 'Reference to user who submitted feedback'
    },

    // Donation Context
    donationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Donation',
      comment: 'Reference to the donation this feedback is about'
    },

    // Feedback Content
    role: {
      type: String,
      enum: ['Donor', 'Recipient'],
      required: true,
      comment: 'User role during the donation process'
    },

    bloodGroup: {
      type: String,
      required: true,
      match: /^(O|A|B|AB)[+-]$/,
      comment: 'Blood group of the user (e.g., O+, A-, etc.)'
    },

    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
      comment: 'Rating 1-5 stars'
    },

    message: {
      type: String,
      required: true,
      trim: true,
      minlength: 10,
      maxlength: 500,
      comment: 'Short feedback message'
    },

    // Approval Status
    isApproved: {
      type: Boolean,
      default: false,
      index: true,
      comment: 'Admin approval status (false = pending, true = approved)'
    },

    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Users',
      comment: 'Admin who approved the feedback'
    },

    approvedAt: {
      type: Date,
      comment: 'Timestamp when feedback was approved'
    },

    // Status
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
      comment: 'Soft delete flag'
    },

    deletedAt: {
      type: Date,
      comment: 'Timestamp when feedback was deleted'
    },

    // Metadata
    tags: {
      type: [String],
      default: [],
      comment: 'Tags for categorizing feedback (e.g., "quick", "professional", "helpful")'
    },

    source: {
      type: String,
      enum: ['web', 'mobile', 'admin'],
      default: 'web',
      comment: 'Platform where feedback was submitted'
    }
  },
  {
    timestamps: true,
    comment: 'User feedback collection for successful donations'
  }
);

// Indexes for efficient queries
FeedbackSchema.index({ isApproved: 1, isDeleted: 1, createdAt: -1 });
FeedbackSchema.index({ userId: 1, isDeleted: 1 });
FeedbackSchema.index({ bloodGroup: 1, isApproved: 1 });
FeedbackSchema.index({ rating: 1, isApproved: 1 });

/**
 * Middleware: Remove personal data before sending to public API
 * @returns {Object} Feedback without personal identifiable info
 */
FeedbackSchema.methods.toPublic = function () {
  const obj = this.toObject();
  delete obj.userId;
  delete obj.approvedBy;
  delete obj._id;
  delete obj.__v;
  return {
    role: obj.role,
    bloodGroup: obj.bloodGroup,
    rating: obj.rating,
    message: obj.message,
    createdAt: obj.createdAt
  };
};

/**
 * Middleware: Return admin-friendly feedback with approval info
 */
FeedbackSchema.methods.toAdmin = function () {
  return this.toObject();
};

module.exports = mongoose.model('Feedback', FeedbackSchema);
