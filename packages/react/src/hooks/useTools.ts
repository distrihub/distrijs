import { useEffect, useRef } from 'react';
import { DistriTool, Agent } from '@distri/core';

export interface UseToolsOptions {
  agent?: Agent;
  tools?: DistriTool[];
}

export function useTools({ agent, tools }: UseToolsOptions) {
  const lastAgentIdRef = useRef<string | null>(null);
  const registeredToolsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!agent || !tools || tools.length === 0) {
      return;
    }

    // Only register if agent ID changed
    if (lastAgentIdRef.current === agent.id) {
      return;
    }

    console.log(`Registering ${tools.length} tools for agent: ${agent.id}`);

    // Register each tool
    tools.forEach(tool => {
      if (!registeredToolsRef.current.has(tool.name)) {
        agent.registerTool(tool);
        registeredToolsRef.current.add(tool.name);
        console.log(`✓ Registered tool: ${tool.name}`);
      }
    });

    lastAgentIdRef.current = agent.id;
    console.log(`Successfully registered ${tools.length} tools with agent`);
  }, [agent?.id, tools]);
}

/**
 * Built-in tool definitions
 */
export const createBuiltinTools = () => ({
  /**
   * Confirmation tool for user approval
   */
  confirm: {
    name: 'confirm',
    description: 'Ask user for confirmation',
    parameters: {
      type: 'object',
      properties: {
        message: { type: 'string', description: 'Message to show to user' },
        defaultValue: { type: 'boolean', description: 'Default value if user doesnt respond' }
      },
      required: ['message']
    },
    handler: async (input: { message: string; defaultValue?: boolean }) => {
      const result = confirm(input.message);
      return { confirmed: result };
    }
  },

  /**
   * Input request tool
   */
  input: {
    name: 'input',
    description: 'Request text input from user',
    parameters: {
      type: 'object',
      properties: {
        prompt: { type: 'string', description: 'Prompt to show to user' },
        placeholder: { type: 'string', description: 'Placeholder text' }
      },
      required: ['prompt']
    },
    handler: async (input: { prompt: string; placeholder?: string }) => {
      const result = prompt(input.prompt, input.placeholder);
      return { input: result };
    }
  },

  /**
   * Notification tool
   */
  notify: {
    name: 'notify',
    description: 'Show notification to user',
    parameters: {
      type: 'object',
      properties: {
        message: { type: 'string', description: 'Notification message' },
        type: { type: 'string', enum: ['info', 'success', 'warning', 'error'], description: 'Notification type' }
      },
      required: ['message']
    },
    handler: async (input: { message: string; type?: string }) => {
      // In a real app, this would show a toast notification
      console.log(`[${input.type || 'info'}] ${input.message}`);
      return { notified: true };
    }
  }
});