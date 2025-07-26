import { useState, useCallback } from 'react';
import { ToolCall, ToolResult } from '@distri/core';

export type ToolCallStatus = 'pending' | 'running' | 'completed' | 'error' | 'user_action_required';

export interface ToolCallState {
  tool_call_id: string;
  status: ToolCallStatus;
  result?: any;
  error?: string;
  startedAt?: Date;
  completedAt?: Date;
}

export interface UseToolCallStateOptions {
  onAllToolsCompleted?: (toolResults: ToolResult[]) => void;
}

export interface UseToolCallStateReturn {
  toolCalls: ToolCall[];
  toolResults: ToolResult[];
  toolCallStates: Map<string, ToolCallState>;
  
  // State management methods
  addToolCall: (toolCall: ToolCall) => void;
  updateToolCallStatus: (toolCallId: string, status: ToolCallStatus, result?: any, error?: string) => void;
  completeToolCall: (toolCallId: string, result: any, success?: boolean, error?: string) => void;
  setToolCallRunning: (toolCallId: string) => void;
  setToolCallError: (toolCallId: string, error: string) => void;
  
  // Query methods
  getToolCallState: (toolCallId: string) => ToolCallState | undefined;
  getToolCallStatus: (toolCallId: string) => ToolCallStatus | undefined;
  hasPendingToolCalls: () => boolean;
  getPendingToolCalls: () => ToolCall[];
  
  // Bulk operations
  clearAll: () => void;
  clearToolResults: () => void;
}

export function useToolCallState(options: UseToolCallStateOptions = {}): UseToolCallStateReturn {
  const [toolCalls, setToolCalls] = useState<ToolCall[]>([]);
  const [toolResults, setToolResults] = useState<ToolResult[]>([]);
  const [toolCallStates, setToolCallStates] = useState<Map<string, ToolCallState>>(new Map());

  const { onAllToolsCompleted } = options;

  // Add a new tool call
  const addToolCall = useCallback((toolCall: ToolCall) => {
    setToolCalls(prev => [...prev, toolCall]);
    setToolCallStates(prev => {
      const newStates = new Map(prev);
      newStates.set(toolCall.tool_call_id, {
        tool_call_id: toolCall.tool_call_id,
        status: 'pending',
        startedAt: new Date()
      });
      return newStates;
    });
  }, []);

  // Update tool call status with optional result/error
  const updateToolCallStatus = useCallback((
    toolCallId: string, 
    status: ToolCallStatus, 
    result?: any, 
    error?: string
  ) => {
    setToolCallStates(prev => {
      const newStates = new Map(prev);
      const currentState = newStates.get(toolCallId);
      
      newStates.set(toolCallId, {
        ...currentState,
        tool_call_id: toolCallId,
        status,
        result,
        error,
        completedAt: status === 'completed' || status === 'error' ? new Date() : currentState?.completedAt
      });
      return newStates;
    });
  }, []);

  // Complete a tool call and add result
  const completeToolCall = useCallback((
    toolCallId: string, 
    result: any, 
    success: boolean = true, 
    error?: string
  ) => {
    // Create tool result
    const toolResult: ToolResult = {
      tool_call_id: toolCallId,
      result,
      success,
      error
    };

    // Add to tool results
    setToolResults(prev => {
      const newResults = [...prev, toolResult];
      
      // Update tool call status
      updateToolCallStatus(toolCallId, success ? 'completed' : 'error', result, error);
      
      // Check if all tools are completed after this update
      setTimeout(() => {
        setToolCallStates(currentStates => {
          const pendingCount = Array.from(currentStates.values())
            .filter(state => state.status === 'pending' || state.status === 'running').length;
          
          // If no more pending tools, trigger callback
          if (pendingCount === 0 && onAllToolsCompleted) {
            onAllToolsCompleted(newResults);
          }
          
          return currentStates;
        });
      }, 0);
      
      return newResults;
    });
  }, [updateToolCallStatus, onAllToolsCompleted]);

  // Set tool call to running state
  const setToolCallRunning = useCallback((toolCallId: string) => {
    updateToolCallStatus(toolCallId, 'running');
  }, [updateToolCallStatus]);

  // Set tool call to error state
  const setToolCallError = useCallback((toolCallId: string, error: string) => {
    updateToolCallStatus(toolCallId, 'error', undefined, error);
  }, [updateToolCallStatus]);

  // Get tool call state
  const getToolCallState = useCallback((toolCallId: string) => {
    return toolCallStates.get(toolCallId);
  }, [toolCallStates]);

  // Get tool call status
  const getToolCallStatus = useCallback((toolCallId: string) => {
    return toolCallStates.get(toolCallId)?.status;
  }, [toolCallStates]);

  // Check if there are pending tool calls
  const hasPendingToolCalls = useCallback(() => {
    return Array.from(toolCallStates.values()).some(
      state => state.status === 'pending' || state.status === 'running'
    );
  }, [toolCallStates]);

  // Get pending tool calls
  const getPendingToolCalls = useCallback(() => {
    const pendingIds = Array.from(toolCallStates.entries())
      .filter(([_, state]) => state.status === 'pending' || state.status === 'running')
      .map(([id, _]) => id);
    
    return toolCalls.filter(tc => pendingIds.includes(tc.tool_call_id));
  }, [toolCalls, toolCallStates]);

  // Clear all state
  const clearAll = useCallback(() => {
    setToolCalls([]);
    setToolResults([]);
    setToolCallStates(new Map());
  }, []);

  // Clear only tool results
  const clearToolResults = useCallback(() => {
    setToolResults([]);
  }, []);

  return {
    toolCalls,
    toolResults,
    toolCallStates,
    
    addToolCall,
    updateToolCallStatus,
    completeToolCall,
    setToolCallRunning,
    setToolCallError,
    
    getToolCallState,
    getToolCallStatus,
    hasPendingToolCalls,
    getPendingToolCalls,
    
    clearAll,
    clearToolResults
  };
}