/**
 * ============================================
 * DONATION FEEDBACK CONTROLLER
 * ============================================
 * Handles donor and recipient feedback after donation
 * Features:
 * - Separate submission for donors and recipients
 * - Duplicate prevention
 * - Detailed ratings and comments
 * - Admin approval workflow
 */

const DonationFeedback = require('./DonationFeedback.Schema');
const { Requests } = require('../Request/Schema');
const Logger = require('../../utils/Logger');
const QueryValidator = require('../../utils/QueryValidator');
const { ObjectId } = require('mongodb');

class DonationFeedbackController {
  /**
   * Submit feedback from donor
   * POST /api/donation-feedback/donor
   * Body: { requestId, donorId, recipientId, bloodGroup, recipientBehavior, recipientResponsiveness, processSmoothness, donorOverallRating, donorComments, wouldRecommend }
   */
  async submitDonorFeedback(req, res) {
    try {
      const {
        requestId,
        recipientId,
        recipientBehavior,
        recipientResponsiveness,
        processSmoothness,
        donorOverallRating,
        donorComments,
        wouldRecommend,
        bloodGroup
      } = req.body;

      const donorId = req.currentUser?._id || req.user?.id;

      // ============= VALIDATION =============
      if (!QueryValidator.isValidObjectId(requestId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid request ID'
        });
      }

      if (!QueryValidator.isValidObjectId(recipientId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid recipient ID'
        });
      }

      // Validate ratings
      const ratings = [recipientBehavior, recipientResponsiveness, processSmoothness, donorOverallRating];
      for (let rating of ratings) {
        if (!rating || rating < 1 || rating > 5) {
          return res.status(400).json({
            success: false,
            message: 'All ratings must be between 1 and 5'
          });
        }
      }

      // Validate comments if provided
      if (donorComments && donorComments.trim().length > 1000) {
        return res.status(400).json({
          success: false,
          message: 'Comments must not exceed 1000 characters'
        });
      }

