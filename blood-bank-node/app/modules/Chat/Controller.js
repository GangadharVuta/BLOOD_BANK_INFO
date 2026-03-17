/**
 * ============================================
 * CHAT CONTROLLER
 * ============================================
 * Handles all chat-related operations:
 * - Fetching chat history
 * - Marking messages as read
 * - Deleting messages
 * - Managing conversations
 */

const _ = require('lodash');
const { ObjectId } = require('mongodb');
const Controller = require('../Base/Controller');
const { Messages, Conversations } = require('./Schema');
const { Requests } = require('../Request/Schema');
const { Users } = require('../User/Schema');
const Model = require('../Base/Model');

class ChatController extends Controller {
    constructor() {
        super();
    }

    /**
     * Purpose: Fetch chat history for a specific blood request
     * Parameters:
     *   - requestId: The blood request ID to fetch messages for
     *   - page: Pagination page (default: 1)
     *   - limit: Messages per page (default: 50)
     * Returns: Array of messages with sender details
     */
    async getChatHistory(requestId, page = 1, limit = 50) {
        try {
            if (!ObjectId.isValid(requestId)) {
                return {
                    status: 0,
                    message: 'Invalid request ID'
                };
            }

            // Verify that the request exists
            const request = await Requests.findById(requestId);
            if (!request) {
                return {
                    status: 0,
                    message: 'Request not found'
                };
            }

            const skip = (page - 1) * limit;

            // Fetch messages with sender information
            const messages = await Messages.find({
                requestId: new ObjectId(requestId),
                isDeleted: false
            })
                .populate({
                    path: 'senderId',
                    select: '-password -phoneNumber -email -address -aadharNumber -panNumber'
                })
                .populate({
                    path: 'receiverId',
                    select: '-password -phoneNumber -email -address -aadharNumber -panNumber'
                })
                .sort({ createdAt: 1 })
                .skip(skip)
                .limit(limit)
                .lean();

            // Get total count for pagination
            const totalMessages = await Messages.countDocuments({
                requestId: new ObjectId(requestId),
                isDeleted: false
            });

            return {
                status: 1,
                message: 'Chat history fetched successfully',
                data: {
                    messages,
                    pagination: {
                        currentPage: page,
                        totalPages: Math.ceil(totalMessages / limit),
                        totalMessages,
                        limit
                    }
                }
            };
        } catch (error) {
            console.error('Error in getChatHistory:', error);
            return {
                status: 0,
                message: error.message || 'Error fetching chat history'
            };
        }
    }

    /**
     * Purpose: Save a new message to the database
     * Parameters:
     *   - messageData: {
     *       senderId, receiverId, requestId, message
     *     }
     * Returns: Saved message object
     */
    async saveMessage(messageData) {
        try {
            const { senderId, receiverId, requestId, message } = messageData;

            // Validate required fields
            if (!ObjectId.isValid(senderId) || !ObjectId.isValid(receiverId) || !ObjectId.isValid(requestId)) {
                return {
                    status: 0,
                    message: 'Invalid user or request ID'
                };
            }

            if (!message || message.trim().length === 0) {
                return {
                    status: 0,
                    message: 'Message cannot be empty'
                };
            }

            // Create new message
            const newMessage = new Messages({
                senderId: new ObjectId(senderId),
                receiverId: new ObjectId(receiverId),
                requestId: new ObjectId(requestId),
                message: message.trim(),
                isRead: false
            });

            const savedMessage = await newMessage.save();

            // Populate sender and receiver details
            const populatedMessage = await Messages.findById(savedMessage._id)
                .populate({
                    path: 'senderId',
                    select: '-password -phoneNumber -email -address -aadharNumber -panNumber'
                })
                .populate({
                    path: 'receiverId',
                    select: '-password -phoneNumber -email -address -aadharNumber -panNumber'
                })
                .lean();

            // Update conversation metadata
            await this.updateConversation(senderId, receiverId, requestId, message);

            return {
                status: 1,
                message: 'Message saved successfully',
                data: populatedMessage
            };
        } catch (error) {
            console.error('Error in saveMessage:', error);
            return {
                status: 0,
                message: error.message || 'Error saving message'
            };
        }
    }

