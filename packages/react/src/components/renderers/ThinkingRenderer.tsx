import React from 'react';
import { Brain, Sparkles } from 'lucide-react';


export type StreamingIndicator = 'typing' | 'planning' | 'generating';

export interface ThinkingRendererProps {
  indicator: 'typing' | 'planning' | 'generating';
  className?: string;
  avatar?: React.ReactNode;
  name?: string;
}

export const ThinkingRenderer: React.FC<ThinkingRendererProps> = ({
  indicator,
  className = '',
}) => {
  const getIconAndText = () => {
    switch (indicator) {
      case 'typing':
      case 'generating':
        return {
          icon: <div className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <div className="w-1 h-1 bg-muted-foreground rounded-full animate-pulse"></div>
              <div className="w-1 h-1 bg-muted-foreground rounded-full animate-pulse delay-75"></div>
              <div className="w-1 h-1 bg-muted-foreground rounded-full animate-pulse delay-150"></div>
            </div>
          </div>,
          text: null,
        };
      case 'planning':
        return {
          icon: <Sparkles className="h-4 w-4 text-primary" />,
          text: 'Planning…',
        };

      default:
        return {
          icon: <Brain className="h-4 w-4 text-muted-foreground" />,
          text: 'Thinking…',
        };
    }
  };

  const { icon, text } = getIconAndText();

  return (
    <div className={`flex items-start gap-4 py-6 ${className}`}>
      <div className="flex-1 min-w-0 max-w-3xl">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          {icon}
          {text && <span>{text}</span>}
        </div>
      </div>
    </div>
  );
};