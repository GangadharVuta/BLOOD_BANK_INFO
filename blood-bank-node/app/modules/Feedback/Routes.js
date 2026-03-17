/**
 * ============================================
 * FEEDBACK ROUTES
 * ============================================
 * API endpoints for feedback operations
 */

const express = require('express');
const feedbackController = require('./Controller');

const router = express.Router();

/**
 * PUBLIC ROUTES (No authentication required)
 */

/**
 * Get approved feedback for homepage carousel
 * GET /api/feedback/public
 * Query: limit (default 10), skip (default 0)
 */
router.get('/public', feedbackController.getPublicFeedback);

/**
 * Get platform statistics
 * GET /api/feedback/stats/platform
 */
router.get('/stats/platform', feedbackController.getPlatformStats);

/**
 * PROTECTED ROUTES (Authentication required)
 */

/**
 * Submit new feedback
 * POST /api/feedback
 * Body: { role, bloodGroup, rating, message, donationId (optional) }
 */
router.post('/', feedbackController.submitFeedback);

/**
 * Get user's own feedback
 * GET /api/feedback/my-feedback
 */
router.get('/my-feedback', feedbackController.getMyFeedback);

/**
 * ADMIN ROUTES (Admin authentication required)
 */

/**
 * Get all feedback (admin view)
 * GET /api/feedback/admin
 * Query: limit, skip, isApproved, role
 */
router.get('/admin/all', feedbackController.getAdminFeedback);

/**
 * Approve/Reject feedback
 * PATCH /api/feedback/:id/approve
 * Body: { isApproved: boolean }
 */
router.patch('/:id/approve', feedbackController.approveFeedback);

/**
 * Delete feedback (soft delete)
 * DELETE /api/feedback/:id
 */
router.delete('/:id', feedbackController.deleteFeedback);

module.exports = router;
