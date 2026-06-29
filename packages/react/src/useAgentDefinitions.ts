import { useState, useEffect, useCallback } from 'react';
import { AgentCard, AgentDefinition } from '@distri/core';
import { useDistri } from './DistriProvider';

export interface UseAgentsResult {
  /**
   * Lightweight A2A {@link AgentCard} list used for listings/pickers. Populated
   * on mount from the bulk `GET /agents/cards` endpoint (name, description,
   * version, icon, skills) — it does NOT include the full agent definition.
   */
  agents: AgentCard[];
  loading: boolean;
  error: Error | null;
  /** Refetch the lightweight card list (same source as {@link agents}). */
  refetch: () => Promise<void>;
  /**
   * Fetch the full, heavy {@link AgentDefinition} list (system prompts, tools,
   * model settings). Reserved for admin/edit surfaces — NOT loaded on mount.
   */
  getAgents: () => Promise<AgentDefinition[]>;
  /**
   * Fetch the lightweight {@link AgentCard} list (bulk). Same data that backs
   * {@link agents}; exposed for callers that want to fetch on demand.
   */
  getAgentCards: () => Promise<AgentCard[]>;
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
  // List state holds lightweight cards (display-only: name/description/version/icon).
  // The heavy AgentDefinition list is fetched on demand via getAgents().
  const [agents, setAgents] = useState<AgentCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const getAgentCards = useCallback(async (): Promise<AgentCard[]> => {
    if (!client) {
      throw new Error('Client not available');
    }
    return await client.getAgentCards();
  }, [client]);

  const getAgents = useCallback(async (): Promise<AgentDefinition[]> => {
    if (!client) {
      throw new Error('Client not available');
    }
    return await client.getAgents();
  }, [client]);

  // Populate the list from the lightweight bulk card endpoint. The list is
  // display-only, so cards are sufficient and avoid the heavy admin fetch.
  const fetchAgents = useCallback(async () => {
    if (!client) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const fetchedCards = await client.getAgentCards();
      setAgents(fetchedCards);
    } catch (err) {
      console.error('[useAgentDefinitions] Failed to fetch agent cards:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch agent cards'));
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
    getAgents,
    getAgentCards,
    getAgent,
    getAgentCard
  };
}