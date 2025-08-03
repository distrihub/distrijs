import React from 'react';
import { Brain } from 'lucide-react';
import { DistriArtifact } from '@distri/core';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { extractContent, renderTextContent } from './utils';

export interface PlanRendererProps {
  message: DistriArtifact;
  className?: string;
  avatar?: React.ReactNode;
}

export const PlanRenderer: React.FC<PlanRendererProps> = ({
  message,
  className = '',
  avatar
}) => {
  const content = extractContent(message);

  return (
    <div className={`flex items-start gap-4 py-6 ${className}`}>
      <Avatar className="h-8 w-8 flex-shrink-0">
        <AvatarFallback className="bg-primary/10 text-primary">
          {avatar || <Brain className="h-4 w-4" />}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0 max-w-3xl">
        <div className="text-sm font-medium text-foreground mb-3">Plan</div>
        <div className="prose prose-sm max-w-none text-foreground">
          {renderTextContent(content)}
        </div>
      </div>
    </div>
  );
}; 