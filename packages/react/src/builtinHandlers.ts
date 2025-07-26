import { ToolCall, ToolResult, APPROVAL_REQUEST_TOOL_NAME } from '@distri/core';

export type LegacyToolHandler = (toolCall: ToolCall, onToolComplete: (toolCallId: string, result: ToolResult) => Promise<void>) => Promise<{} | null>;

// Simple approval dialog function
let showSimpleApprovalDialog: ((message: string, toolCalls: ToolCall[]) => Promise<boolean>) | null = null;
let showSimpleToast: ((message: string, type?: 'success' | 'error' | 'warning' | 'info') => void) | null = null;

/**
 * Initialize simple builtin handlers
 */
export const initializeSimpleBuiltinHandlers = (callbacks: {
  showApprovalDialog: (message: string, toolCalls: ToolCall[]) => Promise<boolean>;
  showToast: (message: string, type?: 'success' | 'error' | 'warning' | 'info') => void;
}) => {
  showSimpleApprovalDialog = callbacks.showApprovalDialog;
  showSimpleToast = callbacks.showToast;
};

/**
 * Simple builtin tool handlers
 */
export const createBuiltinToolHandlers = (): Record<string, LegacyToolHandler> => ({
  // Approval request handler - shows a dialog and returns result directly
  [APPROVAL_REQUEST_TOOL_NAME]: async (toolCall: ToolCall, onToolComplete: (toolCallId: string, result: ToolResult) => Promise<void>): Promise<{} | null> => {
    try {
      const input = typeof toolCall.input === 'string' ? JSON.parse(toolCall.input) : toolCall.input;
      const toolCallsToApprove: ToolCall[] = input.tool_calls || [];
      const reason: string = input.reason || 'Approval required';

      if (!showSimpleApprovalDialog) {
        console.warn('Approval dialog not initialized');
        const result: ToolResult = {
          tool_call_id: toolCall.tool_call_id,
          result: { approved: false, reason: 'Approval dialog not available' },
          success: false,
          error: 'Approval dialog not initialized'
        };
        await onToolComplete(toolCall.tool_call_id, result);
        return null;
      }

      // Show approval dialog and wait for user response
      const approved = await showSimpleApprovalDialog(reason, toolCallsToApprove);

      // Send the tool result
      const result: ToolResult = {
        tool_call_id: toolCall.tool_call_id,
        result: { 
          approved, 
          reason: approved ? 'Approved by user' : 'Denied by user',
          tool_calls: toolCallsToApprove 
        },
        success: true
      };
      await onToolComplete(toolCall.tool_call_id, result);

      return {
        approved,
        reason: approved ? 'Approved by user' : 'Denied by user',
        tool_calls: toolCallsToApprove
      };
    } catch (error) {
      console.error('Error in approval request handler:', error);
      const result: ToolResult = {
        tool_call_id: toolCall.tool_call_id,
        result: null,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
      await onToolComplete(toolCall.tool_call_id, result);
      return null;
    }
  },

  // Toast handler - shows a toast and returns success
  toast: async (toolCall: ToolCall, onToolComplete: (toolCallId: string, result: ToolResult) => Promise<void>): Promise<{} | null> => {
    try {
      const input = typeof toolCall.input === 'string' ? JSON.parse(toolCall.input) : toolCall.input;
      const message: string = input.message || 'Toast message';
      const type: 'success' | 'error' | 'warning' | 'info' = input.type || 'info';

      if (!showSimpleToast) {
        console.warn('Toast not initialized');
        const result: ToolResult = {
          tool_call_id: toolCall.tool_call_id,
          result: null,
          success: false,
          error: 'Toast not initialized'
        };
        await onToolComplete(toolCall.tool_call_id, result);
        return null;
      }

      showSimpleToast(message, type);

      // Send the tool result immediately
      const result: ToolResult = {
        tool_call_id: toolCall.tool_call_id,
        result: { success: true, message: 'Toast displayed successfully' },
        success: true
      };
      await onToolComplete(toolCall.tool_call_id, result);

      return {
        success: true,
        message: 'Toast displayed successfully'
      };
    } catch (error) {
      console.error('Error in toast handler:', error);
      const result: ToolResult = {
        tool_call_id: toolCall.tool_call_id,
        result: null,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
      await onToolComplete(toolCall.tool_call_id, result);
      return null;
    }
  },

  // Input request handler - shows prompt and returns input
  input_request: async (toolCall: ToolCall, onToolComplete: (toolCallId: string, result: ToolResult) => Promise<void>): Promise<{} | null> => {
    try {
      const input = typeof toolCall.input === 'string' ? JSON.parse(toolCall.input) : toolCall.input;
      const prompt: string = input.prompt || 'Please provide input:';
      const defaultValue: string = input.default || '';

      const userInput = window.prompt(prompt, defaultValue);

      if (userInput === null) {
        // User cancelled
        const result: ToolResult = {
          tool_call_id: toolCall.tool_call_id,
          result: null,
          success: false,
          error: 'User cancelled input'
        };
        await onToolComplete(toolCall.tool_call_id, result);
        return null;
      }

      // Send the tool result
      const result: ToolResult = {
        tool_call_id: toolCall.tool_call_id,
        result: { input: userInput },
        success: true
      };
      await onToolComplete(toolCall.tool_call_id, result);

      return {
        input: userInput
      };
    } catch (error) {
      console.error('Error in input request handler:', error);
      const result: ToolResult = {
        tool_call_id: toolCall.tool_call_id,
        result: null,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
      await onToolComplete(toolCall.tool_call_id, result);
      return null;
    }
  }
});

// Legacy exports for backwards compatibility
export const initializeBuiltinHandlers = initializeSimpleBuiltinHandlers; 