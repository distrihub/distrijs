import React from 'react';
import { Bug } from 'lucide-react';
import { DistriEvent, DistriArtifact } from '@distri/core';
import { Avatar, AvatarFallback } from '../ui/avatar';

export interface DebugRendererProps {
  message: DistriEvent | DistriArtifact;
  chatState: any;
  className?: string;
  avatar?: React.ReactNode;
}

export const DebugRenderer: React.FC<DebugRendererProps> = ({
  message,
  chatState: _chatState,
  className = '',
  avatar
}) => {
  return (
    <div className={`flex items-start gap-4 py-3 px-2 ${className}`}>
      <Avatar className="h-8 w-8">
        <AvatarFallback className="bg-muted text-muted-foreground">
          {avatar || <Bug className="h-4 w-4" />}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-foreground mb-2">Debug</div>
        <div className="prose prose-sm max-w-none text-foreground">
          <pre className="text-xs bg-muted p-2 rounded border overflow-auto">
            {JSON.stringify(message, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}; 