/**
 * ============================================
 * FIREBASE SERVICE - FCM NOTIFICATIONS
 * ============================================
 * Handles all Firebase Cloud Messaging operations:
 * - Send notifications to single/multiple recipients
 * - Handle token management
 * - Error handling and retries
 * - Production-ready implementation
 * 
 * Usage:
 *   const fbService = require('../../services/FirebaseService');
 *   await fbService.sendNotification(fcmToken, { title, body, data });
 */

const admin = require('firebase-admin');
const Logger = require('../utils/Logger');

class FirebaseService {
  /**
   * Check if Firebase Admin SDK is initialized
   */
  static isInitialized() {
    try {
      admin.app();
      return true;
    } catch (err) {
      Logger.warn('Firebase Admin SDK not initialized');
      return false;
    }
  }

  /**
   * Send notification to single device
   * @param {string} token - FCM device token
   * @param {object} notification - { title, body, imageUrl (optional) }
   * @param {object} data - Custom data payload (max 4096 bytes)
   * @returns {Promise<string>} messageId or null if failed
   */
  static async sendNotification(token, notification, data = {}) {
    try {
      if (!this.isInitialized()) {
        Logger.error('Firebase not initialized');
        return null;
      }

      if (!token || typeof token !== 'string') {
        Logger.warn('Invalid FCM token provided', { token });
        return null;
      }

      // Validate notification
      if (!notification || !notification.title || !notification.body) {
        Logger.warn('Invalid notification object', { notification });
        return null;
      }

      const message = {
        token,
        notification: {
          title: notification.title,
          body: notification.body,
          ...(notification.imageUrl && { imageUrl: notification.imageUrl })
        },
        data: this.sanitizeData(data),
        // Android-specific options
        android: {
          priority: 'high',
          ttl: 86400 * 1000 // 24 hours in milliseconds
        },
        // iOS-specific options
        apns: {
          headers: {
            'apns-priority': '10'
          }
        }
      };

      Logger.debug('Sending FCM notification', { token: token.substring(0, 20) + '...' });
      
      const messageId = await admin.messaging().send(message);
      
      Logger.info('📱 FCM notification sent successfully', { 
        messageId,
        to: token.substring(0, 20) + '...',
        title: notification.title
      });
      
      return messageId;

    } catch (error) {
      Logger.error('Failed to send FCM notification', error, {
        token: token?.substring(0, 20) + '...',
        title: notification.title
      });

      // Handle specific Firebase errors
      if (error.code === 'messaging/invalid-registration-token' || 
          error.code === 'messaging/registration-token-not-registered') {
        Logger.warn('⚠️ Invalid/expired FCM token - should be removed from database');
        return { error: 'INVALID_TOKEN' };
      }

      return null;
    }
  }

  /**
   * Send notifications to multiple devices
   * @param {string[]} tokens - Array of FCM tokens
   * @param {object} notification - Notification object
   * @param {object} data - Custom data
   * @returns {Promise<object>} { successful, failed, results }
   */
  static async sendMulticast(tokens, notification, data = {}) {
    try {
      if (!this.isInitialized()) {
        Logger.error('Firebase not initialized');
        return { successful: 0, failed: tokens.length, results: [] };
      }

      if (!Array.isArray(tokens) || tokens.length === 0) {
        Logger.warn('Invalid tokens array', { tokensLength: tokens?.length });
        return { successful: 0, failed: 0, results: [] };
      }

      // Firebase allows max 500 tokens per request
      const batchSize = 500;
      const batches = [];

      for (let i = 0; i < tokens.length; i += batchSize) {
        batches.push(tokens.slice(i, i + batchSize));
      }

      let totalSuccessful = 0;
      let totalFailed = 0;
      const allResults = [];

      for (const batch of batches) {
        const message = {
          tokens: batch,
          notification: {
            title: notification.title,
            body: notification.body,
            ...(notification.imageUrl && { imageUrl: notification.imageUrl })
          },
          data: this.sanitizeData(data),
          android: {
            priority: 'high',
            ttl: 86400 * 1000
          },
          apns: {
            headers: {
              'apns-priority': '10'
            }
          }
        };

        Logger.debug('Sending multicast FCM', { count: batch.length });

        const response = await admin.messaging().sendMulticast(message);

        totalSuccessful += response.successCount;
        totalFailed += response.failureCount;
        allResults.push(...response.responses);

        // Handle failed tokens
        response.responses.forEach((result, index) => {
          if (!result.success) {
            Logger.warn('❌ Failed to send to token', {
              token: batch[index].substring(0, 20) + '...',
              error: result.error?.code
            });
          }
        });
      }

      Logger.info('✅ Multicast completed', {
        successful: totalSuccessful,
        failed: totalFailed,
        total: tokens.length
      });

      return {
        successful: totalSuccessful,
        failed: totalFailed,
        results: allResults
      };

    } catch (error) {
      Logger.error('Multicast notification failed', error);
      return { successful: 0, failed: tokens.length, results: [] };
    }
  }

