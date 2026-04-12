/**
 * ============================================
 * INTEGRATION GUIDE - CODE SNIPPETS
 * ============================================
 * Copy-paste ready code for implementing
 * CSRF, Swagger, Performance monitoring
 */

// ============================================
// 1. CSRF PROTECTION INTEGRATION
// ============================================

// In: blood-bank-node/server.js (near the top, before routes)
const express = require('express');
const cookieParser = require('cookie-parser');
const { csrfProtection } = require('./middleware/csrfProtection');

const app = express();

// Add cookie parser first
app.use(cookieParser());

// Add CSRF protection
app.use(csrfProtection);

// ============================================
// 2. SWAGGER DOCUMENTATION INTEGRATION
// ============================================

// In: blood-bank-node/server.js (after CSRF, before routes)
const { setupSwagger } = require('./configs/swagger');

// Setup API documentation BEFORE routes
setupSwagger(app);

// ============================================
// 3. PERFORMANCE MONITORING INTEGRATION
// ============================================

// In: blood-bank-node/configs/express.js (early in middleware)
const { performanceMiddleware } = require('../utils/performanceMonitor');

module.exports = (app) => {
  // Add performance monitoring first
  app.use(performanceMiddleware());

  // ... rest of express config
};

// ============================================
// 4. CSRF TOKEN ENDPOINT
// ============================================

// In: blood-bank-node/server.js (add this route)
const { getCsrfToken } = require('./middleware/csrfProtection');

// CSRF token endpoint (no auth needed)
app.get('/api/csrf-token', getCsrfToken);

// ============================================
// 5. METRICS ENDPOINTS
// ============================================

// In: blood-bank-node/server.js (add these routes)
const { monitor } = require('./utils/performanceMonitor');

// Metrics endpoint (consider adding auth to this)
app.get('/api/metrics', (req, res) => {
  res.json(monitor.getMetrics());
});

// Health check endpoint (no auth needed, for load balancers)
app.get('/api/health', (req, res) => {
  res.status(200).json(monitor.getHealthStatus());
});

// ============================================
// 6. CSRF ERROR HANDLER
// ============================================

// In: blood-bank-node/server.js (at the END, after all routes)
const { csrfErrorHandler } = require('./middleware/csrfProtection');

// Add CSRF error handler before other error handlers
app.use(csrfErrorHandler);

// ============================================
// 7. REACT CSRF TOKEN SETUP
// ============================================

// In: blood-bank-react/src/services/api.js or axios config
import axios from 'axios';

// Get CSRF token on app initialization
export async function initializeCsrfToken() {
  try {
    const response = await axios.get('/api/csrf-token');
    if (response.data.token) {
      localStorage.setItem('csrfToken', response.data.token);
      return response.data.token;
    }
  } catch (error) {
    console.error('Failed to fetch CSRF token:', error);
  }
}

// Add CSRF token to all requests
axios.interceptors.request.use((config) => {
  // Add CSRF token to non-GET requests
  if (['post', 'put', 'delete'].includes(config.method)) {
    const token = localStorage.getItem('csrfToken');
    if (token) {
      config.headers['X-CSRF-Token'] = token;
    }
  }
  return config;
});

// ============================================
// 8. SENTRY INITIALIZATION
// ============================================

// In: blood-bank-node/server.js (VERY FIRST, before anything else)
const { initializeSentry, sentryErrorHandler } = require('./configs/sentry');

// Initialize Sentry FIRST
initializeSentry(app);

// ... all other middleware and routes ...

// At the END, add Sentry error handler
sentryErrorHandler(app);

// ============================================
// 9. EXAMPLE SWAGGER JSDoc COMMENTS
// ============================================

// Add to: blood-bank-node/app/modules/User/Routes.js

/**
 * @swagger
 * /api/users/register:
 *   post:
 *     summary: Register a new user
 *     description: Creates a new user account with email verification
 *     tags:
 *       - Users
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - emailId
 *               - password
 *               - userName
 *               - phoneNumber
 *               - firebaseUid
 *               - idToken
 *             properties:
 *               emailId:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: StrongPass123!
 *               userName:
 *                 type: string
 *                 example: John Doe
 *               phoneNumber:
 *                 type: string
 *                 example: '9876543210'
 *               bloodGroup:
 *                 type: string
 *                 enum: [O+, O-, A+, A-, B+, B-, AB+, AB-]
 *               firebaseUid:
 *                 type: string
 *               idToken:
 *                 type: string
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: integer
 *                   example: 1
 *                 message:
 *                   type: string
 *                   example: User registered successfully
 *                 token:
 *                   type: string
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: integer
 *                   example: 0
 *                 message:
 *                   type: string
 *       409:
 *         description: User already exists
 */
