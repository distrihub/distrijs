/**
 * IndexedDB-backed CRUD tools for the agent.
 *
 * Each tool lives in its own file with a static `XXX_TOOL_DEF` (the tool's
 * name, description, and JSON-Schema parameters) plus a `createXxxHandler`
 * factory that binds the handler to a set of IndexedDbStore instances.
 *
 * Tool defs are intentionally static — the `collection` parameter does not
 * carry a runtime enum, and descriptions don't enumerate available
 * collections. Apps inject collection info into their system prompt (see
 * `dbToolsPrompt`) or rely on the agent calling `db_collections` at runtime.
 */

import type { DistriFnTool } from '@distri/core'
import { IndexedDbStore, type StoreChangeEvent } from '../storage/indexeddb-store'

import type { CollectionDef } from './shared'
import { createDbPutTool } from './db-put'
import { createDbGetTool } from './db-get'
import { createDbListTool } from './db-list'
import { createDbSearchTool } from './db-search'
import { createDbDeleteTool } from './db-delete'
import { createDbClearTool } from './db-clear'
import { createDbCollectionsTool } from './db-collections'
import { createExecJsTool } from './exec'

export interface CreateDbToolsOptions {
  collections: CollectionDef[]
  /** Notified after every mutation; usually re-dispatched as a window event. */
  onChange?: (event: StoreChangeEvent) => void
  /**
   * Include the unsafe `exec_js` tool that runs JavaScript in the browser
   * with a `db` global wired to these collections. Off by default — only
   * register on hosts that are happy with arbitrary JS execution.
   */
  enableExecJs?: boolean
}

export interface CreateDbToolsResult {
  tools: DistriFnTool[]
  stores: Record<string, IndexedDbStore>
}

export function createDbTools(options: CreateDbToolsOptions): CreateDbToolsResult {
  const stores: Record<string, IndexedDbStore> = {}
  for (const def of options.collections) {
    stores[def.name] = (def.store as IndexedDbStore | undefined) ?? IndexedDbStore.forName(def.name)
  }
  const onChange = options.onChange

  const tools: DistriFnTool[] = [
    createDbCollectionsTool(options.collections),
    createDbPutTool(stores, onChange),
    createDbGetTool(stores),
    createDbListTool(stores),
    createDbSearchTool(stores),
    createDbDeleteTool(stores, onChange),
    createDbClearTool(stores, onChange),
  ]

  if (options.enableExecJs) {
    tools.push(createExecJsTool({ stores, collections: options.collections, onChange }))
  }

  return { tools, stores }
}

/**
 * Render the available collections + schemas as a markdown block suitable for
 * pasting into a system prompt. Use this when you'd rather burn the
 * collection list into the prompt than rely on the agent calling
 * `db_collections` at runtime.
 */
export function dbToolsPrompt(collections: CollectionDef[]): string {
  const lines = collections.map((c) => {
    const schema = c.schema ? `\n  data schema: ${JSON.stringify(c.schema)}` : ''
    return `- \`${c.name}\` — ${c.description}${schema}`
  })
  return `Available collections:\n${lines.join('\n')}`
}

export type { CollectionDef } from './shared'
export { DB_PUT_TOOL_DEF, createDbPutHandler, createDbPutTool } from './db-put'
export { DB_GET_TOOL_DEF, createDbGetHandler, createDbGetTool } from './db-get'
export { DB_LIST_TOOL_DEF, createDbListHandler, createDbListTool } from './db-list'
export { DB_SEARCH_TOOL_DEF, createDbSearchHandler, createDbSearchTool } from './db-search'
export { DB_DELETE_TOOL_DEF, createDbDeleteHandler, createDbDeleteTool } from './db-delete'
export { DB_CLEAR_TOOL_DEF, createDbClearHandler, createDbClearTool } from './db-clear'
export { DB_COLLECTIONS_TOOL_DEF, createDbCollectionsHandler, createDbCollectionsTool } from './db-collections'
export { EXEC_JS_TOOL_DEF, createExecJsHandler, createExecJsTool } from './exec'
export type { ExecJsParams, ExecDbApi, CreateExecJsHandlerOptions } from './exec'
