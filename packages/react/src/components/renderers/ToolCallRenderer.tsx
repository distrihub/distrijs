import React from 'react';
import { Wrench, ChevronDown, ChevronRight, Loader2, CheckCircle, XCircle, Clock } from 'lucide-react';
import { ToolCallState } from '../../types';

export interface ToolCallRendererProps {
  toolCall: ToolCallState;
  isExpanded: boolean;
  onToggle: () => void;
  className?: string;
  avatar?: React.ReactNode;
  name?: string;
}

export const ToolCallRenderer: React.FC<ToolCallRendererProps> = ({
  toolCall,
  isExpanded,
  onToggle,
  className = '',
}) => {
  const getStatusIcon = () => {
    switch (toolCall.status) {
      case 'pending':
        return <Clock className="h-3 w-3 text-muted-foreground" />;
      case 'running':
        return <Loader2 className="h-3 w-3 text-primary animate-spin" />;
      case 'completed':
        return <CheckCircle className="h-3 w-3 text-primary" />;
      case 'error':
        return <XCircle className="h-3 w-3 text-destructive" />;
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
    <div className={`flex items-start gap-4 py-6 ${className}`}>
      <div className="flex-1 min-w-0 max-w-3xl">
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
                <Wrench className="h-4 w-4 text-primary" />
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
                  <div className="text-xs text-destructive font-medium mb-1">Error:</div>
                  <div className="text-xs text-destructive bg-destructive/10 p-2 rounded border border-destructive/20">
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