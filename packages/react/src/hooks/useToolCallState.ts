import { useState, useCallback } from 'react';
import { Agent, ToolCall, ToolResult } from '@distri/core';
import { DistriAnyTool, DistriUiTool, ToolCallState } from '@/types';

export interface UseToolCallStateOptions {
  onAllToolsCompleted?: (toolResults: ToolResult[]) => void;
  tools?: DistriAnyTool[];
  agent?: Agent;
}

export interface UseToolCallStateReturn {
  toolCallStates: Map<string, ToolCallState>;

  // State management methods
  initToolCall: (toolCall: ToolCall) => void;
  updateToolCallStatus: (toolCallId: string, updates: Partial<ToolCallState>) => void;

  // Query methods
  getToolCallState: (toolCallId: string) => ToolCallState | undefined;
  hasPendingToolCalls: () => boolean;
  getPendingToolCalls: () => ToolCallState[];

  // Bulk operations
  clearAll: () => void;
  clearToolResults: () => void;
}

export function useToolCallState(options: UseToolCallStateOptions): UseToolCallStateReturn {
  const [toolCallStates, setToolCallStates] = useState<Map<string, ToolCallState>>(new Map());

  const { onAllToolsCompleted, agent, tools } = options;

  const executeTool = async (tool: DistriAnyTool | undefined, toolCall: ToolCall) => {
    if (!tool) {
      console.error(`Tool ${toolCall.tool_name} not found`);
      return;
    }
    let component: React.ReactNode | undefined;
    if (tool.type === 'ui') {
      component = (tool as DistriUiTool).component({
        toolCall,
        toolCallState: toolCallStates.get(toolCall.tool_call_id),
        completeTool: (result: ToolResult) => {
          updateToolCallStatus(toolCall.tool_call_id, {
            status: 'completed',
            result,
            completedAt: new Date()
          });
        }
      });
      updateToolCallStatus(toolCall.tool_call_id, {
        tool_name: toolCall.tool_name,
        input: toolCall.input,
        component,
        status: 'running',
        startedAt: new Date()
      });
    }
    else {
      try {
        const result = await tool.handler(toolCall.input);
        console.log('result', result);
        updateToolCallStatus(toolCall.tool_call_id, {
          status: 'completed',
          result: JSON.stringify(result),
          completedAt: new Date()
        });


      }
      catch (error) {
        updateToolCallStatus(toolCall.tool_call_id, {
          status: 'error',
          error: error instanceof Error ? error.message : String(error),
          completedAt: new Date()
        });
      }
    }
  }
  // Add a new tool call
  const initToolCall = useCallback((toolCall: ToolCall) => {
    const tool = agent?.getTools().find(t => t.name === toolCall.tool_name);


    setToolCallStates(prev => {
      const newStates = new Map(prev);
      const state: ToolCallState = {
        tool_call_id: toolCall.tool_call_id,
        tool_name: toolCall.tool_name,
        input: toolCall.input,
        status: 'pending',
        startedAt: new Date(),
      };
      newStates.set(toolCall.tool_call_id, state);
      return newStates;
    });
    if (tool) {
      executeTool(tool as DistriAnyTool, toolCall);
    } else {
      console.log(agent?.getTools());
    }

  }, []);

  // Update tool call status with optional result/error
  const updateToolCallStatus = useCallback((
    toolCallId: string,
    updates: Partial<ToolCallState>
  ) => {
    setToolCallStates(prev => {
      const newStates = new Map(prev);
      const currentState = newStates.get(toolCallId);

      if (currentState) {
        newStates.set(toolCallId, {
          ...currentState,
          ...updates
        });
      }

      // Trigger callback if all tools are completed
      if (tools) {
        const pendingToolCalls = getPendingToolCalls();
        if (pendingToolCalls.length === 0 && onAllToolsCompleted) {
          const externalCalls = Array.from(newStates.values()).filter(state => state.status === 'completed' || state.status === 'error' && tools.find(tool => tool.name === state.tool_name)).map(state => ({
            tool_call_id: state.tool_call_id,
            result: state.result,
            success: state.status === 'completed',
            error: state.error
          }));
          if (externalCalls.length > 0) {
            onAllToolsCompleted(externalCalls);
          }
        }
      }

      return newStates;
    });
  }, [tools]);

  // Get tool call state
  const getToolCallState = useCallback((toolCallId: string) => {
    return toolCallStates.get(toolCallId);
  }, [toolCallStates]);

  // Check if there are pending tool calls
  const hasPendingToolCalls = useCallback(() => {
    return getPendingToolCalls().length > 0;
  }, [toolCallStates]);

  // Get pending tool calls
  const getPendingToolCalls = useCallback(() => {
    const pendingIds = Array.from(toolCallStates.entries())
      .filter(([_, state]) => state.status === 'pending' || state.status === 'running' && tools?.find(tool => tool.name === state.tool_name))
      .map(([id, _]) => id);

    return Array.from(toolCallStates.values()).filter(state => pendingIds.includes(state.tool_call_id));
  }, [toolCallStates, tools]);

  // Clear all state
  const clearAll = useCallback(() => {
    setToolCallStates(new Map());
  }, []);

  // Clear only tool results
  const clearToolResults = useCallback(() => {
    toolCallStates.forEach(state => {
      state.result = undefined;
      state.error = undefined;
    });
  }, []);

  return {
    toolCallStates,
    initToolCall,
    updateToolCallStatus,

    getToolCallState,
    hasPendingToolCalls,
    getPendingToolCalls,

    clearAll,
    clearToolResults
  };
}