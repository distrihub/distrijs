import React from 'react';
import { Bot, Brain, Sparkles, Loader2 } from 'lucide-react';
import { DistriEvent } from '@distri/core';
import { Avatar, AvatarFallback } from '../ui/avatar';

export interface ThinkingRendererProps {
  event: DistriEvent;
  className?: string;
  avatar?: React.ReactNode;
  name?: string;
}

export const ThinkingRenderer: React.FC<ThinkingRendererProps> = ({
  event,
  className = '',
  avatar,
  name = "Assistant",
}) => {
  const getIconAndText = () => {
    switch (event.type) {
      case 'run_started':
        return {
          icon: <Loader2 className="h-4 w-4 text-muted-foreground animate-spin" />,
          text: 'Agent is starting…',
        };
      case 'plan_started':
        return {
          icon: <Sparkles className="h-4 w-4 text-primary" />,
          text: 'Planning…',
        };
      case 'text_message_start':
        return {
          icon: <Loader2 className="h-4 w-4 text-primary animate-spin" />,
          text: 'Generating response…',
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
      <Avatar className="h-8 w-8 flex-shrink-0">
        <AvatarFallback className="bg-primary/10 text-primary">
          {avatar || <Bot className="h-4 w-4" />}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0 max-w-3xl">
        <div className="text-sm font-medium text-foreground mb-3">{name}</div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          {icon}
          <span>{text}</span>
        </div>
      </div>
    </div>
  );
};