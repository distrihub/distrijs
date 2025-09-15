import React from 'react';
import { DistriMessage, DistriPart, ToolCall, ToolResult, extractToolResultData } from '@distri/core';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { CheckCircle, Clock, AlertCircle, Play } from 'lucide-react';

interface ExecutionStepsProps {
  messages: DistriMessage[];
  className?: string;
}

interface ExecutionStep {
  id: string;
  type: 'tool_call' | 'tool_result' | 'response';
  tool_call?: ToolCall;
  tool_result?: ToolResult;
  content?: string;
  status: 'pending' | 'running' | 'completed' | 'error';
  timestamp?: string;
}

export const ExecutionSteps: React.FC<ExecutionStepsProps> = ({ messages, className = "" }) => {
  // Process messages to extract execution steps
  const steps: ExecutionStep[] = React.useMemo(() => {
    const stepsMap = new Map<string, ExecutionStep>();
    const allSteps: ExecutionStep[] = [];

    messages.forEach((message) => {
      message.parts.forEach((part: DistriPart) => {
        if (part.type === 'tool_call') {
          const toolCall = part.data;
          const step: ExecutionStep = {
            id: toolCall.tool_call_id,
            type: 'tool_call',
            tool_call: toolCall,
            status: 'running',
            timestamp: message.created_at,
          };
          stepsMap.set(toolCall.tool_call_id, step);
          allSteps.push(step);
        } else if (part.type === 'tool_result') {
          const toolResult = part.data;
          const existingStep = stepsMap.get(toolResult.tool_call_id);
          if (existingStep) {
            existingStep.tool_result = toolResult;
            const resultData = extractToolResultData(toolResult);
            existingStep.status = resultData?.success ? 'completed' : 'error';
          } else {
            // Create a new step for orphaned tool results
            const resultData = extractToolResultData(toolResult);
            const step: ExecutionStep = {
              id: toolResult.tool_call_id,
              type: 'tool_result',
              tool_result: toolResult,
              status: resultData?.success ? 'completed' : 'error',
              timestamp: message.created_at,
            };
            allSteps.push(step);
          }
        } else if (part.type === 'text' && part.data.trim()) {
          // Final response step
          const step: ExecutionStep = {
            id: `response_${message.id}`,
            type: 'response',
            content: part.data,
            status: 'completed',
            timestamp: message.created_at,
          };
          allSteps.push(step);
        }
      });
    });

    return allSteps;
  }, [messages]);

  const getStepIcon = (step: ExecutionStep) => {
    switch (step.status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      case 'running':
        return <Clock className="w-4 h-4 text-blue-600 animate-pulse" />;
      default:
        return <Play className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStepBadgeColor = (step: ExecutionStep) => {
    switch (step.status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      case 'running':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatToolInput = (input: any) => {
    if (typeof input === 'string') return input;
    return JSON.stringify(input, null, 2);
  };

  const formatToolResult = (result: any) => {
    if (typeof result === 'string') return result;
    if (typeof result === 'object') {
      try {
        const parsed = typeof result === 'string' ? JSON.parse(result) : result;
        if (parsed.answer) return parsed.answer;
        if (parsed.results && Array.isArray(parsed.results)) {
          return parsed.results.map((r: any) => r.title || r.content || JSON.stringify(r)).join('\n');
        }
        return JSON.stringify(parsed, null, 2);
      } catch {
        return JSON.stringify(result, null, 2);
      }
    }
    return String(result);
  };

  if (steps.length === 0) {
    return null;
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {steps.map((step) => (
        <Card key={step.id} className="border-l-4 border-l-blue-200">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {getStepIcon(step)}
                <CardTitle className="text-sm font-medium">
                  {step.type === 'tool_call' && step.tool_call
                    ? `${step.tool_call.tool_name}`
                    : step.type === 'response'
                    ? 'Final Response'
                    : 'Tool Result'}
                </CardTitle>
              </div>
              <Badge className={getStepBadgeColor(step)}>
                {step.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {step.type === 'tool_call' && step.tool_call && (
              <div className="space-y-2">
                <div className="text-xs text-gray-600">Input:</div>
                <pre className="text-xs bg-gray-50 p-2 rounded overflow-x-auto">
                  {formatToolInput(step.tool_call.input)}
                </pre>
              </div>
            )}
            
            {step.tool_result && (
              <div className="space-y-2 mt-2">
                <div className="text-xs text-gray-600">Result:</div>
                <div className="text-xs bg-gray-50 p-2 rounded overflow-x-auto max-h-32 overflow-y-auto">
                  {formatToolResult(extractToolResultData(step.tool_result)?.result)}
                </div>
              </div>
            )}

            {step.type === 'response' && step.content && (
              <div className="text-sm">
                {step.content}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default ExecutionSteps;