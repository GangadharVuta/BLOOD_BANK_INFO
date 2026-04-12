/**
 * ============================================
 * SENTRY ERROR TRACKING SETUP
 * ============================================
 * Captures and tracks application errors
 * Provides real-time error monitoring, alerting, and debugging
 */

const Sentry = require('@sentry/node');
const SentryTracing = require('@sentry/tracing');
const logger = require('../utils/logger');

/**
 * Initialize Sentry for error tracking
 * Must be called early in application setup, before other middleware
 * 
 * Environment variables required:
 * - SENTRY_DSN: Data Source Name from your Sentry project
 * - NODE_ENV: Set to 'production' to enable full error tracking
 * - SENTRY_ENVIRONMENT: Environment name (production, staging, development)
 * - SENTRY_RELEASE: Application release version
 */
function initializeSentry(app) {
  const sentryDsn = process.env.SENTRY_DSN;

  // Only initialize Sentry if DSN is provided
  if (!sentryDsn) {
    if (process.env.NODE_ENV === 'production') {
      logger.warn('SENTRY_DSN not configured. Error tracking disabled.');
      logger.warn('Set SENTRY_DSN environment variable to enable Sentry monitoring.');
    } else {
      logger.info('Sentry disabled in development mode. Set SENTRY_DSN to enable.');
    }
    return;
  }

  Sentry.init({
    dsn: sentryDsn,
    environment: process.env.SENTRY_ENVIRONMENT || process.env.NODE_ENV || 'development',
    release: process.env.SENTRY_RELEASE || '2.0.0',

    // Tracing
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

    // Performance Monitoring
    integrations: [
      new SentryTracing.Integrations.Http({ breadcrumbs: true, timing: true }),
      new SentryTracing.Integrations.Express({
        app: true,
        request: true,
        serverName: true
      })
    ],

    // Ignore certain errors
    ignoreErrors: [
      // Browser extensions and malicious scripts
      'top.GLOBALS',
      'chrome-extension://',
      'moz-extension://',

      // Random plugins/extensions that don't exist
      'Can\'t find variable: ZiteReader',
      'jigsaw is not defined',
      'ComboSearch is not defined',

      // Network errors
      'NetworkError',
      'timeout of',
      'The operation couldn\'t be completed'
    ],

    // Don't capture certain errors in specific conditions
    beforeSend(event, hint) {
      // Filter out 4xx client errors (optional)
      if (event.exception) {
        const error = hint.originalException;
        if (error && error.statusCode >= 400 && error.statusCode < 500) {
          return null; // Don't send client errors
        }
      }

      return event;
    }
  });

  // Request handler - must be first
  app.use(Sentry.Handlers.requestHandler());

  // Tracing handler
  app.use(Sentry.Handlers.tracingHandler());

  logger.info('✅ Sentry error tracking initialized', {
    dsn: sentryDsn.substring(0, 20) + '...',
    environment: process.env.SENTRY_ENVIRONMENT || process.env.NODE_ENV,
    version: process.env.SENTRY_RELEASE || '2.0.0'
  });
}

/**
 * Sentry error handler - should be added at the END of middleware pipeline
 * before other error handlers
 */
function sentryErrorHandler(app) {
  if (!process.env.SENTRY_DSN) {
    return; // Sentry not configured
  }

  // Error handler
  app.use(Sentry.Handlers.errorHandler());
}

/**
 * Capture exceptions manually
 */
function captureException(error, context = {}) {
  if (!process.env.SENTRY_DSN) {
    logger.error('Exception (Sentry disabled):', { error: error.message, ...context });
    return;
  }

  Sentry.captureException(error, {
    contexts: {
      custom: context
    }
  });

  logger.error('Exception captured by Sentry:', { error: error.message, ...context });
}

/**
 * Capture message for monitoring events
 */
function captureMessage(message, level = 'info', context = {}) {
  if (!process.env.SENTRY_DSN) {
    logger.log(level, message, context);
    return;
  }

  Sentry.captureMessage(message, level);
  logger.log(level, message, context);
}

/**
 * Set user context for error reporting
 */
function setUserContext(userId, email, username) {
  Sentry.setUser({
    id: userId,
    email: email,
    username: username
  });
}

/**
 * Clear user context
 */
function clearUserContext() {
  Sentry.setUser(null);
}

module.exports = {
  Sentry,
  initializeSentry,
  sentryErrorHandler,
  captureException,
  captureMessage,
  setUserContext,
  clearUserContext
};
