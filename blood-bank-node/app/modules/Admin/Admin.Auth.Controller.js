/**
 * ============================================
 * ADMIN AUTH CONTROLLER
 * ============================================
 * Handles admin authentication operations
 * Features:
 * - Secure login with password verification
 * - Admin registration (super admin only)
 * - Profile management
 * - Password change
 * - Account security
 */

const Admin = require('./Admin.Schema');
const Logger = require('../../utils/Logger');
const { generateAdminToken } = require('../../middleware/adminAuth');
const QueryValidator = require('../../utils/QueryValidator');

class AdminAuthController {
  /**
   * Admin Login
   * POST /api/admin-auth/login
   * Body: { email, password }
   */
  async login(req, res) {
    try {
      const { email, password } = req.body;

      // Validate input
      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Email and password are required'
        });
      }

      // Find admin by email
      const admin = await Admin.findOne({ email })
        .select('+password')
        .exec();

      if (!admin) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password'
        });
      }

      // Check if account is locked
      if (admin.isLocked()) {
        return res.status(423).json({
          success: false,
          message: 'Account is locked. Please try again later.'
        });
      }

      // Check if account is active
      if (!admin.isActive) {
        return res.status(403).json({
          success: false,
          message: 'Account is disabled'
        });
      }

      // Verify password
      const isPasswordValid = await admin.comparePassword(password);

      if (!isPasswordValid) {
        // Increment failed login attempts
        await admin.incrementLoginAttempts();

        return res.status(401).json({
          success: false,
          message: 'Invalid email or password'
        });
      }

      // Reset login attempts on successful login
      await admin.resetLoginAttempts();

      // Generate JWT token
      const token = generateAdminToken(admin);

      // Update last login
      admin.lastLogin = new Date();
      admin.lastActivity = new Date();
      await admin.save();

      Logger.info('✅ Admin logged in', { email: admin.email, adminId: admin._id });

      return res.json({
        success: true,
        message: 'Login successful',
        token,
        data: {
          _id: admin._id,
          name: admin.name,
          email: admin.email,
          role: admin.role,
          permissions: admin.permissions
        }
      });
    } catch (error) {
      Logger.error('Admin login failed', error);
      return res.status(500).json({
        success: false,
        message: 'Login failed'
      });
    }
  }

  /**
   * Register New Admin
   * POST /api/admin-auth/register
   * Body: { name, email, password, role, permissions }
   * Only Super Admins can create new admins
   */
  async register(req, res) {
    try {
      const { name, email, password, role = 'Admin', permissions } = req.body;

      // Validate input
      if (!name || !email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Name, email, and password are required'
        });
      }

      // Check if email already exists
      const existingAdmin = await Admin.findOne({ email });
      if (existingAdmin) {
        return res.status(409).json({
          success: false,
          message: 'Email already registered'
        });
      }

      // Create new admin
      const newAdmin = new Admin({
        name,
        email,
        password,
        role,
        permissions,
        createdBy: req.currentAdmin?._id
      });

      await newAdmin.save();

      Logger.info('✅ New admin created', { email, role, adminId: newAdmin._id });

      return res.status(201).json({
        success: true,
        message: 'Admin created successfully',
        data: {
          _id: newAdmin._id,
          name: newAdmin.name,
          email: newAdmin.email,
          role: newAdmin.role,
          permissions: newAdmin.permissions
        }
      });
    } catch (error) {
      Logger.error('Admin registration failed', error);
      return res.status(500).json({
        success: false,
        message: 'Registration failed'
      });
    }
  }

  /**
   * Get Admin Profile
   * GET /api/admin-auth/profile
   */
  async getProfile(req, res) {
    try {
      const adminId = req.currentAdmin?._id;

      const admin = await Admin.findById(adminId);

      if (!admin) {
        return res.status(404).json({
          success: false,
          message: 'Admin not found'
        });
      }

      return res.json({
        success: true,
        data: admin
      });
    } catch (error) {
      Logger.error('Failed to get admin profile', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch profile'
      });
    }
  }

  /**
   * Update Admin Profile
   * PATCH /api/admin-auth/profile
   * Body: { name, ... }
   */
  async updateProfile(req, res) {
    try {
      const adminId = req.currentAdmin?._id;
      const { name } = req.body;

      // Don't allow email or role changes through this route
      const updateData = {};
      if (name) updateData.name = name;

      const admin = await Admin.findByIdAndUpdate(adminId, updateData, {
        new: true,
        runValidators: true
      });

      if (!admin) {
        return res.status(404).json({
          success: false,
          message: 'Admin not found'
        });
      }

      Logger.info('✅ Admin profile updated', { adminId });

      return res.json({
        success: true,
        message: 'Profile updated successfully',
        data: admin
      });
    } catch (error) {
      Logger.error('Failed to update profile', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to update profile'
      });
    }
  }

  /**
   * Change Password
   * POST /api/admin-auth/change-password
   * Body: { currentPassword, newPassword }
   */
  async changePassword(req, res) {
    try {
      const adminId = req.currentAdmin?._id;
      const { currentPassword, newPassword } = req.body;

      // Validate input
      if (!currentPassword || !newPassword) {
        return res.status(400).json({
          success: false,
          message: 'Current and new password are required'
        });
      }

      // Find admin with password field
      const admin = await Admin.findById(adminId).select('+password');

      if (!admin) {
        return res.status(404).json({
          success: false,
          message: 'Admin not found'
        });
      }

      // Verify current password
      const isPasswordValid = await admin.comparePassword(currentPassword);

      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: 'Current password is incorrect'
        });
      }

      // Update password
      admin.password = newPassword;
      await admin.save();

      Logger.info('✅ Admin password changed', { adminId });

      return res.json({
        success: true,
        message: 'Password changed successfully'
      });
    } catch (error) {
      Logger.error('Failed to change password', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to change password'
      });
    }
  }

  /**
   * Get All Admins (Super Admin Only)
   * GET /api/admin-auth/admins
   */
  async getAllAdmins(req, res) {
    try {
      const { page = 1, limit = 20, search = '', status = 'all' } = req.query;

      const skip = (parseInt(page) - 1) * parseInt(limit);

      const query = { isDeleted: false };

      if (status === 'active') {
        query.isActive = true;
      } else if (status === 'inactive') {
        query.isActive = false;
      }

      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ];
      }

      const totalAdmins = await Admin.countDocuments(query);
      const admins = await Admin.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .select('-password');

      return res.json({
        success: true,
        data: admins,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: totalAdmins,
          pages: Math.ceil(totalAdmins / limit)
        }
      });
    } catch (error) {
      Logger.error('Failed to get admins', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch admins'
      });
    }
  }

  /**
   * Deactivate Admin (Super Admin Only)
   * PATCH /api/admin-auth/admins/:adminId/deactivate
   */
  async deactivateAdmin(req, res) {
    try {
      const { adminId } = req.params;
      const { deactivate = true } = req.body;

      if (!QueryValidator.isValidObjectId(adminId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid admin ID'
        });
      }

      const admin = await Admin.findByIdAndUpdate(
        adminId,
        { isActive: !deactivate },
        { new: true }
      );

      if (!admin) {
        return res.status(404).json({
          success: false,
          message: 'Admin not found'
        });
      }

      Logger.info(`✅ Admin ${deactivate ? 'deactivated' : 'activated'}`, { adminId });

      return res.json({
        success: true,
        message: `Admin ${deactivate ? 'deactivated' : 'activated'} successfully`,
        data: admin
      });
    } catch (error) {
      Logger.error('Failed to update admin status', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to update admin status'
      });
    }
  }
}

module.exports = new AdminAuthController();
