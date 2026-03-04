import React from 'react';
import './Button.css';

/**
 * Reusable Button Component
 * 
 * Props:
 * - label: button text
 * - onClick: click handler
 * - type: 'primary', 'secondary', 'call', 'request', 'danger'
 * - size: 'small', 'medium', 'large'
 * - disabled: boolean
 * - className: additional CSS classes
 * - fullWidth: boolean to make button full width
 */
const Button = ({
  label,
  onClick,
  type = 'primary',
  size = 'medium',
  disabled = false,
  className = '',
  fullWidth = false,
  children
}) => {
  return (
    <button
      className={`btn btn-${type} btn-${size} ${fullWidth ? 'btn-full-width' : ''} ${className}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children || label}
    </button>
  );
};

export default Button;
