import { clientToolRegistry } from '@distri/core'
import { createDbTools, type CreateDbToolsOptions, type CreateDbToolsResult } from '@distri/state'

/**
 * Namespace the browser IndexedDB tools register under in
 * `clientToolRegistry`. Exported so callers can `unregister`/`has`/inspect it.
 */
export const BROWSER_TOOLS_NAMESPACE = 'browser'

/**
 * Build the browser IndexedDB tools (`db_get`/`db_put`/…, optionally
 * `exec_js`) and register them under the `"browser"` namespace in the
 * process-wide `clientToolRegistry`. Every subsequent `Agent.invoke`/
 * `invokeStream` call automatically picks these up — no per-chat
 * `externalTools` wiring needed. Call once at app bootstrap (re-calling
 * replaces the previous registration, e.g. if `collections` changes).
 */
export function registerBrowserTools(options: CreateDbToolsOptions): CreateDbToolsResult {
  const result = createDbTools(options)
  clientToolRegistry.register(BROWSER_TOOLS_NAMESPACE, result.tools)
  return result
}

/** Remove the browser tools from the registry (e.g. on logout/teardown). */
export function unregisterBrowserTools(): void {
  clientToolRegistry.unregister(BROWSER_TOOLS_NAMESPACE)
}
