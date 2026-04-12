/**
 * ============================================
 * VALIDATORS UTILITY
 * ============================================
 * Centralized validation functions for security
 * Prevents MongoDB injection and validation attacks
 */

const mongoose = require('mongoose');

/**
 * Validate if string is valid MongoDB ObjectId
 */
exports.isValidObjectId = (id) => {
  return mongoose.Types.ObjectId.isValid(id);
};

/**
 * Middleware to validate ObjectId in route params or body
 */
exports.validateObjectId = (req, res, next) => {
  const id = req.params.id || req.body.id || req.query.id;

  if (!id) {
    return res.status(400).json({
      status: 0,
      message: 'ID is required'
    });
  }

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      status: 0,
      message: 'Invalid ID format'
    });
  }

  next();
};

/**
 * Validate password strength
 * Requirements: min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char
 */
exports.validatePasswordStrength = (password) => {
  const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  return regex.test(password);
};

/**
 * Validate email format
 */
exports.validateEmail = (email) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};

/**
 * Validate phone number (10 digits)
 */
exports.validatePhone = (phone) => {
  const regex = /^[0-9]{10}$/;
  return regex.test(phone.replace(/[^\d]/g, ''));
};

/**
 * Validate blood group
 */
exports.validateBloodGroup = (bloodGroup) => {
  return /^(O|A|B|AB)[+-]$/.test(bloodGroup);
};

/**
 * Sanitize string input - remove potential XSS
 */
exports.sanitizeString = (str) => {
  if (typeof str !== 'string') return str;
  
  // Remove HTML tags and trim
  return str
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .trim()
    .substring(0, 500); // Limit length
};

/**
 * Validate admin role
 */
exports.isValidAdminRole = (role) => {
  return ['super_admin', 'admin', 'moderator'].includes(role);
};

/**
 * Validate user role
 */
exports.isValidUserRole = (role) => {
  return ['Donor', 'Recipient'].includes(role);
};

/**
 * Middleware to validate request body has required fields
 */
exports.validateRequiredFields = (requiredFields) => {
  return (req, res, next) => {
    const missingFields = requiredFields.filter(field => !req.body[field]);

    if (missingFields.length > 0) {
      return res.status(400).json({
        status: 0,
        message: `Missing required fields: ${missingFields.join(', ')}`
      });
    }

    next();
  };
};

/**
 * Middleware to validate password strength in request body
 * Checks 'password' field by default, or 'newPassword' for password change endpoints
 */
exports.validatePasswordStrengthMiddleware = (passwordField = 'password') => {
  return (req, res, next) => {
    const password = req.body[passwordField];

    if (!password) {
      return res.status(400).json({
        status: 0,
        message: `${passwordField} is required`
      });
    }

    if (!exports.validatePasswordStrength(password)) {
      return res.status(400).json({
        status: 0,
        message: 'Password must be at least 8 characters and contain uppercase, lowercase, number, and special character (@$!%*?&)'
      });
    }

    next();
  };
};

/**
 * Validate FCM token
 * Firebase Cloud Messaging tokens are base64url encoded, typically 100-200 characters
 */
exports.validateFcmToken = (token) => {
  if (!token || typeof token !== 'string') {
    return false;
  }
  
  // FCM tokens are typically 100-500 characters and contain alphanumeric, hyphen, underscore
  return token.length >= 100 && token.length <= 500 && /^[A-Za-z0-9_-]+$/.test(token);
};

/**
 * Validate pincode (Indian: 6 digits)
 */
exports.validatePincode = (pincode) => {
  return /^\d{6}$/.test(pincode?.toString());
};

/**
 * Validate age (18-100)
 */
exports.validateAge = (age) => {
  const ageNum = parseInt(age, 10);
  return !isNaN(ageNum) && ageNum >= 18 && ageNum <= 100;
};

/**
 * Validate blood request form data
 */
exports.validateBloodRequestForm = (data) => {
  const errors = [];

  if (!data.address || typeof data.address !== 'string' || data.address.trim().length < 5) {
    errors.push('Address must be at least 5 characters');
  }

  if (!exports.validatePincode(data.pincode)) {
    errors.push('Invalid pincode (must be 6 digits)');
  }

  if (!Array.isArray(data.userIds) || data.userIds.length === 0) {
    errors.push('At least one donor must be selected');
  }

  if (!exports.validateBloodGroup(data.bloodGroup)) {
    errors.push('Invalid blood group');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validate feedback form data
 */
exports.validateFeedbackForm = (data) => {
  const errors = [];

  if (!data.title || typeof data.title !== 'string' || data.title.trim().length < 5) {
    errors.push('Title must be at least 5 characters');
  }

  if (!data.description || typeof data.description !== 'string' || data.description.trim().length < 10) {
    errors.push('Description must be at least 10 characters');
  }

  if (data.rating) {
    const rating = parseInt(data.rating, 10);
    if (isNaN(rating) || rating < 1 || rating > 5) {
      errors.push('Rating must be between 1 and 5');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

module.exports = exports;
