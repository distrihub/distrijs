import { useCallback, useEffect, useRef, useState } from 'react';
import { Agent, AgentDefinition } from '@distri/core';
import { useDistriNative } from './DistriNativeProvider';

export interface UseAgentOptions {
  agentIdOrDef: string | AgentDefinition;
  enabled?: boolean;
}

export interface UseAgentResult {
  agent: Agent | null;
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
}

/** Loads a server agent definition or wraps a caller-provided definition. */
export function useAgent({ agentIdOrDef, enabled = true }: UseAgentOptions): UseAgentResult {
  const { client, error: clientError } = useDistriNative();
  const [agent, setAgent] = useState<Agent | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const requestId = useRef(0);

  const refresh = useCallback(async () => {
    const currentRequest = ++requestId.current;
    if (!client || !enabled) {
      setAgent(null);
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const definition = typeof agentIdOrDef === 'string'
        ? await client.getAgent(agentIdOrDef)
        : agentIdOrDef;
      if (requestId.current === currentRequest) setAgent(new Agent(definition, client));
    } catch (cause) {
      if (requestId.current === currentRequest) {
        setAgent(null);
        setError(cause instanceof Error ? cause : new Error('Failed to load Distri agent'));
      }
    } finally {
      if (requestId.current === currentRequest) setLoading(false);
    }
  }, [agentIdOrDef, client, enabled]);

  useEffect(() => {
    void refresh();
    return () => { requestId.current += 1; };
  }, [refresh]);

  return { agent, loading, error: error ?? clientError, refresh };
}
