/**
 * Firebase Initialization (Modular SDK v9+)
 * Supports:
 * - Firebase Auth (OTP + reCAPTCHA)
 * - Firebase Cloud Messaging (FCM)
 */

import { initializeApp } from "firebase/app";
import { getAuth, RecaptchaVerifier } from "firebase/auth";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
};

// Validate env variables
const requiredEnvVars = [
  "REACT_APP_FIREBASE_API_KEY",
  "REACT_APP_FIREBASE_AUTH_DOMAIN",
  "REACT_APP_FIREBASE_PROJECT_ID",
  "REACT_APP_FIREBASE_STORAGE_BUCKET",
  "REACT_APP_FIREBASE_MESSAGING_SENDER_ID",
  "REACT_APP_FIREBASE_APP_ID",
  "REACT_APP_FIREBASE_VAPID_KEY",
];

const missingVars = requiredEnvVars.filter((key) => !process.env[key]);
if (missingVars.length > 0) {
  console.warn(
    `Missing Firebase environment variables: ${missingVars.join(", ")}`
  );
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// ================= AUTH =================
const auth = getAuth(app);
auth.languageCode = "en";

// ================= FCM ==================
let messaging = null;

/**
 * Check if browser supports FCM
 */
const isFcmSupported = () => {
  const checks = {
    serviceWorker: "serviceWorker" in navigator,
    pushManager: "PushManager" in window,
    notification: "Notification" in window,
    indexedDB: typeof window.indexedDB !== "undefined",
  };
  
  const supported = Object.values(checks).every(v => v);
  
  if (!supported) {
    const missing = Object.entries(checks)
      .filter(([_, check]) => !check)
      .map(([name]) => name);
    console.warn(`⚠️ Browser missing FCM APIs: ${missing.join(", ")}`);
  }
  
  return supported;
};

// Initialize messaging only if supported
try {
  if (isFcmSupported()) {
    try {
      messaging = getMessaging(app);
      console.log("✅ Firebase Messaging initialized successfully");
    } catch (err) {
      console.warn("⚠️ Firebase Messaging initialization failed:", err.message);
      messaging = null;
    }
  } else {
    console.info("ℹ️ Firebase Messaging disabled: Browser doesn't support required APIs");
    messaging = null;
  }
} catch (outerErr) {
  // Catch any unexpected errors during FCM initialization
  console.warn("⚠️ Unexpected error during FCM setup:", outerErr.message);
  messaging = null;
}

// Get FCM token
const getFcmToken = async () => {
  try {
    // Skip if messaging is not available
    if (!messaging) {
      console.debug("ℹ️ FCM messaging not available");
      return null;
    }

    const token = await getToken(messaging, {
      vapidKey: process.env.REACT_APP_FIREBASE_VAPID_KEY,
    });

    if (token) {
      console.log("🔔 FCM Token:", token);
      return token;
    } else {
      console.warn("ℹ️ No FCM token received (user may have denied permission)");
      return null;
    }
  } catch (error) {
    console.warn("ℹ️ Failed to get FCM token:", error.message);
    return null;
  }
};

// Listen for foreground messages
const onMessageListener = () =>
  new Promise((resolve) => {
    if (!messaging) {
      console.debug("ℹ️ FCM messaging not available");
      resolve(null);
      return;
    }
    
    try {
      onMessage(messaging, (payload) => {
        resolve(payload);
      });
    } catch (error) {
      console.warn("ℹ️ Failed to setup message listener:", error.message);
      resolve(null);
    }
  });

export {
  app,
  auth,
  RecaptchaVerifier,
  messaging,
  getFcmToken,
  onMessageListener,
};
