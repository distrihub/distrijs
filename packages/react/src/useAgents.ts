import { useState, useEffect, useCallback } from 'react';
import { AgentCard } from '@distri/core';
import { useDistriClient } from './DistriProvider';

export interface UseAgentsResult {
  agents: AgentCard[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  getAgent: (agentId: string) => Promise<AgentCard>;
}

export function useAgents(): UseAgentsResult {
  const client = useDistriClient();
  const [agents, setAgents] = useState<AgentCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchAgents = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const fetchedAgents = await client.getAgents();
      setAgents(fetchedAgents);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch agents'));
    } finally {
      setLoading(false);
    }
  }, [client]);

  const getAgent = useCallback(async (agentId: string): Promise<AgentCard> => {
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
    fetchAgents();
  }, [fetchAgents]);

  return {
    agents,
    loading,
    error,
    refetch: fetchAgents,
    getAgent
  };
}