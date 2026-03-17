/**
 * ============================================
 * ADMIN CONTROLLER
 * ============================================
 * Handles all admin-related operations:
 * - Authentication (login)
 * - Dashboard statistics
 * - Donor management
 * - Request management
 * - Feedback moderation
 * - Chat monitoring
 */

const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const Admin = require('./Schema');
const { Users } = require('../User/Schema');
const { Donors } = require('../Donor/Schema');
const { Requests } = require('../Request/Schema');
const Feedback = require('../Feedback/Schema');
const { Messages, Conversations } = require('../Chat/Schema');
const asyncHandler = require('../../utils/asyncHandler');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

/**
 * ============================================
 * AUTHENTICATION
 * ============================================
 */

/**
 * Admin Login
 * POST /api/admin/login
 */
exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Email and password are required'
    });
  }

  // Find admin by email
  const admin = await Admin.findOne({ email, isDeleted: false }).select('+password');

  if (!admin || !admin.isActive) {
    return res.status(401).json({
      success: false,
      message: 'Invalid email or password'
    });
  }

  // Compare password
  const isPasswordCorrect = await admin.comparePassword(password);

  if (!isPasswordCorrect) {
    return res.status(401).json({
      success: false,
      message: 'Invalid email or password'
    });
  }

  // Update last login
  admin.lastLogin = new Date();
  admin.loginCount = (admin.loginCount || 0) + 1;
  admin.ipAddress = req.ip;
  await admin.save();

  // Generate JWT token
  const token = jwt.sign(
    {
      id: admin._id,
      email: admin.email,
      role: admin.role,
      permissions: admin.permissions
    },
    JWT_SECRET,
    { expiresIn: '24h' }
  );

  res.status(200).json({
    success: true,
    message: 'Login successful',
    data: {
      token,
      admin: admin.toJSON()
    }
  });
});

/**
 * ============================================
 * DASHBOARD & STATISTICS
 * ============================================
 */

/**
 * Get Dashboard Statistics
 * GET /api/admin/dashboard/stats
 */
exports.getDashboardStats = asyncHandler(async (req, res) => {
  // Total counts
  const totalDonors = await Donors.countDocuments({ isDeleted: false });
  const totalRequests = await Requests.countDocuments({ isDeleted: false });
  const totalUsers = await Users.countDocuments({ isDeleted: false });
  const totalFeedback = await Feedback.countDocuments({ isDeleted: false });

  // Pending feedback
  const pendingFeedback = await Feedback.countDocuments({
    isDeleted: false,
    isApproved: false
  });

  // Approved feedback
  const approvedFeedback = await Feedback.countDocuments({
    isDeleted: false,
    isApproved: true
  });

  // Active requests
  const activeRequests = await Requests.countDocuments({
    isDeleted: false,
    status: { $in: ['pending', 'active'] }
  });

  // Average rating
  const avgRatingData = await Feedback.aggregate([
    { $match: { isDeleted: false, isApproved: true } },
    { $group: { _id: null, avgRating: { $avg: '$rating' } } }
  ]);

  const avgRating = avgRatingData.length > 0 ? avgRatingData[0].avgRating.toFixed(2) : 0;

  // Blood group distribution
  const bloodGroupStats = await Donors.aggregate([
    { $match: { isDeleted: false } },
    { $group: { _id: '$bloodGroup', count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ]);

  // Recent feedback
  const recentFeedback = await Feedback.find({ isDeleted: false })
    .sort({ createdAt: -1 })
    .limit(5)
    .lean();

  // Recent requests
  const recentRequests = await Requests.find({ isDeleted: false })
    .sort({ createdAt: -1 })
    .limit(5)
    .lean();

  res.status(200).json({
    success: true,
    message: 'Dashboard statistics retrieved',
    data: {
      totalStats: {
        totalUsers,
        totalDonors,
        totalRequests,
        totalFeedback
      },
      feedbackStats: {
        total: totalFeedback,
        pending: pendingFeedback,
        approved: approvedFeedback,
        averageRating: parseFloat(avgRating)
      },
      requestStats: {
        total: totalRequests,
        active: activeRequests
      },
      bloodGroupDistribution: bloodGroupStats,
      recentFeedback: recentFeedback.map(f => ({
        id: f._id,
        role: f.role,
        bloodGroup: f.bloodGroup,
        rating: f.rating,
        message: f.message.substring(0, 100),
        isApproved: f.isApproved,
        createdAt: f.createdAt
      })),
      recentRequests: recentRequests.map(r => ({
        id: r._id,
        status: r.status,
        urgency: r.urgency,
        createdAt: r.createdAt
      }))
    }
  });
});

/**
 * ============================================
 * DONOR MANAGEMENT
 * ============================================
 */

/**
 * Get All Donors with Filters
 * GET /api/admin/donors
 */
exports.getDonors = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, bloodGroup, search, status } = req.query;

  const query = { isDeleted: false };

  if (bloodGroup) query.bloodGroup = bloodGroup;
  if (status) query.status = status;

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { phone: { $regex: search, $options: 'i' } }
    ];
  }

  const skip = (page - 1) * limit;

  const donors = await Donors.find(query)
    .skip(skip)
    .limit(parseInt(limit))
    .sort({ createdAt: -1 })
    .lean();

  const total = await Donors.countDocuments(query);

  res.status(200).json({
    success: true,
    message: 'Donors retrieved',
    data: {
      donors,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit),
        limit: parseInt(limit)
      }
    }
  });
});

