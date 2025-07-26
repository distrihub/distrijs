import { ToolCall, ToolResult } from '@distri/core';
import { DistriMessage, isDistriMessage } from '@distri/core';

export interface ToolCallState {
  tool_call_id: string;
  tool_name: string;
  status: 'running' | 'completed' | 'error';
  input: string;
  result: any;
  error: string | null;
}

export interface ToolHandlerResult {
  tool_call_id: string;
  result: any;
  success: boolean;
  error: string | null;
}

/**
 * Extract tool calls and their results from message history to restore state
 */
export const extractToolCallsWithResults = (messages: (DistriMessage | any)[]): Array<{
  toolCall: ToolCall;
  status: 'pending' | 'running' | 'completed' | 'error' | 'user_action_required';
  result?: any;
  error?: string;
  startedAt?: Date;
  completedAt?: Date;
}> => {
  const toolCallsMap = new Map<string, {
    toolCall: ToolCall;
    status: 'pending' | 'running' | 'completed' | 'error' | 'user_action_required';
    result?: any;
    error?: string;
    startedAt?: Date;
    completedAt?: Date;
  }>();

  messages.forEach((message) => {
    if (!isDistriMessage(message)) return;

    const distriMessage = message as DistriMessage;
    
    // Extract tool calls from message parts
    distriMessage.parts.forEach((part: any) => {
      if (part.type === 'tool_call' && part.tool_call) {
        const toolCall = part.tool_call as ToolCall;
        if (!toolCallsMap.has(toolCall.tool_call_id)) {
          toolCallsMap.set(toolCall.tool_call_id, {
            toolCall,
            status: 'pending',
            startedAt: new Date(distriMessage.created_at || Date.now()),
          });
        }
      }
      
      // Extract tool results and update corresponding tool call status
      if (part.type === 'tool_result' && part.tool_result) {
        const toolResult = part.tool_result as ToolResult;
        const existingToolCall = toolCallsMap.get(toolResult.tool_call_id);
        
        if (existingToolCall) {
          existingToolCall.status = toolResult.success ? 'completed' : 'error';
          existingToolCall.result = toolResult.result;
          existingToolCall.error = toolResult.error;
          existingToolCall.completedAt = new Date(distriMessage.created_at || Date.now());
        }
      }
    });
  });

  return Array.from(toolCallsMap.values());
};

/**
 * Extract external tool calls from messages
 * This function finds messages with assistant_response metadata containing tool calls
 */
export const extractExternalToolCalls = (messages: any[]): ToolCall[] => {
  const externalToolCalls: ToolCall[] = [];

  messages.forEach((message) => {
    const meta = message.metadata;
    if (
      meta &&
      meta.type === 'assistant_response' &&
      meta.tool_calls &&
      Array.isArray(meta.tool_calls)
    ) {
      // Add all tool calls from assistant_response metadata
      meta.tool_calls.forEach((toolCall: ToolCall) => {
        const existingToolCall = externalToolCalls.find(tc => tc.tool_call_id === toolCall.tool_call_id);
        if (!existingToolCall) {
          externalToolCalls.push(toolCall);
        }
      });
    }
  });

  return externalToolCalls;
}; 