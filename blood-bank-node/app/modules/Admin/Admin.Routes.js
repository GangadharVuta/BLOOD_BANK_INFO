/**
 * ============================================
 * ADMIN ROUTES
 * ============================================
 * Protected routes for admin operations
 * All routes require admin authentication
 */

const express = require('express');
const router = express.Router();
const AdminController = require('./Admin.Controller');
const { verifyAdminToken } = require('../../middleware/adminAuth');

/**
 * Dashboard Statistics
 */
router.get('/dashboard/stats', verifyAdminToken, AdminController.getDashboardStats);

/**
 * Analytics & Reporting
 */
router.get('/analytics', verifyAdminToken, AdminController.getAnalytics);

/**
 * ============================================
 * DONOR MANAGEMENT ENDPOINTS
 * ============================================
 */

/**
 * GET all donors with filtering and pagination
 * Query params: page, limit, search, status
 */
router.get('/donors', verifyAdminToken, AdminController.getAllDonors);

/**
 * GET donor details including feedback
 * Params: donorId
 */
router.get('/donors/:donorId', verifyAdminToken, AdminController.getDonorDetails);

/**
 * PATCH suspend/unsuspend donor
 * Params: donorId
 * Body: { suspend: boolean }
 */
router.patch('/donors/:donorId/suspend', verifyAdminToken, AdminController.suspendDonor);

/**
 * DELETE donor (soft delete)
 * Params: donorId
 */
router.delete('/donors/:donorId', verifyAdminToken, AdminController.deleteDonor);

/**
 * ============================================
 * REQUEST MANAGEMENT ENDPOINTS
 * ============================================
 */

/**
 * GET all blood requests with filtering and pagination
 * Query params: page, limit, status, search
 */
router.get('/requests', verifyAdminToken, AdminController.getAllRequests);

/**
 * GET request details
 * Params: requestId
 */
router.get('/requests/:requestId', verifyAdminToken, AdminController.getRequestDetails);

/**
 * DELETE request (soft delete)
 * Params: requestId
 */
router.delete('/requests/:requestId', verifyAdminToken, AdminController.deleteRequest);

/**
 * ============================================
 * FEEDBACK MODERATION ENDPOINTS
 * ============================================
 */

/**
 * GET all feedback with filtering and pagination
 * Query params: page, limit, status (approved/pending/all), role
 */
router.get('/feedback', verifyAdminToken, AdminController.getAllFeedback);

/**
 * PATCH approve/reject feedback
 * Params: feedbackId
 * Body: { approve: boolean }
 */
router.patch('/feedback/:feedbackId/approve', verifyAdminToken, AdminController.approveFeedback);

/**
 * DELETE feedback (soft delete)
 * Params: feedbackId
 */
router.delete('/feedback/:feedbackId', verifyAdminToken, AdminController.deleteFeedback);

module.exports = router;
