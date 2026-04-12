/**
 * ============================================
 * ADMIN AUTHENTICATION MIDDLEWARE
 * ============================================
 * Handles JWT verification and role-based access control
 * Includes admin-specific authentication for dashboard
 */

const jwt = require('jsonwebtoken');

// Validate required secrets
const JWT_SECRET = process.env.JWT_SECRET;
const ADMIN_JWT_SECRET = process.env.ADMIN_JWT_SECRET;
const ADMIN_JWT_EXPIRY = process.env.ADMIN_JWT_EXPIRY || '24h';

if (!JWT_SECRET || !ADMIN_JWT_SECRET) {
  throw new Error('Missing required JWT secrets in environment variables: JWT_SECRET and ADMIN_JWT_SECRET');
}

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

/**
 * ============================================
 * ADMIN DASHBOARD SPECIFIC MIDDLEWARE
 * ============================================
 */

/**
 * Verify Admin JWT Token
 * Checks authorization header and validates admin token
 * Used exclusively for admin dashboard routes
 */
exports.verifyAdminToken = (req, res, next) => {
  try {
    // Extract token from header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'No authorization token provided'
      });
    }

    const token = authHeader.substring(7);

    // Verify token with admin secret
    const decoded = jwt.verify(token, ADMIN_JWT_SECRET);

    // Check if admin role
    if (decoded.role !== 'Admin') {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions'
      });
    }

    // Add admin info to request
    req.currentAdmin = decoded;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token has expired'
      });
    }

    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token'
    });
  }
};

/**
 * Generate Admin JWT Token
 * Creates JWT token for admin login
 * Token includes admin ID, email, and role
 */
exports.generateAdminToken = (adminData) => {
  return jwt.sign(
    {
      _id: adminData._id,
      email: adminData.email,
      role: 'Admin'
    },
    ADMIN_JWT_SECRET,
    { expiresIn: ADMIN_JWT_EXPIRY }
  );
};
