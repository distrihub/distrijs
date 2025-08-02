import { useState } from 'react';
import { TaskState } from '../../hooks/useChatState';
import { Badge } from '../ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { ChevronDown, ChevronRight, Loader2, CheckCircle, XCircle, Clock } from 'lucide-react';
import { ToolCallRenderer } from '../toolcalls/ToolCallRenderer';

interface TaskRendererProps {
  task: TaskState;
  toolCallStates: Map<string, any>;
  className?: string;
  onToolResult?: (toolCallId: string, result: any) => void;
}

export function TaskRenderer({ task, toolCallStates, className = '', onToolResult: _onToolResult }: TaskRendererProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const getStatusIcon = () => {
    switch (task.status) {
      case 'running':
        return <Loader2 className="w-4 h-4 animate-spin text-primary" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-primary" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-destructive" />;
      default:
        return <Clock className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getStatusColor = () => {
    switch (task.status) {
      case 'running':
        return 'bg-primary/10 text-primary';
      case 'completed':
        return 'bg-primary/10 text-primary';
      case 'failed':
        return 'bg-destructive/10 text-destructive';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const hasDetails = (task.toolCalls && task.toolCalls.length > 0) ||
    (task.results && task.results.length > 0) ||
    task.error;

  return (
    <Card className={`mb-4 ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {getStatusIcon()}
            <CardTitle className="text-sm font-medium">{task.title}</CardTitle>
            <Badge variant="secondary" className={getStatusColor()}>
              {task.status}
            </Badge>
            {hasDetails && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-1 h-6 w-6"
              >
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
              </Button>
            )}
          </div>
          <div className="text-xs text-muted-foreground">
            {task.startTime && new Date(task.startTime).toLocaleTimeString()}
          </div>
        </div>
      </CardHeader>

      {isExpanded && hasDetails && (
        <CardContent className="pt-0 space-y-4">
          {/* Tool Calls */}
          {task.toolCalls && task.toolCalls.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-2">Tool Calls</h4>
              <div className="space-y-2">
                {task.toolCalls.map((toolCall, index) => (
                  <ToolCallRenderer
                    key={toolCall.tool_call_id || index}
                    toolCall={toolCall}
                    toolCallState={toolCallStates.get(toolCall.tool_call_id)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Tool Results */}
          {task.results && task.results.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-2">Results</h4>
              <div className="space-y-2">
                {task.results.map((result, index) => (
                  <div key={result.tool_call_id || index} className="border rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">{result.tool_name}</span>
                      <Badge variant="default" className="text-xs">
                        Success
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      <strong>Result:</strong>
                      <pre className="whitespace-pre-wrap text-xs bg-muted p-2 rounded mt-1 max-h-32 overflow-y-auto">
                        {typeof result.result === 'string' ? result.result : JSON.stringify(result.result, null, 2)}
                      </pre>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Error */}
          {task.error && (
            <div className="p-2 bg-destructive/10 border border-destructive/20 rounded">
              <span className="text-xs text-destructive">{task.error}</span>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
} 