/**
 * ============================================
 * DONATION FEEDBACK ROUTES
 * ============================================
 * API endpoints for submission, retrieval, and management
 */

const express = require('express');
const { route } = require('../../configs/express');
const DonationFeedbackController = require('./DonationFeedback.Controller');
const { verifyToken } = require('../../middleware/adminAuth');

const router = express.Router();

/**
 * ============= PUBLIC ROUTES (No authentication required) =============
 */

// Get approved public feedback for homepage
router.get(
  '/public/approved',
  async (req, res) => {
    await DonationFeedbackController.getPublicApprovedFeedback(req, res);
  }
);

// Get platform statistics
router.get(
  '/stats/platform',
  async (req, res) => {
    await DonationFeedbackController.getPlatformStats(req, res);
  }
);

/**
 * ============= AUTHENTICATED ROUTES =============
 */

// Submit donor feedback
router.post(
  '/donor',
  verifyToken,
  async (req, res) => {
    await DonationFeedbackController.submitDonorFeedback(req, res);
  }
);

// Submit recipient feedback
router.post(
  '/recipient',
  verifyToken,
  async (req, res) => {
    await DonationFeedbackController.submitRecipientFeedback(req, res);
  }
);

// Get feedback for a request
router.get(
  '/request/:requestId',
  async (req, res) => {
    await DonationFeedbackController.getFeedbackForRequest(req, res);
  }
);

// Check if feedback exists for current user
router.get(
  '/check/:requestId/:feedbackType',
  verifyToken,
  async (req, res) => {
    await DonationFeedbackController.checkFeedbackExists(req, res);
  }
);

// Get current user's feedback
router.get(
  '/my-feedback',
  verifyToken,
  async (req, res) => {
    await DonationFeedbackController.getUserFeedback(req, res);
  }
);

// Get donor's average rating
router.get(
  '/donor/:donorId/rating',
  async (req, res) => {
    await DonationFeedbackController.getDonorRating(req, res);
  }
);

// Delete feedback (only owner)
router.delete(
  '/:feedbackId',
  verifyToken,
  async (req, res) => {
    await DonationFeedbackController.deleteFeedback(req, res);
  }
);

module.exports = router;
