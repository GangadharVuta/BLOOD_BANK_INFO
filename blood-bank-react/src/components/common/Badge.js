import React from 'react';
import './Badge.css';

/**
 * Reusable Badge Component
 * 
 * Props:
 * - text: badge text content
 * - type: badge type - 'registered', 'added', 'available', 'success', 'info', 'warning', 'danger'
 * - size: 'small', 'medium', 'large'
 * - className: additional CSS classes
 */
const Badge = ({ text, type = 'info', size = 'medium', className = '' }) => {
  return (
    <span className={`badge badge-${type} badge-${size} ${className}`}>
      {text}
    </span>
  );
};

export default Badge;
