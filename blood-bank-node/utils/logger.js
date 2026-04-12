/**
 * ============================================
 * CENTRALIZED LOGGER UTILITY
 * ============================================
 * Replaces console.log with structured logging
 * Logs to files and console with proper levels
 */

const winston = require('winston');
const path = require('path');
const fs = require('fs');

// Ensure logs directory exists
const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir);
}

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4
};

const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white'
};

winston.addColors(colors);

// Custom format for logs
const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.errors({ stack: true }),
  winston.format.printf(
    (info) => {
      const { timestamp, level, message, ...args } = info;

      const ts = timestamp.slice(0, 19).replace('T', ' ');
      
      // Don't log sensitive data
      let logMessage = message;
      
      return `${ts} [${level}]: ${logMessage} ${Object.keys(args).length ? JSON.stringify(args, null, 2) : ''}`;
    }
  )
);

// Transports
const transports = [
  // Error logs
  new winston.transports.File({
    filename: path.join(logsDir, 'error.log'),
    level: 'error',
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.errors({ stack: true }),
      winston.format.json()
    )
  }),
  // Combined logs
  new winston.transports.File({
    filename: path.join(logsDir, 'combined.log'),
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.json()
    )
  })
];

// Add console logging in development
if (process.env.NODE_ENV !== 'production') {
  transports.push(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize({ all: true }),
        format
      )
    })
  );
}

// Create logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'debug',
  levels,
  format,
  transports,
  exceptionHandlers: [
    new winston.transports.File({
      filename: path.join(logsDir, 'exceptions.log')
    })
  ],
  rejectionHandlers: [
    new winston.transports.File({
      filename: path.join(logsDir, 'rejections.log')
    })
  ]
});

// Export logger
module.exports = logger;
