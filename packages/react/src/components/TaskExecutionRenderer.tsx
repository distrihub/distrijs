import React, { useMemo } from 'react';
import { DistriMessage, DistriEvent, isDistriMessage } from '@distri/core';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { CheckCircle, Clock, AlertCircle, Loader2 } from 'lucide-react';

interface TaskExecutionRendererProps {
  events: (DistriMessage | DistriEvent)[];
  className?: string;
}

interface ExecutionStep {
  id: string;
  type: 'step' | 'tool' | 'message';
  title: string;
  status: 'pending' | 'running' | 'completed' | 'error';
  startTime?: string;
  endTime?: string;
  content?: string;
  toolCall?: any;
  toolResult?: any;
}

export const TaskExecutionRenderer: React.FC<TaskExecutionRendererProps> = ({ 
  events, 
  className = "" 
}) => {
  // Process events into execution steps
  const steps = useMemo(() => {
    const stepMap = new Map<string, ExecutionStep>();
    const stepOrder: string[] = [];

    events.forEach((event) => {
      if (isDistriMessage(event)) {
        // Handle DistriMessage - usually final responses
        const message = event as DistriMessage;
        const stepId = `message_${message.id}`;
        
        if (!stepMap.has(stepId)) {
          stepOrder.push(stepId);
        }

        stepMap.set(stepId, {
          id: stepId,
          type: 'message',
          title: 'Response',
          status: 'completed',
          content: message.parts
            .filter(part => part.type === 'text')
            .map(part => (part as any).text)
            .join('\n'),
        });

        // Handle tool calls and results within the message
        message.parts.forEach((part) => {
          if (part.type === 'tool_call') {
            const toolCall = (part as any).tool_call;
            const toolStepId = `tool_${toolCall.tool_call_id}`;
            
            if (!stepMap.has(toolStepId)) {
              stepOrder.push(toolStepId);
            }
            
            stepMap.set(toolStepId, {
              id: toolStepId,
              type: 'tool',
              title: `${toolCall.tool_name}`,
              status: 'completed',
              toolCall: toolCall,
            });
          } else if (part.type === 'tool_result') {
            const toolResult = (part as any).tool_result;
            const toolStepId = `tool_${toolResult.tool_call_id}`;
            
            const existingStep = stepMap.get(toolStepId);
            if (existingStep) {
              existingStep.toolResult = toolResult;
              existingStep.status = toolResult.success ? 'completed' : 'error';
            }
          }
        });
      } else {
        // Handle DistriEvent - status updates
        const distriEvent = event as DistriEvent;
        
        switch (distriEvent.type) {
          case 'run_started':
            const runStepId = 'run_start';
            if (!stepMap.has(runStepId)) {
              stepOrder.push(runStepId);
            }
            stepMap.set(runStepId, {
              id: runStepId,
              type: 'step',
              title: 'Starting task execution',
              status: 'completed',
            });
            break;

          case 'plan_started':
            const planStartId = 'plan_start';
            if (!stepMap.has(planStartId)) {
              stepOrder.push(planStartId);
            }
            stepMap.set(planStartId, {
              id: planStartId,
              type: 'step',
              title: 'Planning task execution',
              status: 'running',
            });
            break;

          case 'plan_finished':
            const planFinishId = 'plan_start'; // Update the existing plan step
            const planStep = stepMap.get(planFinishId);
            if (planStep) {
              planStep.status = 'completed';
              const planData = distriEvent.data as any;
              if (planData.total_steps) {
                planStep.title = `Plan completed (${planData.total_steps} steps)`;
              }
            }
            break;

          case 'tool_call_start':
            const startData = distriEvent.data as any;
            const toolStartId = `tool_${startData.tool_call_id}`;
            
            if (!stepMap.has(toolStartId)) {
              stepOrder.push(toolStartId);
            }
            
            stepMap.set(toolStartId, {
              id: toolStartId,
              type: startData.is_external ? 'tool' : 'step',
              title: startData.tool_call_name || 'Processing',
              status: 'running',
            });
            break;

          case 'tool_call_end':
            const endData = distriEvent.data as any;
            const toolEndId = `tool_${endData.tool_call_id}`;
            
            const existingStep = stepMap.get(toolEndId);
            if (existingStep) {
              existingStep.status = 'completed';
            }
            break;

          case 'tool_call_result':
            const resultData = distriEvent.data as any;
            const toolResultId = `tool_${resultData.tool_call_id}`;
            
            const resultStep = stepMap.get(toolResultId);
            if (resultStep) {
              resultStep.toolResult = {
                tool_call_id: resultData.tool_call_id,
                result: resultData.result,
                success: true
              };
              resultStep.status = 'completed';
            }
            break;

          case 'task_artifact':
            const artifactData = distriEvent.data as any;
            const artifactId = `artifact_${artifactData.artifact_id}`;
            
            if (!stepMap.has(artifactId)) {
              stepOrder.push(artifactId);
            }
            
            stepMap.set(artifactId, {
              id: artifactId,
              type: 'step',
              title: `Task ${artifactData.artifact_type}`,
              status: 'completed',
              content: artifactData.resolution ? 
                JSON.stringify(artifactData.resolution, null, 2) : 
                'Artifact generated',
            });
            break;

          case 'text_message_start':
            const msgStartData = distriEvent.data as any;
            const msgStartId = `message_${msgStartData.message_id}`;
            
            if (!stepMap.has(msgStartId)) {
              stepOrder.push(msgStartId);
            }
            
            stepMap.set(msgStartId, {
              id: msgStartId,
              type: 'message',
              title: 'Generating response',
              status: 'running',
              content: '',
            });
            break;

          case 'text_message_content':
            const msgContentData = distriEvent.data as any;
            const msgContentId = `message_${msgContentData.message_id}`;
            
            const msgStep = stepMap.get(msgContentId);
            if (msgStep) {
              msgStep.content = (msgStep.content || '') + msgContentData.delta;
            }
            break;

          case 'text_message_end':
            const msgEndData = distriEvent.data as any;
            const msgEndId = `message_${msgEndData.message_id}`;
            
            const msgEndStep = stepMap.get(msgEndId);
            if (msgEndStep) {
              msgEndStep.status = 'completed';
            }
            break;

          case 'run_finished':
            // Mark all remaining running steps as completed
            stepMap.forEach(step => {
              if (step.status === 'running') {
                step.status = 'completed';
              }
            });
            break;

          default:
            console.warn('Unhandled event type:', distriEvent.type, distriEvent);
            break;
        }
      }
    });

    return stepOrder.map(id => stepMap.get(id)!).filter(Boolean);
  }, [events]);

  const getStepIcon = (step: ExecutionStep) => {
    switch (step.status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      case 'running':
        return <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
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
                  {step.title}
                </CardTitle>
              </div>
              <Badge className={getStepBadgeColor(step)}>
                {step.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {step.toolCall && (
              <div className="space-y-2">
                <div className="text-xs text-gray-600">Input:</div>
                <pre className="text-xs bg-gray-50 p-2 rounded overflow-x-auto">
                  {formatToolInput(step.toolCall.input)}
                </pre>
              </div>
            )}
            
            {step.toolResult && (
              <div className="space-y-2 mt-2">
                <div className="text-xs text-gray-600">Result:</div>
                <div className="text-xs bg-gray-50 p-2 rounded overflow-x-auto max-h-32 overflow-y-auto">
                  {formatToolResult(step.toolResult.result)}
                </div>
              </div>
            )}

            {step.content && step.type === 'message' && (
              <div className="text-sm whitespace-pre-wrap">
                {step.content}
                {step.status === 'running' && (
                  <span className="inline-block w-2 h-4 bg-blue-600 animate-pulse ml-1" />
                )}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default TaskExecutionRenderer;