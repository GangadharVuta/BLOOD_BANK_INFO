/**
 * ============================================
 * CHAT COMPONENT
 * ============================================
 * Main chat interface with real-time messaging
 * Features:
 * - Real-time message sending/receiving with Socket.io
 * - Message history fetching with pagination
 * - Online/offline status tracking
 * - Typing indicators
 * - Message read receipts
 * - WhatsApp-like UI
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import socketClient from '../../services/socketClient';
import chatService from '../../services/chatService';
import './Chat.css';

const Chat = ({ requestId, otherUserId, otherUserName, otherUserBloodGroup }) => {
    // State management
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSending, setIsSending] = useState(false);
    const [isUserOnline, setIsUserOnline] = useState(false);
    const [isTyping, setIsTyping] = useState(false);
    const [showTypingIndicator, setShowTypingIndicator] = useState(false);
    const [currentUserId, setCurrentUserId] = useState('');
    const [error, setError] = useState(null);
    const [page, setPage] = useState(1);
    const [hasMoreMessages, setHasMoreMessages] = useState(true);

    // Refs
    const messagesEndRef = useRef(null);
    const typingTimeoutRef = useRef(null);
    const messagesContainerRef = useRef(null);

    /**
     * Scroll to latest message
     */
    const scrollToBottom = useCallback(() => {
        setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 0);
    }, []);

    /**
     * Initialize chat - fetch user data and connect socket
     */
    useEffect(() => {
        const initChat = async () => {
            try {
                setIsLoading(true);

                // Get current user ID from localStorage
                const userId = localStorage.getItem('userId') || localStorage.getItem('id');
                setCurrentUserId(userId);

                // Connect to socket server
                const token = localStorage.getItem('token') || localStorage.getItem('authToken');
                if (!token) {
                    throw new Error('Authentication token not found');
                }

                await socketClient.connect(token);
                socketClient.joinChat(requestId);

                // Fetch chat history
                const chatHistory = await chatService.getChatHistory(requestId, 1, 50);
                if (chatHistory && chatHistory.messages) {
                    setMessages(chatHistory.messages.map(msg =>
                        chatService.formatMessageForDisplay(msg)
                    ));
                }

                // Check unread count
                const unread = await chatService.getUnreadCountForChat(requestId);
                if (unread > 0) {
                    await chatService.markConversationAsRead(requestId);
                }

                setError(null);
            } catch (err) {
                console.error('Error initializing chat:', err);
                setError(err.message || 'Failed to initialize chat');
            } finally {
                setIsLoading(false);
            }
        };

        initChat();

        return () => {
            if (socketClient.isConnected) {
                socketClient.leaveChat(requestId);
            }
        };
    }, [requestId]);

    /**
     * Listen for incoming messages from Socket.io
     */
    useEffect(() => {
        const handleMessageReceived = (message) => {
            const formattedMessage = {
                _id: message._id,
                senderId: message.senderId._id,
                senderName: message.senderId.name,
                senderBloodGroup: message.senderId.bloodGroup,
                receiverId: message.receiverId._id,
                message: message.message,
                timestamp: new Date(message.timestamp),
                isRead: message.isRead,
                isDeleted: false
            };

            setMessages(prev => [...prev, formattedMessage]);
            scrollToBottom();

            // Mark message as read if it's for current user
            if (message.receiverId._id === currentUserId && !message.isRead) {
                socketClient.markMessageAsRead(message._id, requestId);
            }
        };

        socketClient.on('messageReceived', handleMessageReceived);

        return () => {
            socketClient.off('messageReceived', handleMessageReceived);
        };
    }, [currentUserId, requestId, scrollToBottom]);

    /**
     * Listen for online/offline status changes
     */
    useEffect(() => {
        const handleUserOnline = (data) => {
            if (data.userId === otherUserId) {
                setIsUserOnline(true);
            }
        };

        const handleUserOffline = (data) => {
            if (data.userId === otherUserId) {
                setIsUserOnline(false);
            }
        };

        socketClient.on('userOnline', handleUserOnline);
        socketClient.on('userOffline', handleUserOffline);

        // Check initial online status
        socketClient.checkUserOnlineStatus(otherUserId).then(status => {
            setIsUserOnline(status.isOnline);
        });

        return () => {
            socketClient.off('userOnline', handleUserOnline);
            socketClient.off('userOffline', handleUserOffline);
        };
    }, [otherUserId]);

    /**
     * Listen for typing indicators
     */
    useEffect(() => {
        const handleTypingStatus = (data) => {
            if (data.userId === otherUserId) {
                setShowTypingIndicator(data.isTyping);
            }
        };

        socketClient.on('typingStatus', handleTypingStatus);

        return () => {
            socketClient.off('typingStatus', handleTypingStatus);
        };
    }, [otherUserId]);

    /**
     * Listen for message read receipts
     */
    useEffect(() => {
        const handleMessageRead = (data) => {
            setMessages(prev =>
                prev.map(msg =>
                    msg._id === data.messageId ? { ...msg, isRead: true } : msg
                )
            );
        };

        socketClient.on('messageRead', handleMessageRead);

        return () => {
            socketClient.off('messageRead', handleMessageRead);
        };
    }, []);

    /**
     * Send a new message
     */
    const handleSendMessage = async (e) => {
        e.preventDefault();

        if (!newMessage.trim()) {
            return;
        }

        try {
            setIsSending(true);
            socketClient.sendMessage(otherUserId, requestId, newMessage);
            setNewMessage('');
            setIsTyping(false);
            socketClient.sendTypingStatus(requestId, false);
        } catch (err) {
            console.error('Error sending message:', err);
            setError('Failed to send message');
        } finally {
            setIsSending(false);
        }
    };

    /**
     * Handle typing - send typing indicator with debounce
     */
    const handleInputChange = (e) => {
        const value = e.target.value;
        setNewMessage(value);

        // Clear previous timeout
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }

        // Send typing indicator
        if (value.length > 0 && !isTyping) {
            setIsTyping(true);
            socketClient.sendTypingStatus(requestId, true);
        }

        // Stop typing after 2 seconds of no input
        typingTimeoutRef.current = setTimeout(() => {
            setIsTyping(false);
            socketClient.sendTypingStatus(requestId, false);
        }, 2000);
    };

    /**
     * Load previous messages (pagination)
     */
    const handleLoadMoreMessages = async () => {
        try {
            const nextPage = page + 1;
            const chatHistory = await chatService.getChatHistory(requestId, nextPage, 50);

            if (!chatHistory || !chatHistory.messages || chatHistory.messages.length === 0) {
                setHasMoreMessages(false);
                return;
            }

            const newMessages = chatHistory.messages.map(msg =>
                chatService.formatMessageForDisplay(msg)
            );

            setMessages(prev => [...newMessages, ...prev]);
            setPage(nextPage);

            if (nextPage >= chatHistory.pagination.totalPages) {
                setHasMoreMessages(false);
            }
        } catch (err) {
            console.error('Error loading more messages:', err);
        }
    };

    /**
     * Delete a message
     */
    const handleDeleteMessage = async (messageId) => {
        try {
            await chatService.deleteMessage(messageId);
            setMessages(prev =>
                prev.map(msg =>
                    msg._id === messageId
                        ? { ...msg, message: '[Message deleted]', isDeleted: true }
                        : msg
                )
            );
        } catch (err) {
            console.error('Error deleting message:', err);
            setError('Failed to delete message');
        }
    };

    /**
     * Format timestamp to readable format
     */
    const formatTime = (timestamp) => {
        const date = new Date(timestamp);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        if (date.toDateString() === today.toDateString()) {
            return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        } else if (date.toDateString() === yesterday.toDateString()) {
            return 'Yesterday';
        } else {
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        }
    };

    if (isLoading) {
        return <div className="chat-loading">Loading chat...</div>;
    }

    return (
        <div className="chat-container">
            {/* Chat Header */}
            <div className="chat-header">
                <div className="chat-header-info">
                    <h3 className="chat-header-name">{otherUserName}</h3>
                    <div className="chat-header-details">
                        <span className="blood-group-badge">{otherUserBloodGroup}</span>
                        <span className={`online-status ${isUserOnline ? 'online' : 'offline'}`}>
                            {isUserOnline ? '🟢 Online' : '🔴 Offline'}
                        </span>
                    </div>
                </div>
                <div className="chat-header-actions">
                    {/* Add more actions like call, video call, etc. */}
                </div>
            </div>

            {/* Error Message */}
            {error && (
                <div className="chat-error">
                    <p>{error}</p>
                    <button onClick={() => setError(null)}>✕</button>
                </div>
            )}

            {/* Messages Container */}
            <div className="chat-messages" ref={messagesContainerRef}>
                {hasMoreMessages && messages.length > 0 && (
                    <button className="load-more-btn" onClick={handleLoadMoreMessages}>
                        Load Previous Messages
                    </button>
                )}

                {messages.length === 0 ? (
                    <div className="no-messages">
                        <p>No messages yet. Start the conversation!</p>
                    </div>
                ) : (
                    messages.map((message, index) => (
                        <div
                            key={message._id}
                            className={`chat-message ${message.senderId === currentUserId ? 'sent' : 'received'}`}
                            onContextMenu={(e) => {
                                e.preventDefault();
                                if (message.senderId === currentUserId) {
                                    handleDeleteMessage(message._id);
                                }
                            }}
                        >
                            <div className="message-bubble">
                                <p className="message-text">{message.message}</p>
                                <div className="message-footer">
                                    <span className="message-time">{formatTime(message.timestamp)}</span>
                                    {message.senderId === currentUserId && (
                                        <span className="message-status">
                                            {message.isRead ? '👁️' : '✓'}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}

                {/* Typing Indicator */}
                {showTypingIndicator && (
                    <div className="chat-message received">
                        <div className="message-bubble typing-indicator">
                            <span></span>
                            <span></span>
                            <span></span>
                        </div>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <form className="chat-input-container" onSubmit={handleSendMessage}>
                <div className="input-wrapper">
                    <input
                        type="text"
                        className="chat-input"
                        placeholder="Type a message..."
                        value={newMessage}
                        onChange={handleInputChange}
                        disabled={isSending}
                        maxLength={5000}
                    />
                    <span className="char-count">
                        {newMessage.length}/5000
                    </span>
                </div>
                <button
                    type="submit"
                    className="send-btn"
                    disabled={isSending || !newMessage.trim()}
                    title="Send message (Enter or click)"
                >
                    {isSending ? '...' : '➤'}
                </button>
            </form>
        </div>
    );
};

export default Chat;
