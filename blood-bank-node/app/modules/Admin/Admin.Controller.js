/**
 * ============================================
 * ADMIN CONTROLLER
 * ============================================
 * Handles all admin panel operations
 * Features:
 * - Dashboard statistics
 * - Donor management
 * - Request management
 * - Feedback moderation
 */

const Logger = require('../../utils/Logger');
const QueryValidator = require('../../utils/QueryValidator');
const { ObjectId } = require('mongodb');

class AdminController {
  /**
   * Get Dashboard Statistics
   * GET /api/admin/dashboard/stats
   */
  async getDashboardStats(req, res) {
    try {
      // Get counts from various collections
      const Users = require('../User/Schema');
      const { Requests } = require('../Request/Schema');
      const DonationFeedback = require('../Feedback/DonationFeedback.Schema');
      const Chat = require('../Chat/Schema');

      // Count statistics
      const totalUsers = await Users.countDocuments({ isDeleted: false });
      const totalDonors = await Users.countDocuments({ role: 'Donor', isDeleted: false });
      const totalRecipients = await Users.countDocuments({ role: 'Recipient', isDeleted: false });
      const suspendedUsers = await Users.countDocuments({ isSuspended: true });

      const totalRequests = await Requests.countDocuments({ isDeleted: false });
      const completedRequests = await Requests.countDocuments({
        status: 'completed',
        isDeleted: false
      });
      const pendingRequests = await Requests.countDocuments({
        status: 'pending',
        isDeleted: false
      });
      const activeRequests = await Requests.countDocuments({
        status: 'active',
        isDeleted: false
      });

      const totalFeedback = await DonationFeedback.countDocuments({ isDeleted: false });
      const approvedFeedback = await DonationFeedback.countDocuments({
        isApproved: true,
        isDeleted: false
      });
      const pendingFeedback = await DonationFeedback.countDocuments({
        isApproved: false,
        isDeleted: false
      });

      // Calculate average rating
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

      const averageRating =
        ratingStats.length > 0 ? parseFloat(ratingStats[0].averageRating.toFixed(1)) : 0;

      // Get recent activity
      const recentUsers = await Users.find({ isDeleted: false })
        .sort({ createdAt: -1 })
        .limit(5)
        .select('name email role createdAt');

      const recentRequests = await Requests.find({ isDeleted: false })
        .sort({ createdAt: -1 })
        .limit(5)
        .select('bloodGroup status createdAt');

      const recentFeedback = await DonationFeedback.find({ isDeleted: false })
        .sort({ createdAt: -1 })
        .limit(5)
        .select('feedbackType bloodGroup donorOverallRating createdAt isApproved');

      return res.json({
        success: true,
        data: {
          summary: {
            totalUsers,
            totalDonors,
            totalRecipients,
            suspendedUsers,
            totalRequests,
            completedRequests,
            pendingRequests,
            activeRequests,
            totalFeedback,
            approvedFeedback,
            pendingFeedback,
            averageRating
          },
          recentActivity: {
            recentUsers,
            recentRequests,
            recentFeedback
          }
        }
      });
    } catch (error) {
      Logger.error('Failed to get dashboard stats', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch dashboard statistics'
      });
    }
  }

  /**
   * Get All Donors (with filtering and pagination)
   * GET /api/admin/donors
   */
  async getAllDonors(req, res) {
    try {
      const Users = require('../User/Schema');
      const { page = 1, limit = 20, search = '', status = 'all' } = req.query;

      const skip = (parseInt(page) - 1) * parseInt(limit);

      // Build query
      const query = {
        role: 'Donor',
        isDeleted: false
      };

      if (status === 'suspended') {
        query.isSuspended = true;
      } else if (status === 'active') {
        query.isSuspended = false;
      }

      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { bloodGroup: { $regex: search, $options: 'i' } }
        ];
      }

      const totalDonors = await Users.countDocuments(query);
      const donors = await Users.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .select('name email bloodGroup phone city createdAt isSuspended');

      return res.json({
        success: true,
        data: donors,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: totalDonors,
          pages: Math.ceil(totalDonors / limit)
        }
      });
    } catch (error) {
      Logger.error('Failed to get donors', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch donors'
      });
    }
  }

  /**
   * Get Single Donor Details
   * GET /api/admin/donors/:donorId
   */
  async getDonorDetails(req, res) {
    try {
      const Users = require('../User/Schema');
      const DonationFeedback = require('../Feedback/DonationFeedback.Schema');

      const { donorId } = req.params;

      if (!QueryValidator.isValidObjectId(donorId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid donor ID'
        });
      }

      const donor = await Users.findById(donorId).select('-password');
      if (!donor || donor.role !== 'Donor') {
        return res.status(404).json({
          success: false,
          message: 'Donor not found'
        });
      }

      // Get donor feedback
      const feedback = await DonationFeedback.find({
        donorId: QueryValidator.toObjectId(donorId),
        feedbackType: 'donor',
        isDeleted: false
      }).sort({ createdAt: -1 });

      // Get donor stats
      const ratingStats = await DonationFeedback.aggregate([
        {
          $match: {
            donorId: QueryValidator.toObjectId(donorId),
            feedbackType: 'donor',
            isDeleted: false
          }
        },
        {
          $group: {
            _id: null,
            averageRating: { $avg: '$donorOverallRating' },
            totalFeedback: { $sum: 1 }
          }
        }
      ]);

      return res.json({
        success: true,
        data: {
          donor,
          feedback,
          stats: ratingStats.length > 0 ? ratingStats[0] : { averageRating: 0, totalFeedback: 0 }
        }
      });
    } catch (error) {
      Logger.error('Failed to get donor details', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch donor details'
      });
    }
  }

  /**
   * Suspend/Unsuspend Donor
   * PATCH /api/admin/donors/:donorId/suspend
   */
  async suspendDonor(req, res) {
    try {
      const Users = require('../User/Schema');
      const { donorId } = req.params;
      const { suspend = true } = req.body;

      if (!QueryValidator.isValidObjectId(donorId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid donor ID'
        });
      }

      const donor = await Users.findByIdAndUpdate(
        donorId,
        { isSuspended: suspend },
        { new: true }
      );

      if (!donor) {
        return res.status(404).json({
          success: false,
          message: 'Donor not found'
        });
      }

      Logger.info(`✅ Donor ${suspend ? 'suspended' : 'unsuspended'}`, { donorId });

      return res.json({
        success: true,
        message: `Donor ${suspend ? 'suspended' : 'unsuspended'} successfully`,
        data: donor
      });
    } catch (error) {
      Logger.error('Failed to suspend donor', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to update donor status'
      });
    }
  }

  /**
   * Delete Donor (Soft Delete)
   * DELETE /api/admin/donors/:donorId
   */
  async deleteDonor(req, res) {
    try {
      const Users = require('../User/Schema');
      const { donorId } = req.params;

      if (!QueryValidator.isValidObjectId(donorId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid donor ID'
        });
      }

      const donor = await Users.findByIdAndUpdate(
        donorId,
        {
          isDeleted: true,
          deletedAt: new Date(),
          deletedBy: req.currentUser?._id
        },
        { new: true }
      );

      if (!donor) {
        return res.status(404).json({
          success: false,
          message: 'Donor not found'
        });
      }

      Logger.info('✅ Donor deleted', { donorId });

      return res.json({
        success: true,
        message: 'Donor deleted successfully',
        data: donor
      });
    } catch (error) {
      Logger.error('Failed to delete donor', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to delete donor'
      });
    }
  }

  /**
   * Get All Requests (with filtering and pagination)
   * GET /api/admin/requests
   */
  async getAllRequests(req, res) {
    try {
      const { Requests } = require('../Request/Schema');
      const { page = 1, limit = 20, status = 'all', search = '' } = req.query;

      const skip = (parseInt(page) - 1) * parseInt(limit);

      const query = { isDeleted: false };

      if (status !== 'all') {
        query.status = status;
      }

      if (search) {
        query.$or = [
          { bloodGroup: { $regex: search, $options: 'i' } },
          { 'recipientInfo.name': { $regex: search, $options: 'i' } }
        ];
      }

      const totalRequests = await Requests.countDocuments(query);
      const requests = await Requests.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate('donorId', 'name email')
        .populate('recipientId', 'name email')
        .select('bloodGroup status urgency createdAt donorId recipientId unitsNeeded');

      return res.json({
        success: true,
        data: requests,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: totalRequests,
          pages: Math.ceil(totalRequests / limit)
        }
      });
    } catch (error) {
      Logger.error('Failed to get requests', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch requests'
      });
    }
  }

  /**
   * Get Request Details
   * GET /api/admin/requests/:requestId
   */
  async getRequestDetails(req, res) {
    try {
      const { Requests } = require('../Request/Schema');
      const { requestId } = req.params;

      if (!QueryValidator.isValidObjectId(requestId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid request ID'
        });
      }

      const request = await Requests.findById(requestId)
        .populate('donorId', 'name email phone')
        .populate('recipientId', 'name email phone');

      if (!request) {
        return res.status(404).json({
          success: false,
          message: 'Request not found'
        });
      }

      return res.json({
        success: true,
        data: request
      });
    } catch (error) {
      Logger.error('Failed to get request details', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch request details'
      });
    }
  }

  /**
   * Delete Request (Soft Delete)
   * DELETE /api/admin/requests/:requestId
   */
  async deleteRequest(req, res) {
    try {
      const { Requests } = require('../Request/Schema');
      const { requestId } = req.params;

      if (!QueryValidator.isValidObjectId(requestId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid request ID'
        });
      }

      const request = await Requests.findByIdAndUpdate(
        requestId,
        {
          isDeleted: true,
          deletedAt: new Date(),
          deletedBy: req.currentUser?._id
        },
        { new: true }
      );

      if (!request) {
        return res.status(404).json({
          success: false,
          message: 'Request not found'
        });
      }

      Logger.info('✅ Request deleted', { requestId });

      return res.json({
        success: true,
        message: 'Request deleted successfully',
        data: request
      });
    } catch (error) {
      Logger.error('Failed to delete request', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to delete request'
      });
    }
  }

  /**
   * Get All Feedback (with filtering and pagination)
   * GET /api/admin/feedback
   */
  async getAllFeedback(req, res) {
    try {
      const DonationFeedback = require('../Feedback/DonationFeedback.Schema');
      const { page = 1, limit = 20, status = 'all', role = 'all' } = req.query;

      const skip = (parseInt(page) - 1) * parseInt(limit);

      const query = { isDeleted: false };

      if (status === 'approved') {
        query.isApproved = true;
      } else if (status === 'pending') {
        query.isApproved = false;
      }

      if (role !== 'all') {
        query.feedbackType = role;
      }

      const totalFeedback = await DonationFeedback.countDocuments(query);
      const feedback = await DonationFeedback.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .select(
          'feedbackType bloodGroup donorOverallRating recipientOverallRating ' +
          'donorComments recipientComments isApproved createdAt wouldRecommend'
        );

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
      Logger.error('Failed to get feedback', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch feedback'
      });
    }
  }

  /**
   * Approve Feedback
   * PATCH /api/admin/feedback/:feedbackId/approve
   */
  async approveFeedback(req, res) {
    try {
      const DonationFeedback = require('../Feedback/DonationFeedback.Schema');
      const { feedbackId } = req.params;
      const { approve = true } = req.body;

      if (!QueryValidator.isValidObjectId(feedbackId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid feedback ID'
        });
      }

      const feedback = await DonationFeedback.findByIdAndUpdate(
        feedbackId,
        {
          isApproved: approve,
          approvedBy: approve ? req.currentUser?._id : null,
          approvedAt: approve ? new Date() : null
        },
        { new: true }
      );

      if (!feedback) {
        return res.status(404).json({
          success: false,
          message: 'Feedback not found'
        });
      }

      Logger.info(`✅ Feedback ${approve ? 'approved' : 'rejected'}`, { feedbackId });

      return res.json({
        success: true,
        message: `Feedback ${approve ? 'approved' : 'rejected'} successfully`,
        data: feedback
      });
    } catch (error) {
      Logger.error('Failed to approve feedback', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to update feedback'
      });
    }
  }

  /**
   * Delete Feedback (Soft Delete)
   * DELETE /api/admin/feedback/:feedbackId
   */
  async deleteFeedback(req, res) {
    try {
      const DonationFeedback = require('../Feedback/DonationFeedback.Schema');
      const { feedbackId } = req.params;

      if (!QueryValidator.isValidObjectId(feedbackId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid feedback ID'
        });
      }

      const feedback = await DonationFeedback.findByIdAndUpdate(
        feedbackId,
        {
          isDeleted: true,
          deletedAt: new Date(),
          deletedBy: req.currentUser?._id
        },
        { new: true }
      );

      if (!feedback) {
        return res.status(404).json({
          success: false,
          message: 'Feedback not found'
        });
      }

      Logger.info('✅ Feedback deleted', { feedbackId });

      return res.json({
        success: true,
        message: 'Feedback deleted successfully',
        data: feedback
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
   * Get Analytics Data
   * GET /api/admin/analytics
   */
  async getAnalytics(req, res) {
    try {
      const Users = require('../User/Schema');
      const { Requests } = require('../Request/Schema');
      const DonationFeedback = require('../Feedback/DonationFeedback.Schema');

      // Get donations per month (last 6 months)
      const monthlyDonations = await Requests.aggregate([
        {
          $match: {
            status: 'completed',
            isDeleted: false,
            createdAt: {
              $gte: new Date(new Date().setMonth(new Date().getMonth() - 6))
            }
          }
        },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' }
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } }
      ]);

      // Get blood group distribution
      const bloodGroupDistribution = await Requests.aggregate([
        {
          $match: { isDeleted: false }
        },
        {
          $group: {
            _id: '$bloodGroup',
            count: { $sum: 1 }
          }
        }
      ]);

      // Get feedback ratings distribution
      const ratingDistribution = await DonationFeedback.aggregate([
        {
          $match: {
            feedbackType: 'donor',
            isDeleted: false,
            donorOverallRating: { $exists: true }
          }
        },
        {
          $group: {
            _id: '$donorOverallRating',
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ]);

      // Get user growth (last 6 months)
      const userGrowth = await Users.aggregate([
        {
          $match: {
            isDeleted: false,
            createdAt: {
              $gte: new Date(new Date().setMonth(new Date().getMonth() - 6))
            }
          }
        },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' }
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } }
      ]);

      return res.json({
        success: true,
        data: {
          monthlyDonations,
          bloodGroupDistribution,
          ratingDistribution,
          userGrowth
        }
      });
    } catch (error) {
      Logger.error('Failed to get analytics', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch analytics'
      });
    }
  }
}

module.exports = new AdminController();
