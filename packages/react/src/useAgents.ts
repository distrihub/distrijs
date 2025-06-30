import { useState, useEffect, useCallback } from 'react';
import { AgentCard } from '@distri/core';
import { useDistri } from './DistriProvider';

export interface UseAgentsResult {
  agents: AgentCard[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  getAgent: (agentUrl: string) => Promise<AgentCard>;
}

export function useAgents(): UseAgentsResult {
  const { client, error: clientError, isLoading: clientLoading } = useDistri();
  const [agents, setAgents] = useState<AgentCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchAgents = useCallback(async () => {
    if (!client) {
      console.log('[useAgents] Client not available, skipping fetch');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      console.log('[useAgents] Fetching agents...');
      const fetchedAgents = await client.getAgents();
      console.log('[useAgents] Fetched agents:', fetchedAgents);
      setAgents(fetchedAgents);
    } catch (err) {
      console.error('[useAgents] Failed to fetch agents:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch agents'));
    } finally {
      setLoading(false);
    }
  }, [client]);

  const getAgent = useCallback(async (agentUrl: string): Promise<AgentCard> => {
    if (!client) {
      throw new Error('Client not available');
    }

    try {
      const agent = await client.getAgent(agentUrl);
      
      // Update the agent in our local state if it exists
      setAgents(prev => prev.map(a => a.url === agentUrl ? agent : a));
      
      return agent;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to get agent');
      setError(error);
      throw error;
    }
  }, [client]);

  useEffect(() => {
    if (clientLoading) {
      console.log('[useAgents] Client is loading, waiting...');
      setLoading(true);
      return;
    }

    if (clientError) {
      console.error('[useAgents] Client error:', clientError);
      setError(clientError);
      setLoading(false);
      return;
    }

    if (client) {
      console.log('[useAgents] Client ready, fetching agents');
      fetchAgents();
    } else {
      console.log('[useAgents] No client available');
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