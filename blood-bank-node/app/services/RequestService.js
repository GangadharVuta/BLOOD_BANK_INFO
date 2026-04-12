/**
 * ============================================
 * REQUEST SERVICE
 * ============================================
 * Handles all blood request operations:
 * - Create requests
 * - Accept/reject requests
 * - Send notifications efficiently
 * - Prevent duplicate operations
 * - Real-time updates via Socket.io
 * 
 * Usage:
 *   const requestService = require('../../services/RequestService');
 *   await requestService.createBloodRequest(userId, requestData);
 */

const { Requests } = require('../modules/Request/Schema');
const { Users } = require('../modules/User/Schema');
const { Donors } = require('../modules/Donor/Schema');
const FirebaseService = require('./FirebaseService');
const Logger = require('../utils/Logger');
const QueryValidator = require('../utils/QueryValidator');

class RequestService {
  /**
   * Create blood requests and notify donors
   * @param {string} userId - User ID who created the request
   * @param {object} requestData - { userIds, bloodGroup, pincode, address }
   * @param {object} io - Socket.io instance for real-time updates
   * @returns {Promise<object>} { status, message, data }
   */
  static async createBloodRequest(userId, requestData, io = null) {
    const startTime = Date.now();

    try {
      const { userIds = [], bloodGroup, pincode, address } = requestData;

      // Validation
      if (!userIds || userIds.length === 0) {
        return {
          status: 0,
          message: 'No donors selected',
          data: null
        };
      }

      if (!bloodGroup || !pincode || !address) {
        return {
          status: 0,
          message: 'Missing required fields: bloodGroup, pincode, address',
          data: null
        };
      }

      // Get requester info
      const requester = await Users.findById(userId).select('name email phone');
      if (!requester) {
        return {
          status: 0,
          message: 'Requester not found',
          data: null
        };
      }

      Logger.info('📤 Creating blood requests', {
        requester: requester.name,
        donorCount: userIds.length,
        bloodGroup,
        pincode
      });

      // Generate unique request ID
      const requestCount = await Requests.countDocuments({ isDeleted: false });
      const baseRequestId = `BCREQ${Date.now()}`;

      const createdRequests = [];
      const invalidDonors = [];
      const fcmTokens = [];
      const requestIds = [];

      // Process each donor in parallel using Promise.all for efficiency
      const requestPromises = userIds.map(async (donorId) => {
        try {
          // Validate donor ID
          if (!QueryValidator.isValidObjectId(donorId)) {
            invalidDonors.push(donorId);
            return null;
          }

          // Find donor - check Users first, then Donors
          let donor = await Users.findById(donorId).select('name email phone fcmToken');
          let isManual = false;

          if (!donor) {
            donor = await Donors.findById(donorId).select('name phone');
            isManual = true;
          }

          if (!donor) {
            invalidDonors.push(donorId);
            return null;
          }

          // Create request record
          const requestRecord = await Requests.create({
            requestedBy: userId,
            donorId: donorId,
            bloodGroup,
            pincode,
            address,
            requestId: baseRequestId,
            status: 'pending',
            isManual: isManual,
            createdAt: new Date()
          });

          if (requestRecord) {
            createdRequests.push(requestRecord);
            requestIds.push(requestRecord._id);

            // Collect FCM token if available
            if (donor.fcmToken) {
              fcmTokens.push({
                token: donor.fcmToken,
                donorId: donorId,
                donorName: donor.name || 'Donor',
                donorPhone: donor.phone || 'N/A'
              });
            }
          }

          return requestRecord;

        } catch (err) {
          Logger.error('Error creating request for donor', err, { donorId });
          return null;
        }
      });

      await Promise.all(requestPromises);

      // === SEND NOTIFICATIONS ===
      // Send to all collected FCM tokens at once (not one by one)
      if (fcmTokens.length > 0) {
        Logger.info('📱 Sending notifications to donors', { count: fcmTokens.length });

        // Use parallel notifications instead of sequential
        const notificationPromises = fcmTokens.map(async (donor) => {
          try {
            const notificationData = {
              bloodGroup,
              address,
              patientName: requester.name,
              requesterPhone: requester.phone,
              urgency: 'high'
            };

            await FirebaseService.notifyBloodRequest(donor.token, notificationData);
            
            Logger.debug('✅ Notification sent', { 
              to: donor.donorName, 
              token: donor.token.substring(0, 20) + '...' 
            });

          } catch (err) {
            Logger.error('Failed to send notification', err, { donorName: donor.donorName });
          }
        });

        // Send all notifications in parallel (not awaiting each one sequentially)
        Promise.allSettled(notificationPromises).catch(err => {
          Logger.error('Notification batch error', err);
        });
      }

      // === EMIT SOCKET.IO EVENT (Real-time update) ===
      if (io) {
        try {
          // Notify all connected clients about new request
          io.emit('blood-request-created', {
            requestId: baseRequestId,
            bloodGroup,
            pincode,
            address,
            requesterName: requester.name,
            timestamp: new Date()
          });

          // Also notify specific donors if they're online
          for (const donor of fcmTokens) {
            io.to(donor.donorId).emit('new-blood-request', {
              requestId: baseRequestId,
              bloodGroup,
              address,
              requesterPhone: requester.phone
            });
          }

          Logger.debug('Socket.io event emitted', { event: 'blood-request-created' });
        } catch (err) {
          Logger.error('Socket.io emit error', err);
        }
      }

      const duration = Date.now() - startTime;

      Logger.info('✅ Blood requests created successfully', {
        totalCreated: createdRequests.length,
        notificationsSent: fcmTokens.length,
        invalidDonors: invalidDonors.length,
        duration: `${duration}ms`
      });

      return {
        status: 1,
        message: 'Request sent successfully',
        data: {
          requestId: baseRequestId,
          totalDonors: userIds.length,
          validRequests: createdRequests.length,
          notificationsSent: fcmTokens.length,
          invalidDonors: invalidDonors.length
        }
      };

    } catch (error) {
      Logger.error('Blood request creation failed', error);
      return {
        status: 0,
        message: error.message || 'Failed to create requests',
        data: null
      };
    }
  }

