
import React from 'react';

export const ThumbnailIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
    {/* Base Image Icon */}
    <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" />
    {/* 'T' for Text/Title */}
    <path d="M15.5 8.5h-7v2h2.5v6h2v-6h2.5v-2z" opacity="0.8" />
  </svg>
);
