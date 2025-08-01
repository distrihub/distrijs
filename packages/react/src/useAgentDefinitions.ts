import { useState, useEffect, useCallback } from 'react';
import { AgentDefinition } from '@distri/core';
import { useDistri } from './DistriProvider';

export interface UseAgentsResult {
  agents: AgentDefinition[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  getAgent: (agentId: string) => Promise<AgentDefinition>;
}

export function useAgentDefinitions(): UseAgentsResult {
  const { client, error: clientError, isLoading: clientLoading } = useDistri();
  const [agents, setAgents] = useState<AgentDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchAgents = useCallback(async () => {
    if (!client) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const fetchedAgents = await client.getAgents();
      setAgents(fetchedAgents);
    } catch (err) {
      console.error('[useAgentDefinitions] Failed to fetch agents:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch agents'));
    } finally {
      setLoading(false);
    }
  }, [client]);

  const getAgent = useCallback(async (agentId: string): Promise<AgentDefinition> => {
    if (!client) {
      throw new Error('Client not available');
    }

    try {
      const agent = await client.getAgent(agentId);

      // Update the agent in our local state if it exists
      setAgents(prev => prev.map(a => a.id === agentId ? agent : a));

      return agent;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to get agent');
      setError(error);
      throw error;
    }
  }, [client]);

  useEffect(() => {
    if (clientLoading) {
      setLoading(true);
      return;
    }

    if (clientError) {
      console.error('[useAgentDefinitions] Client error:', clientError);
      setError(clientError);
      setLoading(false);
      return;
    }

    if (client) {
      fetchAgents();
    } else {
      console.log('[useAgentDefinitions] No client available');
      setLoading(false);
    }
  }, [clientLoading, clientError, client, fetchAgents]);

  return {
    agents,
    loading: loading || clientLoading,
    error: error || clientError,
    refetch: fetchAgents,
    getAgent
  };
}