    /**
     * Purpose: Mark a message as read
     * Parameters:
     *   - messageId: ID of the message to mark as read
     * Returns: Updated message
     */
    async markMessageAsRead(messageId) {
        try {
            if (!ObjectId.isValid(messageId)) {
                return {
                    status: 0,
                    message: 'Invalid message ID'
                };
            }

            const updatedMessage = await Messages.findByIdAndUpdate(
                messageId,
                { isRead: true },
                { new: true }
            );

            if (!updatedMessage) {
                return {
                    status: 0,
                    message: 'Message not found'
                };
            }

            return {
                status: 1,
                message: 'Message marked as read',
                data: updatedMessage
            };
        } catch (error) {
            console.error('Error in markMessageAsRead:', error);
            return {
                status: 0,
                message: error.message || 'Error marking message as read'
            };
        }
    }

    /**
     * Purpose: Mark all messages in a conversation as read
     * Parameters:
     *   - requestId: The request ID (chat room)
     *   - userId: The user ID who is reading the messages
     * Returns: Number of messages marked as read
     */
    async markConversationAsRead(requestId, userId) {
        try {
            if (!ObjectId.isValid(requestId) || !ObjectId.isValid(userId)) {
                return {
                    status: 0,
                    message: 'Invalid request or user ID'
                };
            }

            const result = await Messages.updateMany(
                {
                    requestId: new ObjectId(requestId),
                    receiverId: new ObjectId(userId),
                    isRead: false
                },
                { isRead: true }
            );

            return {
                status: 1,
                message: 'Conversation marked as read',
                data: { modifiedCount: result.modifiedCount }
            };
        } catch (error) {
            console.error('Error in markConversationAsRead:', error);
            return {
                status: 0,
                message: error.message || 'Error marking conversation as read'
            };
        }
    }

    /**
     * Purpose: Soft delete a message (user can delete their own messages)
     * Parameters:
     *   - messageId: ID of the message to delete
     *   - userId: ID of the user deleting the message (must be sender)
     * Returns: Updated message
     */
    async deleteMessage(messageId, userId) {
        try {
            if (!ObjectId.isValid(messageId) || !ObjectId.isValid(userId)) {
                return {
                    status: 0,
                    message: 'Invalid message or user ID'
                };
            }

            const message = await Messages.findById(messageId);
            if (!message) {
                return {
                    status: 0,
                    message: 'Message not found'
                };
            }

            // Only sender can delete their own message
            if (message.senderId.toString() !== userId.toString()) {
                return {
                    status: 0,
                    message: 'You can only delete your own messages'
                };
            }

            const updatedMessage = await Messages.findByIdAndUpdate(
                messageId,
                { isDeleted: true, message: '[Message deleted]' },
                { new: true }
            );

            return {
                status: 1,
                message: 'Message deleted successfully',
                data: updatedMessage
            };
        } catch (error) {
            console.error('Error in deleteMessage:', error);
            return {
                status: 0,
                message: error.message || 'Error deleting message'
            };
        }
    }

    /**
     * Purpose: Get list of conversations for a user
     * Parameters:
     *   - userId: ID of the user
     *   - page: Pagination page (default: 1)
     *   - limit: Conversations per page (default: 20)
     * Returns: List of conversations with last message and unread count
     */
    async getConversationList(userId, page = 1, limit = 20) {
        try {
            if (!ObjectId.isValid(userId)) {
                return {
                    status: 0,
                    message: 'Invalid user ID'
                };
            }

            const skip = (page - 1) * limit;

            // Find conversations where user is one of the participants
            const conversations = await Conversations.find({
                $or: [
                    { participant1Id: new ObjectId(userId) },
                    { participant2Id: new ObjectId(userId) }
                ],
                isActive: true
            })
                .populate({
                    path: 'participant1Id',
                    select: '-password -phoneNumber -email -address -aadharNumber -panNumber'
                })
                .populate({
                    path: 'participant2Id',
                    select: '-password -phoneNumber -email -address -aadharNumber -panNumber'
                })
                .populate({
                    path: 'requestId',
                    select: 'bloodGroup pincode address'
                })
                .sort({ lastMessageTime: -1 })
                .skip(skip)
                .limit(limit)
                .lean();

            // Get total count
            const totalConversations = await Conversations.countDocuments({
                $or: [
                    { participant1Id: new ObjectId(userId) },
                    { participant2Id: new ObjectId(userId) }
                ],
                isActive: true
            });

            return {
                status: 1,
                message: 'Conversations fetched successfully',
                data: {
                    conversations,
                    pagination: {
                        currentPage: page,
                        totalPages: Math.ceil(totalConversations / limit),
                        totalConversations,
                        limit
                    }
                }
            };
        } catch (error) {
            console.error('Error in getConversationList:', error);
            return {
                status: 0,
                message: error.message || 'Error fetching conversations'
            };
        }
    }

