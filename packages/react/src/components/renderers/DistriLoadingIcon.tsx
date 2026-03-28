import React from 'react';

/**
 * Animated distri logo mark for loading states.
 * The D-robot icon slides horizontally with a gentle bounce.
 */
export const DistriLoadingIcon: React.FC<{ className?: string; size?: number }> = ({
  className = '',
  size = 16,
}) => {
  return (
    <span className={`inline-flex items-center ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 361 437"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="distri-loading-icon"
      >
        {/* D body */}
        <path
          d="M207 148C276.036 148 332 203.964 332 273C332 342.036 276.036 398 207 398H82V148H207Z"
          stroke="currentColor"
          strokeWidth="50"
        />
        {/* Antenna stem */}
        <path d="M147 63H187V123H147V63Z" fill="currentColor" />
        {/* Right eye */}
        <path
          d="M220 258C220 246.954 228.954 238 240 238C251.046 238 260 246.954 260 258V288C260 299.046 251.046 308 240 308C228.954 308 220 299.046 220 288V258Z"
          fill="currentColor"
          className="distri-eye"
        />
        {/* Left eye */}
        <path
          d="M136 258C136 246.954 144.954 238 156 238C167.046 238 176 246.954 176 258V288C176 299.046 167.046 308 156 308C144.954 308 136 299.046 136 288V258Z"
          fill="currentColor"
          className="distri-eye"
        />
        {/* Arm */}
        <path d="M2 215H42V315H2V215Z" fill="currentColor" />
        {/* Antenna ball */}
        <circle cx="167" cy="40" r="40" fill="currentColor" />
      </svg>
      <style>{`
        @keyframes distri-slide {
          0%, 100% { transform: translateX(0); }
          50% { transform: translateX(4px); }
        }
        @keyframes distri-blink {
          0%, 90%, 100% { opacity: 1; }
          95% { opacity: 0.1; }
        }
        .distri-loading-icon {
          animation: distri-slide 1.5s ease-in-out infinite;
        }
        .distri-eye {
          animation: distri-blink 3s ease-in-out infinite;
        }
      `}</style>
    </span>
  );
};