      // Validate blood group
      if (!bloodGroup || !/^(O|A|B|AB)[+-]$/.test(bloodGroup)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid blood group format'
        });
      }

      // ============= CHECK FOR DUPLICATES =============
      const existingFeedback = await DonationFeedback.findExisting(
        requestId,
        donorId,
        recipientId,
        'donor'
      );

      if (existingFeedback) {
        return res.status(409).json({
          success: false,
          message: 'You have already submitted feedback for this donation',
          isDuplicate: true
        });
      }

      // ============= VERIFY REQUEST EXISTS =============
      const request = await Requests.findById(requestId);
      if (!request) {
        return res.status(404).json({
          success: false,
          message: 'Request not found'
        });
      }

      // ============= CREATE FEEDBACK =============
      const feedback = await DonationFeedback.create({
        requestId: QueryValidator.toObjectId(requestId),
        donorId: QueryValidator.toObjectId(donorId),
        recipientId: QueryValidator.toObjectId(recipientId),
        feedbackType: 'donor',
        bloodGroup,
        recipientBehavior: parseInt(recipientBehavior),
        recipientResponsiveness: parseInt(recipientResponsiveness),
        processSmoothness: parseInt(processSmoothness),
        donorOverallRating: parseInt(donorOverallRating),
        donorComments: donorComments?.trim() || '',
        wouldRecommend: !!wouldRecommend
      });

      Logger.info('✅ Donor feedback submitted', {
        feedbackId: feedback._id,
        requestId,
        donorId,
        rating: donorOverallRating
      });

      return res.status(201).json({
        success: true,
        message: 'Feedback submitted successfully',
        data: {
          feedbackId: feedback._id,
          submittedAt: feedback.createdAt
        }
      });

    } catch (error) {
      Logger.error('Failed to submit donor feedback', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to submit feedback'
      });
    }
  }

  /**
   * Submit feedback from recipient
   * POST /api/donation-feedback/recipient
   * Body: { requestId, donorId, bloodGroup, donorHelpfulness, donorResponseTime, recipientOverallRating, recipientComments, wouldRecommend }
   */
  async submitRecipientFeedback(req, res) {
    try {
      const {
        requestId,
        donorId,
        donorHelpfulness,
        donorResponseTime,
        recipientOverallRating,
        recipientComments,
        wouldRecommend,
        bloodGroup
      } = req.body;

      const recipientId = req.currentUser?._id || req.user?.id;

      // ============= VALIDATION =============
      if (!QueryValidator.isValidObjectId(requestId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid request ID'
        });
      }

      if (!QueryValidator.isValidObjectId(donorId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid donor ID'
        });
      }

      // Validate ratings
      const ratings = [donorHelpfulness, donorResponseTime, recipientOverallRating];
      for (let rating of ratings) {
        if (!rating || rating < 1 || rating > 5) {
          return res.status(400).json({
            success: false,
            message: 'All ratings must be between 1 and 5'
          });
        }
      }

      // Validate comments if provided
      if (recipientComments && recipientComments.trim().length > 1000) {
        return res.status(400).json({
          success: false,
          message: 'Comments must not exceed 1000 characters'
        });
      }

      // Validate blood group
      if (!bloodGroup || !/^(O|A|B|AB)[+-]$/.test(bloodGroup)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid blood group format'
        });
      }

      // ============= CHECK FOR DUPLICATES =============
      const existingFeedback = await DonationFeedback.findExisting(
        requestId,
        donorId,
        recipientId,
        'recipient'
      );

      if (existingFeedback) {
        return res.status(409).json({
          success: false,
          message: 'You have already submitted feedback for this donation',
          isDuplicate: true
        });
      }

      // ============= VERIFY REQUEST EXISTS =============
      const request = await Requests.findById(requestId);
      if (!request) {
        return res.status(404).json({
          success: false,
          message: 'Request not found'
        });
      }

      // ============= CREATE FEEDBACK =============
      const feedback = await DonationFeedback.create({
        requestId: QueryValidator.toObjectId(requestId),
        donorId: QueryValidator.toObjectId(donorId),
        recipientId: QueryValidator.toObjectId(recipientId),
        feedbackType: 'recipient',
        bloodGroup,
        donorHelpfulness: parseInt(donorHelpfulness),
        donorResponseTime: parseInt(donorResponseTime),
        recipientOverallRating: parseInt(recipientOverallRating),
        recipientComments: recipientComments?.trim() || '',
        wouldRecommend: !!wouldRecommend
      });

      Logger.info('✅ Recipient feedback submitted', {
        feedbackId: feedback._id,
        requestId,
        recipientId,
        rating: recipientOverallRating
      });

      return res.status(201).json({
        success: true,
        message: 'Feedback submitted successfully',
        data: {
          feedbackId: feedback._id,
          submittedAt: feedback.createdAt
        }
      });

    } catch (error) {
      Logger.error('Failed to submit recipient feedback', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to submit feedback'
      });
    }
  }

  /**
   * Get feedback for a request
   * GET /api/donation-feedback/request/:requestId
   */
  async getFeedbackForRequest(req, res) {
    try {
      const { requestId } = req.params;

      if (!QueryValidator.isValidObjectId(requestId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid request ID'
        });
      }

      const feedback = await DonationFeedback.find({
        requestId: QueryValidator.toObjectId(requestId),
        isDeleted: false
      }).populate('donorId', 'name avatar bloodGroup')
        .populate('recipientId', 'name avatar bloodGroup')
        .sort({ createdAt: -1 });

      return res.json({
        success: true,
        data: feedback,
        count: feedback.length
      });

    } catch (error) {
      Logger.error('Failed to fetch feedback', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch feedback'
      });
    }
  }

  /**
   * Check if user has submitted feedback for a request
   * GET /api/donation-feedback/check/:requestId/:feedbackType
   */
  async checkFeedbackExists(req, res) {
    try {
      const { requestId, feedbackType } = req.params;
      const userId = req.currentUser?._id || req.user?.id;

      if (!QueryValidator.isValidObjectId(requestId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid request ID'
        });
      }

      const query = {
        requestId: QueryValidator.toObjectId(requestId),
        feedbackType,
        isDeleted: false
      };

      if (feedbackType === 'donor') {
        query.donorId = QueryValidator.toObjectId(userId);
      } else if (feedbackType === 'recipient') {
        query.recipientId = QueryValidator.toObjectId(userId);
      }

      const existingFeedback = await DonationFeedback.findOne(query);

      return res.json({
        success: true,
        exists: !!existingFeedback,
        feedbackId: existingFeedback?._id || null
      });

    } catch (error) {
      Logger.error('Failed to check feedback', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to check feedback'
      });
    }
  }

  /**
   * Get user's feedback (submitted by current user)
   * GET /api/donation-feedback/my-feedback
   */
  async getUserFeedback(req, res) {
    try {
      const userId = req.currentUser?._id || req.user?.id;
      const { type, page = 1, limit = 20 } = req.query;

      const query = {
        $or: [
          { donorId: QueryValidator.toObjectId(userId) },
          { recipientId: QueryValidator.toObjectId(userId) }
        ],
        isDeleted: false
      };

      if (type && ['donor', 'recipient'].includes(type)) {
        query.feedbackType = type;
      }

      const skip = (parseInt(page) - 1) * parseInt(limit);

      const totalFeedback = await DonationFeedback.countDocuments(query);
      const feedback = await DonationFeedback.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate('requestId', 'bloodGroup')
        .populate('donorId', 'name avatar')
        .populate('recipientId', 'name avatar');

      return res.json({
        success: true,
        data: feedback,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: totalFeedback,
          pages: Math.ceil(totalFeedback / limit)
        }
      });

    } catch (error) {
      Logger.error('Failed to fetch user feedback', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch feedback'
      });
    }
  }

  /**
   * Get donor's average rating
   * GET /api/donation-feedback/donor/:donorId/rating
   */
  async getDonorRating(req, res) {
    try {
      const { donorId } = req.params;

      if (!QueryValidator.isValidObjectId(donorId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid donor ID'
        });
      }

      const ratingInfo = await DonationFeedback.getDonorAverageRating(
        QueryValidator.toObjectId(donorId)
      );

      return res.json({
        success: true,
        data: ratingInfo
      });

    } catch (error) {
      Logger.error('Failed to get donor rating', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to get donor rating'
      });
    }
  }

  /**
   * Delete feedback (soft delete)
   * DELETE /api/donation-feedback/:feedbackId
   */
  async deleteFeedback(req, res) {
    try {
      const { feedbackId } = req.params;
      const userId = req.currentUser?._id || req.user?.id;

      if (!QueryValidator.isValidObjectId(feedbackId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid feedback ID'
        });
      }

      const feedback = await DonationFeedback.findById(feedbackId);
      if (!feedback) {
        return res.status(404).json({
          success: false,
          message: 'Feedback not found'
        });
      }

      // Verify ownership
      if (feedback.feedbackType === 'donor' && String(feedback.donorId) !== String(userId)) {
        return res.status(403).json({
          success: false,
          message: 'Unauthorized'
        });
      }

      if (feedback.feedbackType === 'recipient' && String(feedback.recipientId) !== String(userId)) {
        return res.status(403).json({
          success: false,
          message: 'Unauthorized'
        });
      }

      // Soft delete
      feedback.isDeleted = true;
      feedback.deletedAt = new Date();
      await feedback.save();

      Logger.info('✅ Feedback deleted', { feedbackId, userId });

      return res.json({
        success: true,
        message: 'Feedback deleted successfully'
      });

    } catch (error) {
      Logger.error('Failed to delete feedback', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to delete feedback'
      });
    }
  }

  /**
   * Get public approved feedback for homepage
   * GET /api/donation-feedback/public/approved
   * Public endpoint - no auth required
   */
  async getPublicApprovedFeedback(req, res) {
    try {
      const { limit = 10, skip = 0 } = req.query;

      // Fetch only approved, non-deleted feedback
      const feedback = await DonationFeedback.find({
        isApproved: true,
        isDeleted: false
      })
        .sort({ createdAt: -1 })
        .skip(parseInt(skip))
        .limit(parseInt(limit))
        .select(
          'feedbackType bloodGroup recipientBehavior recipientResponsiveness ' +
          'processSmoothness donorOverallRating donorHelpfulness donorResponseTime ' +
          'recipientOverallRating wouldRecommend createdAt'
        );

      return res.json({
        success: true,
        data: feedback,
        count: feedback.length
      });

    } catch (error) {
      Logger.error('Failed to fetch public feedback', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch feedback'
      });
    }
  }

  /**
   * Get platform statistics for homepage
   * GET /api/donation-feedback/stats/platform
   * Public endpoint - no auth required
   */
  async getPlatformStats(req, res) {
    try {
      // Count approved feedback
      const totalFeedback = await DonationFeedback.countDocuments({
        isApproved: true,
        isDeleted: false
      });

      // Calculate average rating (from donor overall ratings)
      const ratingStats = await DonationFeedback.aggregate([
        {
          $match: {
            isApproved: true,
            isDeleted: false,
            feedbackType: 'donor',
            donorOverallRating: { $exists: true }
          }
        },
        {
          $group: {
            _id: null,
            averageRating: { $avg: '$donorOverallRating' },
            totalRatings: { $sum: 1 }
          }
        }
      ]);

      // Count unique donors who received feedback
      const uniqueDonors = await DonationFeedback.aggregate([
        {
          $match: {
            isApproved: true,
            isDeleted: false,
            feedbackType: 'donor'
          }
        },
        {
          $group: {
            _id: '$donorId'
          }
        },
        {
          $count: 'totalDonors'
        }
      ]);

      // Count total successful donations (requests completed)
      let totalDonations = 0;
      try {
        const { Requests } = require('../Request/Schema');
        const donationResult = await Requests.countDocuments({
          status: 'completed'
        });
        totalDonations = donationResult;
      } catch (err) {
        Logger.warn('Could not fetch donation count', err);
        totalDonations = 0;
      }

      // Count unique registered donors
      let totalDonors = 0;
      try {
        const Users = require('../User/Schema');
        const donorResult = await Users.countDocuments({
          role: 'Donor',
          isDeleted: false
        });
        totalDonors = donorResult;
      } catch (err) {
        Logger.warn('Could not fetch donor count', err);
        totalDonors = 0;
      }

      const stats = {
        totalSuccessfulDonations: totalDonations,
        totalRegisteredDonors: totalDonors,
        averagePlatformRating:
          ratingStats.length > 0
            ? parseFloat(ratingStats[0].averageRating.toFixed(1))
            : 4.5,
        totalFeedbacks: totalFeedback,
        totalRatedDonors: uniqueDonors.length > 0 ? uniqueDonors[0].totalDonors : 0
      };

      return res.json({
        success: true,
        data: stats
      });

    } catch (error) {
      Logger.error('Failed to fetch platform stats', error);
      // Return default stats if error
      return res.json({
        success: true,
        data: {
          totalSuccessfulDonations: 0,
          totalRegisteredDonors: 0,
          averagePlatformRating: 4.5,
          totalFeedbacks: 0,
          totalRatedDonors: 0
        }
      });
    }
  }
}

module.exports = new DonationFeedbackController();
