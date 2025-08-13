import React from 'react';

export const TypingIndicator: React.FC = () => {
  return (
    <div className="flex items-center gap-4 py-6">
      <div className="w-full">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-primary"></div>
          <span>AI is thinking...</span>
        </div>
        
        <div className="flex items-center space-x-1 p-3 bg-muted/30 rounded-lg w-fit">
          <div className="flex space-x-1">
            <div 
              className="h-2 w-2 bg-muted-foreground rounded-full animate-bounce"
              style={{ animationDelay: '0ms' }}
            ></div>
            <div 
              className="h-2 w-2 bg-muted-foreground rounded-full animate-bounce"
              style={{ animationDelay: '150ms' }}
            ></div>
            <div 
              className="h-2 w-2 bg-muted-foreground rounded-full animate-bounce"
              style={{ animationDelay: '300ms' }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
};