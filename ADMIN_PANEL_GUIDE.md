# Admin Panel Implementation Guide

## Overview
The BloodConnect Admin Panel is a comprehensive management system for platform administrators to control and monitor all system operations, including donor management, blood request management, feedback moderation, and platform statistics.

## Quick Start

### Step 1: Create Admin User
Run the admin creation script to create your first admin account:

```bash
cd blood-bank-node
node createAdmin.js
```

This will create:
- **Email**: admin@bloodconnect.com
- **Password**: Admin@123
- **Role**: Super Admin (full access)

⚠️ **IMPORTANT**: Change this password immediately after your first login!

### Step 2: Start Servers

**Backend (Terminal 1):**
```bash
cd blood-bank-node
npm start
```
Runs on: `http://localhost:4000`

**Frontend (Terminal 2):**
```bash
cd blood-bank-react
npm start
```
Runs on: `http://localhost:3000`

### Step 3: Access Admin Panel

1. Navigate to: `http://localhost:3000/admin/login`
2. Login with:
   - Email: `admin@bloodconnect.com`
   - Password: `Admin@123`
3. You'll be redirected to the admin dashboard

---

## Admin Features

### 1. Dashboard
**URL**: `/admin/dashboard`

View comprehensive platform statistics:
- Total Users
- Registered Donors
- Blood Requests
- Average Platform Rating
- Pending Feedback Count
- Blood Group Distribution
- Recent Feedback & Requests

### 2. Donor Management
**URL**: `/admin/donors`

Features:
- View all registered donors with pagination
- Search donors by name, email, or phone
- Filter by blood group and status
- Update donor status (active, suspended, inactive)
- Delete donor profiles
- View detailed donor information

### 3. Request Management
**URL**: `/admin/requests`

Features:
- View all blood requests with pagination
- Search requests by requester name or email
- Filter by status (pending, active, fulfilled, cancelled)
- Update request status
- Delete requests
- View detailed request information
- Track urgency levels

### 4. Feedback Moderation
**URL**: `/admin/feedback`

Features:
- Review pending feedback submissions
- View all approved feedback
- Approve feedback for public display
- Reject/delete inappropriate feedback
- Filter by user role and blood group
- View ratings and user testimonials

---

## API Endpoints

### Authentication

**Login**
```
POST /api/admin/login
Content-Type: application/json

{
  "email": "admin@bloodconnect.com",
  "password": "Admin@123"
}

Response:
{
  "success": true,
  "data": {
    "token": "jwt_token_here",
    "admin": {
      "_id": "...",
      "name": "...",
      "email": "...",
      "role": "super_admin",
      "permissions": {...}
    }
  }
}
```

### Dashboard Statistics

**Get Dashboard Stats**
```
GET /api/admin/dashboard/stats
Authorization: Bearer <token>

Response:
{
  "success": true,
  "data": {
    "totalStats": {
      "totalUsers": 150,
      "totalDonors": 80,
      "totalRequests": 45,
      "totalFeedback": 25
    },
    "feedbackStats": {
      "total": 25,
      "pending": 5,
      "approved": 20,
      "averageRating": 4.5
    },
    "requestStats": {
      "total": 45,
      "active": 8
    },
    "bloodGroupDistribution": [...],
    "recentFeedback": [...],
    "recentRequests": [...]
  }
}
```

### Donor Management

**Get All Donors**
```
GET /api/admin/donors?page=1&limit=10&bloodGroup=O+&search=john&status=active
Authorization: Bearer <token>
```

**Get Donor Details**
```
GET /api/admin/donors/:donorId
Authorization: Bearer <token>
```

**Update Donor Status**
```
PUT /api/admin/donors/:donorId/status
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "active" // or "suspended", "inactive"
}
```

**Delete Donor**
```
DELETE /api/admin/donors/:donorId
Authorization: Bearer <token>
```

### Request Management

**Get All Requests**
```
GET /api/admin/requests?page=1&limit=10&status=pending&search=john
Authorization: Bearer <token>
```

**Get Request Details**
```
GET /api/admin/requests/:requestId
Authorization: Bearer <token>
```

**Update Request Status**
```
PUT /api/admin/requests/:requestId/status
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "fulfilled" // or "pending", "active", "cancelled"
}
```

**Delete Request**
```
DELETE /api/admin/requests/:requestId
Authorization: Bearer <token>
```

### Feedback Management

**Get All Feedback**
```
GET /api/admin/feedback?page=1&limit=10&status=pending
Authorization: Bearer <token>
```

**Get Pending Feedback**
```
GET /api/admin/feedback/pending?page=1&limit=10
Authorization: Bearer <token>
```

**Approve Feedback**
```
PUT /api/admin/feedback/:feedbackId/approve
Authorization: Bearer <token>
```

**Reject Feedback**
```
DELETE /api/admin/feedback/:feedbackId/reject
Authorization: Bearer <token>
```

### Admin Management (Super Admin Only)

**Create New Admin**
```
POST /api/admin/create-admin
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "John Admin",
  "email": "john@admin.com",
  "password": "SecurePassword123",
  "role": "admin",
  "permissions": {
    "manageDonors": true,
    "manageRequests": true,
    "manageFeedback": true,
    "manageChat": false,
    "manageAdmins": false,
    "viewStatistics": true
  }
}
```

