import { signal, Signal } from '@angular/core';
import { Agent, AgentDefinition, DistriClient } from '@distri/core';

export interface AgentServiceOptions {
  client: DistriClient;
  agentIdOrDef: string | AgentDefinition;
}

export interface AgentService {
  agent: Signal<Agent | null>;
  loading: Signal<boolean>;
  error: Signal<Error | null>;
  /** Re-resolve the agent (e.g. after `agentIdOrDef` or `client` changes). */
  refresh: (options?: Partial<AgentServiceOptions>) => Promise<void>;
}

/**
 * Resolves an `Agent` from an id (fetched via `DistriClient.getAgent`) or an
 * already-known `AgentDefinition`. Mirrors `@distri/react`'s `useAgent` —
 * that hook's actual resolution logic is this same handful of lines; the
 * rest of the hook is React lifecycle glue with nothing to share.
 */
export async function resolveAgentOnce(client: DistriClient, agentIdOrDef: string | AgentDefinition): Promise<Agent> {
  return typeof agentIdOrDef === 'string'
    ? new Agent(await client.getAgent(agentIdOrDef), client)
    : new Agent(agentIdOrDef, client);
}

export function createAgentService(initial: AgentServiceOptions): AgentService {
  let current = initial;
  const agentSig = signal<Agent | null>(null);
  const loadingSig = signal(false);
  const errorSig = signal<Error | null>(null);

  async function resolve(options?: Partial<AgentServiceOptions>): Promise<void> {
    current = { ...current, ...options };
    const { client, agentIdOrDef } = current;
    if (!client || !agentIdOrDef) return;

    loadingSig.set(true);
    errorSig.set(null);
    try {
      agentSig.set(await resolveAgentOnce(client, agentIdOrDef));
    } catch (err) {
      console.error('Failed to initialize agent:', err);
      errorSig.set(err instanceof Error ? err : new Error('Failed to initialize agent'));
      agentSig.set(null);
    } finally {
      loadingSig.set(false);
    }
  }

  void resolve();

  return {
    agent: agentSig.asReadonly(),
    loading: loadingSig.asReadonly(),
    error: errorSig.asReadonly(),
    refresh: resolve,
  };
}
