/****************************
 EXPRESS AND ROUTING HANDLING
 ****************************/
const express = require('express');
const helmet = require('helmet');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const rateLimit = require('express-rate-limit');
const MongoStoreModule = require('connect-mongo');
const MongoStore = MongoStoreModule.MongoStore || MongoStoreModule.default;
const { csrfProtection, csrfErrorHandler } = require('../middleware/csrfProtection');
const { performanceMiddleware } = require('../utils/performanceMonitor');
const sentry = require('./sentry');
const config = require('./configs');
const app = express();

const bodyParser = require('body-parser');

module.exports = function () {
  console.log('env - ' + process.env.NODE_ENV)

  // ======= SECURITY HEADERS (MUST BE FIRST) =======
  app.use(helmet()); // Adds security headers: CSP, X-Frame-Options, HSTS, etc.

  // ======= RATE LIMITING (Prevent abuse and DDoS) =======
  const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again after 15 minutes',
    standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
    legacyHeaders: false, // Disable `X-RateLimit-*` headers
    skip: (req) => {
      // Skip rate limiting for health checks and static files
      return req.path === '/health' || req.path.startsWith('/static');
    }
  });

  // Stricter rate limiting for authentication endpoints
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 attempts per IP
    message: 'Too many login attempts, please try again later',
    skipSuccessfulRequests: true, // Don't count successful requests
  });

  app.use(generalLimiter);
  
  // Apply stricter auth limiting to specific endpoints
  app.use('/api/users/login', authLimiter);
  app.use('/api/users/register', rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // Max 3 registrations per IP per hour
    message: 'Too many accounts created from this IP, please try again later'
  }));
  
  // ======= COMPRESSION =======
  app.use(compression()); // Compress responses

  // ======= REQUEST SIZE LIMITS (Prevent DoS) =======
  app.use(bodyParser.urlencoded({
    limit: "1mb", // Reduced from 50mb for security
    extended: true
  }));

  app.use(bodyParser.json({ limit: "1mb" })); // Reduced from default for security

  // ======= COOKIE PARSER (Required for CSRF) =======
  app.use(cookieParser());

  // ======= SESSION SETUP (Required for CSRF) - Using MongoDB for Production =======
  const sessionStore = new MongoStore({
    mongoUrl: config.db,
    touchAfter: 24 * 3600, // Lazy session update - only update every 24 hours
    dbName: 'Blood_Bank',
    collectionName: 'sessions'
  });

  sessionStore.on('error', (err) => {
    console.error('❌ MongoStore connection error:', err);
  });

  sessionStore.on('connected', () => {
    console.log('✅ MongoStore connected to MongoDB for sessions');
  });

  app.use(session({
    secret: process.env.SESSION_SECRET || 'dev-session-secret-change-in-production',
    resave: false,
    saveUninitialized: false,
    store: sessionStore,
    cookie: { 
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      sameSite: 'strict',
      maxAge: 3600000 // 1 hour
    }
  }));

  // ======= PERFORMANCE MONITORING =======
  app.use(performanceMiddleware());

  // ======= CORS CONFIGURATION (Production-Ready) =======
  let corsWhitelist = [];

  if (process.env.NODE_ENV === 'production') {
    // Production: Strict domain-only whitelist
    if (!process.env.REACT_APP_URL) {
      throw new Error('REACT_APP_URL must be set in production');
    }
    corsWhitelist = [process.env.REACT_APP_URL];
  } else {
    // Development: Allow localhost variants
    corsWhitelist = [
      'http://localhost:3000',
      'http://localhost:3001',
      process.env.REACT_APP_URL
    ].filter(url => url !== undefined && url !== '');
  }

  app.use((req, res, next) => {
    const origin = req.headers.origin;
    
    // Allow if in whitelist or no origin header (for Postman/curl)
    if (!origin || corsWhitelist.includes(origin)) {
      res.header('Access-Control-Allow-Origin', origin || '*');
      res.header('Access-Control-Allow-Credentials', 'true');
      res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS,PATCH');
      res.header('Access-Control-Allow-Headers', 'Content-Type,Authorization,X-Requested-With,X-CSRF-Token,x-csrf-token');
      res.header('Access-Control-Max-Age', '3600');
    }
    
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    
    next();
  });

  app.use(express.json());

  // ======= CSRF PROTECTION (DISABLED FOR JWT-PROTECTED API ROUTES) =======
  // CSRF protection is NOT needed for /api routes because they use JWT authentication
  // CSRF is only for form-based authentication. JWT tokens are immune to CSRF attacks.
  
  app.use((req, res, next) => {
    // Skip CSRF protection for:
    // 1. All /api routes (protected by JWT)
    // 2. GET and OPTIONS requests (safe methods)
    if (req.path.startsWith('/api') || req.method === 'OPTIONS' || req.method === 'GET') {
      return next();
    }
    
    // Apply CSRF protection only to non-API routes (if any exist)
    csrfProtection(req, res, next);
  });

  app.use(csrfErrorHandler);

  // =======   Routing
  require('../app/modules/User/Routes.js')(app, express);
  require('../app/modules/OTP/Routes.js')(app, express);
  require('../app/modules/Feedback/Routes.js')(app, express);
  require('../app/modules/Request/Routes.js')(app, express);
  require('../app/modules/Donor/Routes.js')(app, express);
  require('../app/modules/BloodBank/Routes.js')(app, express);
  require('../app/modules/Chat/Routes.js')(app, express);
  require('../app/modules/Admin/Routes.js')(app, express);

  // ======= CENTRALIZED ERROR HANDLER MIDDLEWARE (MUST BE LAST)
  // Sentry error handler (captures exceptions)
  app.use(sentry.sentryErrorHandler);
  
  // Application error handler (catches everything else)
  app.use((err, req, res, next) => {
    console.error('❌ Error:', err.message);
    console.error('Stack:', err.stack);
    
    // Prevent Server crashes - return safe error response
    return res.status(500).send({
      status: 0,
      message: err.message || 'Internal server error',
      error: process.env.NODE_ENV === 'Development' ? err.message : 'An error occurred'
    });
  });

  return app;
};
