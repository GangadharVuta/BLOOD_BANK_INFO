/* eslint-disable no-undef */
importScripts("https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js");

/**
 * Firebase Service Worker for Cloud Messaging
 * Handles background message delivery when app is not in foreground
 * 
 * NOTE: These values MUST match the config in blood-bank-react/.env.local
 */
firebase.initializeApp({
  apiKey: "AIzaSyDV9Abn5xLhzoweoxhXp6HQmm1LCIpFYRI",
  authDomain: "blood-bank-app-97b45.firebaseapp.com",
  projectId: "blood-bank-app-97b45",
  storageBucket: "blood-bank-app-97b45.firebasestorage.app",
  messagingSenderId: "1081108873916",
  appId: "1:1081108873916:web:8c71bc0436714b96b706b9",
});

const messaging = firebase.messaging();

/**
 * Handle background messages (when app is closed or in background)
 * Displays notification automatically
 */
messaging.onBackgroundMessage(function (payload) {
  console.log("📩 Background FCM Message Received:", payload);
  
  const notificationTitle = payload.notification?.title || "🩸 Blood Bank";
  const notificationOptions = {
    body: payload.notification?.body || "You have a new notification",
    icon: "/logo192.png",
    badge: "/logo192.png",
    tag: "blood-bank-notification",
    requireInteraction: false,
    data: payload.data || {},
  };

  return self.registration.showNotification(notificationTitle, notificationOptions);
});
