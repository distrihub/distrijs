import React, { useState, useCallback, useRef } from 'react';
import {
  Agent,
} from '@distri/core';
import { useDistri } from './DistriProvider';

export interface UseAgentOptions {
  agentId: string;
  agent?: Agent;
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
  const currentAgentIdRef = useRef<string | null>(null);

  // Initialize agent
  const initializeAgent = useCallback(async () => {
    if (!client || !agentId) return;

    // Check if we need to create a new agent
    if (currentAgentIdRef.current === agentId && agentRef.current) {
      return; // Same agent, no need to recreate
    }

    try {
      setLoading(true);
      setError(null);
      
      // Clear previous agent if switching to a different one
      if (currentAgentIdRef.current !== agentId) {
        agentRef.current = null;
        setAgent(null);
      }
      
      const newAgent = await Agent.create(agentId, client);
      agentRef.current = newAgent;
      currentAgentIdRef.current = agentId;
      setAgent(newAgent);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to create agent'));
    } finally {
      setLoading(false);
    }
  }, [client, agentId]);

  // Auto-initialize agent when client is ready or agentId changes
  React.useEffect(() => {
    if (!clientLoading && !clientError && autoCreateAgent && client) {
      initializeAgent();
    }
  }, [clientLoading, clientError, autoCreateAgent, client, agentId, initializeAgent]);

  // Reset agent when agentId changes
  React.useEffect(() => {
    if (currentAgentIdRef.current !== agentId) {
      agentRef.current = null;
      setAgent(null);
      currentAgentIdRef.current = null;
    }
  }, [agentId]);

  return {
    // Agent information
    agent,

    // State management
    loading: loading || clientLoading,
    error: error || clientError,
  };
}

