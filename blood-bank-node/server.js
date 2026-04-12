/****************************
 SERVER MAIN FILE
 ****************************/
// Include Modules
let exp = require('express');
let path = require('path');
let http = require('http');

console.log('🔧 Loading configurations...');

let config = require('./configs/configs');
console.log('✅ Configs loaded');

let express = require('./configs/express');
console.log('✅ Express loaded');

let mongoose = require('./configs/mongoose');
console.log('✅ Mongoose loaded');

let initializeSocket = require('./configs/socket');
const sentry = require('./configs/sentry');
const { setupSwagger } = require('./configs/swagger');
const { monitor } = require('./utils/performanceMonitor');

global.appRoot = path.resolve(__dirname);

console.log('📦 Connecting to MongoDB...');
let db;
try {
  db = mongoose();
  console.log('✅ Database connection initiated');
} catch (err) {
  console.error('❌ MongoDB connection error:', err.message);
  process.exit(1);
}

console.log('Initializing Express app...');
let app;
try {
  app = express();
  console.log('✅ Express app configured');
} catch (err) {
  console.error('❌ Express initialization error:', err.message);
  console.error(err.stack);
  process.exit(1);
}

// Initialize Sentry error tracking (MUST be before other middleware)
console.log('🔐 Initializing Sentry...');
try {
  sentry.initializeSentry(app);
  console.log('✅ Sentry initialized');
} catch (err) {
  console.error('❌ Sentry initialization error:', err.message);
  console.error(err.stack);
}

// Setup Swagger/OpenAPI documentation
console.log('📚 Setting up Swagger...');
try {
  setupSwagger(app);
  console.log('✅ Swagger configured');
} catch (err) {
  console.error('❌ Swagger setup error:', err.message);
  console.error(err.stack);
}

// Create HTTP server from Express app for Socket.io
console.log('🔌 Creating HTTP server...');
let httpServer;
try {
  httpServer = http.createServer(app);
  console.log('✅ HTTP server created');
} catch (err) {
  console.error('❌ HTTP server creation error:', err.message);
  process.exit(1);
}

// Initialize Socket.io for real-time chat
console.log('💬 Initializing Socket.io...');
let io;
try {
  io = initializeSocket(httpServer);
  console.log('✅ Socket.io initialized');
} catch (err) {
  console.error('❌ Socket.io initialization error:', err.message);
  console.error(err.stack);
  process.exit(1);
}

// Attach io to app for access in other files
app.io = io;

app.get('/', function (req, res, next) {
    res.send('hello world');
});

// ======= CSRF TOKEN ENDPOINT =======
const { getCsrfToken } = require('./middleware/csrfProtection');
app.post('/api/csrf-token', getCsrfToken);

// ======= METRICS ENDPOINTS =======
app.get('/api/metrics', (req, res) => {
    res.json(monitor.getMetrics());
});

app.get('/api/health', (req, res) => {
    res.json(monitor.getHealthStatus());
});

// ======= SWAGGER DOCUMENTATION =======
// Swagger UI is automatically available at /api/docs
// API specification JSON is at /api/docs.json

/* Old path for serving public folder */
app.use('/public', exp.static(__dirname + '/public'));

// Listening Server
httpServer.listen(parseInt(config.serverPort), async () => {
    console.log('process.env.NODE_ENV', process.env.NODE_ENV);
    console.log(`Server running at http://localhost:${config.serverPort}`);
    console.log('Socket.io server is ready for connections');
});

// ======= GLOBAL ERROR HANDLERS =======
process.on('uncaughtException', (err) => {
    console.error('❌ Uncaught Exception:', err);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});
