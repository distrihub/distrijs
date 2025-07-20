import React, { useState, useCallback, useRef } from 'react';
import {
  Agent,
  InvokeConfig,
  InvokeResult,
  InvokeStreamResult,
  ExternalToolHandler,
  ApprovalHandler,
  ToolCall,
} from '@distri/core';
import { useDistri } from './DistriProvider';

export interface UseAgentOptions {
  agentId: string;
  autoCreateAgent?: boolean;
  defaultExternalToolHandlers?: Record<string, ExternalToolHandler>;
  defaultApprovalHandler?: ApprovalHandler;
}

export interface UseAgentResult {
  agent: Agent | null;
  loading: boolean;
  error: Error | null;
  invoke: (input: string, config?: InvokeConfig) => Promise<InvokeResult | InvokeStreamResult>;
  invokeWithHandlers: (
    input: string,
    handlers?: Record<string, ExternalToolHandler>,
    approvalHandler?: ApprovalHandler,
    config?: Omit<InvokeConfig, 'externalToolHandlers' | 'approvalHandler'>
  ) => Promise<InvokeResult>;
}

/**
 * React hook for working with a specific agent
 */
export function useAgent({
  agentId,
  autoCreateAgent = true,
  defaultExternalToolHandlers,
  defaultApprovalHandler
}: UseAgentOptions): UseAgentResult {
  const { client, error: clientError, isLoading: clientLoading } = useDistri();
  const [agent, setAgent] = useState<Agent | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const agentRef = useRef<Agent | null>(null);

  // Initialize agent
  const initializeAgent = useCallback(async () => {
    if (!client || !agentId || agentRef.current) return;

    try {
      setLoading(true);
      setError(null);
      const newAgent = await Agent.create(agentId, client);
      agentRef.current = newAgent;
      setAgent(newAgent);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to create agent'));
    } finally {
      setLoading(false);
    }
  }, [client, agentId]);

  // Auto-initialize agent when client is ready
  React.useEffect(() => {
    if (!clientLoading && !clientError && autoCreateAgent && client) {
      initializeAgent();
    }
  }, [clientLoading, clientError, autoCreateAgent, client, initializeAgent]);

  // Invoke method
  const invoke = useCallback(async (
    input: string,
    config: InvokeConfig = {}
  ): Promise<InvokeResult | InvokeStreamResult> => {
    if (!agent) {
      throw new Error('Agent not initialized');
    }

    const finalConfig = {
      ...config,
      externalToolHandlers: config.externalToolHandlers || defaultExternalToolHandlers,
      approvalHandler: config.approvalHandler || defaultApprovalHandler
    };

    return agent.invoke(input, finalConfig);
  }, [agent, defaultExternalToolHandlers, defaultApprovalHandler]);

  // Convenience method with explicit handlers
  const invokeWithHandlers = useCallback(async (
    input: string,
    handlers?: Record<string, ExternalToolHandler>,
    approvalHandler?: ApprovalHandler,
    config: Omit<InvokeConfig, 'externalToolHandlers' | 'approvalHandler'> = {}
  ): Promise<InvokeResult> => {
    if (!agent) {
      throw new Error('Agent not initialized');
    }

    const result = await agent.invoke(input, {
      ...config,
      stream: false,
      externalToolHandlers: handlers || defaultExternalToolHandlers,
      approvalHandler: approvalHandler || defaultApprovalHandler
    });

    // Since stream is false, this will always be InvokeResult
    return result as InvokeResult;
  }, [agent, defaultExternalToolHandlers, defaultApprovalHandler]);

  return {
    agent,
    loading: loading || clientLoading,
    error: error || clientError,
    invoke,
    invokeWithHandlers
  };
}

/**
 * Built-in external tool handlers
 */
export const createBuiltinToolHandlers = (): Record<string, ExternalToolHandler> => ({
  // File upload handler
  file_upload: async (toolCall: ToolCall) => {
    const input = JSON.parse(toolCall.input);
    // This would typically open a file picker
    // For now, return a placeholder
    console.log('File upload requested:', input);
    return { success: true, message: 'File upload simulated' };
  },

  // Input request handler
  input_request: async (toolCall: ToolCall) => {
    const input = JSON.parse(toolCall.input);
    const userInput = prompt(input.prompt || 'Please provide input:');
    return { input: userInput };
  },

  // Email send handler
  email_send: async (toolCall: ToolCall) => {
    const input = JSON.parse(toolCall.input);
    console.log('Email send requested:', input);
    return { success: true, message: 'Email sent successfully' };
  }
});

/**
 * Built-in approval handler with confirm dialog
 */
export const createBuiltinApprovalHandler = (): ApprovalHandler => {
  return async (toolCalls: ToolCall[], reason?: string): Promise<boolean> => {
    const toolNames = toolCalls.map(tc => tc.tool_name).join(', ');
    const message = reason
      ? `${reason}\n\nTools to execute: ${toolNames}\n\nDo you approve?`
      : `Execute tools: ${toolNames}?`;

    return confirm(message);
  };
};