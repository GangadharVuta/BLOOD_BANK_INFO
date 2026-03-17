/**
 * ============================================
 * CHAT ROUTES
 * ============================================
 * REST API endpoints for chat operations
 * All routes require JWT authentication
 */

const ChatController = require('./Controller');
const asyncHandler = require('../../utils/asyncHandler');
const jwt = require('jsonwebtoken');

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        
        if (!token) {
            return res.status(401).json({
                status: 0,
                message: 'Authorization token is required'
            });
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        req.userId = decoded.id || decoded._id;
        next();
    } catch (error) {
        return res.status(401).json({
            status: 0,
            message: 'Invalid or expired token'
        });
    }
};

module.exports = function (app, express) {
    const router = express.Router();
    const chatController = new ChatController();

    /**
     * GET /api/chat/history/:requestId
     * Purpose: Fetch chat history for a specific blood request
     * Query Parameters:
     *   - page: pagination page (default: 1)
     *   - limit: messages per page (default: 50)
     * Authentication: Required (JWT)
     * Returns: Array of messages with sender details
     */
    router.get('/chat/history/:requestId', verifyToken, asyncHandler(async (req, res) => {
        const { requestId } = req.params;
        const { page = 1, limit = 50 } = req.query;

        const result = await chatController.getChatHistory(
            requestId,
            parseInt(page),
            parseInt(limit)
        );

        return res.status(result.status === 1 ? 200 : 400).json(result);
    }));

    /**
     * GET /api/chat/conversations
     * Purpose: Fetch list of all conversations for logged-in user
     * Query Parameters:
     *   - page: pagination page (default: 1)
     *   - limit: conversations per page (default: 20)
     * Authentication: Required (JWT)
     * Returns: List of conversations with last message and unread count
     */
    router.get('/chat/conversations', verifyToken, asyncHandler(async (req, res) => {
        const userId = req.userId;
        const { page = 1, limit = 20 } = req.query;

        const result = await chatController.getConversationList(
            userId,
            parseInt(page),
            parseInt(limit)
        );

        return res.status(result.status === 1 ? 200 : 400).json(result);
    }));

    /**
     * GET /api/chat/unread
     * Purpose: Get total unread message count for user
     * Authentication: Required (JWT)
     * Returns: Total unread message count
     */
    router.get('/chat/unread', verifyToken, asyncHandler(async (req, res) => {
        const userId = req.userId;
        const result = await chatController.getUnreadCount(userId);

        return res.status(result.status === 1 ? 200 : 400).json(result);
    }));

    /**
     * GET /api/chat/unread/:requestId
     * Purpose: Get unread message count for a specific conversation
     * Authentication: Required (JWT)
     * Returns: Unread count for the conversation
     */
    router.get('/chat/unread/:requestId', verifyToken, asyncHandler(async (req, res) => {
        const { requestId } = req.params;
        const userId = req.userId;

        const result = await chatController.getUnreadCountForChat(requestId, userId);

        return res.status(result.status === 1 ? 200 : 400).json(result);
    }));

    /**
     * POST /api/chat/mark-read
     * Purpose: Mark a specific message as read
     * Request Body:
     *   {
     *     "messageId": "message-id"
     *   }
     * Authentication: Required (JWT)
     * Returns: Updated message
     */
    router.post('/chat/mark-read', verifyToken, asyncHandler(async (req, res) => {
        const { messageId } = req.body;

        if (!messageId) {
            return res.status(400).json({
                status: 0,
                message: 'messageId is required'
            });
        }

        const result = await chatController.markMessageAsRead(messageId);

        return res.status(result.status === 1 ? 200 : 400).json(result);
    }));

    /**
     * POST /api/chat/mark-conversation-read/:requestId
     * Purpose: Mark all messages in a conversation as read
     * Authentication: Required (JWT)
     * Returns: Number of messages marked as read
     */
    router.post('/chat/mark-conversation-read/:requestId', verifyToken, asyncHandler(async (req, res) => {
        const { requestId } = req.params;
        const userId = req.userId;

        const result = await chatController.markConversationAsRead(requestId, userId);

        // Also reset unread count in conversation
        await chatController.resetUnreadCount(requestId, userId);

        return res.status(result.status === 1 ? 200 : 400).json(result);
    }));

    /**
     * DELETE /api/chat/message/:messageId
     * Purpose: Soft delete a message (user can only delete their own)
     * Authentication: Required (JWT)
     * Returns: Updated message
     */
    router.delete('/chat/message/:messageId', verifyToken, asyncHandler(async (req, res) => {
        const { messageId } = req.params;
        const userId = req.userId;

        const result = await chatController.deleteMessage(messageId, userId);

        return res.status(result.status === 1 ? 200 : 400).json(result);
    }));

    app.use('/api', router);
};
