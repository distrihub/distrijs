import React from 'react';
import { Brain, Sparkles } from 'lucide-react';


export type StreamingIndicator = 'typing' | 'thinking' | 'generating';
export interface ThinkingRendererProps {
  indicator: StreamingIndicator;
  className?: string;
  avatar?: React.ReactNode;
  name?: string;
}

export const ThinkingRenderer: React.FC<ThinkingRendererProps> = ({
  indicator,
  className = '',
}) => {
  const getThinkingComponent = () => {
    switch (indicator) {
      case 'typing':
      case 'generating':
        return (<div className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <div className="w-1 h-1 bg-muted-foreground rounded-full animate-pulse"></div>
            <div className="w-1 h-1 bg-muted-foreground rounded-full animate-pulse delay-75"></div>
            <div className="w-1 h-1 bg-muted-foreground rounded-full animate-pulse delay-150"></div>
          </div>
        </div>
        );
      case 'thinking':
        return (<div className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
          <Sparkles className="h-3 w-3 text-primary" />
          Thinking…
        </div>);

      default:
        return (<div className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
          <Brain className="h-3 w-3 text-muted-foreground" />
          Thinking…
        </div>);
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