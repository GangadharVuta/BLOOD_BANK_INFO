/**
 * ============================================
 * ADMIN AUTH ROUTES
 * ============================================
 * Routes for admin authentication operations
 * Includes public login and protected profile/admin management
 */

const express = require('express');
const router = express.Router();
const AdminAuthController = require('./Admin.Auth.Controller');
const { verifyAdminToken } = require('../../middleware/adminAuth');

/**
 * ============================================
 * PUBLIC ROUTES (No Authentication Required)
 * ============================================
 */

/**
 * POST Admin Login
 * /api/admin-auth/login
 * Body: { email, password }
 * Returns: { token, admin data }
 */
router.post('/login', AdminAuthController.login);

/**
 * ============================================
 * PROTECTED ROUTES (Admin Authentication Required)
 * ============================================
 */

/**
 * GET Admin Profile
 * /api/admin-auth/profile
 * Returns: Current admin's profile information
 */
router.get('/profile', verifyAdminToken, AdminAuthController.getProfile);

/**
 * PATCH Update Admin Profile
 * /api/admin-auth/profile
 * Body: { name, ... }
 * Returns: Updated profile
 */
router.patch('/profile', verifyAdminToken, AdminAuthController.updateProfile);

/**
 * POST Change Password
 * /api/admin-auth/change-password
 * Body: { currentPassword, newPassword }
 * Returns: Success message
 */
router.post('/change-password', verifyAdminToken, AdminAuthController.changePassword);

/**
 * ============================================
 * SUPER ADMIN ONLY ROUTES
 * ============================================
 */

/**
 * POST Create New Admin
 * /api/admin-auth/register
 * Body: { name, email, password, role, permissions }
 * SuperAdmin: Can create other admins
 * Returns: New admin data
 */
router.post('/register', verifyAdminToken, AdminAuthController.register);

/**
 * GET All Admins
 * /api/admin-auth/admins
 * Query: { page, limit, search, status }
 * SuperAdmin: List all admin users
 * Returns: Paginated admin list
 */
router.get('/admins', verifyAdminToken, AdminAuthController.getAllAdmins);

/**
 * PATCH Deactivate/Activate Admin
 * /api/admin-auth/admins/:adminId/deactivate
 * Body: { deactivate: boolean }
 * SuperAdmin: Enable/disable admin accounts
 * Returns: Updated admin data
 */
router.patch('/admins/:adminId/deactivate', verifyAdminToken, AdminAuthController.deactivateAdmin);

module.exports = router;
