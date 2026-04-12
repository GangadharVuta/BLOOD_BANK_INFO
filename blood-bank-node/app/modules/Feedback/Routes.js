/**
 * ============================================
 * FEEDBACK ROUTES
 * ============================================
 * API endpoints for feedback operations
 */

const feedbackController = require('./Controller');
const Globals = require('../../../configs/Globals');
const validation = require('../../../middleware/validation');

module.exports = (app, express) => {
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
  router.post('/', Globals.isAuthorised, validation.validateFeedback, feedbackController.submitFeedback);

  /**
   * Get user's own feedback
   * GET /api/feedback/my-feedback
   */
  router.get('/my-feedback', Globals.isAuthorised, feedbackController.getMyFeedback);

  /**
   * ADMIN ROUTES (Admin authentication required)
   */

  /**
   * Get all feedback (admin view)
   * GET /api/feedback/admin
   * Query: limit, skip, isApproved, role
   */
  router.get('/admin/all', Globals.isAuthorised, feedbackController.getAdminFeedback);

  /**
   * Approve/Reject feedback
   * PATCH /api/feedback/:id/approve
   * Body: { isApproved: boolean }
   */
  router.patch('/:id/approve', Globals.isAuthorised, feedbackController.approveFeedback);

  /**
   * Delete feedback (soft delete)
   * DELETE /api/feedback/:id
   */
  router.delete('/:id', Globals.isAuthorised, feedbackController.deleteFeedback);

  app.use('/api/feedback', router);
};
