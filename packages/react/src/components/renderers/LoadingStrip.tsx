// packages/react/src/components/renderers/LoadingStrip.tsx
import React, { useEffect, useState } from 'react';

const DEFAULT_WORDS = [
  'Thinking…',
  'Working on it…',
  'On it…',
  'Let me check…',
  'Looking it up…',
  'Almost there…',
  'Just a moment…',
  'Figuring this out…',
  'Making progress…',
  'Bear with me…',
  'Digging in…',
  'Getting there…',
];

interface LoadingStripProps {
  words?: string[];
  className?: string;
}

export const LoadingStrip: React.FC<LoadingStripProps> = ({
  words = DEFAULT_WORDS,
  className = '',
}) => {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (words.length === 0) return;
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setIndex((i) => (i + 1) % words.length);
        setVisible(true);
      }, 300);
    }, 2500);
    return () => clearInterval(interval);
  }, [words]);

  return (
    <div className={`flex items-center gap-2 px-1 py-1 ${className}`}>
      {/* Three bouncing dots */}
      <div className="flex gap-0.5 items-center">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-primary inline-block animate-bounce"
            style={{ animationDelay: `${i * 150}ms` }}
          />
        ))}
      </div>
      {/* Cycling word */}
      {words.length > 0 && (
        <span
          className="text-xs text-muted-foreground transition-opacity duration-300"
          style={{ opacity: visible ? 1 : 0 }}
        >
          {words[index]}
        </span>
      )}
    </div>
  );
};
