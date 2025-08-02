import React from 'react';
import { Bot, Wrench, ChevronDown, ChevronRight, Loader2, CheckCircle, XCircle, Clock } from 'lucide-react';
import { ToolCallState } from '../../types';
import { Avatar, AvatarFallback } from '../ui/avatar';

export interface ToolCallRendererProps {
  toolCall: ToolCallState;
  chatState: any;
  isExpanded: boolean;
  onToggle: () => void;
  className?: string;
  avatar?: React.ReactNode;
  name?: string;
}

export const ToolCallRenderer: React.FC<ToolCallRendererProps> = ({
  toolCall,
  chatState: _chatState,
  isExpanded,
  onToggle,
  className = '',
  avatar,
  name = "Assistant"
}) => {
  const getStatusIcon = () => {
    switch (toolCall.status) {
      case 'pending':
        return <Clock className="h-3 w-3 text-yellow-500" />;
      case 'running':
        return <Loader2 className="h-3 w-3 text-blue-500 animate-spin" />;
      case 'completed':
        return <CheckCircle className="h-3 w-3 text-green-500" />;
      case 'error':
        return <XCircle className="h-3 w-3 text-red-500" />;
      default:
        return <Clock className="h-3 w-3 text-muted-foreground" />;
    }
  };

  const getStatusText = () => {
    switch (toolCall.status) {
      case 'pending':
        return 'Pending';
      case 'running':
        return 'Running';
      case 'completed':
        return 'Completed';
      case 'error':
        return 'Failed';
      default:
        return 'Unknown';
    }
  };

  const canCollapse = toolCall.result !== undefined || toolCall.error !== undefined ||
    toolCall.status === 'completed' || toolCall.status === 'error';

  return (
    <div className={`flex items-start gap-4 py-3 px-2 ${className}`}>
      <Avatar className="h-8 w-8">
        <AvatarFallback className="bg-blue-100 text-blue-600">
          {avatar || <Bot className="h-4 w-4" />}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-foreground mb-2">{name}</div>

        <div className="border rounded-lg bg-background overflow-hidden">
          {/* Tool Call Header */}
          <div className="p-3 border-b border-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  onClick={onToggle}
                  className="p-1 hover:bg-muted rounded transition-colors"
                  disabled={!canCollapse}
                >
                  {canCollapse ? (
                    isExpanded ? (
                      <ChevronDown className="h-3 w-3 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-3 w-3 text-muted-foreground" />
                    )
                  ) : (
                    <div className="h-3 w-3" />
                  )}
                </button>
                <Wrench className="h-4 w-4 text-green-500" />
                <span className="text-sm font-medium text-foreground">
                  {toolCall.tool_name}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {getStatusIcon()}
                <span className="text-xs text-muted-foreground">
                  {getStatusText()}
                </span>
              </div>
            </div>

            {/* Always show input */}
            <div className="mt-2">
              <div className="text-xs text-muted-foreground mb-1">Input:</div>
              <div className="text-xs font-mono bg-muted p-2 rounded border">
                {JSON.stringify(toolCall.input, null, 2)}
              </div>
            </div>

            {/* Custom tool call renderers */}
            {toolCall.component && (
              <div className="mt-3">
                {toolCall.component}
              </div>
            )}
          </div>

          {/* Collapsible Result Section */}
          {canCollapse && isExpanded && (
            <div className="p-3 bg-muted/30">
              {toolCall.error && (
                <div className="mb-3">
                  <div className="text-xs text-red-600 font-medium mb-1">Error:</div>
                  <div className="text-xs text-red-600 bg-red-50 p-2 rounded border border-red-200">
                    {toolCall.error}
                  </div>
                </div>
              )}

              {toolCall.result && (
                <div>
                  <div className="text-xs text-muted-foreground font-medium mb-1">Result:</div>
                  <div className="text-xs font-mono bg-background p-2 rounded border">
                    {JSON.stringify(toolCall.result, null, 2)}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}; 