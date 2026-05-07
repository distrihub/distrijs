import type { DistriFnTool } from '@distri/core'
import type { IndexedDbStore } from '../storage/indexeddb-store'
import { COLLECTION_PARAM, FN_BASE, makeResolver, recordView } from './shared'

export const DB_SEARCH_TOOL_DEF = {
  name: 'db_search',
  description:
    'Substring search across the JSON-serialised `data` of every record in a collection. Case-insensitive. Returns matching records.',
  parameters: {
    type: 'object',
    required: ['collection', 'query'],
    properties: {
      collection: COLLECTION_PARAM,
      query: { type: 'string', description: 'Substring to look for.' },
    },
  },
} as const

export function createDbSearchHandler(stores: Record<string, IndexedDbStore>) {
  const resolve = makeResolver(stores)
  return async (input: unknown) => {
    const { collection, query } = input as { collection: string; query: string }
    const needle = (query ?? '').toLowerCase()
    const all = await resolve(collection).list()
    const matches = needle
      ? all.filter((r) => JSON.stringify(r.data).toLowerCase().includes(needle))
      : all
    return [{ part_type: 'data' as const, data: { count: matches.length, records: matches.map(recordView) } }]
  }
}

export function createDbSearchTool(stores: Record<string, IndexedDbStore>): DistriFnTool {
  return { ...FN_BASE, ...DB_SEARCH_TOOL_DEF, handler: createDbSearchHandler(stores) }
}
