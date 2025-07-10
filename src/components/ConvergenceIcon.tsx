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
      {/* Multiple input streams converging to one output */}
      <path d="M2 6 L12 12" />
      <path d="M2 9 L12 12" />
      <path d="M2 12 L12 12" />
      <path d="M2 15 L12 12" />
      <path d="M2 18 L12 12" />
      
      {/* Convergence point */}
      <circle cx="12" cy="12" r="1" fill="currentColor" />
      
      {/* Single output stream with arrow */}
      <path d="M12 12 L22 12" />
      <path d="M19 9 L22 12 L19 15" />
    </svg>
  );
}