import { ToolHandler, ToolCall, ToolResult, APPROVAL_REQUEST_TOOL_NAME } from '@distri/core';

// Global state for managing tool execution
let pendingToolCalls: Map<string, { toolCall: ToolCall; resolve: (result: ToolResult) => void }> = new Map();

// Toast management
let showToast: ((message: string, type?: 'success' | 'error' | 'warning' | 'info') => void) | null = null;

// Approval dialog management
let showApprovalDialog: ((toolCalls: ToolCall[], reason?: string) => Promise<boolean>) | null = null;

/**
 * Initialize the builtin handlers with callbacks
 */
export const initializeBuiltinHandlers = (callbacks: {
  onToolComplete: (results: ToolResult[]) => void;
  onCancel: () => void;
  showToast: (message: string, type?: 'success' | 'error' | 'warning' | 'info') => void;
  showApprovalDialog: (toolCalls: ToolCall[], reason?: string) => Promise<boolean>;
}) => {
  showToast = callbacks.showToast;
  showApprovalDialog = callbacks.showApprovalDialog;
};

/**
 * Clear pending tool calls
 */
export const clearPendingToolCalls = () => {
  pendingToolCalls.clear();
};

/**
 * Builtin tool handlers using the new ToolHandler interface
 */
export const createBuiltinToolHandlers = (): Record<string, ToolHandler> => ({
  // Approval request handler - opens a dialog
  [APPROVAL_REQUEST_TOOL_NAME]: async (toolCall: ToolCall, onToolComplete: (result: ToolResult) => Promise<void>): Promise<{} | null> => {
    try {
      const input = JSON.parse(toolCall.input);
      const toolCallsToApprove: ToolCall[] = input.tool_calls || [];
      const reason: string = input.reason;

      if (!showApprovalDialog) {
        console.warn('Approval dialog not initialized');
        return null;
      }

      const approved = await showApprovalDialog(toolCallsToApprove, reason);

      // Report completion
      const result: ToolResult = {
        tool_call_id: toolCall.tool_call_id,
        result: { approved, reason: approved ? 'Approved by user' : 'Denied by user' },
        success: true
      };
      await onToolComplete(result);

      return {
        approved,
        reason: approved ? 'Approved by user' : 'Denied by user',
        tool_calls: toolCallsToApprove
      };
    } catch (error) {
      console.error('Error in approval request handler:', error);

      // Report error
      const result: ToolResult = {
        tool_call_id: toolCall.tool_call_id,
        result: null,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
      await onToolComplete(result);

      return null;
    }
  },

  // Toast handler - shows a toast and returns success
  toast: async (toolCall: ToolCall, onToolComplete: (result: ToolResult) => Promise<void>): Promise<{} | null> => {
    try {
      const input = JSON.parse(toolCall.input);
      const message: string = input.message || 'Toast message';
      const type: 'success' | 'error' | 'warning' | 'info' = input.type || 'info';

      if (!showToast) {
        console.warn('Toast not initialized');
        return null;
      }

      showToast(message, type);

      // Report completion
      const result: ToolResult = {
        tool_call_id: toolCall.tool_call_id,
        result: { success: true, message: 'Toast displayed successfully' },
        success: true
      };
      await onToolComplete(result);

      return {
        success: true,
        message: 'Toast displayed successfully'
      };
    } catch (error) {
      console.error('Error in toast handler:', error);

      // Report error
      const result: ToolResult = {
        tool_call_id: toolCall.tool_call_id,
        result: null,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
      await onToolComplete(result);

      return null;
    }
  },

  // Input request handler - shows prompt
  input_request: async (toolCall: ToolCall, onToolComplete: (result: ToolResult) => Promise<void>): Promise<{} | null> => {
    try {
      const input = JSON.parse(toolCall.input);
      const prompt: string = input.prompt || 'Please provide input:';
      const defaultValue: string = input.default || '';

      const userInput = window.prompt(prompt, defaultValue);

      if (userInput === null) {
        // Report cancellation
        const result: ToolResult = {
          tool_call_id: toolCall.tool_call_id,
          result: null,
          success: false,
          error: 'User cancelled input'
        };
        await onToolComplete(result);
        return null; // User cancelled
      }

      // Report completion
      const result: ToolResult = {
        tool_call_id: toolCall.tool_call_id,
        result: { input: userInput },
        success: true
      };
      await onToolComplete(result);

      return {
        input: userInput
      };
    } catch (error) {
      console.error('Error in input request handler:', error);

      // Report error
      const result: ToolResult = {
        tool_call_id: toolCall.tool_call_id,
        result: null,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
      await onToolComplete(result);

      return null;
    }
  }
});

/**
 * Process external tool calls with handlers
 */
export const processExternalToolCalls = async (
  toolCalls: ToolCall[],
  handlers: Record<string, ToolHandler>,
  onToolComplete: (results: ToolResult[]) => Promise<void>
): Promise<void> => {
  const results: ToolResult[] = [];

  for (const toolCall of toolCalls) {
    const handler = handlers[toolCall.tool_name];

    if (!handler) {
      // No handler found - report as error
      const result: ToolResult = {
        tool_call_id: toolCall.tool_call_id,
        result: null,
        success: false,
        error: `No handler found for tool: ${toolCall.tool_name}`
      };
      results.push(result);
      continue;
    }

    try {
      // Create a wrapper onToolComplete that collects results
      const singleToolComplete = async (result: ToolResult) => {
        results.push(result);
        // Also call the main onToolComplete with all results so far
        await onToolComplete([...results]);
      };

      // Execute handler with single tool complete callback
      await handler(toolCall, singleToolComplete);
    } catch (error) {
      console.error(`Error executing tool ${toolCall.tool_name}:`, error);

      // Report error
      const result: ToolResult = {
        tool_call_id: toolCall.tool_call_id,
        result: null,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
      results.push(result);
      await onToolComplete([...results]);
    }
  }
}; 