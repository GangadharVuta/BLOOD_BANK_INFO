/**
 * ============================================
 * ADMIN ROUTES
 * ============================================
 * All routes include JWT verification and role-based access control
 */

module.exports = (app, express) => {
  const router = express.Router();
  const AdminController = require('./Controller');
  const { verifyToken, verifyAdmin, verifySuperAdmin } = require('../../../middleware/adminAuth');

  /**
   * ============================================
   * AUTHENTICATION - NO AUTH REQUIRED
   * ============================================
   */

  /**
   * Admin Login
   * POST /api/admin/login
   * Body: { email, password }
   */
  router.post('/admin/login', AdminController.login);

  /**
   * ============================================
   * DASHBOARD - AUTH + ADMIN REQUIRED
   * ============================================
   */

  /**
   * Get Dashboard Statistics
   * GET /api/admin/dashboard/stats
   */
  router.get('/admin/dashboard/stats', verifyToken, verifyAdmin, AdminController.getDashboardStats);

  /**
   * ============================================
   * DONOR MANAGEMENT - AUTH + ADMIN REQUIRED
   * ============================================
   */

  /**
   * Get All Donors (with filters)
   * GET /api/admin/donors?page=1&limit=10&bloodGroup=O+&search=john&status=active
   */
  router.get('/admin/donors', verifyToken, verifyAdmin, AdminController.getDonors);

  /**
   * Get Donor Details
   * GET /api/admin/donors/:id
   */
  router.get('/admin/donors/:id', verifyToken, verifyAdmin, AdminController.getDonorDetails);

  /**
   * Update Donor Status (active, suspended, inactive)
   * PUT /api/admin/donors/:id/status
   * Body: { status }
   */
  router.put('/admin/donors/:id/status', verifyToken, verifyAdmin, AdminController.updateDonorStatus);

  /**
   * Delete Donor (soft delete)
   * DELETE /api/admin/donors/:id
   */
  router.delete('/admin/donors/:id', verifyToken, verifyAdmin, AdminController.deleteDonor);

  /**
   * ============================================
   * REQUEST MANAGEMENT - AUTH + ADMIN REQUIRED
   * ============================================
   */

  /**
   * Get All Blood Requests (with filters)
   * GET /api/admin/requests?page=1&limit=10&status=pending&search=john
   */
  router.get('/admin/requests', verifyToken, verifyAdmin, AdminController.getRequests);

  /**
   * Get Request Details
   * GET /api/admin/requests/:id
   */
  router.get('/admin/requests/:id', verifyToken, verifyAdmin, AdminController.getRequestDetails);

  /**
   * Update Request Status (pending, active, fulfilled, cancelled)
   * PUT /api/admin/requests/:id/status
   * Body: { status }
   */
  router.put('/admin/requests/:id/status', verifyToken, verifyAdmin, AdminController.updateRequestStatus);

  /**
   * Delete Request (soft delete)
   * DELETE /api/admin/requests/:id
   */
  router.delete('/admin/requests/:id', verifyToken, verifyAdmin, AdminController.deleteRequest);

  /**
   * ============================================
   * FEEDBACK MODERATION - AUTH + ADMIN REQUIRED
   * ============================================
   */

  /**
   * Get All Feedback (approved and pending)
   * GET /api/admin/feedback?page=1&limit=10&status=pending
   */
  router.get('/admin/feedback', verifyToken, verifyAdmin, AdminController.getAllFeedback);

  /**
   * Get Pending Feedback Only
   * GET /api/admin/feedback/pending?page=1&limit=10
   */
  router.get('/admin/feedback/pending', verifyToken, verifyAdmin, AdminController.getPendingFeedback);

  /**
   * Approve Feedback
   * PUT /api/admin/feedback/:id/approve
   */
  router.put('/admin/feedback/:id/approve', verifyToken, verifyAdmin, AdminController.approveFeedback);

  /**
   * Reject Feedback (soft delete)
   * DELETE /api/admin/feedback/:id/reject
   */
  router.delete('/admin/feedback/:id/reject', verifyToken, verifyAdmin, AdminController.rejectFeedback);

  /**
   * ============================================
   * ADMIN MANAGEMENT - AUTH + SUPER ADMIN REQUIRED
   * ============================================
   */

  /**
   * Create New Admin
   * POST /api/admin/create-admin
   * Body: { name, email, password, role, permissions }
   */
  router.post('/admin/create-admin', verifyToken, verifySuperAdmin, AdminController.createAdmin);

  /**
   * Get All Admins
   * GET /api/admin/list
   */
  router.get('/admin/list', verifyToken, verifySuperAdmin, AdminController.getAllAdmins);

  /**
   * Update Admin
   * PUT /api/admin/:id
   * Body: { name, role, permissions, isActive }
   */
  router.put('/admin/:id', verifyToken, verifySuperAdmin, AdminController.updateAdmin);

  /**
   * Delete Admin
   * DELETE /api/admin/:id
   */
  router.delete('/admin/:id', verifyToken, verifySuperAdmin, AdminController.deleteAdmin);

  /**
   * ============================================
   * CHAT MONITORING - AUTH + ADMIN REQUIRED
   * ============================================
   */

  /**
   * Get All Chat Conversations for Monitoring
   * GET /api/admin/chat/conversations?page=1&limit=20&search=john
   */
  router.get('/admin/chat/conversations', verifyToken, verifyAdmin, AdminController.getAllChatConversations);

  /**
   * Get Chat History for Monitoring
   * GET /api/admin/chat/history/:requestId?page=1&limit=50
   */
  router.get('/admin/chat/history/:requestId', verifyToken, verifyAdmin, AdminController.getChatHistoryForMonitoring);

  app.use('/api', router);
};
