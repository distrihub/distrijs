import React from 'react';

interface LoadingShimmerProps {
  text: string;
  className?: string;
}

export const LoadingShimmer: React.FC<LoadingShimmerProps> = ({ 
  text, 
  className = "" 
}) => {
  return (
    <div className={`relative ${className}`}>
      <span className="relative inline-block font-medium px-1 py-0.5 rounded overflow-hidden">
        <span 
          className="relative z-10 flex items-center gap-1 text-start align-middle truncate"
          style={{ opacity: 1 }}
        >
          {text}
        </span>
        {/* Shimmer overlay */}
        <span className="absolute inset-0 -z-0 bg-gradient-to-r from-transparent via-white/10 to-transparent bg-[length:200%_100%] animate-shimmer" />
      </span>
      <style>{`
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        .animate-shimmer {
          animation: shimmer 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default LoadingShimmer;