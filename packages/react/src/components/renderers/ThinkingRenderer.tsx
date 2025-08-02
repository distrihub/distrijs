import React from 'react';
import { Brain, Sparkles, Loader2 } from 'lucide-react';

export interface ThinkingRendererProps {
  indicator: 'agent_starting' | 'planning' | 'generating_response';
  className?: string;
  avatar?: React.ReactNode;
  name?: string;
}

export const ThinkingRenderer: React.FC<ThinkingRendererProps> = ({
  indicator,
  className = '',
  name = "Assistant",
}) => {
  const getIconAndText = () => {
    switch (indicator) {
      case 'agent_starting':
        return {
          icon: <Loader2 className="h-4 w-4 text-muted-foreground animate-spin" />,
          text: 'Agent is starting…',
        };
      case 'planning':
        return {
          icon: <Sparkles className="h-4 w-4 text-primary" />,
          text: 'Planning…',
        };
      case 'generating_response':
        return {
          icon: <Loader2 className="h-4 w-4 text-primary animate-spin" />,
          text: null,
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
        <div className="text-sm font-medium text-foreground mb-3">{name}</div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          {icon}
          {text && <span>{text}</span>}
        </div>
      </div>
    </div>
  );
};