/**
 * ============================================
 * ADMIN SYSTEM INTEGRATION GUIDE
 * ============================================
 * Code to insert into your blood-bank-node/server.js
 */

// ============= PART 1: IMPORTS =============
// Add these lines at the top of your server.js with other route imports:

const AdminAuthRoutes = require('./app/modules/Admin/Admin.Auth.Routes');
const AdminRoutes = require('./app/modules/Admin/Admin.Routes');

// ============= PART 2: ROUTE REGISTRATION =============
// Add these lines in the middleware/routes section of your server.js
// Place after other route registrations (typically around line 50-100)

// Admin Authentication Routes (PUBLIC login + Protected profile operations)
app.use('/api/admin-auth', AdminAuthRoutes);

// Admin Dashboard & Management Routes (ALL PROTECTED)
app.use('/api/admin', AdminRoutes);

// ============= PART 3: ENVIRONMENT VARIABLES =============
// Add these to your .env file (create if not exists):

ADMIN_JWT_SECRET=your-admin-secret-key-change-this-in-production
ADMIN_JWT_EXPIRY=24h

// ============= PART 4: DATABASE MODEL REGISTRATION =============
// In blood-bank-node/configs/mongoose.js, add this line:

require('../app/modules/Admin/Admin.Schema');

// ============= PART 5: INSTALL BCRYPTJS =============
// Run in terminal if not already installed:
// npm install bcryptjs

// ============= COMPLETE EXAMPLE server.js SETUP =============

/*
const express = require('express');
const cors = require('cors');
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Database connection
require('./configs/mongoose');

// ===== ROUTE IMPORTS =====
const AuthRoutes = require('./app/modules/Authentication/Auth.Routes');
const UserRoutes = require('./app/modules/User/User.Routes');
const RequestRoutes = require('./app/modules/Request/Request.Routes');
const ChatRoutes = require('./app/modules/Chat/Chat.Routes');
const DonationFeedbackRoutes = require('./app/modules/Feedback/DonationFeedback.Routes');
const AdminAuthRoutes = require('./app/modules/Admin/Admin.Auth.Routes');        // ADD THIS
const AdminRoutes = require('./app/modules/Admin/Admin.Routes');                // ADD THIS

// ===== ROUTE REGISTRATIONS =====
app.use('/api/auth', AuthRoutes);
app.use('/api/users', UserRoutes);
app.use('/api/requests', RequestRoutes);
app.use('/api/chat', ChatRoutes);
app.use('/api/donation-feedback', DonationFeedbackRoutes);
app.use('/api/admin-auth', AdminAuthRoutes);                                    // ADD THIS
app.use('/api/admin', AdminRoutes);                                            // ADD THIS

// Server start
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
*/

// ============= API ENDPOINTS REFERENCE =============

// PUBLIC (No authentication required)
// POST   /api/admin-auth/login
//        Body: { email, password }
//        Returns: { token, admin data }

// PROTECTED (Admin authentication required - Bearer token in header)
// GET    /api/admin-auth/profile
//        Returns: Current admin's profile

// PATCH  /api/admin-auth/profile
//        Body: { name }
//        Returns: Updated profile

// POST   /api/admin-auth/change-password
//        Body: { currentPassword, newPassword }
//        Returns: Success message

// SUPER ADMIN ONLY
// POST   /api/admin-auth/register
//        Body: { name, email, password, role, permissions }
//        Returns: New admin data

// GET    /api/admin-auth/admins
//        Query: page, limit, search, status
//        Returns: Paginated admin list

// DASHBOARD (All require admin auth)
// GET    /api/admin/dashboard/stats
//        Returns: Platform statistics

// GET    /api/admin/analytics
//        Returns: Charts data (monthly donations, blood groups, ratings, etc)

// DONOR MANAGEMENT
// GET    /api/admin/donors
//        Query: page, limit, search, status
//        Returns: Paginated donor list

// GET    /api/admin/donors/:donorId
//        Returns: Donor details + feedback

// PATCH  /api/admin/donors/:donorId/suspend
//        Body: { suspend: boolean }
//        Returns: Updated donor

// DELETE /api/admin/donors/:donorId
//        Returns: Success message

// REQUEST MANAGEMENT
// GET    /api/admin/requests
//        Query: page, limit, status, search
//        Returns: Paginated request list

// GET    /api/admin/requests/:requestId
//        Returns: Request details

// DELETE /api/admin/requests/:requestId
//        Returns: Success message

// FEEDBACK MODERATION
// GET    /api/admin/feedback
//        Query: page, limit, status, role
//        Returns: Paginated feedback list

// PATCH  /api/admin/feedback/:feedbackId/approve
//        Body: { approve: boolean }
//        Returns: Updated feedback

// DELETE /api/admin/feedback/:feedbackId
//        Returns: Success message

// ============= TESTING WITH CURL =============

// 1. LOGIN (get token)
/*
curl -X POST http://localhost:4000/api/admin-auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"Admin@123"}'

// Response:
// {
//   "success": true,
//   "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
//   "data": { "_id": "...", "name": "Admin", "email": "admin@example.com", "role": "Admin" }
// }
*/

// 2. GET DASHBOARD STATS (using token from login)
/*
curl -X GET http://localhost:4000/api/admin/dashboard/stats \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

// Response:
// {
//   "success": true,
//   "data": {
//     "summary": {
//       "totalUsers": 150,
//       "totalDonors": 100,
//       "totalRecipients": 50,
//       "totalRequests": 45,
//       ...
//     },
//     "recentActivity": { ... }
//   }
// }
*/

// 3. GET DONORS LIST
/*
curl -X GET "http://localhost:4000/api/admin/donors?page=1&limit=20&status=active" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
*/

// 4. APPROVE FEEDBACK
/*
curl -X PATCH http://localhost:4000/api/admin/feedback/feedbackId/approve \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{"approve":true}'
*/
