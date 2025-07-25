import { ToolCall } from '@distri/core';

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