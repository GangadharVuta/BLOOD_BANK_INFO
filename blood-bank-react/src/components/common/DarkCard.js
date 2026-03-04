import React from 'react';
import './DarkCard.css';

/**
 * DarkCard Component - Unified Card Design
 * Used consistently across the application
 * 
 * Props:
 * - title: Card title (required)
 * - subtitle: Optional subtitle/secondary text
 * - details: Array of {label, value} objects
 * - badge: {text, type} - Status badge
 * - actions: Array of {label, onClick, type, disabled, icon}
 * - highlighted: Value to highlight (e.g., blood group)
 * - selected: Boolean for selection state
 * - onSelect: Callback for checkbox change
 * - showCheckbox: Boolean to show selection checkbox
 * - className: Additional CSS classes
 * - children: Custom content as alternative to standard layout
 */
const DarkCard = ({
  title,
  subtitle,
  details = [],
  badge,
  actions = [],
  highlighted,
  selected = false,
  onSelect,
  showCheckbox = false,
  className = '',
  children,
  id
}) => {
  return (
    <div className={`dark-card ${selected ? 'dark-card--selected' : ''} ${className}`}>
      {/* Selection Checkbox */}
      {showCheckbox && onSelect && (
        <input
          type="checkbox"
          className="dark-card__checkbox"
          checked={selected}
          onChange={() => onSelect(id)}
          aria-label="Select item"
        />
      )}

      {/* Badge */}
      {badge && (
        <span className={`dark-card__badge dark-card__badge--${badge.type}`}>
          {badge.text}
        </span>
      )}

      {/* Custom Content */}
      {children ? (
        <div className="dark-card__content">
          {children}
        </div>
      ) : (
        <>
          {/* Title */}
          {title && <h3 className="dark-card__title">{title}</h3>}

          {/* Subtitle */}
          {subtitle && <p className="dark-card__subtitle">{subtitle}</p>}

          {/* Details Grid */}
          {details.length > 0 && (
            <div className="dark-card__details">
              {details.map((detail, idx) => (
                <div key={idx} className="dark-card__detail-row">
                  <span className="dark-card__detail-label">{detail.label}</span>
                  <span className="dark-card__detail-value">{detail.value}</span>
                </div>
              ))}
            </div>
          )}

          {/* Highlighted Value (Blood Group, Distance, etc.) */}
          {highlighted && (
            <div className="dark-card__highlighted">
              {highlighted}
            </div>
          )}

          {/* Actions */}
          {actions.length > 0 && (
            <div className="dark-card__actions">
              {actions.map((action, idx) => (
                <button
                  key={idx}
                  className={`dark-card__action-btn dark-card__action-btn--${action.type || 'secondary'}`}
                  onClick={action.onClick}
                  disabled={action.disabled || false}
                  title={action.title || action.label}
                  aria-label={action.label}
                >
                  {action.icon && <span className="dark-card__action-icon">{action.icon}</span>}
                  <span className="dark-card__action-label">{action.label}</span>
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default DarkCard;
