/**
 * ============================================
 * REACT API SERVICE - CLEAN API HANDLING
 * ============================================
 * Centralized API calls with:
 * - Request deduplication
 * - Proper error handling
 * - Token management
 * - Retry logic
 * - Timeout handling
 * 
 * Usage in components:
 *   import { apiService } from '../services/apiService';
 *   const response = await apiService.post('/api/requests', data);
 */

import axios from 'axios';

// Create axios instance with default config
const axiosInstance = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:4000',
  timeout: 30000, // 30 seconds
  headers: {
    'Content-Type': 'application/json'
  }
});

// Track pending requests to prevent duplicates
const pendingRequests = new Map();

/**
 * Generate request key for deduplication
 */
const getRequestKey = (method, url, data = null) => {
  return `${method}:${url}:${data ? JSON.stringify(data) : ''}`;
};

/**
 * Add Authorization token to headers
 */
const addAuthToken = (config) => {
  const token = localStorage.getItem('token') || localStorage.getItem('adminToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
};

/**
 * Request interceptor - Add token and prevent duplicates
 */
axiosInstance.interceptors.request.use(
  (config) => {
    // Add auth token
    config = addAuthToken(config);

    // Check for duplicate requests (GET, DELETE only)
    if (['get', 'delete'].includes(config.method?.toLowerCase())) {
      const requestKey = getRequestKey(config.method, config.url);
      
      if (pendingRequests.has(requestKey)) {
        console.warn(`⚠️ Duplicate request detected: ${config.method.toUpperCase()} ${config.url}`);
        return pendingRequests.get(requestKey);
      }

      // Store the request promise
      const request = axios.request(config);
      pendingRequests.set(requestKey, request);

      // Clean up after request completes
      request.finally(() => {
        pendingRequests.delete(requestKey);
      });

      return config;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Response interceptor - Global error handling
 */
axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle 401 - Unauthorized (token expired)
    if (error.response?.status === 401) {
      console.error('❌ Session expired - redirecting to login');
      localStorage.removeItem('token');
      localStorage.removeItem('adminToken');
      localStorage.removeItem('userId');
      window.location.href = '/login';
      return Promise.reject(error);
    }

    // Handle 403 - Forbidden
    if (error.response?.status === 403) {
      console.error('❌ Access denied');
    }

    // Handle network errors
    if (error.code === 'ECONNABORTED') {
      console.error('❌ Request timeout');
    }

    return Promise.reject(error);
  }
);

/**
 * API Service object with methods
 */
export const apiService = {
  /**
   * GET request
   */
  get: async (url, config = {}) => {
    try {
      const response = await axiosInstance.get(url, config);
      return {
        ok: true,
        status: response.status,
        data: response.data,
        message: response.data?.message || 'Success'
      };
    } catch (error) {
      return {
        ok: false,
        status: error.response?.status || 500,
        data: null,
        message: error.response?.data?.message || error.message,
        error
      };
    }
  },

  /**
   * POST request
   */
  post: async (url, data = {}, config = {}) => {
    try {
      const response = await axiosInstance.post(url, data, config);
      return {
        ok: true,
        status: response.status,
        data: response.data,
        message: response.data?.message || 'Success'
      };
    } catch (error) {
      return {
        ok: false,
        status: error.response?.status || 500,
        data: null,
        message: error.response?.data?.message || error.message,
        error
      };
    }
  },

  /**
   * PUT request
   */
  put: async (url, data = {}, config = {}) => {
    try {
      const response = await axiosInstance.put(url, data, config);
      return {
        ok: true,
        status: response.status,
        data: response.data,
        message: response.data?.message || 'Success'
      };
    } catch (error) {
      return {
        ok: false,
        status: error.response?.status || 500,
        data: null,
        message: error.response?.data?.message || error.message,
        error
      };
    }
  },

  /**
   * DELETE request
   */
  delete: async (url, config = {}) => {
    try {
      const response = await axiosInstance.delete(url, config);
      return {
        ok: true,
        status: response.status,
        data: response.data,
        message: response.data?.message || 'Success'
      };
    } catch (error) {
      return {
        ok: false,
        status: error.response?.status || 500,
        data: null,
        message: error.response?.data?.message || error.message,
        error
      };
    }
  },

  /**
   * Upload file with FormData
   */
  uploadFile: async (url, file, additionalData = {}) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      // Add additional fields
      for (const [key, value] of Object.entries(additionalData)) {
        formData.append(key, value);
      }

      const config = {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      };

      const response = await axiosInstance.post(url, formData, config);
      return {
        ok: true,
        status: response.status,
        data: response.data,
        message: response.data?.message || 'File uploaded successfully'
      };
    } catch (error) {
      return {
        ok: false,
        status: error.response?.status || 500,
        data: null,
        message: error.response?.data?.message || error.message,
        error
      };
    }
  },

  /**
   * Retry failed request
   */
  retryRequest: async (url, method = 'get', data = null, retries = 3) => {
    let lastError;

    for (let i = 0; i < retries; i++) {
      try {
        console.log(`🔄 Attempt ${i + 1}/${retries} - ${method.toUpperCase()} ${url}`);

        let response;
        switch (method.toLowerCase()) {
          case 'post':
            response = await apiService.post(url, data);
            break;
          case 'put':
            response = await apiService.put(url, data);
            break;
          case 'delete':
            response = await apiService.delete(url);
            break;
          default:
            response = await apiService.get(url);
        }

        if (response.ok) {
          return response;
        }

        lastError = response;

      } catch (error) {
        lastError = error;
      }

      // Wait before retrying (exponential backoff: 1s, 2s, 4s)
      if (i < retries - 1) {
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
      }
    }

    console.error(`❌ Failed after ${retries} attempts`);
    return lastError;
  }
};

export default apiService;
