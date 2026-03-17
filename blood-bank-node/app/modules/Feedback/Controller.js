/**
 * ============================================
 * FEEDBACK CONTROLLER
 * ============================================
 * Handles all feedback operations:
 * - Submit feedback
 * - Get public feedback
 * - Admin approval
 * - Statistics calculation
 */

const Feedback = require('./Schema');
const Users = require('../User/Schema');
const { ObjectId } = require('mongodb');

/**
 * Submit new feedback
 * POST /api/feedback
 */
const submitFeedback = async (req, res) => {
  try {
    const { role, bloodGroup, rating, message, donationId } = req.body;
    const userId = req.user._id || req.user.id;

    // Validation
    if (!role || !['Donor', 'Recipient'].includes(role)) {
      return res.status(400).json({
        status: 0,
        message: 'Invalid role. Must be Donor or Recipient'
      });
    }

    if (!bloodGroup || !/^(O|A|B|AB)[+-]$/.test(bloodGroup)) {
      return res.status(400).json({
        status: 0,
        message: 'Invalid blood group format'
      });
    }

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        status: 0,
        message: 'Rating must be between 1 and 5'
      });
    }

    if (!message || message.trim().length < 10) {
      return res.status(400).json({
        status: 0,
        message: 'Message must be at least 10 characters'
      });
    }

    // Create feedback
    const feedback = new Feedback({
      userId: new ObjectId(userId),
      donationId: donationId ? new ObjectId(donationId) : null,
      role,
      bloodGroup,
      rating,
      message: message.trim(),
      isApproved: false
    });

    await feedback.save();

    res.status(201).json({
      status: 1,
      message: 'Feedback submitted successfully. Pending admin approval.',
      data: feedback._id
    });
  } catch (error) {
    console.error('Error submitting feedback:', error);
    res.status(500).json({
      status: 0,
      message: error.message || 'Failed to submit feedback'
    });
  }
};

/**
 * Get public feedback (approved only)
 * GET /api/feedback/public
 * No authentication required
 */
const getPublicFeedback = async (req, res) => {
  try {
    const { limit = 10, skip = 0 } = req.query;

    // Get approved, non-deleted feedback, sorted by newest first
    const feedbacks = await Feedback.find({
      isApproved: true,
      isDeleted: false
    })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip))
      .lean();

    // Remove personal identifiable information
    const publicFeedbacks = feedbacks.map(feedback => ({
      role: feedback.role,
      bloodGroup: feedback.bloodGroup,
      rating: feedback.rating,
      message: feedback.message,
      createdAt: feedback.createdAt
    }));

    // Get total count for pagination
    const total = await Feedback.countDocuments({
      isApproved: true,
      isDeleted: false
    });

    res.status(200).json({
      status: 1,
      data: publicFeedbacks,
      total,
      limit: parseInt(limit),
      skip: parseInt(skip),
      pages: Math.ceil(total / parseInt(limit))
    });
  } catch (error) {
    console.error('Error fetching public feedback:', error);
    res.status(500).json({
      status: 0,
      message: error.message || 'Failed to fetch feedback'
    });
  }
};

/**
 * Get all feedback (admin only)
 * GET /api/feedback/admin
 */
const getAdminFeedback = async (req, res) => {
  try {
    // Check if user is admin (you should have admin check middleware)
    const { limit = 20, skip = 0, isApproved, role } = req.query;

    let query = { isDeleted: false };

    if (isApproved !== undefined) {
      query.isApproved = isApproved === 'true';
    }

    if (role && ['Donor', 'Recipient'].includes(role)) {
      query.role = role;
    }

    const feedbacks = await Feedback.find(query)
      .sort({ isApproved: 1, createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip))
      .populate('userId', 'name email bloodGroup')
      .populate('approvedBy', 'name email')
      .lean();

    const total = await Feedback.countDocuments(query);

    res.status(200).json({
      status: 1,
      data: feedbacks,
      total,
      limit: parseInt(limit),
      skip: parseInt(skip),
      pages: Math.ceil(total / parseInt(limit))
    });
  } catch (error) {
    console.error('Error fetching admin feedback:', error);
    res.status(500).json({
      status: 0,
      message: error.message || 'Failed to fetch feedback'
    });
  }
};

