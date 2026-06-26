import { useState, useEffect, useCallback } from 'react';
import { AgentCard, AgentDefinition } from '@distri/core';
import { useDistri } from './DistriProvider';

export interface UseAgentsResult {
  agents: AgentDefinition[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  /**
   * Fetch the full, heavy {@link AgentDefinition} for a single agent (system
   * prompt, tools, model settings). Use this when editing or running the agent.
   */
  getAgent: (agentId: string) => Promise<AgentDefinition>;
  /**
   * Fetch the lightweight A2A {@link AgentCard} for a single agent (name,
   * description, version, icon, skills, capabilities). Prefer this for
   * listings/pickers where the full definition is not needed.
   */
  getAgentCard: (agentId: string) => Promise<AgentCard>;
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
      setAgents(prev => prev.map(a => a.name === agent.name ? agent : a));

      return agent;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to get agent');
      setError(error);
      throw error;
    }
  }, [client]);

  const getAgentCard = useCallback(async (agentId: string): Promise<AgentCard> => {
    if (!client) {
      throw new Error('Client not available');
    }

    try {
      return await client.getAgentCard(agentId);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to get agent card');
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
    getAgent,
    getAgentCard
  };
}