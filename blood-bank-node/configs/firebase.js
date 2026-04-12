/**
 * Firebase Admin SDK Initialization (Backend)
 * For server-side operations like token verification
 */

const admin = require("firebase-admin");
const path = require("path");
const logger = require('../utils/logger');

let app = null;

try {
  // Try to initialize Firebase Admin SDK
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;

  let serviceAccount = null;

  if (serviceAccountJson) {
    try {
      serviceAccount = JSON.parse(serviceAccountJson);
    } catch (e) {
      logger.error("Invalid JSON in FIREBASE_SERVICE_ACCOUNT_JSON", { error: e.message });
    }
  } else if (serviceAccountPath) {
    try {
      serviceAccount = require(path.resolve(serviceAccountPath));
    } catch (e) {
      logger.error(`Failed to load service account from ${serviceAccountPath}`, { error: e.message });
    }
  }

  if (serviceAccount) {
    app = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: process.env.FIREBASE_PROJECT_ID,
    });
    logger.info("✅ Firebase Admin SDK initialized successfully");
  } else {
    logger.warn("⚠️ Firebase Admin SDK not configured. Set FIREBASE_SERVICE_ACCOUNT_JSON or FIREBASE_SERVICE_ACCOUNT_PATH in .env");
    
    // In production, this is critical
    if (process.env.NODE_ENV === 'production') {
      logger.error("Firebase is required in production. Exiting.");
      process.exit(1);
    }
  }
} catch (error) {
  logger.error("❌ Error initializing Firebase Admin SDK", { error: error.message });
  if (process.env.NODE_ENV === 'production') {
    process.exit(1);
  }
}

module.exports = admin;
