/**
 * Firebase Admin SDK Initialization (Backend)
 * For server-side operations like token verification
 */

const admin = require("firebase-admin");
const path = require("path");

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
      console.error("Invalid JSON in FIREBASE_SERVICE_ACCOUNT_JSON:", e.message);
    }
  } else if (serviceAccountPath) {
    try {
      serviceAccount = require(path.resolve(serviceAccountPath));
    } catch (e) {
      console.error(`Failed to load service account from ${serviceAccountPath}:`, e.message);
    }
  }

  if (serviceAccount) {
    app = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: process.env.FIREBASE_PROJECT_ID,
    });
    console.log("✅ Firebase Admin SDK initialized");
  } else {
    console.warn("⚠️ Firebase Admin SDK not configured. Set FIREBASE_SERVICE_ACCOUNT_JSON or FIREBASE_SERVICE_ACCOUNT_PATH in .env");
  }
} catch (error) {
  console.error("❌ Error initializing Firebase Admin SDK:", error.message);
}

module.exports = admin;
