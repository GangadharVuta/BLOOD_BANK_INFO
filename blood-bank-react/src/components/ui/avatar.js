import React from 'react';

export const Avatar = ({ children, className = '' }) => {
  return (
    <div className={`w-10 h-10 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center ${className}`}>
      {children}
    </div>
  );
};

export const AvatarImage = ({ src, alt = '', className = '' }) => {
  return <img src={src} alt={alt} className={`w-full h-full object-cover ${className}`} />;
};

export const AvatarFallback = ({ children, className = '' }) => {
  return <span className={`text-sm font-medium text-gray-700 ${className}`}>{children}</span>;
};
