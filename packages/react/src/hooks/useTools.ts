import { useState, useCallback, useRef } from 'react';
import { ToolCall, ToolResult } from '@distri/core';

export interface ToolCallState {
  toolCall: ToolCall;
  status: 'pending' | 'running' | 'completed' | 'error';
  result?: any;
  error?: string;
}

export interface ToolHandler {
  (input: any): Promise<any> | any;
}

export interface UseToolsOptions {
  tools?: Record<string, ToolHandler>;
  onToolComplete?: (toolCallId: string, result: ToolResult) => void;
  onAllToolsComplete?: (results: ToolResult[]) => void;
}

export interface UseToolsReturn {
  toolCalls: ToolCallState[];
  executeTool: (toolCall: ToolCall) => Promise<void>;
  executeAllTools: (toolCalls: ToolCall[]) => Promise<ToolResult[]>;
  clearToolCalls: () => void;
  isExecuting: boolean;
}

export function useTools(options: UseToolsOptions = {}): UseToolsReturn {
  const [toolCalls, setToolCalls] = useState<ToolCallState[]>([]);
  const [isExecuting, setIsExecuting] = useState(false);
  const toolsRef = useRef(options.tools || {});
  const onToolCompleteRef = useRef(options.onToolComplete);
  const onAllToolsCompleteRef = useRef(options.onAllToolsComplete);

  // Update refs when options change
  if (options.tools !== toolsRef.current) {
    toolsRef.current = options.tools || {};
  }
  if (options.onToolComplete !== onToolCompleteRef.current) {
    onToolCompleteRef.current = options.onToolComplete;
  }
  if (options.onAllToolsComplete !== onAllToolsCompleteRef.current) {
    onAllToolsCompleteRef.current = options.onAllToolsComplete;
  }

  const executeTool = useCallback(async (toolCall: ToolCall) => {
    const toolHandler = toolsRef.current[toolCall.tool_name];

    if (!toolHandler) {
      // Tool not found, silently ignore
      const errorResult: ToolResult = {
        tool_call_id: toolCall.tool_call_id,
        result: null,
        success: false,
        error: `Tool '${toolCall.tool_name}' not found`
      };

      setToolCalls(prev => [...prev, {
        toolCall,
        status: 'error',
        error: errorResult.error
      }]);

      onToolCompleteRef.current?.(toolCall.tool_call_id, errorResult);
      return;
    }

    // Add tool call to state
    setToolCalls(prev => [...prev, {
      toolCall,
      status: 'pending'
    }]);

    try {
      // Update status to running
      setToolCalls(prev => prev.map(tc =>
        tc.toolCall.tool_call_id === toolCall.tool_call_id
          ? { ...tc, status: 'running' }
          : tc
      ));

      // Execute the tool
      const result = await toolHandler(toolCall.input);

      const successResult: ToolResult = {
        tool_call_id: toolCall.tool_call_id,
        result,
        success: true
      };

      // Update status to completed
      setToolCalls(prev => prev.map(tc =>
        tc.toolCall.tool_call_id === toolCall.tool_call_id
          ? { ...tc, status: 'completed', result }
          : tc
      ));

      onToolCompleteRef.current?.(toolCall.tool_call_id, successResult);
    } catch (error) {
      const errorResult: ToolResult = {
        tool_call_id: toolCall.tool_call_id,
        result: null,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };

      // Update status to error
      setToolCalls(prev => prev.map(tc =>
        tc.toolCall.tool_call_id === toolCall.tool_call_id
          ? { ...tc, status: 'error', error: errorResult.error }
          : tc
      ));

      onToolCompleteRef.current?.(toolCall.tool_call_id, errorResult);
    }
  }, []);

  const executeAllTools = useCallback(async (toolCallsToExecute: ToolCall[]): Promise<ToolResult[]> => {
    setIsExecuting(true);

    try {
      // Execute all tools in parallel
      const promises = toolCallsToExecute.map(toolCall => executeTool(toolCall));
      await Promise.all(promises);

      // Wait a bit for state updates to complete
      await new Promise(resolve => setTimeout(resolve, 100));

      // Get results from state
      const results: ToolResult[] = toolCallsToExecute.map(toolCall => {
        const state = toolCalls.find(tc => tc.toolCall.tool_call_id === toolCall.tool_call_id);
        if (!state) {
          return {
            tool_call_id: toolCall.tool_call_id,
            result: null,
            success: false,
            error: 'Tool call not found in state'
          };
        }

        return {
          tool_call_id: toolCall.tool_call_id,
          result: state.result,
          success: state.status === 'completed',
          error: state.error
        };
      });

      onAllToolsCompleteRef.current?.(results);
      return results;
    } finally {
      setIsExecuting(false);
    }
  }, [executeTool]);

  const clearToolCalls = useCallback(() => {
    setToolCalls([]);
  }, []);

  return {
    toolCalls,
    executeTool,
    executeAllTools,
    clearToolCalls,
    isExecuting
  };
} 