import React from 'react';

export type StreamingIndicator = 'typing' | 'thinking' | 'generating';
export interface ThinkingRendererProps {
  indicator: StreamingIndicator;
  className?: string;
  avatar?: React.ReactNode;
  name?: string;
  thoughtText?: string;
}

export const LoadingShimmer = ({ text, className }: { text: string, className?: string }) => {
  return (<div className={`w-full ${className || ''}`}>

    <span className="font-medium text-shimmer">
      {text}
    </span>
    <style>{`
          @keyframes shimmer {
            0% { background-position: -150% 0; }
            100% { background-position: 150% 0; }
          }
          .text-shimmer {
            background: linear-gradient(90deg, hsl(var(--muted-foreground)) 0%, hsl(var(--primary)) 50%, hsl(var(--muted-foreground)) 100%);
            background-size: 150% 100%;
            background-clip: text;
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            animation: shimmer 2s ease-in-out infinite;
          }
        `}</style>
  </div>
  )
}
export const ThinkingRenderer: React.FC<ThinkingRendererProps> = ({
  className = '',
}) => {

  const component = LoadingShimmer({ text: 'Thinking...' });
  return (
    <div className={`flex items-start gap-3 py-3 ${className}`}>
      <div className="w-full">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          {component}
        </div>
      </div>
    </div>
  );
};