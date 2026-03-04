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
let messaging;
try {
  messaging = getMessaging(app);
} catch (err) {
  console.warn("FCM not supported in this browser");
}

// Get FCM token
const getFcmToken = async () => {
  try {
    if (!messaging) return null;

    const token = await getToken(messaging, {
      vapidKey: process.env.REACT_APP_FIREBASE_VAPID_KEY,
    });

    if (token) {
      console.log("🔔 FCM Token:", token);
      return token;
    } else {
      console.warn("No FCM token received");
      return null;
    }
  } catch (error) {
    console.error("Error getting FCM token", error);
    console.log(
      "VAPID FROM ENV:",
      process.env.REACT_APP_FIREBASE_VAPID_KEY
    );

    return null;
  }
};

// Listen for foreground messages
const onMessageListener = () =>
  new Promise((resolve) => {
    if (!messaging) return;
    onMessage(messaging, (payload) => {
      resolve(payload);
    });
  });

export {
  app,
  auth,
  RecaptchaVerifier,
  messaging,
  getFcmToken,
  onMessageListener,
};
