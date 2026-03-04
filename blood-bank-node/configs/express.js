/****************************
 EXPRESS AND ROUTING HANDLING
 ****************************/
const express = require('express');
const app = express();

const bodyParser = require('body-parser');

module.exports = function () {
  console.log('env - ' + process.env.NODE_ENV)

  app.use(bodyParser.urlencoded({
    limit: "50mb",
    extended: true
  }));

  app.use(bodyParser.json());

  // ======= SECURE CORS WHITELIST (No * allowed)
  const corsWhitelist = [
    'http://localhost:3000',
    'http://localhost:3001',
    process.env.REACT_APP_URL
  ].filter(url => url !== undefined && url !== '');

  app.use((req, res, next) => {
    const origin = req.headers.origin;
    
    // Allow if in whitelist (or no origin header for Postman/curl)
    if (!origin || corsWhitelist.includes(origin)) {
      res.header('Access-Control-Allow-Origin', origin || '*');
      res.header('Access-Control-Allow-Credentials', 'true');
      res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS,PATCH');
      res.header('Access-Control-Allow-Headers', 'Content-Type,Authorization,X-Requested-With');
    }
    
    // Handle preflight
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    
    next();
  });

  app.use(express.json());

  // =======   Routing
  require('../app/modules/User/Routes.js')(app, express);
  require('../app/modules/OTP/Routes.js')(app, express);
  require('../app/modules/Request/Routes.js')(app, express);
  require('../app/modules/Donor/Routes.js')(app, express);

  // ======= CENTRALIZED ERROR HANDLER MIDDLEWARE (MUST BE LAST)
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
