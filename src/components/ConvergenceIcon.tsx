import React from 'react';

interface ConvergenceIconProps {
  className?: string;
}

export function ConvergenceIcon({ className = "w-4 h-4" }: ConvergenceIconProps) {
  return (
    <div className={`relative ${className}`}>
      <svg
        viewBox="0 0 24 24"
        fill="none"
        className="w-full h-full"
      >
        {/* Glass-like background glow */}
        <defs>
          <radialGradient id="glassGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.3)" />
            <stop offset="70%" stopColor="rgba(255,255,255,0.1)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0.05)" />
          </radialGradient>
          <linearGradient id="lineGradient" x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.6)" />
            <stop offset="50%" stopColor="rgba(255,255,255,0.9)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0.8)" />
          </linearGradient>
        </defs>
        
        {/* Background glow effect */}
        <circle cx="12" cy="12" r="10" fill="url(#glassGlow)" opacity="0.4" />
        
        {/* Multiple input streams from bottom converging to one output at top - thicker lines */}
        <g stroke="url(#lineGradient)" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 22 L12 12" opacity="0.9" />
          <path d="M8.5 22 L12 12" opacity="0.95" />
          <path d="M12 22 L12 12" opacity="1" />
          <path d="M15.5 22 L12 12" opacity="0.95" />
          <path d="M19 22 L12 12" opacity="0.9" />
        </g>
        
        {/* Larger, more prominent convergence point with glass effect */}
        <circle cx="12" cy="12" r="2.5" fill="rgba(255,255,255,0.9)" />
        <circle cx="12" cy="12" r="2.5" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="1" />
        <circle cx="12" cy="12" r="1.2" fill="rgba(255,255,255,0.4)" />
        
        {/* Single output stream with arrow pointing up - thicker */}
        <g stroke="url(#lineGradient)" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 12 L12 2" />
          <path d="M8.5 5.5 L12 2 L15.5 5.5" strokeWidth="3" />
        </g>
        
        {/* Glass highlight effect */}
        <path d="M8 8 Q12 6 16 8" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" fill="none" opacity="0.6" />
      </svg>
    </div>
  );
}