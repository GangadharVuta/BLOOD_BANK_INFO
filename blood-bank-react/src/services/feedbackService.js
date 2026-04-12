/**
 * ============================================
 * FEEDBACK SERVICE (REACT)
 * ============================================
 * API wrapper for donation feedback
 */

import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000';

class FeedbackService {
  constructor() {
    this.api = axios.create({
      baseURL: `${API_BASE_URL}/api/donation-feedback`
    });

    // Inject token in every request
    this.api.interceptors.request.use((config) => {
      const token = localStorage.getItem('authToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Handle response errors
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('authToken');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  /**
   * Submit feedback from donor
   * @param {Object} feedbackData - { requestId, recipientId, recipientBehavior, recipientResponsiveness, processSmoothness, donorOverallRating, donorComments, wouldRecommend, bloodGroup }
   */
  async submitDonorFeedback(feedbackData) {
    try {
      const response = await this.api.post('/donor', feedbackData);
      return {
        success: true,
        data: response.data,
        status: response.status
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to submit feedback',
        isDuplicate: error.response?.data?.isDuplicate || false,
        status: error.response?.status
      };
    }
  }

  /**
   * Submit feedback from recipient
   * @param {Object} feedbackData - { requestId, donorId, donorHelpfulness, donorResponseTime, recipientOverallRating, recipientComments, wouldRecommend, bloodGroup }
   */
  async submitRecipientFeedback(feedbackData) {
    try {
      const response = await this.api.post('/recipient', feedbackData);
      return {
        success: true,
        data: response.data,
        status: response.status
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to submit feedback',
        isDuplicate: error.response?.data?.isDuplicate || false,
        status: error.response?.status
      };
    }
  }

  /**
   * Check if user has already submitted feedback for a request
   * @param {string} requestId
   * @param {string} feedbackType - 'donor' or 'recipient'
   */
  async checkFeedbackExists(requestId, feedbackType) {
    try {
      const response = await this.api.get(`/check/${requestId}/${feedbackType}`);
      return {
        success: true,
        exists: response.data.exists,
        feedbackId: response.data.feedbackId
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to check feedback',
        exists: false
      };
    }
  }

  /**
   * Get feedback for a specific request
   * @param {string} requestId
   */
  async getFeedbackForRequest(requestId) {
    try {
      const response = await this.api.get(`/request/${requestId}`);
      return {
        success: true,
        data: response.data.data,
        count: response.data.count
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch feedback',
        data: []
      };
    }
  }

  /**
   * Get current user's feedback
   * @param {string} type - 'donor', 'recipient', or undefined for all
   * @param {number} page - page number (default 1)
   * @param {number} limit - items per page (default 20)
   */
  async getUserFeedback(type = null, page = 1, limit = 20) {
    try {
      const params = { page, limit };
      if (type) {
        params.type = type;
      }

      const response = await this.api.get('/my-feedback', { params });
      return {
        success: true,
        data: response.data.data,
        pagination: response.data.pagination
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch feedback',
        data: [],
        pagination: {}
      };
    }
  }

  /**
   * Get donor's average rating and stats
   * @param {string} donorId
   */
  async getDonorRating(donorId) {
    try {
      const response = await this.api.get(`/donor/${donorId}/rating`);
      return {
        success: true,
        data: response.data.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch rating',
        data: null
      };
    }
  }

  /**
   * Delete feedback (soft delete)
   * @param {string} feedbackId
   */
  async deleteFeedback(feedbackId) {
    try {
      const response = await this.api.delete(`/${feedbackId}`);
      return {
        success: true,
        message: response.data.message
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to delete feedback'
      };
    }
  }
}

export default new FeedbackService();
