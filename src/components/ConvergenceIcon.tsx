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
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {/* Multiple input streams from bottom converging to one output at top */}
      <path d="M6 22 L12 12" />
      <path d="M9 22 L12 12" />
      <path d="M12 22 L12 12" />
      <path d="M15 22 L12 12" />
      <path d="M18 22 L12 12" />
      
      {/* Convergence point */}
      <circle cx="12" cy="12" r="1.5" fill="currentColor" />
      
      {/* Single output stream with arrow pointing up */}
      <path d="M12 12 L12 2" />
      <path d="M9 5 L12 2 L15 5" />
    </svg>
  );
}