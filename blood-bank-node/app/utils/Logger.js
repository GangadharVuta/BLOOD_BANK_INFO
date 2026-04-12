/**
 * ============================================
 * LOGGER UTILITY - CLEAN LOGGING
 * ============================================
 * Centralized logging with:
 * - Log levels (debug, info, warn, error)
 * - File rotation support
 * - Environment-aware filtering
 * - Structured logging without clutter
 * 
 * Usage:
 *   const Logger = require('../../utils/logger');
 *   Logger.info('User created', { userId: '123' });
 *   Logger.error('Database error', { error: err });
 */

const fs = require('fs');
const path = require('path');

// Log levels
const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3
};

// Get current log level from environment
const getCurrentLogLevel = () => {
  const envLevel = process.env.LOG_LEVEL || 'info';
  return LOG_LEVELS[envLevel.toUpperCase()] || LOG_LEVELS.INFO;
};

// Color codes for terminal
const COLORS = {
  RESET: '\x1b[0m',
  DEBUG: '\x1b[36m',   // Cyan
  INFO: '\x1b[32m',    // Green
  WARN: '\x1b[33m',    // Yellow
  ERROR: '\x1b[31m'    // Red
};

/**
 * Format timestamp
 */
const getTimestamp = () => {
  const now = new Date();
  return now.toISOString();
};

/**
 * Ensure logs directory exists
 */
const ensureLogsDirectory = () => {
  const logsDir = process.env.LOG_DIR || './logs';
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }
  return logsDir;
};

/**
 * Format log message
 */
const formatMessage = (level, message, data = {}) => {
  const timestamp = getTimestamp();
  const context = Object.keys(data).length > 0 
    ? ` | ${JSON.stringify(data, null, 2)}` 
    : '';
  
  return `[${timestamp}] [${level}] ${message}${context}`;
};

/**
 * Write to file
 */
const writeToFile = (message) => {
  try {
    const logsDir = ensureLogsDirectory();
    const now = new Date();
    const fileName = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}.log`;
    const filePath = path.join(logsDir, fileName);
    
    fs.appendFileSync(filePath, message + '\n');
  } catch (err) {
    console.error('Failed to write to log file:', err);
  }
};

/**
 * Logger object with methods
 */
class Logger {
  /**
   * DEBUG level logging
   */
  static debug(message, data = {}) {
    if (getCurrentLogLevel() > LOG_LEVELS.DEBUG) return;
    
    const formatted = formatMessage('DEBUG', message, data);
    console.log(`${COLORS.DEBUG}${formatted}${COLORS.RESET}`);
    
    if (process.env.NODE_ENV === 'production') {
      writeToFile(formatted);
    }
  }

  /**
   * INFO level logging (most common)
   */
  static info(message, data = {}) {
    if (getCurrentLogLevel() > LOG_LEVELS.INFO) return;
    
    const formatted = formatMessage('INFO', message, data);
    console.log(`${COLORS.INFO}${formatted}${COLORS.RESET}`);
    
    if (process.env.NODE_ENV === 'production') {
      writeToFile(formatted);
    }
  }

  /**
   * WARN level logging
   */
  static warn(message, data = {}) {
    if (getCurrentLogLevel() > LOG_LEVELS.WARN) return;
    
    const formatted = formatMessage('WARN', message, data);
    console.warn(`${COLORS.WARN}${formatted}${COLORS.RESET}`);
    writeToFile(formatted);
  }

  /**
   * ERROR level logging (always logged)
   */
  static error(message, error = null, data = {}) {
    const errorData = error ? {
      ...data,
      error: {
        message: error.message,
        stack: error.stack?.split('\n').slice(0, 3).join(' | ')
      }
    } : data;
    
    const formatted = formatMessage('ERROR', message, errorData);
    console.error(`${COLORS.ERROR}${formatted}${COLORS.RESET}`);
    writeToFile(formatted);
  }

  /**
   * Log API request/response
   */
  static api(method, endpoint, statusCode, duration, userId = null) {
    const userData = userId ? ` | UserId: ${userId}` : '';
    const message = `${method.toUpperCase()} ${endpoint} → ${statusCode} (${duration}ms)${userData}`;
    
    const level = statusCode >= 400 ? 'ERROR' : 'INFO';
    const formatted = formatMessage(level, message);
    
    if (statusCode >= 400) {
      console.error(`${COLORS.ERROR}${formatted}${COLORS.RESET}`);
    } else {
      console.log(`${COLORS.INFO}${formatted}${COLORS.RESET}`);
    }
  }

  /**
   * Log database query
   */
  static query(collection, operation, success = true, duration = null, error = null) {
    const durationStr = duration ? ` | ${duration}ms` : '';
    const message = `[DB] ${collection}.${operation}${durationStr}`;
    
    if (success) {
      this.debug(message);
    } else {
      this.error(message, error);
    }
  }

  /**
   * Log Socket.io events
   */
  static socket(event, data = {}, type = 'emit') {
    const message = `[Socket.io] ${type.toUpperCase()} "${event}"`;
    this.debug(message, data);
  }
}

module.exports = Logger;