router.post(
  '/users/register',
  registerLimiter,
  validation.validateRegister,
  validators.validatePasswordStrengthMiddleware('password'),
  (req, res, next) => {
    const userObj = new UsersController().boot(req, res);
    return userObj.register();
  }
);

// ============================================
// 10. SENTRY USAGE EXAMPLE
// ============================================

// In any controller file
const { captureException, setUserContext } = require('../../../configs/sentry');
const logger = require('../../../utils/logger');

async login() {
  try {
    const data = this.req.body;
    
    // ... validation code ...
    
    const user = await Users.findOne({ emailId: data.emailId });
    
    if (user) {
      // Set user context for error tracking
      setUserContext(user._id.toString(), user.emailId, user.userName);
    }
    
    // ... rest of login logic ...
    
    return this.res.send({
      status: 1,
      message: 'Login successful',
      token: token,
      data: user
    });
    
  } catch (error) {
    // Capture exception with context
    captureException(error, {
      userId: this.req.currentUser?._id,
      action: 'login',
      emailId: this.req.body.emailId
    });
    
    logger.error('Login error:', { error: error.message });
    return this.res.send({
      status: 0,
      message: 'Login failed'
    });
  }
}

// ============================================
// 11. ENV VARIABLES NEEDED
// ============================================

// Add to .env.production:

# CSRF Protection
CSRF_COOKIE_HTTPONLY=true
CSRF_COOKIE_SECURE=true
CSRF_COOKIE_SAMESITE=strict

# Sentry Error Tracking
SENTRY_DSN=https://your-key@sentry.io/your-project-id
SENTRY_ENVIRONMENT=production
SENTRY_RELEASE=2.0.0

# API Documentation
API_DOMAIN=api.yourdomain.com

# Performance Monitoring
PERFORMANCE_LOG_SLOW_REQUESTS=true
SLOW_REQUEST_THRESHOLD=1000

// ============================================
// 12. COMPLETE SERVER.JS EXAMPLE STRUCTURE
// ============================================

/*
const express = require('express');
const cookieParser = require('cookie-parser');

// ===== SECURITY & MONITORING =====
const { initializeSentry, sentryErrorHandler } = require('./configs/sentry');
const { csrfProtection, csrfErrorHandler } = require('./middleware/csrfProtection');
const { setupSwagger } = require('./configs/swagger');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// ===== CORE SETUP =====
const app = express();

// 1. Initialize Sentry FIRST (before all middleware)
initializeSentry(app);

// 2. Security headers
app.use(helmet());

// 3. Body parsing
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ limit: '1mb', extended: true }));

// 4. Cookies for CSRF
app.use(cookieParser());

// 5. CSRF protection
app.use(csrfProtection);

// 6. Rate limiting
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many login attempts'
});

// 7. Performance monitoring
const { performanceMiddleware } = require('./utils/performanceMonitor');
app.use(performanceMiddleware());

// 8. API Documentation
setupSwagger(app);

// 9. CSRF token endpoint
app.get('/api/csrf-token', (req, res) => {
  try {
    const token = req.csrfToken();
    res.json({ status: 1, token });
  } catch (error) {
    res.status(500).json({ status: 0, message: 'Failed to generate token' });
  }
});

// 10. Metrics endpoints
const { monitor } = require('./utils/performanceMonitor');
app.get('/api/metrics', (req, res) => res.json(monitor.getMetrics()));
app.get('/api/health', (req, res) => res.status(200).json(monitor.getHealthStatus()));

// 11. YOUR ROUTES HERE
const authentication = require('./app/modules/Authentication/Routes');
authentication(app, express);
// ... more routes ...

// 12. Error handlers
app.use(csrfErrorHandler);
app.use(sentryErrorHandler);

// 13. Start server
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
*/

// ============================================
// IMPLEMENTATION PRIORITY
// ============================================

/*
1. CSRF Protection (15 min)
   - Add middleware to express.js
   - Add token endpoint
   - Update React interceptor

2. Swagger Docs (30 min)
   - Integrate swagger.js
   - Add JSDoc to 3-4 key routes
   - Test /api/docs

3. Performance Monitoring (20 min)
   - Add performanceMiddleware
   - Add metrics endpoints
   - Test /api/health

4. Sentry Setup (1 hour)
   - Create account
   - Install packages
   - Configure DSN
   - Initialize in server.js

5. Security Scanning (ongoing)
   - Install Snyk
   - Run first scan
   - Fix vulnerabilities

Total Time: 2-3 hours
*/

module.exports = {
  SNIPPET_CSRF: 'CSRF Protection middleware',
  SNIPPET_SWAGGER: 'API Documentation (Swagger/OpenAPI)',
  SNIPPET_METRICS: 'Performance Metrics endpoints',
  SNIPPET_SENTRY: 'Error Tracking integration',
  SNIPPET_REACT: 'React CSRF token setup'
};
