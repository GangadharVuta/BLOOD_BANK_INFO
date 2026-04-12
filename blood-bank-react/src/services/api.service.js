/**
 * ============================================
 * API SERVICE - CENTRALIZED API CALLS
 * ============================================
 * 
 * This service handles all HTTP requests to the backend.
 * Benefits:
 * - Centralized authentication handling
 * - JWT token management
 * - Automatic error handling
 * - Request/response interceptors
 * - Logging for debugging
 * 
 * Usage:
 * import ApiService from '@services/api.service';
 * 
 * // Login
 * const response = await ApiService.post('/api/users/login', { email, password });
 * 
 * // Get user profile
 * const user = await ApiService.get('/api/users/profile');
 * 
 * // Submit blood request
 * const request = await ApiService.post('/api/requests/requestDonors', formData);
 */

import axios from 'axios';
import swal from 'sweetalert';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000';
const REQUEST_TIMEOUT = 10000; // 10 seconds

class ApiService {
  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: REQUEST_TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor: Add JWT token to all requests
    this.client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('token');
        
        if (token) {
          // Add JWT token to Authorization header
          config.headers.Authorization = `Bearer ${token}`;
        }

        // Log request in development
        if (process.env.NODE_ENV === 'development') {
          console.debug(`📤 API Request: ${config.method.toUpperCase()} ${config.url}`);
        }

        return config;
      },
      (error) => {
        console.error('❌ Request interceptor error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor: Handle common errors
    this.client.interceptors.response.use(
      (response) => {
        // Log successful response in development
        if (process.env.NODE_ENV === 'development') {
          console.debug(`✅ API Response: ${response.config.method.toUpperCase()} ${response.config.url}`, response.data);
        }

        return response;
      },
      (error) => {
        // Handle authentication errors
        if (error.response?.status === 401) {
          console.warn('⚠️ Unauthorized - Session expired');
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          
          // Redirect to login
          setTimeout(() => {
            window.location.href = '/login';
          }, 1000);

          swal({
            title: 'Session Expired',
            text: 'Your session has expired. Please login again.',
            icon: 'warning',
            button: 'OK',
          });
        }

        // Handle 403 Forbidden
        if (error.response?.status === 403) {
          console.warn('⚠️ Forbidden - Access denied');
          swal({
            title: 'Access Denied',
            text: error.response?.data?.message || 'You do not have permission to access this resource.',
            icon: 'error',
            button: 'OK',
          });
        }

        // Handle 404 Not Found
        if (error.response?.status === 404) {
          console.warn('⚠️ Not Found');
        }

        // Handle 429 Too Many Requests (Rate limiting)
        if (error.response?.status === 429) {
          console.warn('⚠️ Rate limited - Too many requests');
          swal({
            title: 'Too Many Requests',
            text: 'Please wait before making another request.',
            icon: 'warning',
            button: 'OK',
          });
        }

        // Handle 5xx Server errors
        if (error.response?.status >= 500) {
          console.error('❌ Server error:', error.response?.data);
          swal({
            title: 'Server Error',
            text: 'An unexpected error occurred. Please try again later.',
            icon: 'error',
            button: 'OK',
          });
        }

        // Handle network errors
        if (error.message === 'Network Error') {
          console.error('❌ Network error - Cannot reach server');
          swal({
            title: 'Connection Error',
            text: 'Unable to connect to the server. Please check your internet connection.',
            icon: 'error',
            button: 'OK',
          });
        }

        return Promise.reject(error);
      }
    );
  }

  /**
   * GET request
   */
  async get(endpoint, config = {}) {
    try {
      const response = await this.client.get(endpoint, config);
      return response.data;
    } catch (error) {
      console.error(`❌ GET ${endpoint} failed:`, error.message);
      throw error;
    }
  }

  /**
   * POST request
   */
  async post(endpoint, data = {}, config = {}) {
    try {
      const response = await this.client.post(endpoint, data, config);
      return response.data;
    } catch (error) {
      console.error(`❌ POST ${endpoint} failed:`, error.message);
      throw error;
    }
  }

  /**
   * PUT request
   */
  async put(endpoint, data = {}, config = {}) {
    try {
      const response = await this.client.put(endpoint, data, config);
      return response.data;
    } catch (error) {
      console.error(`❌ PUT ${endpoint} failed:`, error.message);
      throw error;
    }
  }

  /**
   * PATCH request
   */
  async patch(endpoint, data = {}, config = {}) {
    try {
      const response = await this.client.patch(endpoint, data, config);
      return response.data;
    } catch (error) {
      console.error(`❌ PATCH ${endpoint} failed:`, error.message);
      throw error;
    }
  }

  /**
   * DELETE request
   */
  async delete(endpoint, config = {}) {
    try {
      const response = await this.client.delete(endpoint, config);
      return response.data;
    } catch (error) {
      console.error(`❌ DELETE ${endpoint} failed:`, error.message);
      throw error;
    }
  }

  /**
   * Set/Update Authorization token
   */
  setToken(token) {
    if (token) {
      this.client.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      localStorage.setItem('token', token);
    } else {
      delete this.client.defaults.headers.common['Authorization'];
      localStorage.removeItem('token');
    }
  }

  /**
   * Get current token
   */
  getToken() {
    return localStorage.getItem('token');
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated() {
    return !!localStorage.getItem('token');
  }

  /**
   * Logout: Remove token and redirect
   */
  logout() {
    this.setToken(null);
    localStorage.removeItem('user');
    window.location.href = '/login';
  }
}

// Export singleton instance
export default new ApiService();

// ============================================
// EXAMPLE USAGE IN REACT COMPONENTS
// ============================================

/*

// In a React component:
import ApiService from '@services/api.service';

// Login
const handleLogin = async (email, password) => {
  try {
    const response = await ApiService.post('/api/users/login', { email, password });
    if (response.status === 1) {
      ApiService.setToken(response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      navigate('/dashboard');
    }
  } catch (error) {
    console.error('Login failed:', error);
  }
};

// Get user profile
const fetchProfile = async () => {
  try {
    const user = await ApiService.get('/api/users/profile');
    setUser(user);
  } catch (error) {
    console.error('Failed to fetch profile:', error);
  }
};

// Submit blood request
const submitBloodRequest = async (formData) => {
  try {
    const response = await ApiService.post('/api/requests/requestDonors', formData);
    if (response.status === 1) {
      swal('Success!', 'Blood request sent successfully', 'success');
      navigate('/dashboard');
    } else {
      swal('Error', response.message, 'error');
    }
  } catch (error) {
    console.error('Failed to submit request:', error);
  }
};

// Save FCM token
const saveFcmToken = async (token) => {
  try {
    await ApiService.post('/api/users/save-fcm-token', { fcmToken: token });
    console.log('✅ FCM token saved');
  } catch (error) {
    console.debug('Could not save FCM token:', error.message);
  }
};

*/
