import React, { useState } from 'react';
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

export function TaskRenderer({ task, toolCallStates, className = '', onToolResult }: TaskRendererProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const getStatusIcon = () => {
    switch (task.status) {
      case 'running':
        return <Loader2 className="w-4 h-4 animate-spin text-blue-500" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = () => {
    switch (task.status) {
      case 'running':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
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
          <div className="text-xs text-gray-500">
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
                    <div className="text-sm text-gray-600">
                      <strong>Result:</strong>
                      <pre className="whitespace-pre-wrap text-xs bg-gray-50 p-2 rounded mt-1 max-h-32 overflow-y-auto">
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
            <div className="p-2 bg-red-50 border border-red-200 rounded">
              <span className="text-xs text-red-600">{task.error}</span>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
} 