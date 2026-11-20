import { useCallback, useEffect, useRef, useState } from 'react';
import { Agent, AgentDefinition, AgentVersion } from '@distri/core';
import { useDistriNative } from './DistriNativeProvider';

export interface UseAgentOptions {
  agentIdOrDef: string | AgentDefinition;
  /** Run a saved version (a number, or `'latest'`, the default). Changing it reloads the agent; the previous one stays until then. */
  version?: AgentVersion;
  enabled?: boolean;
}

export interface UseAgentResult {
  agent: Agent | null;
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
}

/** Resolves an agent from its A2A card, or wraps a caller-provided definition. */
export function useAgent({ agentIdOrDef, version, enabled = true }: UseAgentOptions): UseAgentResult {
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
      // An id is resolved from the agent's A2A card (readable with an
      // end-user token); a definition passed in is used as is.
      const resolved = await Agent.create(agentIdOrDef, client, { version });
      if (requestId.current === currentRequest) setAgent(resolved);
    } catch (cause) {
      if (requestId.current === currentRequest) {
        setAgent(null);
        setError(cause instanceof Error ? cause : new Error('Failed to load Distri agent'));
      }
    } finally {
      if (requestId.current === currentRequest) setLoading(false);
    }
  }, [agentIdOrDef, version, client, enabled]);

  useEffect(() => {
    void refresh();
    return () => { requestId.current += 1; };
  }, [refresh]);

  return { agent, loading, error: error ?? clientError, refresh };
}