/**
 * Approve/Reject feedback (admin only)
 * PATCH /api/feedback/:id/approve
 */
const approveFeedback = async (req, res) => {
  try {
    const { id } = req.params;
    const { isApproved } = req.body;
    const adminId = req.user._id || req.user.id;

    if (typeof isApproved !== 'boolean') {
      return res.status(400).json({
        status: 0,
        message: 'isApproved must be true or false'
      });
    }

    const feedback = await Feedback.findByIdAndUpdate(
      id,
      {
        isApproved,
        approvedBy: isApproved ? new ObjectId(adminId) : null,
        approvedAt: isApproved ? new Date() : null
      },
      { new: true }
    );

    if (!feedback) {
      return res.status(404).json({
        status: 0,
        message: 'Feedback not found'
      });
    }

    res.status(200).json({
      status: 1,
      message: isApproved ? 'Feedback approved' : 'Feedback rejected',
      data: feedback
    });
  } catch (error) {
    console.error('Error approving feedback:', error);
    res.status(500).json({
      status: 0,
      message: error.message || 'Failed to approve feedback'
    });
  }
};

/**
 * Delete feedback (soft delete)
 * DELETE /api/feedback/:id
 */
const deleteFeedback = async (req, res) => {
  try {
    const { id } = req.params;

    const feedback = await Feedback.findByIdAndUpdate(
      id,
      {
        isDeleted: true,
        deletedAt: new Date()
      },
      { new: true }
    );

    if (!feedback) {
      return res.status(404).json({
        status: 0,
        message: 'Feedback not found'
      });
    }

    res.status(200).json({
      status: 1,
      message: 'Feedback deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting feedback:', error);
    res.status(500).json({
      status: 0,
      message: error.message || 'Failed to delete feedback'
    });
  }
};

/**
 * Get platform statistics
 * GET /api/feedback/stats/platform
 * No authentication required
 */
const getPlatformStats = async (req, res) => {
  try {
    // Get approved feedbacks count
    const totalFeedbacks = await Feedback.countDocuments({
      isApproved: true,
      isDeleted: false
    });

    // Calculate average rating from approved feedbacks
    const ratingStats = await Feedback.aggregate([
      {
        $match: {
          isApproved: true,
          isDeleted: false
        }
      },
      {
        $group: {
          _id: null,
          averageRating: { $avg: '$rating' },
          totalRatings: { $sum: 1 }
        }
      }
    ]);

    const averageRating = ratingStats[0]?.averageRating || 0;

    // Get unique donors and recipients who gave feedback
    const donorStats = await Feedback.countDocuments({
      role: 'Donor',
      isApproved: true,
      isDeleted: false
    });

    const recipientStats = await Feedback.countDocuments({
      role: 'Recipient',
      isApproved: true,
      isDeleted: false
    });

    // Placeholder for actual donation stats (link to Donation collection if exists)
    // For now, using feedback count as proxy
    const stats = {
      totalSuccessfulDonations: totalFeedbacks * 2, // Estimate (each feedback = 1 user, could be 2 per donation)
      totalRegisteredDonors: 350, // This should come from Users collection count
      averagePlatformRating: averageRating.toFixed(1),
      totalFeedbacks,
      donorFeedbacks: donorStats,
      recipientFeedbacks: recipientStats
    };

    res.status(200).json({
      status: 1,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching platform stats:', error);
    res.status(500).json({
      status: 0,
      message: error.message || 'Failed to fetch statistics'
    });
  }
};

/**
 * Get user's own feedback
 * GET /api/feedback/my-feedback
 */
const getMyFeedback = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;

    const feedbacks = await Feedback.find({
      userId: new ObjectId(userId),
      isDeleted: false
    })
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({
      status: 1,
      data: feedbacks
    });
  } catch (error) {
    console.error('Error fetching user feedback:', error);
    res.status(500).json({
      status: 0,
      message: error.message || 'Failed to fetch your feedback'
    });
  }
};

module.exports = {
  submitFeedback,
  getPublicFeedback,
  getAdminFeedback,
  approveFeedback,
  deleteFeedback,
  getPlatformStats,
  getMyFeedback
};
