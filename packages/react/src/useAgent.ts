import React, { useState, useCallback, useRef } from 'react';
import {
  Agent,
  AgentDefinition,
  DistriClient,
} from '@distri/core';
import { useDistri } from './DistriProvider';

export interface UseAgentOptions {
  agentIdOrDef: string | AgentDefinition;
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

    try {
      setLoading(true);
      setError(null);

      // Clear previous agent if switching to a different one
      if (
        currentAgentIdRef.current !== agentIdOrDef ||
        currentClientRef.current !== client
      ) {
        agentRef.current = null;
        setAgent(null);
      }

      const newAgent = await Agent.create(agentIdOrDef, client);
      agentRef.current = newAgent;
      currentAgentIdRef.current = agentIdOrDef;
      currentClientRef.current = client;
      setAgent(newAgent);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to create agent'));
    } finally {
      setLoading(false);
    }
  }, [client, agentIdOrDef]);

  // Auto-initialize agent when client is ready or agentId changes
  React.useEffect(() => {
    if (!clientLoading && !clientError && client) {
      initializeAgent();
    }
  }, [clientLoading, clientError, client, agentIdOrDef, initializeAgent]);

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

