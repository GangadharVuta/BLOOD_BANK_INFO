/**
 * ============================================
 * DONOR CARD COMPONENT
 * ============================================
 * Privacy-focused donor information card
 * Features:
 * - Shows: Blood Group, Location (City/Village), Availability Status
 * - Hides: Name, Phone (shared only via chat)
 * - Actions: Chat button (real-time) + Request button
 * - Clean, responsive design with hover effects
 */

import React, { useState, useCallback } from 'react';
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

  /**
   * Get availability status styling
   */
  const getAvailabilityStatus = useCallback(() => {
    const statusMap = {
      'Available': { color: 'status-available', icon: '🟢' },
      'Not Available': { color: 'status-unavailable', icon: '🔴' },
      'Pending': { color: 'status-pending', icon: '🟡' },
    };
    return statusMap[donor.availability] || statusMap['Available'];
  }, [donor.availability]);

  return (
    <>
      <div className={`donor-card ${isSelected ? 'selected' : ''}`}>
        {/* Selection Checkbox - Top Left */}
        <div className="card-select-overlay">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => onSelect(donor._id)}
            className="donor-checkbox"
            title={isSelected ? 'Deselect donor' : 'Select donor'}
            aria-label={`Select donor for blood request`}
          />
        </div>

        {/* Donor Type Badge - Top Right */}
        <div className={`donor-badge ${donor.donorType || 'manual'}`}>
          {donor.donorType === 'registered' ? '🟢 Registered' : '🩸 Donor'}
        </div>

        {/* Main Content Section */}
        <div className="card-content">
          {/* Blood Group - Large Prominent Display */}
          <div className="blood-group-section">
            <div className="blood-group-circle" title={`Blood Group: ${donor.bloodGroup}`}>
              {donor.bloodGroup}
            </div>
          </div>

          {/* Location Information - City/Village */}
          <div className="location-section">
            <span className="location-icon">📍</span>
            <div className="location-text">
              <p className="location-label">Location</p>
              <p className="location-value">
                {donor.village && donor.city 
                  ? `${donor.village}, ${donor.city}`
                  : donor.pincode || 'Location unavailable'
                }
              </p>
            </div>
          </div>

          {/* Availability Status */}
          <div className="availability-section">
            <span className="availability-icon">
              {getAvailabilityStatus().icon}
            </span>
            <div className="availability-text">
              <p className="availability-label">Status</p>
              <p className={`availability-value ${getAvailabilityStatus().color}`}>
                {donor.availability || 'Available'}
              </p>
            </div>
          </div>

          {/* Privacy Notice - Always visible */}
          <div className="privacy-notice">
            🔒 Contact details shared only in chat
          </div>
        </div>

        {/* Action Buttons - Bottom */}
        <div className="card-actions">
          {/* Chat Button - Opens real-time messaging */}
          <button
            className="action-btn chat-btn"
            onClick={() => setShowChat(true)}
            title="Start real-time chat with donor"
            aria-label="Open chat with donor"
          >
            💬 Chat
          </button>

          {/* Request/Select Button - Shows selection state */}
          <button
            className={`action-btn request-btn ${isSelected ? 'active' : ''}`}
            onClick={() => onSelect(donor._id)}
            title={isSelected ? 'Deselect donor' : 'Select donor for blood request'}
            aria-label={isSelected ? 'Deselect donor' : 'Select donor'}
            aria-pressed={isSelected}
          >
            {isSelected ? '✓ Selected' : '❤️ Request'}
          </button>
        </div>
      </div>

      {/* Chat Modal - Opens when chat button clicked */}
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
                  : donor.pincode || 'Location'
          }
          onClose={() => setShowChat(false)}
        />
      )}
    </>
  );
};

export default DonorCard;
