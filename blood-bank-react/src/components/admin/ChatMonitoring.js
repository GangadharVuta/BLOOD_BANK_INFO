/**
 * ============================================
 * CHAT MONITORING COMPONENT
 * ============================================
 * Allows admins to monitor and view all user chat conversations
 */

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import { useNavigate } from 'react-router-dom';
import './ChatMonitoring.css';

const ChatMonitoring = () => {
  const navigate = useNavigate();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [selectedChat, setSelectedChat] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatLoading, setChatLoading] = useState(false);

  const adminRole = localStorage.getItem('adminRole') || '';

  useEffect(() => {
    if (adminRole !== 'super_admin' && adminRole !== 'admin') {
      return;
    }

    fetchConversations();
  }, [currentPage, search]);

  const getToken = () => localStorage.getItem('adminToken');

  const fetchConversations = async () => {
    try {
      setLoading(true);
      const token = getToken();
      if (!token) {
        navigate('/admin/login');
        return;
      }

      const params = new URLSearchParams({
        page: currentPage,
        limit: 20,
        ...(search && { search })
      });

      const response = await axios.get(
        `/api/admin/chat/conversations?${params}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        setConversations(response.data.data.conversations || []);
        setTotalPages(response.data.data.pagination.pages);
      }
    } catch (err) {
      console.error('Error fetching conversations:', err);
      if (err.response?.status === 401) {
        navigate('/admin/login');
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Failed to load chat conversations'
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleViewChat = async (conversation) => {
    try {
      setChatLoading(true);
      setSelectedChat(conversation);

      const token = getToken();
      const response = await axios.get(
        `/api/admin/chat/history/${conversation.requestId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        setChatMessages(response.data.data.messages || []);
      }
    } catch (err) {
      console.error('Error fetching chat history:', err);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to load chat messages'
      });
    } finally {
      setChatLoading(false);
    }
  };

  const closeChatView = () => {
    setSelectedChat(null);
    setChatMessages([]);
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="chat-monitoring">
      <div className="chat-monitoring-header">
        <h2>Chat Monitoring</h2>
        <p>Monitor and view all user chat conversations</p>
      </div>

      <div className="chat-monitoring-content">
        {/* Conversations List */}
        <div className="conversations-panel">
          <div className="conversations-header">
            <h3>Active Conversations</h3>
            <div className="search-bar">
              <input
                type="text"
                placeholder="Search by patient name, blood group, or location..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <button onClick={fetchConversations}>Search</button>
            </div>
          </div>

          {loading ? (
            <div className="loading">Loading conversations...</div>
          ) : (
            <div className="conversations-list">
              {conversations.length === 0 ? (
                <div className="no-conversations">No conversations found</div>
              ) : (
                conversations.map((conv) => (
                  <div
                    key={conv._id}
                    className={`conversation-item ${selectedChat?._id === conv._id ? 'active' : ''}`}
                    onClick={() => handleViewChat(conv)}
                  >
                    <div className="conversation-info">
                      <h4>{conv.request?.patientName || 'Unknown Patient'}</h4>
                      <p className="blood-group">{conv.request?.bloodGroup || 'N/A'}</p>
                      <p className="location">{conv.request?.location || 'N/A'}</p>
                    </div>
                    <div className="conversation-stats">
                      <span className="message-count">{conv.messageCount} messages</span>
                      {conv.unreadCount > 0 && (
                        <span className="unread-badge">{conv.unreadCount} unread</span>
                      )}
                    </div>
                    <div className="conversation-time">
                      {conv.lastMessage && formatTime(conv.lastMessage.createdAt)}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="pagination">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(currentPage - 1)}
              >
                Previous
              </button>
              <span>Page {currentPage} of {totalPages}</span>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(currentPage + 1)}
              >
                Next
              </button>
            </div>
          )}
        </div>

        {/* Chat View */}
        <div className="chat-panel">
          {selectedChat ? (
            <>
              <div className="chat-header">
                <h3>Chat: {selectedChat.request?.patientName || 'Unknown'}</h3>
                <p>{selectedChat.request?.bloodGroup} - {selectedChat.request?.location}</p>
                <button className="close-chat" onClick={closeChatView}>×</button>
              </div>

              <div className="chat-messages">
                {chatLoading ? (
                  <div className="loading">Loading messages...</div>
                ) : chatMessages.length === 0 ? (
                  <div className="no-messages">No messages in this conversation</div>
                ) : (
                  chatMessages.map((msg) => (
                    <div key={msg._id} className={`message ${msg.senderType}`}>
                      <div className="message-header">
                        <strong>{msg.senderId?.name || 'Unknown'}</strong>
                        <span className="message-time">{formatTime(msg.createdAt)}</span>
                      </div>
                      <div className="message-content">{msg.message}</div>
                    </div>
                  ))
                )}
              </div>
            </>
          ) : (
            <div className="no-chat-selected">
              <h3>Select a conversation</h3>
              <p>Click on a conversation from the list to view the chat messages</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatMonitoring;