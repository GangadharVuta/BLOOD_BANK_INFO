/**
 * Input Validation Middleware
 * Validates and sanitizes incoming requests to prevent injection attacks
 */

const sanitizeHtml = require('sanitize-html');

// Sanitize string input
const sanitizeString = (str) => {
  if (typeof str !== 'string') return str;
  return str.trim().substring(0, 500); // Limit to 500 chars
};

// Validate email format
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Validate password strength
const validatePassword = (password) => {
  // Minimum 8 chars, at least 1 uppercase, 1 lowercase, 1 number, 1 special char
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  return passwordRegex.test(password);
};

// Validate phone number
const validatePhone = (phone) => {
  const phoneRegex = /^[0-9]{10}$/;
  return phoneRegex.test(phone.replace(/[^\d]/g, ''));
};

// Validate blood group
const validateBloodGroup = (bg) => {
  return /^(O|A|B|AB)[+-]$/.test(bg);
};

/**
 * Validate Registration Input
 */
exports.validateRegister = (req, res, next) => {
  try {
    const { userName, emailId, phoneNumber, password, bloodGroup, role } = req.body;

    // Check required fields
    if (!userName || !emailId || !phoneNumber || !password) {
      return res.status(400).json({
        status: 0,
        message: 'Missing required fields: userName, emailId, phoneNumber, password'
      });
    }

    // Validate email
    if (!validateEmail(emailId)) {
      return res.status(400).json({
        status: 0,
        message: 'Invalid email address'
      });
    }

    // Validate password strength
    if (!validatePassword(password)) {
      return res.status(400).json({
        status: 0,
        message: 'Password must be at least 8 characters with uppercase, lowercase, number, and special character'
      });
    }

    // Validate phone
    if (!validatePhone(phoneNumber)) {
      return res.status(400).json({
        status: 0,
        message: 'Invalid phone number. Must be 10 digits.'
      });
    }

    // Validate blood group if provided
    if (bloodGroup && !validateBloodGroup(bloodGroup)) {
      return res.status(400).json({
        status: 0,
        message: 'Invalid blood group'
      });
    }

    // Sanitize inputs
    req.body.userName = sanitizeString(userName);
    req.body.emailId = emailId.toLowerCase().trim();
    req.body.role = ['Donor', 'Recipient'].includes(role) ? role : 'Donor';

    next();
  } catch (error) {
    return res.status(500).json({
      status: 0,
      message: 'Validation error: ' + error.message
    });
  }
};

/**
 * Validate Login Input
 */
exports.validateLogin = (req, res, next) => {
  try {
    const { emailId, password } = req.body;

    if (!emailId || !password) {
      return res.status(400).json({
        status: 0,
        message: 'Email and password are required'
      });
    }

    if (!validateEmail(emailId)) {
      return res.status(400).json({
        status: 0,
        message: 'Invalid email address'
      });
    }

    // Sanitize
    req.body.emailId = emailId.toLowerCase().trim();

    next();
  } catch (error) {
    return res.status(500).json({
      status: 0,
      message: 'Validation error: ' + error.message
    });
  }
};

/**
 * Validate Profile Update
 */
exports.validateProfileUpdate = (req, res, next) => {
  try {
    const { userName, phoneNumber, bloodGroup, pincode } = req.body;

    // Validate each field only if provided
    if (userName && userName.length > 100) {
      return res.status(400).json({
        status: 0,
        message: 'Username too long (max 100 characters)'
      });
    }

    if (phoneNumber && !validatePhone(phoneNumber)) {
      return res.status(400).json({
        status: 0,
        message: 'Invalid phone number'
      });
    }

    if (bloodGroup && !validateBloodGroup(bloodGroup)) {
      return res.status(400).json({
        status: 0,
        message: 'Invalid blood group'
      });
    }

    if (pincode && !/^\d{5,6}$/.test(pincode)) {
      return res.status(400).json({
        status: 0,
        message: 'Invalid pincode (5-6 digits)'
      });
    }

    // Sanitize inputs
    if (req.body.userName) req.body.userName = sanitizeString(userName);
    if (req.body.pincode) req.body.pincode = sanitizeString(pincode);

    next();
  } catch (error) {
    return res.status(500).json({
      status: 0,
      message: 'Validation error: ' + error.message
    });
  }
};

/**
 * Validate Feedback Input
 */
exports.validateFeedback = (req, res, next) => {
  try {
    const { role, bloodGroup, rating, message } = req.body;

    if (!role || !['Donor', 'Recipient'].includes(role)) {
      return res.status(400).json({
        status: 0,
        message: 'Invalid role. Must be Donor or Recipient'
      });
    }

    if (!bloodGroup || !validateBloodGroup(bloodGroup)) {
      return res.status(400).json({
        status: 0,
        message: 'Invalid blood group'
      });
    }

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        status: 0,
        message: 'Rating must be between 1 and 5'
      });
    }

    if (!message || message.trim().length < 10 || message.trim().length > 500) {
      return res.status(400).json({
        status: 0,
        message: 'Message must be between 10 and 500 characters'
      });
    }

    // Sanitize message
    req.body.message = sanitizeString(message);

    next();
  } catch (error) {
    return res.status(500).json({
      status: 0,
      message: 'Validation error: ' + error.message
    });
  }
};

module.exports = exports;