    /**
     * Purpose: Get unread message count for all conversations of a user
     * Parameters:
     *   - userId: ID of the user
     * Returns: Total unread message count
     */
    async getUnreadCount(userId) {
        try {
            if (!ObjectId.isValid(userId)) {
                return {
                    status: 0,
                    message: 'Invalid user ID'
                };
            }

            const unreadCount = await Messages.countDocuments({
                receiverId: new ObjectId(userId),
                isRead: false,
                isDeleted: false
            });

            return {
                status: 1,
                message: 'Unread count fetched successfully',
                data: { unreadCount }
            };
        } catch (error) {
            console.error('Error in getUnreadCount:', error);
            return {
                status: 0,
                message: error.message || 'Error fetching unread count'
            };
        }
    }

    /**
     * Purpose: Get unread count for a specific conversation
     * Parameters:
     *   - requestId: The request/conversation ID
     *   - userId: ID of the user checking unread count
     * Returns: Number of unread messages
     */
    async getUnreadCountForChat(requestId, userId) {
        try {
            if (!ObjectId.isValid(requestId) || !ObjectId.isValid(userId)) {
                return {
                    status: 0,
                    message: 'Invalid request or user ID'
                };
            }

            const unreadCount = await Messages.countDocuments({
                requestId: new ObjectId(requestId),
                receiverId: new ObjectId(userId),
                isRead: false,
                isDeleted: false
            });

            return {
                status: 1,
                message: 'Unread count for chat fetched successfully',
                data: { unreadCount }
            };
        } catch (error) {
            console.error('Error in getUnreadCountForChat:', error);
            return {
                status: 0,
                message: error.message || 'Error fetching unread count'
            };
        }
    }

    /**
     * Purpose: Update conversation metadata after new message
     * Parameters:
     *   - senderId, receiverId, requestId, message
     * Returns: Updated conversation
     */
    async updateConversation(senderId, receiverId, requestId, message) {
        try {
            // Check if conversation exists
            let conversation = await Conversations.findOne({
                requestId: new ObjectId(requestId)
            });

            if (!conversation) {
                // Create new conversation
                conversation = new Conversations({
                    participant1Id: new ObjectId(senderId),
                    participant2Id: new ObjectId(receiverId),
                    requestId: new ObjectId(requestId),
                    lastMessage: message,
                    lastMessageTime: new Date()
                });
                await conversation.save();
            } else {
                // Update existing conversation
                conversation.lastMessage = message;
                conversation.lastMessageTime = new Date();
                
                // Increment unread count for receiver
                if (conversation.participant1Id.toString() === senderId) {
                    conversation.unreadCount2 += 1;
                } else {
                    conversation.unreadCount1 += 1;
                }
                
                await conversation.save();
            }

            return conversation;
        } catch (error) {
            console.error('Error in updateConversation:', error);
        }
    }

    /**
     * Purpose: Reset unread count in conversation when user reads messages
     * Parameters:
     *   - requestId: The request/conversation ID
     *   - userId: ID of the user reading the messages
     * Returns: Updated conversation
     */
    async resetUnreadCount(requestId, userId) {
        try {
            const conversation = await Conversations.findOne({
                requestId: new ObjectId(requestId)
            });

            if (!conversation) {
                return null;
            }

            // Reset unread count based on which participant is reading
            if (conversation.participant1Id.toString() === userId.toString()) {
                conversation.unreadCount1 = 0;
            } else {
                conversation.unreadCount2 = 0;
            }

            await conversation.save();
            return conversation;
        } catch (error) {
            console.error('Error in resetUnreadCount:', error);
        }
    }
}

module.exports = ChatController;
