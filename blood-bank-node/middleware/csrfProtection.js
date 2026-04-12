/**
 * ============================================
 * CSRF PROTECTION MIDDLEWARE
 * ============================================
 * Prevents Cross-Site Request Forgery attacks
 * using double-submit cookie pattern
 */

const csrf = require('csurf');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const logger = require('../utils/logger');

// CSRF protection middleware with cookie-based tokens
// Tokens are stored in cookies and validated against form/header tokens
const csrfProtection = csrf({
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production', // HTTPS only in production
    sameSite: 'strict',
    maxAge: 3600000 // 1 hour
  }
});

// Error handler for CSRF token errors
const csrfErrorHandler = (err, req, res, next) => {
  if (err.code !== 'EBADCSRFTOKEN') {
    return next(err);
  }

  logger.warn('CSRF token validation failed:', {
    ip: req.ip,
    path: req.path,
    method: req.method
  });

  // Return 403 if token is invalid
  res.status(403).json({
    status: 0,
    message: 'CSRF token invalid or expired'
  });
};

/**
 * Get CSRF token for client
 * Used by frontend to include in form submissions
 */
const getCsrfToken = (req, res) => {
  try {
    const token = req.csrfToken();
    res.json({
      status: 1,
      token: token,
      message: 'CSRF token generated successfully'
    });
  } catch (error) {
    logger.error('Error generating CSRF token:', { error: error.message });
    res.status(500).json({
      status: 0,
      message: 'Failed to generate CSRF token'
    });
  }
};

module.exports = {
  csrfProtection,
  csrfErrorHandler,
  getCsrfToken
};