  /**
   * Accept blood request
   */
  static async acceptBloodRequest(requestId, donorId, io = null) {
    try {
      Logger.info('Accepting blood request', { requestId, donorId });

      const request = await Requests.findById(requestId);
      if (!request) {
        return { status: 0, message: 'Request not found' };
      }

      // Update request status
      const updated = await Requests.findByIdAndUpdate(
        requestId,
        {
          status: 'accepted',
          acceptedBy: donorId,
          acceptedAt: new Date()
        },
        { new: true }
      );

      // Get donor info for notification
      const donor = await Users.findById(donorId).select('name phone bloodGroup');
      const requester = await Users.findById(request.requestedBy).select('fcmToken');

      // Notify requester
      if (requester && requester.fcmToken) {
        await FirebaseService.notifyRequestAccepted(requester.fcmToken, {
          donorName: donor.name,
          bloodGroup: donor.bloodGroup,
          phone: donor.phone
        });

        Logger.info('✅ Acceptance notification sent to requester');
      }

      // Emit Socket.io event
      if (io) {
        io.emit('request-accepted', {
          requestId,
          donorId,
          donorName: donor.name,
          donorPhone: donor.phone,
          timestamp: new Date()
        });
      }

      return {
        status: 1,
        message: 'Request accepted',
        data: updated
      };

    } catch (error) {
      Logger.error('Accept request failed', error);
      return {
        status: 0,
        message: 'Failed to accept request',
        error: error.message
      };
    }
  }

  /**
   * Reject blood request
   */
  static async rejectBloodRequest(requestId, donorId, io = null) {
    try {
      Logger.info('Rejecting blood request', { requestId, donorId });

      const request = await Requests.findById(requestId);
      if (!request) {
        return { status: 0, message: 'Request not found' };
      }

      // Update request status
      const updated = await Requests.findByIdAndUpdate(
        requestId,
        {
          status: 'rejected',
          rejectedBy: donorId,
          rejectedAt: new Date()
        },
        { new: true }
      );

      // Get donor info for notification
      const donor = await Users.findById(donorId).select('name bloodGroup');
      const requester = await Users.findById(request.requestedBy).select('fcmToken');

      // Notify requester
      if (requester && requester.fcmToken) {
        await FirebaseService.notifyRequestRejected(requester.fcmToken, {
          donorName: donor.name,
          bloodGroup: donor.bloodGroup
        });

        Logger.info('❌ Rejection notification sent to requester');
      }

      // Emit Socket.io event
      if (io) {
        io.emit('request-rejected', {
          requestId,
          donorId,
          donorName: donor.name,
          timestamp: new Date()
        });
      }

      return {
        status: 1,
        message: 'Request rejected',
        data: updated
      };

    } catch (error) {
      Logger.error('Reject request failed', error);
      return {
        status: 0,
        message: 'Failed to reject request',
        error: error.message
      };
    }
  }

  /**
   * Get pending requests for a donor
   */
  static async getPendingRequestsForDonor(donorId, page = 1, limit = 10) {
    try {
      const { skip, limit: lim } = QueryValidator.paginate(page, limit);

      const query = {
        donorId: QueryValidator.toObjectId(donorId),
        status: 'pending',
        isDeleted: false
      };

      const requests = await Requests.find(query)
        .populate('requestedBy', 'name email phone bloodGroup')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(lim);

      const total = await Requests.countDocuments(query);

      return {
        status: 1,
        data: requests,
        pagination: {
          page,
          limit: lim,
          total,
          pages: Math.ceil(total / lim)
        }
      };

    } catch (error) {
      Logger.error('Failed to get pending requests', error);
      return {
        status: 0,
        message: error.message,
        data: []
      };
    }
  }

  /**
   * Get requests by requester
   */
  static async getRequesterRequests(requesterId, page = 1, limit = 10) {
    try {
      const { skip, limit: lim } = QueryValidator.paginate(page, limit);

      const query = {
        requestedBy: QueryValidator.toObjectId(requesterId),
        isDeleted: false
      };

      const requests = await Requests.find(query)
        .populate('donorId', 'name phone bloodGroup')
        .populate('acceptedBy', 'name phone')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(lim);

      const total = await Requests.countDocuments(query);

      return {
        status: 1,
        data: requests,
        pagination: {
          page,
          limit: lim,
          total,
          pages: Math.ceil(total / lim)
        }
      };

    } catch (error) {
      Logger.error('Failed to get requester requests', error);
      return {
        status: 0,
        message: error.message,
        data: []
      };
    }
  }
}

module.exports = RequestService;
