/**
 * ============================================
 * DONOR CARD COMPONENT
 * ============================================
 * Privacy-focused donor card for Request Page
 * Shows only: Blood Group, Location, Availability
 * Hides: Name, Phone number
 * Action: Chat button for real-time messaging
 */

import React, { useState, useEffect } from 'react';
import ChatModal from './ChatModal';
import './DonorCard.css';

const DonorCard = ({ 
  donor, 
  isSelected, 
  onSelect, 
  currentUserId,
  requestId 
}) => {
  const [showChat, setShowChat] = useState(false);
  const [chatAvailable, setChatAvailable] = useState(false);

  /**
   * Check if chat is available for this request
   * TESTING MODE: Chat always available
   */
  useEffect(() => {
    // For testing: Always enable chat button
    setChatAvailable(true);
  }, []);

  /**
   * Get availability status badge color
   */
  const getAvailabilityColor = () => {
    switch (donor.availability) {
      case 'Available':
        return 'status-available';
      case 'Not Available':
        return 'status-unavailable';
      case 'Pending':
        return 'status-pending';
      default:
        return 'status-available';
    }
  };

  return (
    <>
      <div className={`donor-card ${isSelected ? 'selected' : ''}`}>
        {/* Selection Checkbox */}
        <div className="card-select-overlay">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => onSelect(donor._id)}
            className="donor-checkbox"
            title={isSelected ? 'Deselect donor' : 'Select donor'}
          />
        </div>

        {/* Donor Type Badge */}
        <div className={`donor-badge ${donor.donorType || 'manual'}`}>
          {donor.donorType === 'registered' ? '🟢 Registered' : '🔵 Donor'}
        </div>

        {/* Main Card Content */}
        <div className="card-content">
          {/* Blood Group - Large Display */}
          <div className="blood-group-section">
            <div className="blood-group-circle">
              {donor.bloodGroup}
            </div>
          </div>

          {/* Location Information */}
          <div className="location-section">
            <div className="location-item">
              <span className="location-icon">📍</span>
              <div className="location-text">
                <p className="location-label">Location</p>
                <p className="location-value">
                  {donor.village && donor.city 
                    ? `${donor.village}, ${donor.city}`
                    : donor.pincode || 'Not specified'
                  }
                </p>
              </div>
            </div>
          </div>

          {/* Availability Status */}
          <div className="availability-section">
            <div className="availability-item">
              <span className="availability-icon">
                {donor.availability === 'Available' && '🟢'}
                {donor.availability === 'Not Available' && '🔴'}
                {donor.availability === 'Pending' && '🟡'}
              </span>
              <div className="availability-text">
                <p className="availability-label">Status</p>
                <p className={`availability-value ${getAvailabilityColor()}`}>
                  {donor.availability || 'Available'}
                </p>
              </div>
            </div>
          </div>

          {/* Privacy Notice */}
          <div className="privacy-notice">
            🔒 Contact details shared only in chat
          </div>
        </div>

        {/* Action Buttons */}
        <div className="card-actions">
          {/* Chat Button - Opens real-time chat */}
          {chatAvailable && (
            <button
              className="action-btn chat-btn"
              onClick={() => setShowChat(true)}
              title="Start chat with donor"
            >
              💬 Chat
            </button>
          )}

          {/* Request/Select Button */}
          <button
            className={`action-btn request-btn ${isSelected ? 'active' : ''}`}
            onClick={() => onSelect(donor._id)}
            title={isSelected ? 'Deselect donor' : 'Select donor for blood request'}
          >
            {isSelected ? '✓ Selected' : '❤️ Request'}
          </button>
        </div>
      </div>

      {/* Chat Modal */}
      {showChat && (
        <ChatModal
          donorId={donor._id}
          currentUserId={currentUserId}
          requestId={requestId}
          bloodGroup={donor.bloodGroup}
          location={
            (donor.village && donor.city) 
              ? `${donor.village}, ${donor.city}`
              : donor.city 
                ? donor.city
                : donor.village 
                  ? donor.village
                  : donor.pincode || 'Location not available'
          }
          onClose={() => setShowChat(false)}
        />
      )}
    </>
  );
};

export default DonorCard;
