/**
 * createDbTools — unified IndexedDB toolset for the agent.
 *
 * Exposes one fixed set of tools (`db_get`, `db_put`, `db_list`, `db_search`,
 * `db_delete`, `db_clear`) that take a `collection` parameter. Apps register
 * which collections are accessible per scenario; the handlers validate the
 * `collection` arg against that allowlist. Tool descriptions enumerate the
 * registered collections + schemas so the agent knows what's available.
 *
 * One IDB database per collection (see IndexedDbStore.forName) — adding a new
 * collection never needs a version bump on an existing one.
 */

import type { DistriFnTool } from '@distri/core'
import { IndexedDbStore, type StoreRecord, type StoreChangeEvent } from '../storage/indexeddb-store'

export interface CollectionDef<T = Record<string, unknown>> {
  /** Logical name. Also the IDB database suffix. */
  name: string
  /** One-line description of what rows in this collection represent. */
  description: string
  /**
   * JSON Schema for the `data` field. Surfaced verbatim in tool descriptions
   * so the agent knows the per-collection record shape.
   */
  schema?: object
  /** Optional pre-existing store instance (otherwise IndexedDbStore.forName(name)). */
  store?: IndexedDbStore<T>
}

export interface CreateDbToolsOptions {
  collections: CollectionDef[]
  /** Notified after every mutation; usually re-dispatched as a window event. */
  onChange?: (event: StoreChangeEvent) => void
}

export interface CreateDbToolsResult {
  tools: DistriFnTool[]
  stores: Record<string, IndexedDbStore>
}

const FN_BASE = { type: 'function' as const, isExternal: true, autoExecute: true }

function recordView<T>(r: StoreRecord<T>) {
  return { id: r.id, ...r.data, _meta: { createdAt: r.createdAt, updatedAt: r.updatedAt } }
}

function describeCollections(collections: CollectionDef[]): string {
  return collections
    .map((c) => {
      const schemaBlock = c.schema ? `\n  data schema: ${JSON.stringify(c.schema)}` : ''
      return `- \`${c.name}\` — ${c.description}${schemaBlock}`
    })
    .join('\n')
}

export function createDbTools(options: CreateDbToolsOptions): CreateDbToolsResult {
  const stores: Record<string, IndexedDbStore> = {}
  for (const def of options.collections) {
    stores[def.name] = (def.store as IndexedDbStore | undefined) ?? IndexedDbStore.forName(def.name)
  }
  const allowed = options.collections.map((c) => c.name)
  const collectionParam = {
    type: 'string',
    enum: allowed,
    description: 'Which collection to operate on.',
  }
  const collectionsBlock = describeCollections(options.collections)

  const resolve = (name: string): IndexedDbStore => {
    const store = stores[name]
    if (!store) {
      throw new Error(`Unknown collection "${name}". Allowed: ${allowed.join(', ')}.`)
    }
    return store
  }

  const tools: DistriFnTool[] = [
    {
      ...FN_BASE,
      name: 'db_put',
      description:
        `Insert or update one record. Returns the stored record. ` +
        `Omit \`id\` to create a new record (a uuid is generated).\n\n` +
        `Collections:\n${collectionsBlock}`,
      parameters: {
        type: 'object',
        required: ['collection', 'data'],
        properties: {
          collection: collectionParam,
          id: { type: 'string', description: 'Record id. Omit to create.' },
          data: { type: 'object', additionalProperties: true, description: 'Per-collection payload.' },
        },
      },
      handler: async (input: unknown) => {
        const { collection, id, data } = input as { collection: string; id?: string; data: Record<string, unknown> }
        const store = resolve(collection)
        const record = await store.put({ id, data })
        options.onChange?.({ store: collection, op: 'put', id: record.id })
        return [{ part_type: 'data' as const, data: { ok: true, record: recordView(record) } }]
      },
    },
    {
      ...FN_BASE,
      name: 'db_get',
      description: `Fetch one record by id. Returns null when missing.\n\nCollections:\n${collectionsBlock}`,
      parameters: {
        type: 'object',
        required: ['collection', 'id'],
        properties: { collection: collectionParam, id: { type: 'string' } },
      },
      handler: async (input: unknown) => {
        const { collection, id } = input as { collection: string; id: string }
        const record = await resolve(collection).get(id)
        return [{ part_type: 'data' as const, data: { record: record ? recordView(record) : null } }]
      },
    },
    {
      ...FN_BASE,
      name: 'db_list',
      description:
        `List all records in a collection, ordered by creation time.\n\nCollections:\n${collectionsBlock}`,
      parameters: {
        type: 'object',
        required: ['collection'],
        properties: { collection: collectionParam },
      },
      handler: async (input: unknown) => {
        const { collection } = input as { collection: string }
        const records = await resolve(collection).list()
        return [{ part_type: 'data' as const, data: { count: records.length, records: records.map(recordView) } }]
      },
    },
    {
      ...FN_BASE,
      name: 'db_search',
      description:
        `Substring search across the JSON-serialised \`data\` of every record in a collection. ` +
        `Case-insensitive. Returns matching records.\n\nCollections:\n${collectionsBlock}`,
      parameters: {
        type: 'object',
        required: ['collection', 'query'],
        properties: {
          collection: collectionParam,
          query: { type: 'string', description: 'Substring to look for.' },
        },
      },
      handler: async (input: unknown) => {
        const { collection, query } = input as { collection: string; query: string }
        const needle = (query ?? '').toLowerCase()
        const all = await resolve(collection).list()
        const matches = needle
          ? all.filter((r) => JSON.stringify(r.data).toLowerCase().includes(needle))
          : all
        return [{ part_type: 'data' as const, data: { count: matches.length, records: matches.map(recordView) } }]
      },
    },
    {
      ...FN_BASE,
      name: 'db_delete',
      description: `Delete one record from a collection by id.`,
      parameters: {
        type: 'object',
        required: ['collection', 'id'],
        properties: { collection: collectionParam, id: { type: 'string' } },
      },
      handler: async (input: unknown) => {
        const { collection, id } = input as { collection: string; id: string }
        await resolve(collection).delete(id)
        options.onChange?.({ store: collection, op: 'delete', id })
        return [{ part_type: 'data' as const, data: { ok: true } }]
      },
    },
    {
      ...FN_BASE,
      name: 'db_clear',
      description: `Delete every record from a collection.`,
      parameters: {
        type: 'object',
        required: ['collection'],
        properties: { collection: collectionParam },
      },
      handler: async (input: unknown) => {
        const { collection } = input as { collection: string }
        await resolve(collection).clear()
        options.onChange?.({ store: collection, op: 'clear' })
        return [{ part_type: 'data' as const, data: { ok: true } }]
      },
    },
  ]

  return { tools, stores }
}
