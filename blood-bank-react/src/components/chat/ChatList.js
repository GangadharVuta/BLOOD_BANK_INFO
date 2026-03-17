/**
 * ============================================
 * CHAT LIST COMPONENT
 * ============================================
 * Display all active conversations/chats
 * Shows:
 * - Last message preview
 * - Unread count
 * - Last message timestamp
 * - Online status
 */

import React, { useState, useEffect } from 'react';
import chatService from '../services/chatService';
import socketClient from '../services/socketClient';
import './ChatList.css';

const ChatList = ({ onSelectConversation, selectedConversationId }) => {
    const [conversations, setConversations] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [page, setPage] = useState(1);
    const [hasMoreConversations, setHasMoreConversations] = useState(true);
    const [onlineUsers, setOnlineUsers] = useState(new Set());
    const [totalUnread, setTotalUnread] = useState(0);

    /**
     * Fetch conversations on component mount
     */
    useEffect(() => {
        const fetchConversations = async () => {
            try {
                setIsLoading(true);
                const result = await chatService.getConversationList(1, 20);

                if (result && result.conversations) {
                    const formattedConversations = result.conversations.map(conv =>
                        chatService.formatConversationForDisplay(conv)
                    );
                    setConversations(formattedConversations);

                    // Calculate total unread
                    const totalUnread = formattedConversations.reduce(
                        (sum, conv) => sum + conv.unreadCount,
                        0
                    );
                    setTotalUnread(totalUnread);

                    if (result.pagination.currentPage >= result.pagination.totalPages) {
                        setHasMoreConversations(false);
                    }
                }

                setError(null);
            } catch (err) {
                console.error('Error fetching conversations:', err);
                setError(err.message || 'Failed to fetch conversations');
            } finally {
                setIsLoading(false);
            }
        };

        fetchConversations();
    }, []);

    /**
     * Listen for online/offline status changes
     */
    useEffect(() => {
        const handleUserOnline = (data) => {
            setOnlineUsers(prev => new Set([...prev, data.userId]));
        };

        const handleUserOffline = (data) => {
            setOnlineUsers(prev => {
                const updated = new Set(prev);
                updated.delete(data.userId);
                return updated;
            });
        };

        socketClient.on('userOnline', handleUserOnline);
        socketClient.on('userOffline', handleUserOffline);

        return () => {
            socketClient.off('userOnline', handleUserOnline);
            socketClient.off('userOffline', handleUserOffline);
        };
    }, []);

    /**
     * Listen for new messages
     */
    useEffect(() => {
        const handleMessageReceived = (message) => {
            // Update the conversation with new message
            setConversations(prev =>
                prev.map(conv => {
                    if (conv.requestId === message.requestId) {
                        return {
                            ...conv,
                            lastMessage: message.message,
                            lastMessageTime: new Date(message.timestamp),
                            unreadCount: conv.unreadCount + 1
                        };
                    }
                    return conv;
                })
            );
        };

        socketClient.on('messageReceived', handleMessageReceived);

        return () => {
            socketClient.off('messageReceived', handleMessageReceived);
        };
    }, []);

    /**
     * Format relative time
     */
    const formatRelativeTime = (date) => {
        const now = new Date();
        const diffMs = now - new Date(date);
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) {
            return 'Just now';
        } else if (diffMins < 60) {
            return `${diffMins}m ago`;
        } else if (diffHours < 24) {
            return `${diffHours}h ago`;
        } else if (diffDays < 7) {
            return `${diffDays}d ago`;
        } else {
            const dateObj = new Date(date);
            return dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        }
    };

    /**
     * Truncate message preview
     */
    const truncateMessage = (message, length = 50) => {
        return message.length > length ? message.substring(0, length) + '...' : message;
    };

    /**
     * Load more conversations
     */
    const handleLoadMore = async () => {
        try {
            const nextPage = page + 1;
            const result = await chatService.getConversationList(nextPage, 20);

            if (result && result.conversations) {
                const newConversations = result.conversations.map(conv =>
                    chatService.formatConversationForDisplay(conv)
                );
                setConversations(prev => [...prev, ...newConversations]);

                if (nextPage >= result.pagination.totalPages) {
                    setHasMoreConversations(false);
                }

                setPage(nextPage);
            }
        } catch (err) {
            console.error('Error loading more conversations:', err);
        }
    };

    if (isLoading) {
        return <div className="chat-list-loading">Loading conversations...</div>;
    }

    return (
        <div className="chat-list-container">
            {/* Header */}
            <div className="chat-list-header">
                <h2 className="chat-list-title">Messages</h2>
                {totalUnread > 0 && (
                    <span className="unread-badge">{totalUnread}</span>
                )}
            </div>

            {/* Error Message */}
            {error && (
                <div className="chat-list-error">
                    <p>{error}</p>
                </div>
            )}

            {/* Conversations List */}
            <div className="conversations-list">
                {conversations.length === 0 ? (
                    <div className="no-conversations">
                        <p>No conversations yet</p>
                    </div>
                ) : (
                    <>
                        {conversations.map(conversation => (
                            <div
                                key={conversation.conversationId}
                                className={`conversation-item ${
                                    selectedConversationId === conversation.requestId
                                        ? 'active'
                                        : ''
                                }`}
                                onClick={() => onSelectConversation(conversation)}
                            >
                                {/* Avatar with online status */}
                                <div className="conversation-avatar-container">
                                    <div className="conversation-avatar">
                                        {conversation.otherParticipant.name
                                            .split(' ')
                                            .map(n => n[0])
                                            .join('')
                                            .substring(0, 2)
                                            .toUpperCase()}
                                    </div>
                                    {onlineUsers.has(conversation.otherParticipant.id) && (
                                        <div className="online-indicator"></div>
                                    )}
                                </div>

                                {/* Conversation Info */}
                                <div className="conversation-content">
                                    {/* Header: Name and Time */}
                                    <div className="conversation-header">
                                        <h3 className="conversation-name">
                                            {conversation.otherParticipant.name}
                                        </h3>
                                        <span className="conversation-time">
                                            {formatRelativeTime(conversation.lastMessageTime)}
                                        </span>
                                    </div>

                                    {/* Body: Message Preview and Details */}
                                    <div className="conversation-body">
                                        <p className={`conversation-preview ${
                                            conversation.unreadCount > 0 ? 'unread' : ''
                                        }`}>
                                            {truncateMessage(conversation.lastMessage)}
                                        </p>

                                        {/* Blood Group and Details */}
                                        <div className="conversation-details">
                                            <span className="detail-badge blood-type">
                                                {conversation.bloodGroup}
                                            </span>
                                            <span className="detail-badge location">
                                                📍 {conversation.pincode}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Unread Count */}
                                {conversation.unreadCount > 0 && (
                                    <div className="unread-count">
                                        {conversation.unreadCount}
                                    </div>
                                )}
                            </div>
                        ))}

                        {/* Load More Button */}
                        {hasMoreConversations && (
                            <button className="load-more-btn" onClick={handleLoadMore}>
                                Load More Conversations
                            </button>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default ChatList;
