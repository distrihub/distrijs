import React from 'react';
import { Brain, Sparkles } from 'lucide-react';
import { LoadingShimmer } from './LoadingShimmer';


export type StreamingIndicator = 'typing' | 'thinking' | 'generating';
export interface ThinkingRendererProps {
  indicator: StreamingIndicator;
  className?: string;
  avatar?: React.ReactNode;
  name?: string;
  thoughtText?: string;
}

export const ThinkingRenderer: React.FC<ThinkingRendererProps> = ({
  indicator,
  className = '',
  thoughtText,
}) => {
  const getThinkingComponent = () => {
    switch (indicator) {
      case 'typing':
        return (
          <div className="flex items-center gap-2 mb-3">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <div className="w-1 h-1 bg-muted-foreground rounded-full animate-pulse"></div>
              <div className="w-1 h-1 bg-muted-foreground rounded-full animate-pulse delay-75"></div>
              <div className="w-1 h-1 bg-muted-foreground rounded-full animate-pulse delay-150"></div>
            </div>
          </div>
        );
      case 'generating':
        return (
          <div className="flex items-center gap-2 mb-3">
            <LoadingShimmer text="Generating response" className="text-sm" />
          </div>
        );
      case 'thinking':
        return (
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="h-3 w-3 text-primary" />
            <LoadingShimmer 
              text={thoughtText || "Thinking..."} 
              className="text-sm" 
            />
          </div>
        );

      default:
        return (
          <div className="flex items-center gap-2 mb-3">
            <Brain className="h-3 w-3 text-muted-foreground" />
            <LoadingShimmer 
              text={thoughtText || "Thinking..."} 
              className="text-sm" 
            />
          </div>
        );
    }
  };

  const component = getThinkingComponent();

  return (
    <div className={`flex items-start gap-3 py-6 ${className}`}>
      <div className="w-full">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          {component}
        </div>
      </div>
    </div>
  );
};