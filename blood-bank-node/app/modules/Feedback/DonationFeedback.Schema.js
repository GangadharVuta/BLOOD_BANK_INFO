/**
 * ============================================
 * DONATION FEEDBACK SCHEMA
 * ============================================
 * Stores donor and recipient feedback after donation
 * 
 * Features:
 * - Separate feedback for donors and recipients
 * - Request-specific tracking with requestId
 * - Prevents duplicate submissions
 * - Detailed ratings and comments
 * - Optional fields for flexibility
 */

const mongoose = require('mongoose');

const DonationFeedbackSchema = new mongoose.Schema(
  {
    // Request Reference (Links to blood request)
    requestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Requests',
      required: true,
      index: true,
      comment: 'Reference to blood request'
    },

    // Users Reference
    donorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Users',
      required: true,
      index: true,
      comment: 'ID of the donor'
    },

    recipientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Users',
      required: true,
      index: true,
      comment: 'ID of the blood recipient/requester'
    },

    // Feedback Type
    feedbackType: {
      type: String,
      enum: ['donor', 'recipient'],
      required: true,
      index: true,
      comment: 'Who is providing feedback: donor or recipient'
    },

    // ============= DONOR FEEDBACK FIELDS =============
    // (only used when feedbackType === 'donor')
    recipientBehavior: {
      type: Number,
      min: 1,
      max: 5,
      comment: 'How was recipient\'s behavior? 1=Poor, 5=Excellent'
    },

    recipientResponsiveness: {
      type: Number,
      min: 1,
      max: 5,
      comment: 'Recipient response time: 1=Very Slow, 5=Very Quick'
    },

    processSmoothness: {
      type: Number,
      min: 1,
      max: 5,
      comment: 'Overall process smoothness: 1=Very Difficult, 5=Very Smooth'
    },

    donorOverallRating: {
      type: Number,
      min: 1,
      max: 5,
      required: true,
      comment: 'Overall rating from donor'
    },

    donorComments: {
      type: String,
      trim: true,
      maxlength: 1000,
      comment: 'Donor\'s detailed comments'
    },

    // ============= RECIPIENT FEEDBACK FIELDS =============
    // (only used when feedbackType === 'recipient')
    donorHelpfulness: {
      type: Number,
      min: 1,
      max: 5,
      comment: 'How helpful was the donor? 1=Not Helpful, 5=Very Helpful'
    },

    donorResponseTime: {
      type: Number,
      min: 1,
      max: 5,
      comment: 'Donor response speed: 1=Very Slow, 5=Very Quick'
    },

    recipientOverallRating: {
      type: Number,
      min: 1,
      max: 5,
      required: true,
      comment: 'Overall rating from recipient'
    },

    recipientComments: {
      type: String,
      trim: true,
      maxlength: 1000,
      comment: 'Recipient\'s detailed comments'
    },

    // ============= COMMON FIELDS =============
    bloodGroup: {
      type: String,
      required: true,
      match: /^(O|A|B|AB)[+-]$/,
      comment: 'Blood group for context'
    },

    // Would recommend flag
    wouldRecommend: {
      type: Boolean,
      comment: 'Would recommend this person again'
    },

    // Status tracking
    isApproved: {
      type: Boolean,
      default: false,
      index: true,
      comment: 'Admin approval status'
    },

    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
      comment: 'Soft delete flag'
    },

    deletedAt: {
      type: Date,
      comment: 'When feedback was deleted'
    },

    // Admin actions
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Users',
      comment: 'Admin who approved'
    },

    approvedAt: {
      type: Date,
      comment: 'When approved by admin'
    },

    rejectionReason: {
      type: String,
      comment: 'Reason for rejection if rejected'
    },

    // Metadata
    tags: {
      type: [String],
      default: [],
      comment: 'Tags for categorizing'
    }
  },
  {
    timestamps: true,
    comment: 'Donation feedback from donors and recipients'
  }
);

// ============= INDEXES =============
// Prevent duplicate submissions
DonationFeedbackSchema.index({ requestId: 1, donorId: 1, recipientId: 1, feedbackType: 1 }, { unique: true });

// Query optimization
DonationFeedbackSchema.index({ isApproved: 1, isDeleted: 1, createdAt: -1 });
DonationFeedbackSchema.index({ donorId: 1, feedbackType: 1, isDeleted: 1 });
DonationFeedbackSchema.index({ recipientId: 1, feedbackType: 1, isDeleted: 1 });
DonationFeedbackSchema.index({ requestId: 1, isDeleted: 1 });

// ============= METHODS =============

/**
 * Check if feedback already exists for this request
 */
DonationFeedbackSchema.statics.findExisting = async function(requestId, donorId, recipientId, feedbackType) {
  return this.findOne({
    requestId,
    donorId,
    recipientId,
    feedbackType,
    isDeleted: false
  });
};

/**
 * Get average rating for donor (from recipients)
 */
DonationFeedbackSchema.statics.getDonorAverageRating = async function(donorId) {
  const result = await this.aggregate([
    {
      $match: {
        donorId: mongoose.Types.ObjectId(donorId),
        feedbackType: 'recipient',
        isApproved: true,
        isDeleted: false
      }
    },
    {
      $group: {
        _id: null,
        averageRating: { $avg: '$recipientOverallRating' },
        totalFeedback: { $sum: 1 }
      }
    }
  ]);

  return result.length > 0
    ? { averageRating: result[0].averageRating.toFixed(2), totalFeedback: result[0].totalFeedback }
    : { averageRating: 0, totalFeedback: 0 };
};

/**
 * Get for public display (no sensitive data)
 */
DonationFeedbackSchema.methods.toPublic = function() {
  const obj = this.toObject();
  delete obj.donorId;
  delete obj.recipientId;
  delete obj.approvedBy;
  delete obj.__v;

  return {
    feedbackType: obj.feedbackType,
    bloodGroup: obj.bloodGroup,
    rating: obj.feedbackType === 'donor' ? obj.donorOverallRating : obj.recipientOverallRating,
    comments: obj.feedbackType === 'donor' ? obj.donorComments : obj.recipientComments,
    wouldRecommend: obj.wouldRecommend,
    createdAt: obj.createdAt
  };
};

module.exports = mongoose.model('DonationFeedback', DonationFeedbackSchema);