**Get All Admins**
```
GET /api/admin/list
Authorization: Bearer <token>
```

**Update Admin**
```
PUT /api/admin/:adminId
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Updated Name",
  "role": "moderator",
  "permissions": {...},
  "isActive": true
}
```

---

## Security Features

### JWT Authentication
- All protected routes require JWT tokens
- Token stored securely in localStorage
- 24-hour token expiration
- Automatic logout on expired tokens

### Role-Based Access Control
- **Super Admin**: Full system access, can manage admins
- **Admin**: Can manage all core features (donors, requests, feedback)
- **Moderator**: Limited to feedback moderation only

### Permission System
Each admin can have custom permissions:
- `manageDonors`: Can view, update, and delete donors
- `manageRequests`: Can view, update, and delete requests
- `manageFeedback`: Can approve and reject feedback
- `manageChat`: Can monitor and moderate chat messages
- `manageAdmins`: Can create and manage other admin accounts
- `viewStatistics`: Can view dashboard statistics

### Data Protection
- Passwords are hashed using bcryptjs
- Soft deletes (data marked as deleted, not permanently removed)
- IP address logging for security audit trail
- Last login tracking

---

## File Structure

### Backend Files Created
```
blood-bank-node/
├── app/modules/Admin/
│   ├── Schema.js          (Admin model with data validation)
│   ├── Controller.js      (All admin operations logic)
│   └── Routes.js          (API endpoint definitions)
├── middleware/
│   └── adminAuth.js       (JWT verification & role checking)
└── createAdmin.js         (Script to create first admin)
```

### Frontend Files Created
```
blood-bank-react/src/components/admin/
├── AdminLogin.js              (Login page)
├── AdminLogin.css
├── AdminDashboard.js          (Main dashboard)
├── AdminDashboard.css
├── DonorManagement.js         (Donor table & management)
├── DonorManagement.css
├── RequestManagement.js       (Request table & management)
├── RequestManagement.css
├── FeedbackModeration.js      (Feedback review cards)
├── FeedbackModeration.css
└── ProtectedAdminRoute.js     (Route protection wrapper)
```

---

## Workflow Examples

### Example 1: Approving Feedback
1. Navigate to `/admin/feedback`
2. Status filter shows "Pending Review" by default
3. Review feedback cards
4. Click "✓ Approve" to display feedback on homepage
5. Or click "✕ Reject" to remove inappropriate feedback

### Example 2: Managing Donors
1. Go to `/admin/donors`
2. Use search to find donor: Search "john"
3. Use filter for blood group: Select "O+"
4. Click "View" to see full donor profile
5. Change status dropdown to "suspended" to restrict donations
6. Click "Delete" to remove donor from system

### Example 3: Monitoring Requests
1. Access `/admin/requests`
2. Filter by status: Select "pending"
3. View urgent requests at top
4. Update status to "active" when donor found
5. Mark as "fulfilled" when blood collected
6. Delete duplicate or spam requests

---

## Troubleshooting

### Issue: "Invalid email or password" on login
- Ensure createAdmin.js was run successfully
- Check that credentials match exactly (case-sensitive)
- Verify admin account exists in database

### Issue: Cannot access admin dashboard (401 error)
- Token may have expired, login again
- Check that adminToken is stored in localStorage
- Verify JWT_SECRET in backend matches

### Issue: CORS error when accessing admin API
- Ensure backend server is running on port 4000
- Check CORS whitelist in configs/express.js
- Verify Authorization header format: `Bearer <token>`

### Issue: Frontend components not rendering
- Verify all admin components are imported in App.js
- Check that routes are correctly defined
- Clear browser cache and localStorage
- Check browser console for errors

---

## Best Practices

### Security
✅ Change default admin password immediately
✅ Use strong passwords (min 8 characters, mixed case, numbers)
✅ Regularly review admin activity logs
✅ Limit number of super admin accounts
✅ Use HTTPS in production
✅ Set appropriate token expiration times

### Maintenance
✅ Regularly backup database
✅ Monitor pending feedback queue
✅ Review and remove inactive donor accounts
✅ Track request fulfillment rates
✅ Monitor platform statistics trends

### Performance
✅ Use pagination for large datasets
✅ Implement search/filter to reduce data loading
✅ Optimize database queries with indexes
✅ Consider caching frequently accessed data

---

## Production Deployment

### Backend Changes
1. Update `JWT_SECRET` in environment variables
2. Set `NODE_ENV=production`
3. Configure database connection to production MongoDB
4. Set up secure MongoDB backup
5. Enable HTTPS/SSL
6. Configure CORS for production domain

### Frontend Changes
1. Build production bundle: `npm run build`
2. Update API base URL to production server
3. Configure environment variables
4. Enable service worker for PWA features
5. Test all admin features thoroughly

### Legal & Compliance
- Ensure admin actions are logged
- Create privacy policy for admin data handling
- Set up audit trails for sensitive operations
- Implement role-based access logging
- Regular security audits

---

## Support & Maintenance

For issues or questions:
1. Check this guide for troubleshooting
2. Review browser console for error messages
3. Check backend server logs
4. Verify database connectivity
5. Contact support@bloodconnect.com

---

## Version History

- **v1.0** (Current): Initial release
  - Admin authentication
  - Donor management
  - Request management
  - Feedback moderation
  - Dashboard statistics
