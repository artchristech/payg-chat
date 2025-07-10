import React from 'react';

interface ConvergenceIconProps {
  className?: string;
}

export function ConvergenceIcon({ className = "w-4 h-4" }: ConvergenceIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {/* Multiple input streams from top converging to one output at bottom */}
      <path d="M6 2 L12 12" />
      <path d="M9 2 L12 12" />
      <path d="M12 2 L12 12" />
      <path d="M15 2 L12 12" />
      <path d="M18 2 L12 12" />
      
      {/* Convergence point */}
      <circle cx="12" cy="12" r="1" fill="currentColor" />
      
      {/* Single output stream with arrow pointing down */}
      <path d="M12 12 L12 22" />
      <path d="M9 19 L12 22 L15 19" />
    </svg>
  );
}