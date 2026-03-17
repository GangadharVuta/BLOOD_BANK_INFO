/**
 * ============================================
 * CHAT MESSAGE SCHEMA
 * ============================================
 * Stores real-time chat messages between donors and recipients
 * Only accessible after a blood request is accepted
 */

const mongoose = require('mongoose');
const schema = mongoose.Schema;

/**
 * Message Schema Structure
 * Fields:
 * - senderId: Reference to the user sending the message
 * - receiverId: Reference to the user receiving the message
 * - requestId: Reference to the blood request this chat is associated with
 * - message: The actual message content
 * - timestamp: When the message was sent (auto-set)
 * - isRead: Whether the recipient has read the message
 * - isDeleted: Soft delete flag
 */
const messageSchema = new schema({
    senderId: {
        type: schema.Types.ObjectId,
        ref: 'Users',
        required: true,
        index: true
    },
    receiverId: {
        type: schema.Types.ObjectId,
        ref: 'Users',
        required: true,
        index: true
    },
    requestId: {
        type: schema.Types.ObjectId,
        ref: 'requests',
        required: true,
        index: true
    },
    message: {
        type: String,
        required: true,
        trim: true,
        maxlength: 5000
    },
    isRead: {
        type: Boolean,
        default: false
    },
    isDeleted: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true  // Automatically adds createdAt and updatedAt
});

/**
 * Compound index for efficient querying:
 * - Fetch all messages for a specific chat pair
 * - Sorted by timestamp
 */
messageSchema.index({ senderId: 1, receiverId: 1, requestId: 1 });
messageSchema.index({ requestId: 1, createdAt: -1 });

/**
 * Conversation Schema
 * Tracks metadata about each conversation between two users
 * Helps with listing active chats and counting unread messages
 */
const conversationSchema = new schema({
    participant1Id: {
        type: schema.Types.ObjectId,
        ref: 'Users',
        required: true
    },
    participant2Id: {
        type: schema.Types.ObjectId,
        ref: 'Users',
        required: true
    },
    requestId: {
        type: schema.Types.ObjectId,
        ref: 'requests',
        required: true,
        unique: true,
        index: true
    },
    lastMessage: {
        type: String,
        default: ''
    },
    lastMessageTime: {
        type: Date,
        default: Date.now
    },
    unreadCount1: {
        type: Number,
        default: 0
    },
    unreadCount2: {
        type: Number,
        default: 0
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

const Messages = mongoose.model('messages', messageSchema);
const Conversations = mongoose.model('conversations', conversationSchema);

module.exports = {
    Messages,
    Conversations,
    messageSchema,
    conversationSchema
};
