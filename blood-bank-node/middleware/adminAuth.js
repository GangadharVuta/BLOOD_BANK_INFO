/**
 * ============================================
 * ADMIN AUTHENTICATION MIDDLEWARE
 * ============================================
 * Handles JWT verification and role-based access control
 */

const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

/**
 * Verify JWT Token
 * Extracts and validates JWT from Authorization header
 */
exports.verifyToken = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided'
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token'
    });
  }
};

/**
 * Verify Admin Role
 * Checks if user is admin or above
 */
exports.verifyAdmin = (req, res, next) => {
  const validRoles = ['super_admin', 'admin', 'moderator'];

  if (!validRoles.includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin role required'
    });
  }

  next();
};

/**
 * Verify Super Admin Role
 * Checks if user is super admin only
 */
exports.verifySuperAdmin = (req, res, next) => {
  if (req.user.role !== 'super_admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Super admin role required'
    });
  }

  next();
};

/**
 * Check Specific Permission
 * Factory function to create permission checkers
 */
exports.checkPermission = (permission) => {
  return (req, res, next) => {
    const hasPermission = req.user.permissions?.[permission];

    if (!hasPermission && req.user.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: `Access denied. ${permission} permission required`
      });
    }

    next();
  };
};
