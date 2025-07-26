import { useState, useCallback, useRef } from 'react';
import { ToolCall, ToolResult } from '@distri/core';

export interface ToolCallState {
  toolCall: ToolCall;
  status: 'pending' | 'running' | 'completed' | 'error' | 'user_action_required';
  result?: any;
  error?: string;
  startedAt?: Date;
  completedAt?: Date;
}

export interface ToolHandler {
  (input: any): Promise<any> | any;
}

export interface UseToolManagerOptions {
  tools?: Record<string, ToolHandler>;
  autoExecute?: boolean; // Whether to automatically execute tools when detected
  onToolComplete?: (toolCallId: string, result: ToolResult) => void;
  onAllToolsComplete?: (results: ToolResult[]) => void;
}

export interface UseToolManagerReturn {
  toolCalls: ToolCallState[];
  executeTool: (toolCall: ToolCall) => Promise<void>;
  completeTool: (toolCallId: string, result: any, success?: boolean, error?: string) => void;
  executeAllTools: (toolCalls: ToolCall[]) => Promise<ToolResult[]>;
  clearToolCalls: () => void;
  isExecuting: boolean;
  addToolCalls: (toolCalls: ToolCall[]) => void;
  getToolCallStatus: (toolCallId: string) => ToolCallState | undefined;
}

export function useToolManager(options: UseToolManagerOptions = {}): UseToolManagerReturn {
  const [toolCalls, setToolCalls] = useState<ToolCallState[]>([]);
  const [isExecuting, setIsExecuting] = useState(false);
  const toolsRef = useRef(options.tools || {});
  const onToolCompleteRef = useRef(options.onToolComplete);
  const onAllToolsCompleteRef = useRef(options.onAllToolsComplete);
  const autoExecuteRef = useRef(options.autoExecute ?? false);

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
  if (options.autoExecute !== autoExecuteRef.current) {
    autoExecuteRef.current = options.autoExecute ?? false;
  }

  const addToolCalls = useCallback((newToolCalls: ToolCall[]) => {
    setToolCalls(prev => {
      const existingIds = new Set(prev.map(tc => tc.toolCall.tool_call_id));
      const newToolCallStates = newToolCalls
        .filter(tc => !existingIds.has(tc.tool_call_id))
        .map(tc => ({
          toolCall: tc,
          status: 'pending' as const,
          startedAt: new Date()
        }));

      return [...prev, ...newToolCallStates];
    });

    // Auto-execute if enabled
    if (autoExecuteRef.current) {
      newToolCalls.forEach(tc => executeTool(tc));
    }
  }, []);

  const executeTool = useCallback(async (toolCall: ToolCall) => {
    const toolHandler = toolsRef.current[toolCall.tool_name];

    // Update status to running (this handles both new executions and reruns)
    setToolCalls(prev => prev.map(tc =>
      tc.toolCall.tool_call_id === toolCall.tool_call_id
        ? { ...tc, status: 'running' as const, startedAt: new Date(), error: undefined, result: undefined }
        : tc
    ));

    if (!toolHandler) {
      // Tool not found, mark as user action required
      setToolCalls(prev => prev.map(tc =>
        tc.toolCall.tool_call_id === toolCall.tool_call_id
          ? { ...tc, status: 'user_action_required' as const }
          : tc
      ));
      return;
    }

    try {
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
          ? { ...tc, status: 'completed' as const, result, completedAt: new Date() }
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
          ? { ...tc, status: 'error' as const, error: errorResult.error, completedAt: new Date() }
          : tc
      ));

      onToolCompleteRef.current?.(toolCall.tool_call_id, errorResult);
    }
  }, []);

  const completeTool = useCallback((toolCallId: string, result: any, success: boolean = true, error?: string) => {
    const toolResult: ToolResult = {
      tool_call_id: toolCallId,
      result,
      success,
      error
    };

    // Update status
    setToolCalls(prev => prev.map(tc =>
      tc.toolCall.tool_call_id === toolCallId
        ? {
          ...tc,
          status: success ? 'completed' as const : 'error' as const,
          result,
          error,
          completedAt: new Date()
        }
        : tc
    ));

    onToolCompleteRef.current?.(toolCallId, toolResult);
  }, []);

  const executeAllTools = useCallback(async (toolCallsToExecute: ToolCall[]): Promise<ToolResult[]> => {
    setIsExecuting(true);

    try {
      // Add tool calls first
      addToolCalls(toolCallsToExecute);

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
  }, [executeTool, addToolCalls, toolCalls]);

  const clearToolCalls = useCallback(() => {
    setToolCalls([]);
  }, []);

  const getToolCallStatus = useCallback((toolCallId: string) => {
    return toolCalls.find(tc => tc.toolCall.tool_call_id === toolCallId);
  }, [toolCalls]);

  return {
    toolCalls,
    executeTool,
    completeTool,
    executeAllTools,
    clearToolCalls,
    isExecuting,
    addToolCalls,
    getToolCallStatus
  };
} 