import React, { useState, useCallback, useRef } from 'react';
import {
  Agent,
  AgentDefinition,
  DistriClient,
} from '@distri/core';
import { useDistri } from './DistriProvider';

export interface UseAgentOptions {
  agentIdOrDef: string | AgentDefinition;
  enabled?: boolean;
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
  agentIdOrDef,
  enabled = true,
}: UseAgentOptions): UseAgentResult {
  const { client, error: clientError, isLoading: clientLoading } = useDistri();
  const [agent, setAgent] = useState<Agent | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const agentRef = useRef<Agent | null>(null);
  const currentAgentIdRef = useRef<string | AgentDefinition | null>(null);
  const currentClientRef = useRef<DistriClient | null>(null);

  // Initialize agent
  const initializeAgent = useCallback(async () => {
    if (!client || !agentIdOrDef) return;

    // Check if we need to create a new agent
    if (
      currentAgentIdRef.current === agentIdOrDef &&
      agentRef.current &&
      currentClientRef.current === client
    ) {
      return; // Same agent, no need to recreate
    }

    setLoading(true);
    setError(null);

    try {
      let newAgent: Agent;
      if (typeof agentIdOrDef === 'string') {
        // Fetch agent config from server and create Agent instance
        const agentConfig = await client.getAgent(agentIdOrDef);
        newAgent = new Agent(agentConfig, client);
      } else {
        // AgentDefinition passed directly - create Agent instance
        newAgent = new Agent(agentIdOrDef, client);
      }

      agentRef.current = newAgent;
      currentAgentIdRef.current = agentIdOrDef;
      currentClientRef.current = client;
      setAgent(newAgent);
    } catch (err) {
      console.error('Failed to initialize agent:', err);
      const initError = err instanceof Error ? err : new Error('Failed to initialize agent');
      setError(initError);
      agentRef.current = null;
    } finally {
      setLoading(false);
    }
  }, [client, agentIdOrDef]);

  React.useEffect(() => {
    if (!clientLoading && !clientError && client && enabled) {
      initializeAgent();
    }
  }, [clientLoading, clientError, client, agentIdOrDef, initializeAgent, enabled]);

  // Reset agent when agentId changes
  React.useEffect(() => {
    if (currentAgentIdRef.current !== agentIdOrDef) {
      agentRef.current = null;
      setAgent(null);
      currentAgentIdRef.current = null;
    }
  }, [agentIdOrDef]);

  // Reset agent when client instance changes
  React.useEffect(() => {
    if (currentClientRef.current !== client) {
      agentRef.current = null;
      setAgent(null);
      currentClientRef.current = null;
    }
  }, [client]);

  return {
    // Agent information
    agent,

    // State management
    loading: loading || clientLoading,
    error: error || clientError,
  };
}
