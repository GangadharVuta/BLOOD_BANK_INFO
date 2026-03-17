/**
 * ============================================
 * CHAT API SERVICE
 * ============================================
 * REST API service for chat operations
 * Handles:
 * - Fetching chat history
 * - Marking messages as read
 * - Deleting messages
 * - Getting conversation lists
 */

import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

class ChatService {
    constructor() {
        this.api = axios.create({
            baseURL: API_BASE_URL,
            timeout: 10000
        });

        // Add interceptor to include JWT token in requests
        this.api.interceptors.request.use(
            (config) => {
                const token = localStorage.getItem('authToken');
                if (token) {
                    config.headers.Authorization = `Bearer ${token}`;
                }
                return config;
            },
            (error) => {
                return Promise.reject(error);
            }
        );

        // Handle response errors
        this.api.interceptors.response.use(
            (response) => response,
            (error) => {
                if (error.response?.status === 401) {
                    // Token expired or invalid
                    localStorage.removeItem('authToken');
                    window.location.href = '/login';
                }
                return Promise.reject(error);
            }
        );
    }

    /**
     * Fetch chat history for a specific blood request
     * @param {string} requestId - Blood request ID
     * @param {number} page - Page number for pagination (default: 1)
     * @param {number} limit - Messages per page (default: 50)
     * @returns {Promise} - Array of messages
     */
    async getChatHistory(requestId, page = 1, limit = 50) {
        try {
            const response = await this.api.get('/chat/history/' + requestId, {
                params: { page, limit }
            });

            if (response.data.status === 1) {
                return response.data.data;
            } else {
                throw new Error(response.data.message || 'Failed to fetch chat history');
            }
        } catch (error) {
            console.error('Error fetching chat history:', error);
            throw error;
        }
    }

    /**
     * Get list of conversations for logged-in user
     * @param {number} page - Page number for pagination (default: 1)
     * @param {number} limit - Conversations per page (default: 20)
     * @returns {Promise} - List of conversations
     */
    async getConversationList(page = 1, limit = 20) {
        try {
            const response = await this.api.get('/chat/conversations', {
                params: { page, limit }
            });

            if (response.data.status === 1) {
                return response.data.data;
            } else {
                throw new Error(response.data.message || 'Failed to fetch conversations');
            }
        } catch (error) {
            console.error('Error fetching conversation list:', error);
            throw error;
        }
    }

    /**
     * Get total unread message count for user
     * @returns {Promise} - Unread count
     */
    async getUnreadCount() {
        try {
            const response = await this.api.get('/chat/unread');

            if (response.data.status === 1) {
                return response.data.data.unreadCount;
            } else {
                throw new Error(response.data.message || 'Failed to fetch unread count');
            }
        } catch (error) {
            console.error('Error fetching unread count:', error);
            throw error;
        }
    }

    /**
     * Get unread count for a specific conversation
     * @param {string} requestId - Blood request ID
     * @returns {Promise} - Unread count for the conversation
     */
    async getUnreadCountForChat(requestId) {
        try {
            const response = await this.api.get(`/chat/unread/${requestId}`);

            if (response.data.status === 1) {
                return response.data.data.unreadCount;
            } else {
                throw new Error(response.data.message || 'Failed to fetch unread count');
            }
        } catch (error) {
            console.error('Error fetching unread count for chat:', error);
            throw error;
        }
    }

    /**
     * Mark a specific message as read
     * @param {string} messageId - Message ID
     * @returns {Promise} - Updated message
     */
    async markMessageAsRead(messageId) {
        try {
            const response = await this.api.post('/chat/mark-read', {
                messageId
            });

            if (response.data.status === 1) {
                return response.data.data;
            } else {
                throw new Error(response.data.message || 'Failed to mark message as read');
            }
        } catch (error) {
            console.error('Error marking message as read:', error);
            throw error;
        }
    }

    /**
     * Mark all messages in a conversation as read
     * @param {string} requestId - Blood request ID
     * @returns {Promise} - Number of messages marked as read
     */
    async markConversationAsRead(requestId) {
        try {
            const response = await this.api.post(
                `/chat/mark-conversation-read/${requestId}`
            );

            if (response.data.status === 1) {
                return response.data.data;
            } else {
                throw new Error(response.data.message || 'Failed to mark conversation as read');
            }
        } catch (error) {
            console.error('Error marking conversation as read:', error);
            throw error;
        }
    }

    /**
     * Delete a message (soft delete - only sender can delete their own)
     * @param {string} messageId - Message ID
     * @returns {Promise} - Updated message
     */
    async deleteMessage(messageId) {
        try {
            const response = await this.api.delete(`/chat/message/${messageId}`);

            if (response.data.status === 1) {
                return response.data.data;
            } else {
                throw new Error(response.data.message || 'Failed to delete message');
            }
        } catch (error) {
            console.error('Error deleting message:', error);
            throw error;
        }
    }

    /**
     * Search messages in a conversation
     * @param {string} requestId - Blood request ID
     * @param {string} searchText - Search query
     * @returns {Promise} - Filtered messages
     */
    async searchMessages(requestId, searchText) {
        try {
            const result = await this.getChatHistory(requestId, 1, 1000);
            const messages = result.messages || [];

            return messages.filter(msg =>
                msg.message.toLowerCase().includes(searchText.toLowerCase())
            );
        } catch (error) {
            console.error('Error searching messages:', error);
            throw error;
        }
    }

    /**
     * Get message details with sender info (limited to avoid exposing private info)
     * @param {object} message - Message object from chat history
     * @returns {object} - Message with limited sender info
     */
    formatMessageForDisplay(message) {
        return {
            _id: message._id,
            senderId: message.senderId._id,
            senderName: message.senderId.name,
            senderBloodGroup: message.senderId.bloodGroup,
            receiverId: message.receiverId._id,
            message: message.message,
            timestamp: new Date(message.createdAt),
            isRead: message.isRead,
            isDeleted: message.isDeleted
        };
    }

    /**
     * Format conversation for display
     * @param {object} conversation - Conversation object
     * @returns {object} - Formatted conversation
     */
    formatConversationForDisplay(conversation) {
        const otherParticipant = conversation.participant1Id._id === localStorage.getItem('userId')
            ? conversation.participant2Id
            : conversation.participant1Id;

        return {
            conversationId: conversation._id,
            requestId: conversation.requestId._id,
            bloodGroup: conversation.requestId.bloodGroup,
            location: conversation.requestId.address,
            pincode: conversation.requestId.pincode,
            otherParticipant: {
                id: otherParticipant._id,
                name: otherParticipant.name,
                bloodGroup: otherParticipant.bloodGroup
            },
            lastMessage: conversation.lastMessage,
            lastMessageTime: new Date(conversation.lastMessageTime),
            unreadCount: conversation.participant1Id._id === localStorage.getItem('userId')
                ? conversation.unreadCount1
                : conversation.unreadCount2
        };
    }
}

export default new ChatService();
