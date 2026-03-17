/**
 * ============================================
 * SOCKET.IO CLIENT
 * ============================================
 * Manages real-time connection and communication with backend Socket.io server
 * Handles:
 * - Connection management
 * - Message sending/receiving
 * - Online status tracking
 * - Typing indicators
 * - Message read receipts
 */

import io from 'socket.io-client';

class SocketClient {
    constructor() {
        this.socket = null;
        this.isConnected = false;
        this.listeners = {
            messageReceived: [],
            userOnline: [],
            userOffline: [],
            typingStatus: [],
            connectionStatus: [],
            messageSent: [],
            messageRead: [],
            error: []
        };
    }

    /**
     * Initialize Socket.io connection with JWT authentication
     * @param {string} token - JWT authentication token
     * @param {string} serverUrl - Backend server URL (default: window.location.origin)
     */
    connect(token, serverUrl = window.location.origin) {
        return new Promise((resolve, reject) => {
            try {
                if (this.socket && this.socket.connected) {
                    console.warn('Socket already connected');
                    resolve(this.socket);
                    return;
                }

                // Initialize Socket.io connection
                this.socket = io(serverUrl, {
                    auth: {
                        token: token
                    },
                    reconnection: true,
                    reconnectionDelay: 1000,
                    reconnectionDelayMax: 5000,
                    reconnectionAttempts: 10,
                    transports: ['websocket', 'polling']
                });

                // Handle successful connection
                this.socket.on('connect', () => {
                    console.log('✅ Connected to chat server');
                    this.isConnected = true;
                    this._notifyListeners('connectionStatus', { 
                        isConnected: true, 
                        timestamp: new Date() 
                    });
                    resolve(this.socket);
                });

                // Handle connection errors
                this.socket.on('connect_error', (error) => {
                    console.error('❌ Connection error:', error);
                    this.isConnected = false;
                    this._notifyListeners('connectionStatus', { 
                        isConnected: false, 
                        error: error.message 
                    });
                    reject(error);
                });

                // Handle disconnection
                this.socket.on('disconnect', () => {
                    console.log('👋 Disconnected from chat server');
                    this.isConnected = false;
                    this._notifyListeners('connectionStatus', { 
                        isConnected: false 
                    });
                });

                // Handle socket errors
                this.socket.on('error', (error) => {
                    console.error('Socket error:', error);
                    this._notifyListeners('error', { message: error });
                });

                // Register event listeners
                this._registerEventListeners();

            } catch (error) {
                console.error('Failed to initialize socket:', error);
                reject(error);
            }
        });
    }

    /**
     * Register all socket event listeners
     * Private method called during connection
     */
    _registerEventListeners() {
        // Receive message event
        this.socket.on('receive_message', (message) => {
            console.log('📬 Message received:', message);
            this._notifyListeners('messageReceived', message);
        });

        // User online status
        this.socket.on('user_online', (data) => {
            console.log('🟢 User online:', data.userId);
            this._notifyListeners('userOnline', data);
        });

        // User offline status
        this.socket.on('user_offline', (data) => {
            console.log('🔴 User offline:', data.userId);
            this._notifyListeners('userOffline', data);
        });

        // User typing indicator
        this.socket.on('user_typing', (data) => {
            this._notifyListeners('typingStatus', data);
        });

        // Message sent confirmation
        this.socket.on('message_sent', (data) => {
            console.log('✅ Message delivered:', data.messageId);
            this._notifyListeners('messageSent', data);
        });

        // Message read receipt
        this.socket.on('message_read_receipt', (data) => {
            console.log('👁️ Message read by:', data.readBy);
            this._notifyListeners('messageRead', data);
        });

        // User joined chat
        this.socket.on('user_joined_chat', (data) => {
            console.log('👤 User joined chat:', data.userId);
        });

        // User left chat
        this.socket.on('user_left_chat', (data) => {
            console.log('👋 User left chat:', data.userId);
        });
    }

    /**
     * Join a chat room for a specific blood request
     * @param {string} requestId - Blood request ID
     */
    joinChat(requestId) {
        if (!this.socket || !this.isConnected) {
            console.error('Socket not connected');
            return;
        }

        this.socket.emit('join_chat', { requestId });
        console.log(`📍 Joined chat room for request: ${requestId}`);
    }

    /**
     * Leave a chat room
     * @param {string} requestId - Blood request ID
     */
    leaveChat(requestId) {
        if (!this.socket || !this.isConnected) {
            console.error('Socket not connected');
            return;
        }

        this.socket.emit('leave_chat', { requestId });
        console.log(`👋 Left chat room for request: ${requestId}`);
    }

    /**
     * Send a message in real-time
     * @param {string} receiverId - ID of the message recipient
     * @param {string} requestId - Blood request ID
     * @param {string} message - Message content
     */
    sendMessage(receiverId, requestId, message) {
        if (!this.socket || !this.isConnected) {
            console.error('Socket not connected');
            return;
        }

        if (!message || message.trim().length === 0) {
            console.error('Message cannot be empty');
            return;
        }

        this.socket.emit('send_message', {
            receiverId,
            requestId,
            message: message.trim()
        });

        console.log('📤 Message sent:', { receiverId, requestId });
    }

    /**
     * Send typing indicator
     * @param {string} requestId - Blood request ID
     * @param {boolean} isTyping - Whether user is typing
     */
    sendTypingStatus(requestId, isTyping) {
        if (!this.socket || !this.isConnected) {
            console.error('Socket not connected');
            return;
        }

        this.socket.emit('typing', {
            requestId,
            isTyping
        });
    }

    /**
     * Mark a message as read
     * @param {string} messageId - Message ID
     * @param {string} requestId - Blood request ID
     */
    markMessageAsRead(messageId, requestId) {
        if (!this.socket || !this.isConnected) {
            console.error('Socket not connected');
            return;
        }

        this.socket.emit('message_read', {
            messageId,
            requestId
        });
    }

    /**
     * Check if a specific user is online
     * @param {string} targetUserId - User ID to check
     * @returns {Promise} - Resolves with online status
     */
    checkUserOnlineStatus(targetUserId) {
        return new Promise((resolve) => {
            if (!this.socket || !this.isConnected) {
                resolve({ isOnline: false });
                return;
            }

            this.socket.emit('check_online_status', { targetUserId }, (response) => {
                resolve(response);
            });
        });
    }

    /**
     * Register a listener for socket events
     * @param {string} eventType - Type of event (messageReceived, userOnline, etc)
     * @param {function} callback - Callback function to execute when event occurs
     */
    on(eventType, callback) {
        if (this.listeners[eventType]) {
            this.listeners[eventType].push(callback);
        } else {
            console.warn(`Unknown event type: ${eventType}`);
        }
    }

    /**
     * Remove a listener for socket events
     * @param {string} eventType - Type of event
     * @param {function} callback - Callback function to remove
     */
    off(eventType, callback) {
        if (this.listeners[eventType]) {
            this.listeners[eventType] = this.listeners[eventType].filter(cb => cb !== callback);
        }
    }

    /**
     * Notify all listeners of an event
     * Private method
     */
    _notifyListeners(eventType, data) {
        if (this.listeners[eventType]) {
            this.listeners[eventType].forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`Error in listener for ${eventType}:`, error);
                }
            });
        }
    }

    /**
     * Disconnect from socket server
     */
    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.isConnected = false;
            console.log('Socket disconnected manually');
        }
    }

    /**
     * Get current connection status
     */
    getConnectionStatus() {
        return {
            isConnected: this.isConnected,
            socketId: this.socket?.id || null
        };
    }
}

// Export singleton instance
export default new SocketClient();
