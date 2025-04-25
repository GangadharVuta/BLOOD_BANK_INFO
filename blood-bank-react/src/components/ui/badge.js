import React from 'react';

export const Badge = ({ children, className = '' }) => {
  return (
    <span className={`inline-block px-2 py-1 text-xs font-semibold rounded-full bg-gray-200 text-gray-800 ${className}`}>
      {children}
    </span>
  );
};
