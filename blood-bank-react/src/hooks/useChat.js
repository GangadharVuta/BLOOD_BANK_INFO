/**
 * ============================================
 * USE CHAT HOOK
 * ============================================
 * Custom React hook for managing chat functionality
 * Handles:
 * - Fetching messages with pagination
 * - Listening for real-time messages
 * - Managing typing status
 * - Checking online status
 * - Sending messages
 * - Marking messages as read
 * - Deleting messages
 * 
 * Production-ready with cleanup and memory leak prevention
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import socketClient from '../services/socketClient';
import chatService from '../services/chatService';

const useChat = (requestId, otherUserId) => {
  // State
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [currentUserId, setCurrentUserId] = useState('');
  const [isUserOnline, setIsUserOnline] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [showTypingIndicator, setShowTypingIndicator] = useState(false);
  
  // Refs
  const typingTimeoutRef = useRef(null);
  const messagesEndRef = useRef(null);
  const isMountedRef = useRef(true);

  /**
   * Initialize chat - fetch user data and connect socket
   */
  useEffect(() => {
    const initChat = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Get current user ID
        const userId = localStorage.getItem('userId') || localStorage.getItem('id');
        if (!isMountedRef.current) return;
        setCurrentUserId(userId);

        // Connect to socket
        const token = localStorage.getItem('token') || localStorage.getItem('authToken');
        if (!token) {
          throw new Error('Authentication token not found');
        }

        await socketClient.connect(token);
        if (!isMountedRef.current) return;
        
        socketClient.joinChat(requestId);

        // Fetch initial chat history
        const chatHistory = await chatService.getChatHistory(requestId, 1, 50);
        if (!isMountedRef.current) return;
        
        if (chatHistory && chatHistory.messages) {
          const formattedMessages = chatHistory.messages.map(msg =>
            chatService.formatMessageForDisplay(msg)
          );
          setMessages(formattedMessages);

          // Mark messages as read
          const unread = await chatService.getUnreadCountForChat(requestId);
          if (unread > 0) {
            await chatService.markConversationAsRead(requestId);
          }
        }

        // Check online status
        const status = await socketClient.checkUserOnlineStatus(otherUserId);
        if (isMountedRef.current) {
          setIsUserOnline(status.isOnline);
        }

      } catch (err) {
        if (isMountedRef.current) {
          console.error('Error initializing chat:', err);
          setError(err.message || 'Failed to initialize chat');
        }
      } finally {
        if (isMountedRef.current) {
          setIsLoading(false);
        }
      }
    };

    initChat();

    return () => {
      if (socketClient.isConnected) {
        socketClient.leaveChat(requestId);
      }
    };
  }, [requestId, otherUserId]);

  /**
   * Listen for incoming messages
   */
  useEffect(() => {
    const handleMessageReceived = (message) => {
      if (!isMountedRef.current) return;

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

      // Auto-mark as read if it's for current user
      if (message.receiverId._id === currentUserId && !message.isRead) {
        socketClient.markMessageAsRead(message._id, requestId);
      }
    };

    socketClient.on('receive_message', handleMessageReceived);

    return () => {
      socketClient.off('receive_message', handleMessageReceived);
    };
  }, [currentUserId, requestId]);

  /**
   * Listen for message read receipts
   */
  useEffect(() => {
    const handleMessageRead = (data) => {
      if (!isMountedRef.current) return;

      setMessages(prev =>
        prev.map(msg =>
          msg._id === data.messageId ? { ...msg, isRead: true } : msg
        )
      );
    };

    socketClient.on('message_read_receipt', handleMessageRead);

    return () => {
      socketClient.off('message_read_receipt', handleMessageRead);
    };
  }, []);

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

    socketClient.on('user_online', handleUserOnline);
    socketClient.on('user_offline', handleUserOffline);

    return () => {
      socketClient.off('user_online', handleUserOnline);
      socketClient.off('user_offline', handleUserOffline);
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

    socketClient.on('user_typing', handleTypingStatus);

    return () => {
      socketClient.off('user_typing', handleTypingStatus);
    };
  }, [otherUserId]);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  /**
   * Scroll to bottom of message list
   */
  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 0);
  }, []);

  /**
   * Send a message
   */
  const sendMessage = useCallback(async (messageText) => {
    if (!messageText.trim()) {
      return;
    }

    try {
      socketClient.sendMessage(otherUserId, requestId, messageText);
      setIsTyping(false);
      socketClient.sendTypingStatus(requestId, false);
      return true;
    } catch (err) {
      console.error('Error sending message:', err);
      if (isMountedRef.current) {
        setError('Failed to send message');
      }
      return false;
    }
  }, [otherUserId, requestId]);

  /**
   * Handle typing with debounce
   */
  const handleTyping = useCallback((isTyping) => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    if (isTyping) {
      setIsTyping(true);
      socketClient.sendTypingStatus(requestId, true);

      // Stop typing after 2 seconds
      typingTimeoutRef.current = setTimeout(() => {
        setIsTyping(false);
        socketClient.sendTypingStatus(requestId, false);
      }, 2000);
    } else {
      setIsTyping(false);
      socketClient.sendTypingStatus(requestId, false);
    }
  }, [requestId]);

  /**
   * Load previous messages
   */
  const loadMoreMessages = useCallback(async () => {
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
      if (isMountedRef.current) {
        setError('Failed to load more messages');
      }
    }
  }, [page, requestId]);

  /**
   * Delete a message
   */
  const deleteMessage = useCallback(async (messageId) => {
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
      if (isMountedRef.current) {
        setError('Failed to delete message');
      }
    }
  }, []);

  /**
   * Mark message as read manually
   */
  const markMessageAsRead = useCallback(async (messageId) => {
    try {
      await chatService.markMessageAsRead(messageId);
      setMessages(prev =>
        prev.map(msg =>
          msg._id === messageId ? { ...msg, isRead: true } : msg
        )
      );
    } catch (err) {
      console.error('Error marking message as read:', err);
    }
  }, []);

  /**
   * Check user online status
   */
  const checkUserStatus = useCallback(async (userId) => {
    try {
      const status = await socketClient.checkUserOnlineStatus(userId);
      return status.isOnline;
    } catch (err) {
      console.error('Error checking user status:', err);
      return false;
    }
  }, []);

  return {
    // State
    messages,
    isLoading,
    error,
    hasMoreMessages,
    isUserOnline,
    showTypingIndicator,
    currentUserId,
    
    // Refs
    messagesEndRef,
    
    // Methods
    sendMessage,
    handleTyping,
    loadMoreMessages,
    deleteMessage,
    markMessageAsRead,
    checkUserStatus,
    scrollToBottom,
    setError
  };
};

export default useChat;
