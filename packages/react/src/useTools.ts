import { useCallback, useRef } from 'react';
import { DistriTool, ToolCall, ToolResult, Agent } from '@distri/core';

export interface UseToolsOptions {
  agent?: Agent | null;
}

export interface UseToolsResult {
  addTool: (tool: DistriTool) => void;
  addTools: (tools: DistriTool[]) => void;
  removeTool: (toolName: string) => void;
  executeTool: (toolCall: ToolCall) => Promise<ToolResult>;
  getTools: () => string[];
  hasTool: (toolName: string) => boolean;
}

/**
 * Hook for managing tools in an agent
 * Follows AG-UI pattern for tool registration
 */
export function useTools({ agent }: UseToolsOptions): UseToolsResult {
  // Keep track of tools added through this hook
  const toolsRef = useRef<Set<string>>(new Set());

  const addTool = useCallback((tool: DistriTool) => {
    if (!agent) {
      console.warn('Cannot add tool: no agent provided');
      return;
    }
    
    agent.addTool(tool);
    toolsRef.current.add(tool.name);
  }, [agent]);

  const addTools = useCallback((tools: DistriTool[]) => {
    if (!agent) {
      console.warn('Cannot add tools: no agent provided');
      return;
    }
    
    tools.forEach(tool => {
      agent.addTool(tool);
      toolsRef.current.add(tool.name);
    });
  }, [agent]);

  const removeTool = useCallback((toolName: string) => {
    if (!agent) {
      console.warn('Cannot remove tool: no agent provided');
      return;
    }
    
    agent.removeTool(toolName);
    toolsRef.current.delete(toolName);
  }, [agent]);

  const executeTool = useCallback(async (toolCall: ToolCall): Promise<ToolResult> => {
    if (!agent) {
      return {
        tool_call_id: toolCall.tool_call_id,
        result: null,
        success: false,
        error: 'No agent provided'
      };
    }
    
    return agent.executeTool(toolCall);
  }, [agent]);

  const getTools = useCallback((): string[] => {
    if (!agent) return [];
    return agent.getTools();
  }, [agent]);

  const hasTool = useCallback((toolName: string): boolean => {
    if (!agent) return false;
    return agent.hasTool(toolName);
  }, [agent]);

  return {
    addTool,
    addTools,
    removeTool,
    executeTool,
    getTools,
    hasTool
  };
}

/**
 * Utility function to create common tool definitions
 */
export const createTool = (
  name: string,
  description: string,
  parameters: any,
  handler: (input: any) => Promise<any> | any
): DistriTool => ({
  name,
  description,
  parameters,
  handler
});

/**
 * Built-in tool definitions
 */
export const createBuiltinTools = () => ({
  /**
   * Confirmation tool for user approval
   */
  confirm: createTool(
    'confirm',
    'Ask user for confirmation',
    {
      type: 'object',
      properties: {
        message: { type: 'string', description: 'Message to show to user' },
        defaultValue: { type: 'boolean', description: 'Default value if user doesnt respond' }
      },
      required: ['message']
    },
    async (input: { message: string; defaultValue?: boolean }) => {
      const result = confirm(input.message);
      return { confirmed: result };
    }
  ),

  /**
   * Input request tool
   */
  input: createTool(
    'input',
    'Request text input from user',
    {
      type: 'object',
      properties: {
        prompt: { type: 'string', description: 'Prompt to show to user' },
        placeholder: { type: 'string', description: 'Placeholder text' }
      },
      required: ['prompt']
    },
    async (input: { prompt: string; placeholder?: string }) => {
      const result = prompt(input.prompt, input.placeholder);
      return { input: result };
    }
  ),

  /**
   * Notification tool
   */
  notify: createTool(
    'notify',
    'Show notification to user',
    {
      type: 'object',
      properties: {
        message: { type: 'string', description: 'Notification message' },
        type: { type: 'string', enum: ['info', 'success', 'warning', 'error'], description: 'Notification type' }
      },
      required: ['message']
    },
    async (input: { message: string; type?: string }) => {
      // In a real app, this would show a toast notification
      console.log(`[${input.type || 'info'}] ${input.message}`);
      return { notified: true };
    }
  )
});