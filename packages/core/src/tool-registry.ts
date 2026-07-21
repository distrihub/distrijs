import { DistriBaseTool } from './types';

/**
 * Namespaced registry for client-side tools that should be available to
 * every agent chat in this process, without each call site threading them
 * through `invoke`/`invokeStream` manually. Mirrors the CLI's
 * `register_all` pattern: register a whole batch of local tools once,
 * under a namespace, and every subsequent chat/agent call picks them all
 * up automatically via `Agent.invoke`/`Agent.invokeStream`.
 *
 * Namespaces let independent tool sets (browser IndexedDB tools, a future
 * client-specific tool set, …) register/unregister without clobbering each
 * other. Re-registering the same namespace replaces its tools.
 */
export class ClientToolRegistry {
  private namespaces = new Map<string, DistriBaseTool[]>();

  register(namespace: string, tools: DistriBaseTool[]): void {
    this.namespaces.set(namespace, tools);
  }

  unregister(namespace: string): void {
    this.namespaces.delete(namespace);
  }

  has(namespace: string): boolean {
    return this.namespaces.has(namespace);
  }

  listNamespaces(): string[] {
    return Array.from(this.namespaces.keys());
  }

  /** All tools across every namespace, or just one namespace's tools when given. */
  getTools(namespace?: string): DistriBaseTool[] {
    if (namespace) {
      return this.namespaces.get(namespace) ?? [];
    }
    return Array.from(this.namespaces.values()).flat();
  }
}

/**
 * Process-wide singleton. Register a namespace once at app bootstrap (or
 * whenever a tool set becomes available); every `Agent.invoke`/
 * `invokeStream` call merges these in automatically.
 */
export const clientToolRegistry = new ClientToolRegistry();
