/**
 * ============================================
 * SOCKET.IO CONFIGURATION
 * ============================================
 * Real-time communication setup for chat
 * Handles JWT authentication and connection validation
 */

const socketIO = require('socket.io');
const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');
const { Messages } = require('../app/modules/Chat/Schema');
const ChatController = require('../app/modules/Chat/Controller');
const { ObjectId } = require('mongodb');

/**
 * Store active users and their socket connections
 * Format: { userId: { socketId: 'socket-id', isOnline: true } }
 */
const activeUsers = new Map();

/**
 * Initialize Socket.io with CORS configuration
 * Returns configured Socket.io server
 */
function initializeSocket(httpServer) {
    const io = socketIO(httpServer, {
        cors: {
            origin: [
                'http://localhost:3000',
                'http://localhost:3001',
                process.env.REACT_APP_URL
            ].filter(url => url !== undefined && url !== ''),
            methods: ['GET', 'POST'],
            credentials: true,
            allowedHeaders: ['Authorization']
        },
        pingInterval: 25000,
        pingTimeout: 60000,
        transports: ['websocket', 'polling']
    });

    // Validate JWT_SECRET exists - no weak fallback default
    const JWT_SECRET = process.env.JWT_SECRET;
    if (!JWT_SECRET) {
        logger.error('Socket.io requires JWT_SECRET environment variable');
        throw new Error('Socket.io requires JWT_SECRET environment variable');
    }

    // Middleware to authenticate socket connections with JWT validation
    io.use((socket, next) => {
        try {
            const token = socket.handshake.auth.token;

            if (!token) {
                return next(new Error('Authentication required'));
            }

            const decoded = jwt.verify(token, JWT_SECRET);
            socket.userId = decoded.id || decoded._id;
            socket.userName = decoded.name;
            logger.debug('Socket authenticated', { userId: socket.userId });
            next();
        } catch (error) {
            logger.warn('Socket authentication failed', { error: error.message });
            next(new Error('Invalid token'));
        }
    });

    /**
     * CONNECTION EVENT
     * Triggered when a user connects to the server
     */
    io.on('connection', (socket) => {
        const userId = socket.userId;
        logger.info(`User connected`, { userId, socketId: socket.id });

        // Store user connection info
        activeUsers.set(userId, {
            socketId: socket.id,
            isOnline: true,
            connectedAt: new Date()
        });

        // Broadcast user online status to all connected clients
        io.emit('user_online', {
            userId,
            isOnline: true,
            timestamp: new Date()
        });

        /**
         * JOIN CHAT ROOM
         * User joins a specific chat room based on request ID
         * This allows targeting specific conversations
         */
        socket.on('join_chat', ({ requestId }) => {
            if (!requestId) {
                socket.emit('error', { message: 'Request ID is required' });
                return;
            }

            const roomId = `chat_${requestId}`;
            socket.join(roomId);
            console.log(`👤 User ${userId} joined room ${roomId}`);

            // Notify others in the room that user is online
            socket.to(roomId).emit('user_joined_chat', {
                userId,
                userName: socket.userName,
                requestId,
                isOnline: true,
                timestamp: new Date()
            });
        });

        /**
         * SEND MESSAGE
         * Handle real-time message sending
         * Saves to database and broadcasts to recipients
         */
        socket.on('send_message', async (messageData) => {
            try {
                const { receiverId, requestId, message } = messageData;

                if (!receiverId || !requestId || !message) {
                    socket.emit('error', { message: 'Missing required fields' });
                    return;
                }

                // Validate message content
                if (message.trim().length === 0) {
                    socket.emit('error', { message: 'Message cannot be empty' });
                    return;
                }

                if (message.length > 5000) {
                    socket.emit('error', { message: 'Message is too long (max 5000 characters)' });
                    return;
                }

                // Save message to database
                const chatController = new ChatController();
                const result = await chatController.saveMessage({
                    senderId: userId,
                    receiverId,
                    requestId,
                    message
                });

                if (result.status !== 1) {
                    socket.emit('error', { message: result.message });
                    return;
                }

                const savedMessage = result.data;

                // Prepare message for broadcasting
                const messageToSend = {
                    _id: savedMessage._id,
                    senderId: { _id: savedMessage.senderId._id, name: savedMessage.senderId.name, bloodGroup: savedMessage.senderId.bloodGroup },
                    receiverId: { _id: savedMessage.receiverId._id, name: savedMessage.receiverId.name, bloodGroup: savedMessage.receiverId.bloodGroup },
                    message: savedMessage.message,
                    requestId,
                    isRead: false,
                    timestamp: savedMessage.createdAt
                };

                // Broadcast message to all users in the chat room
                const roomId = `chat_${requestId}`;
                io.to(roomId).emit('receive_message', messageToSend);

                // Send confirmation to sender
                socket.emit('message_sent', {
                    messageId: savedMessage._id,
                    status: 'delivered',
                    timestamp: savedMessage.createdAt
                });

                console.log(`💬 Message from ${userId} to ${receiverId} in request ${requestId}`);
            } catch (error) {
                console.error('Error in send_message:', error);
                socket.emit('error', { message: 'Failed to send message' });
            }
        });

        /**
         * MESSAGE READ RECEIPT
         * Notify when receiver reads a message
         */
        socket.on('message_read', async ({ messageId, requestId }) => {
            try {
                const chatController = new ChatController();
                await chatController.markMessageAsRead(messageId);

                const roomId = `chat_${requestId}`;
                io.to(roomId).emit('message_read_receipt', {
                    messageId,
                    readBy: userId,
                    timestamp: new Date()
                });

                console.log(`✅ Message ${messageId} read by user ${userId}`);
            } catch (error) {
                console.error('Error in message_read:', error);
            }
        });

        /**
         * TYPING INDICATOR
         * Show when user is typing
         */
        socket.on('typing', ({ requestId, isTyping }) => {
            const roomId = `chat_${requestId}`;
            socket.to(roomId).emit('user_typing', {
                userId,
                userName: socket.userName,
                isTyping,
                timestamp: new Date()
            });
        });

        /**
         * LEAVE CHAT ROOM
         * User leaves a specific chat room
         */
        socket.on('leave_chat', ({ requestId }) => {
            const roomId = `chat_${requestId}`;
            socket.leave(roomId);
            console.log(`👋 User ${userId} left room ${roomId}`);

            socket.to(roomId).emit('user_left_chat', {
                userId,
                userName: socket.userName,
                requestId,
                timestamp: new Date()
            });
        });

        /**
         * REQUEST ONLINE STATUS
         * User requests online status of another user
         */
        socket.on('check_online_status', ({ targetUserId }, callback) => {
            const userStatus = activeUsers.get(targetUserId);
            const isOnline = userStatus?.isOnline || false;

            if (callback) {
                callback({
                    userId: targetUserId,
                    isOnline,
                    timestamp: new Date()
                });
            }
        });

        /**
         * DISCONNECT EVENT
         * Triggered when user disconnects
         */
        socket.on('disconnect', () => {
            console.log(`❌ User ${userId} disconnected (socket: ${socket.id})`);

            // Update user status
            activeUsers.delete(userId);

            // Broadcast user offline status
            io.emit('user_offline', {
                userId,
                isOnline: false,
                timestamp: new Date()
            });
        });

        /**
         * ERROR HANDLING
         */
        socket.on('error', (error) => {
            console.error('Socket error for user', userId, ':', error);
        });
    });

    /**
     * Utility function to get active users
     * Can be called from other parts of the application
     */
    io.getActiveUsers = () => {
        const users = {};
        activeUsers.forEach((value, key) => {
            users[key] = value;
        });
        return users;
    };

    /**
     * Utility function to emit message to specific user
     */
    io.sendMessageToUser = (userId, eventName, data) => {
        const user = activeUsers.get(userId);
        if (user) {
            io.to(user.socketId).emit(eventName, data);
        }
    };

    return io;
}

module.exports = initializeSocket;
