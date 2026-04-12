/****************************
 MONGOOSE SCHEMAS
 ****************************/
const config = require('./configs');
const mongoose = require('mongoose');
const logger = require('../utils/logger');

mongoose.Promise = global.Promise;

module.exports = function () {
    const db = mongoose.connect(config.db)
      .then((connect) => {
        logger.info('✅ MongoDB connected successfully');
        return connect;
      })
      .catch((err) => {
        logger.error('❌ MongoDB connection error:', { error: err.message });
        logger.error('Application cannot start without database connection');
        process.exit(1); // Force exit on critical failure
      });
    
    return db;
};
