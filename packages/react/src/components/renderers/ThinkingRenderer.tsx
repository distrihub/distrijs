import React from 'react';
import { Bot, Brain, Sparkles, Loader2 } from 'lucide-react';
import { Avatar, AvatarFallback } from '../ui/avatar';

export interface ThinkingRendererProps {
  type: 'thinking' | 'planning' | 'generating';
  className?: string;
  avatar?: React.ReactNode;
  name?: string;
}

export const ThinkingRenderer: React.FC<ThinkingRendererProps> = ({
  type,
  className = '',
  avatar,
  name = "Assistant"
}) => {
  const getIcon = () => {
    switch (type) {
      case 'thinking':
        return <Brain className="h-4 w-4 text-blue-500" />;
      case 'planning':
        return <Sparkles className="h-4 w-4 text-purple-500" />;
      case 'generating':
        return <Loader2 className="h-4 w-4 text-green-500 animate-spin" />;
    }
  };

  const getText = () => {
    switch (type) {
      case 'thinking':
        return 'Thinking...';
      case 'planning':
        return 'Planning...';
      case 'generating':
        return 'Generating response...';
    }
  };

  return (
    <div className={`flex items-start gap-4 py-3 px-2 ${className}`}>
      <Avatar className="h-8 w-8">
        <AvatarFallback className="bg-blue-100 text-blue-600">
          {avatar || <Bot className="h-4 w-4" />}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-foreground mb-2">{name}</div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          {getIcon()}
          <span>{getText()}</span>
        </div>
      </div>
    </div>
  );
}; 