  /**
   * Send notification to topic (for subscribed users)
   * @param {string} topic - Topic name (e.g., 'blood-requests-A+')
   * @param {object} notification - Notification object
   * @param {object} data - Custom data
   */
  static async sendToTopic(topic, notification, data = {}) {
    try {
      if (!this.isInitialized()) {
        Logger.error('Firebase not initialized');
        return null;
      }

      const message = {
        topic,
        notification: {
          title: notification.title,
          body: notification.body,
          ...(notification.imageUrl && { imageUrl: notification.imageUrl })
        },
        data: this.sanitizeData(data)
      };

      Logger.debug('Sending topic notification', { topic });

      const messageId = await admin.messaging().send(message);

      Logger.info('📢 Topic notification sent', {
        messageId,
        topic,
        title: notification.title
      });

      return messageId;

    } catch (error) {
      Logger.error('Failed to send topic notification', error, { topic });
      return null;
    }
  }

  /**
   * Subscribe device to topic
   * @param {string} token - FCM token
   * @param {string} topic - Topic name
   */
  static async subscribeToTopic(token, topic) {
    try {
      if (!this.isInitialized()) {
        Logger.error('Firebase not initialized');
        return false;
      }

      await admin.messaging().subscribeToTopic([token], topic);
      Logger.debug(`✅ Subscribed to topic: ${topic}`);
      return true;

    } catch (error) {
      Logger.error('Failed to subscribe to topic', error, { token: token?.substring(0, 20), topic });
      return false;
    }
  }

  /**
   * Unsubscribe device from topic
   */
  static async unsubscribeFromTopic(token, topic) {
    try {
      if (!this.isInitialized()) {
        Logger.error('Firebase not initialized');
        return false;
      }

      await admin.messaging().unsubscribeFromTopic([token], topic);
      Logger.debug(`✅ Unsubscribed from topic: ${topic}`);
      return true;

    } catch (error) {
      Logger.error('Failed to unsubscribe from topic', error, { token: token?.substring(0, 20), topic });
      return false;
    }
  }

  /**
   * Sanitize data payload (must be key-value strings, max 4096 bytes)
   */
  static sanitizeData(data = {}) {
    if (!data || typeof data !== 'object') {
      return {};
    }

    const sanitized = {};

    for (const [key, value] of Object.entries(data)) {
      // Only strings allowed, convert others
      if (value === null || value === undefined) {
        continue;
      }

      if (typeof value === 'object') {
        sanitized[key] = JSON.stringify(value);
      } else {
        sanitized[key] = String(value);
      }
    }

    return sanitized;
  }

  /**
   * Blood request notification (for donors)
   */
  static async notifyBloodRequest(fcmToken, requestData) {
    const { bloodGroup, address, patientName, urgency = 'normal' } = requestData;

    const notification = {
      title: '🩸 Blood Donation Request',
      body: `${patientName} needs ${bloodGroup} blood at ${address}`,
      imageUrl: 'https://via.placeholder.com/200?text=Blood+Donation'
    };

    const data = {
      type: 'blood-request',
      bloodGroup,
      address,
      patientName,
      urgency,
      timestamp: new Date().toISOString()
    };

    return this.sendNotification(fcmToken, notification, data);
  }

  /**
   * Blood request accepted notification (for requester)
   */
  static async notifyRequestAccepted(fcmToken, donorData) {
    const { donorName, bloodGroup, phone } = donorData;

    const notification = {
      title: '✅ Donation Request Accepted',
      body: `${donorName} (${bloodGroup}) accepted your blood request`,
      imageUrl: 'https://via.placeholder.com/200?text=Donation+Accepted'
    };

    const data = {
      type: 'request-accepted',
      donorName,
      bloodGroup,
      phone,
      timestamp: new Date().toISOString()
    };

    return this.sendNotification(fcmToken, notification, data);
  }

  /**
   * Blood request rejected notification (for requester)
   */
  static async notifyRequestRejected(fcmToken, donorData) {
    const { donorName, bloodGroup } = donorData;

    const notification = {
      title: '❌ Donation Request Declined',
      body: `${donorName} (${bloodGroup}) declined your blood request`
    };

    const data = {
      type: 'request-rejected',
      donorName,
      bloodGroup,
      timestamp: new Date().toISOString()
    };

    return this.sendNotification(fcmToken, notification, data);
  }

  /**
   * Chat message notification
   */
  static async notifyChatMessage(fcmToken, messageData) {
    const { senderName, message, avatarUrl } = messageData;

    const notification = {
      title: `💬 Message from ${senderName}`,
      body: message.substring(0, 100),
      imageUrl: avatarUrl
    };

    const data = {
      type: 'chat-message',
      senderName,
      timestamp: new Date().toISOString()
    };

    return this.sendNotification(fcmToken, notification, data);
  }

  /**
   * Feedback moderation notification (for requester)
   */
  static async notifyFeedbackStatus(fcmToken, feedbackData) {
    const { status } = feedbackData; // 'approved' or 'rejected'

    const isApproved = status === 'approved';
    const notification = {
      title: isApproved ? '✅ Feedback Approved' : '❌ Feedback Not Approved',
      body: isApproved 
        ? 'Your feedback has been published' 
        : 'Your feedback did not meet our guidelines'
    };

    const data = {
      type: 'feedback-status',
      status,
      timestamp: new Date().toISOString()
    };

    return this.sendNotification(fcmToken, notification, data);
  }
}

module.exports = FirebaseService;
