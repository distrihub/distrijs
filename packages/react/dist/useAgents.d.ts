import { AgentCard } from '@distri/core';
export interface UseAgentsResult {
    agents: AgentCard[];
    loading: boolean;
    error: Error | null;
    refetch: () => Promise<void>;
    getAgent: (agentUrl: string) => Promise<AgentCard>;
}
export declare function useAgents(): UseAgentsResult;
