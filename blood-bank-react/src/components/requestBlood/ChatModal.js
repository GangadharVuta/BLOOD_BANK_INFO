/**
 * ============================================
 * CHAT MODAL COMPONENT
 * ============================================
 * Modal wrapper for Chat component on Request Page
 * Provides communication between donor and recipient
 */

import React from 'react';
import Chat from '../chat/Chat';
import './ChatModal.css';

const ChatModal = ({
  donorId,
  currentUserId,
  requestId,
  bloodGroup,
  location,
  onClose
}) => {
  /**
   * Handle backdrop click to close modal
   */
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  /**
   * Prevent backdrop click when clicking on modal content
   */
  const handleModalClick = (e) => {
    e.stopPropagation();
  };

  return (
    <div className="chat-modal-overlay" onClick={handleBackdropClick}>
      <div className="chat-modal-container" onClick={handleModalClick}>
        {/* Modal Header */}
        <div className="chat-modal-header">
          <div className="modal-header-content">
            <h2 className="modal-title">💬 Blood Donor Chat</h2>
            <div className="modal-subtitle">
              <span className="blood-group-badge">{bloodGroup}</span>
              <span className="location-info">📍 {location}</span>
            </div>
          </div>

          {/* Close Button */}
          <button
            className="modal-close-btn"
            onClick={onClose}
            title="Close chat"
            aria-label="Close chat modal"
          >
            ✕
          </button>
        </div>

        {/* Modal Body - Chat Component */}
        <div className="chat-modal-body">
          <Chat
            requestId={requestId}
            otherUserId={donorId}
            otherUserName="Blood Donor"
            otherUserBloodGroup={bloodGroup}
          />
        </div>
      </div>
    </div>
  );
};

export default ChatModal;