/**
 * Get Donor Details
 * GET /api/admin/donors/:id
 */
exports.getDonorDetails = asyncHandler(async (req, res) => {
  const donor = await Donors.findById(req.params.id)
    .populate('userId', 'name email phone')
    .lean();

  if (!donor) {
    return res.status(404).json({
      success: false,
      message: 'Donor not found'
    });
  }

  res.status(200).json({
    success: true,
    data: donor
  });
});

/**
 * Update Donor Status
 * PUT /api/admin/donors/:id/status
 */
exports.updateDonorStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;

  const validStatuses = ['active', 'suspended', 'inactive'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({
      success: false,
      message: `Status must be one of: ${validStatuses.join(', ')}`
    });
  }

  const donor = await Donors.findByIdAndUpdate(
    req.params.id,
    { status },
    { new: true, runValidators: true }
  );

  if (!donor) {
    return res.status(404).json({
      success: false,
      message: 'Donor not found'
    });
  }

  res.status(200).json({
    success: true,
    message: 'Donor status updated',
    data: donor
  });
});

/**
 * Delete/Suspend Donor
 * DELETE /api/admin/donors/:id
 */
exports.deleteDonor = asyncHandler(async (req, res) => {
  const donor = await Donors.findByIdAndUpdate(
    req.params.id,
    {
      isDeleted: true,
      deletedAt: new Date(),
      deletedBy: req.user.id
    },
    { new: true }
  );

  if (!donor) {
    return res.status(404).json({
      success: false,
      message: 'Donor not found'
    });
  }

  res.status(200).json({
    success: true,
    message: 'Donor deleted',
    data: donor
  });
});

/**
 * ============================================
 * REQUEST MANAGEMENT
 * ============================================
 */

/**
 * Get All Blood Requests
 * GET /api/admin/requests
 */
exports.getRequests = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, status, search } = req.query;

  const query = { isDeleted: false };

  if (status) query.status = status;

  if (search) {
    query.$or = [
      { requesterName: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } }
    ];
  }

  const skip = (page - 1) * limit;

  const requests = await Requests.find(query)
    .skip(skip)
    .limit(parseInt(limit))
    .sort({ createdAt: -1 })
    .lean();

  const total = await Requests.countDocuments(query);

  res.status(200).json({
    success: true,
    message: 'Requests retrieved',
    data: {
      requests,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit),
        limit: parseInt(limit)
      }
    }
  });
});

/**
 * Get Request Details
 * GET /api/admin/requests/:id
 */
exports.getRequestDetails = asyncHandler(async (req, res) => {
  const request = await Requests.findById(req.params.id)
    .populate('userId', 'name email phone')
    .lean();

  if (!request) {
    return res.status(404).json({
      success: false,
      message: 'Request not found'
    });
  }

  res.status(200).json({
    success: true,
    data: request
  });
});

/**
 * Update Request Status
 * PUT /api/admin/requests/:id/status
 */
exports.updateRequestStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;

  const validStatuses = ['pending', 'active', 'fulfilled', 'cancelled'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({
      success: false,
      message: `Status must be one of: ${validStatuses.join(', ')}`
    });
  }

  const request = await Requests.findByIdAndUpdate(
    req.params.id,
    { status, updatedAt: new Date() },
    { new: true, runValidators: true }
  );

  if (!request) {
    return res.status(404).json({
      success: false,
      message: 'Request not found'
    });
  }

  res.status(200).json({
    success: true,
    message: 'Request status updated',
    data: request
  });
});

/**
 * Delete Request
 * DELETE /api/admin/requests/:id
 */
exports.deleteRequest = asyncHandler(async (req, res) => {
  const request = await Requests.findByIdAndUpdate(
    req.params.id,
    {
      isDeleted: true,
      deletedAt: new Date(),
      deletedBy: req.user.id
    },
    { new: true }
  );

  if (!request) {
    return res.status(404).json({
      success: false,
      message: 'Request not found'
    });
  }

  res.status(200).json({
    success: true,
    message: 'Request deleted',
    data: request
  });
});

/**
 * ============================================
 * FEEDBACK MODERATION
 * ============================================
 */

/**
 * Get Pending Feedback
 * GET /api/admin/feedback/pending
 */
exports.getPendingFeedback = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;

  const skip = (page - 1) * limit;

  const feedback = await Feedback.find({ isDeleted: false, isApproved: false })
    .skip(skip)
    .limit(parseInt(limit))
    .sort({ createdAt: -1 })
    .lean();

  const total = await Feedback.countDocuments({
    isDeleted: false,
    isApproved: false
  });

  res.status(200).json({
    success: true,
    message: 'Pending feedback retrieved',
    data: {
      feedback,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit),
        limit: parseInt(limit)
      }
    }
  });
});

/**
 * Approve Feedback
 * PUT /api/admin/feedback/:id/approve
 */
exports.approveFeedback = asyncHandler(async (req, res) => {
  const feedback = await Feedback.findByIdAndUpdate(
    req.params.id,
    {
      isApproved: true,
      approvedBy: req.user.id,
      approvedAt: new Date()
    },
    { new: true }
  );

  if (!feedback) {
    return res.status(404).json({
      success: false,
      message: 'Feedback not found'
    });
  }

  res.status(200).json({
    success: true,
    message: 'Feedback approved',
    data: feedback
  });
});

/**
 * Reject Feedback
 * DELETE /api/admin/feedback/:id/reject
 */
exports.rejectFeedback = asyncHandler(async (req, res) => {
  const feedback = await Feedback.findByIdAndUpdate(
    req.params.id,
    {
      isDeleted: true,
      deletedAt: new Date(),
      deletedBy: req.user.id
    },
    { new: true }
  );

  if (!feedback) {
    return res.status(404).json({
      success: false,
      message: 'Feedback not found'
    });
  }

  res.status(200).json({
    success: true,
    message: 'Feedback rejected',
    data: feedback
  });
});

/**
 * Get All Feedback (Approved and Pending)
 * GET /api/admin/feedback
 */
exports.getAllFeedback = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, status } = req.query;

  const query = { isDeleted: false };

  if (status === 'approved') query.isApproved = true;
  if (status === 'pending') query.isApproved = false;

  const skip = (page - 1) * limit;

  const feedback = await Feedback.find(query)
    .skip(skip)
    .limit(parseInt(limit))
    .sort({ createdAt: -1 })
    .lean();

  const total = await Feedback.countDocuments(query);

  res.status(200).json({
    success: true,
    message: 'Feedback retrieved',
    data: {
      feedback,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit),
        limit: parseInt(limit)
      }
    }
  });
});

/**
 * ============================================
 * ADMIN MANAGEMENT (Super Admin Only)
 * ============================================
 */

/**
 * Create New Admin
 * POST /api/admin/create-admin
 */
exports.createAdmin = asyncHandler(async (req, res) => {
  // Check if current user is super admin
  if (req.user.role !== 'super_admin') {
    return res.status(403).json({
      success: false,
      message: 'Only super admin can create new admins'
    });
  }

  const { name, email, password, role, permissions } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Name, email, and password are required'
    });
  }

  // Check if email already exists
  const existingAdmin = await Admin.findOne({ email });
  if (existingAdmin) {
    return res.status(400).json({
      success: false,
      message: 'Email already exists'
    });
  }

  const admin = new Admin({
    name,
    email,
    password,
    role: role || 'admin',
    permissions: permissions || {}
  });

  await admin.save();

  res.status(201).json({
    success: true,
    message: 'Admin created successfully',
    data: admin.toJSON()
  });
});

/**
 * Get All Admins
 * GET /api/admin/list
 */
exports.getAllAdmins = asyncHandler(async (req, res) => {
  const admins = await Admin.find({ isDeleted: false }).lean();

  res.status(200).json({
    success: true,
    message: 'Admins retrieved',
    data: admins
  });
});

