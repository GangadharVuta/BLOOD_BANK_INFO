import React from 'react';
import './Card.css';

/**
 * Reusable Card Component
 * Used for displaying donor cards, blood bank cards, etc.
 * 
 * Props:
 * - id: unique identifier for selection purposes
 * - selected: boolean indicating if card is selected
 * - onSelect: callback when checkbox is clicked
 * - badge: badge object {text, type} - type can be 'registered', 'added', 'available', 'success', 'info'
 * - title: main heading (e.g., donor name, blood bank name)
 * - subtitle: secondary text (e.g., blood group, address)
 * - details: array of {label, value} objects
 * - actions: array of {label, onClick, type} objects - type can be 'call', 'request', 'primary', 'secondary'
 * - children: alternative way to pass custom content
 * - showCheckbox: boolean to show/hide selection checkbox
 * - highlightedValue: optionally highlight a value (e.g., blood group)
 */
const Card = ({
  id,
  selected,
  onSelect,
  badge,
  title,
  subtitle,
  details = [],
  actions = [],
  children,
  showCheckbox = true,
  highlightedValue = null,
  highlightLabel = null
}) => {
  return (
    <div className={`card ${selected ? 'card-selected' : ''}`}>
      {/* Selection Checkbox */}
      {showCheckbox && onSelect && (
        <input
          type="checkbox"
          className="card-checkbox"
          checked={selected || false}
          onChange={() => onSelect(id)}
        />
      )}

      {/* Badge */}
      {badge && (
        <span className={`card-badge card-badge-${badge.type}`}>
          {badge.text}
        </span>
      )}

      {/* Custom Children Content */}
      {children ? (
        <div className="card-content">
          {children}
        </div>
      ) : (
        <>
          {/* Title */}
          {title && <h3 className="card-title">{title}</h3>}

          {/* Subtitle */}
          {subtitle && <p className="card-subtitle">{subtitle}</p>}

          {/* Details Section */}
          {details.length > 0 && (
            <div className="card-details">
              {details.map((detail, idx) => (
                <div key={idx} className="card-detail-row">
                  <span className="card-detail-label">{detail.label}</span>
                  <span
                    className={`card-detail-value ${
                      highlightLabel &&
                      detail.label === highlightLabel
                        ? 'card-detail-highlighted'
                        : ''
                    }`}
                  >
                    {detail.value}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Highlighted Value (e.g., Blood Group Badge) */}
          {highlightedValue && (
            <div className="card-highlight">
              {highlightedValue}
            </div>
          )}

          {/* Actions Section */}
          {actions.length > 0 && (
            <div className="card-actions">
              {actions.map((action, idx) => (
                <button
                  key={idx}
                  className={`card-action-btn card-action-btn-${action.type || 'secondary'}`}
                  onClick={action.onClick}
                  disabled={action.disabled}
                >
                  {action.label}
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Card;
