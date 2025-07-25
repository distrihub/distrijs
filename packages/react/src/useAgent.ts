import React, { useState, useCallback, useRef } from 'react';
import {
  Agent,
} from '@distri/core';
import { useDistri } from './DistriProvider';

export interface UseAgentOptions {
  agentId: string;
  autoCreateAgent?: boolean;
}

export interface UseAgentResult {
  // Agent information
  agent: Agent | null;

  // State management
  loading: boolean;
  error: Error | null;
}

/**
 * useAgent is for agent configuration and invocation.
 * For chat UIs, use useChat instead.
 */
export function useAgent({
  agentId,
  autoCreateAgent = true,
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


  return {
    // Agent information
    agent,

    // State management
    loading: loading || clientLoading,
    error: error || clientError,
  };
}

