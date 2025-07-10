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
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {/* Two input lines converging to one output line */}
      <path d="M3 8 L12 12" />
      <path d="M3 16 L12 12" />
      <path d="M12 12 L21 12" />
      
      {/* Small dots at the start points */}
      <circle cx="3" cy="8" r="1.5" fill="currentColor" />
      <circle cx="3" cy="16" r="1.5" fill="currentColor" />
      
      {/* Arrow at the end */}
      <path d="M18 9 L21 12 L18 15" />
    </svg>
  );
}