/**
 * Update Admin
 * PUT /api/admin/:id
 */
exports.updateAdmin = asyncHandler(async (req, res) => {
  const { name, role, permissions, isActive, password } = req.body;

  const update = { name, role, permissions, isActive };

  if (password) {
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long'
      });
    }

    const salt = await bcrypt.genSalt(10);
    update.password = await bcrypt.hash(password, salt);
  }

  const admin = await Admin.findByIdAndUpdate(
    req.params.id,
    update,
    { new: true, runValidators: true }
  );

  if (!admin) {
    return res.status(404).json({
      success: false,
      message: 'Admin not found'
    });
  }

  res.status(200).json({
    success: true,
    message: 'Admin updated',
    data: admin.toJSON()
  });
});

/**
 * Delete Admin
 * DELETE /api/admin/:id
 */
exports.deleteAdmin = asyncHandler(async (req, res) => {
  const adminId = req.params.id;

  // Prevent deleting super admin
  const adminToDelete = await Admin.findById(adminId);
  if (!adminToDelete) {
    return res.status(404).json({
      success: false,
      message: 'Admin not found'
    });
  }

  if (adminToDelete.role === 'super_admin') {
    return res.status(403).json({
      success: false,
      message: 'Cannot delete super admin accounts'
    });
  }

  // Soft delete by setting isDeleted to true
  await Admin.findByIdAndUpdate(adminId, {
    isDeleted: true,
    deletedAt: new Date(),
    deletedBy: req.user._id
  });

  res.status(200).json({
    success: true,
    message: 'Admin deleted successfully'
  });
});

/**
 * ============================================
 * CHAT MONITORING (Admin Only)
 * ============================================
 */

/**
 * Get All Chat Conversations for Monitoring
 * GET /api/admin/chat/conversations
 */
exports.getAllChatConversations = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, search = '' } = req.query;

  const skip = (page - 1) * limit;

  // Get conversations with message counts and last message
  const conversations = await Conversations.aggregate([
    {
      $lookup: {
        from: 'messages',
        localField: '_id',
        foreignField: 'conversationId',
        as: 'messages'
      }
    },
    {
      $lookup: {
        from: 'requests',
        localField: 'requestId',
        foreignField: '_id',
        as: 'request'
      }
    },
    {
      $unwind: { path: '$request', preserveNullAndEmptyArrays: true }
    },
    {
      $addFields: {
        messageCount: { $size: '$messages' },
        lastMessage: { $arrayElemAt: ['$messages', -1] },
        unreadCount: {
          $size: {
            $filter: {
              input: '$messages',
              as: 'msg',
              cond: { $eq: ['$$msg.isRead', false] }
            }
          }
        }
      }
    },
    {
      $match: {
        ...(search && {
          $or: [
            { 'request.patientName': { $regex: search, $options: 'i' } },
            { 'request.bloodGroup': { $regex: search, $options: 'i' } },
            { 'request.location': { $regex: search, $options: 'i' } }
          ]
        })
      }
    },
    {
      $sort: { updatedAt: -1 }
    },
    {
      $skip: skip
    },
    {
      $limit: parseInt(limit)
    }
  ]);

  const total = await Conversations.countDocuments();

  res.status(200).json({
    success: true,
    message: 'Chat conversations retrieved',
    data: {
      conversations,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit),
        limit: parseInt(limit)
      }
    }
  });
});

/**
 * Get Chat History for Monitoring
 * GET /api/admin/chat/history/:requestId
 */
exports.getChatHistoryForMonitoring = asyncHandler(async (req, res) => {
  const { requestId } = req.params;
  const { page = 1, limit = 50 } = req.query;

  if (!requestId) {
    return res.status(400).json({
      success: false,
      message: 'Request ID is required'
    });
  }

  const skip = (page - 1) * limit;

  // Get messages with user details
  const messages = await Messages.find({ requestId })
    .populate('senderId', 'name email')
    .sort({ createdAt: 1 })
    .skip(skip)
    .limit(parseInt(limit))
    .lean();

  // Get request details
  const request = await Requests.findById(requestId)
    .populate('requesterId', 'name email phoneNumber')
    .lean();

  const total = await Messages.countDocuments({ requestId });

  res.status(200).json({
    success: true,
    message: 'Chat history retrieved for monitoring',
    data: {
      request,
      messages,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit),
        limit: parseInt(limit)
      }
    }
  });
});
