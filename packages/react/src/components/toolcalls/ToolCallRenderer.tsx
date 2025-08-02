import React from 'react';
import { Badge } from '../ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Clock, CheckCircle, XCircle, Play } from 'lucide-react';

interface ToolCallRendererProps {
  toolCall: any;
  toolCallState?: any;
}

export function ToolCallRenderer({ toolCall, toolCallState }: ToolCallRendererProps) {
  const getStatusIcon = () => {
    if (!toolCallState) {
      return <Clock className="w-4 h-4 text-yellow-500" />;
    }

    switch (toolCallState.status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'running':
        return <Play className="w-4 h-4 text-blue-500" />;
      default:
        return <Clock className="w-4 h-4 text-yellow-500" />;
    }
  };

  const getStatusText = () => {
    if (!toolCallState) {
      return 'Pending';
    }

    switch (toolCallState.status) {
      case 'completed':
        return 'Completed';
      case 'error':
        return 'Failed';
      case 'running':
        return 'Running';
      default:
        return 'Pending';
    }
  };

  const getStatusColor = () => {
    if (!toolCallState) {
      return 'bg-yellow-100 text-yellow-800';
    }

    switch (toolCallState.status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      case 'running':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  return (
    <Card className="mb-2">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {getStatusIcon()}
            <CardTitle className="text-sm font-medium">{toolCall.tool_name}</CardTitle>
            <Badge variant="secondary" className={getStatusColor()}>
              {getStatusText()}
            </Badge>
          </div>
          <div className="text-xs text-gray-500">
            ID: {toolCall.tool_call_id}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-2">
          <div className="text-sm">
            <strong>Input:</strong>
            <pre className="whitespace-pre-wrap text-xs bg-gray-50 p-2 rounded mt-1">
              {typeof toolCall.input === 'string' ? toolCall.input : JSON.stringify(toolCall.input, null, 2)}
            </pre>
          </div>
          {toolCallState?.result && (
            <div className="text-sm">
              <strong>Result:</strong>
              <pre className="whitespace-pre-wrap text-xs bg-gray-50 p-2 rounded mt-1">
                {typeof toolCallState.result === 'string' ? toolCallState.result : JSON.stringify(toolCallState.result, null, 2)}
              </pre>
            </div>
          )}
          {toolCallState?.error && (
            <div className="text-sm">
              <strong>Error:</strong>
              <pre className="whitespace-pre-wrap text-xs bg-red-50 p-2 rounded mt-1 text-red-600">
                {toolCallState.error}
              </pre>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
} 