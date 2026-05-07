import type { DistriFnTool } from '@distri/core'
import type { IndexedDbStore } from '../storage/indexeddb-store'
import { COLLECTION_PARAM, FN_BASE, makeResolver, recordView } from './shared'

export const DB_LIST_TOOL_DEF = {
  name: 'db_list',
  description: 'List all records in a collection, ordered by creation time.',
  parameters: {
    type: 'object',
    required: ['collection'],
    properties: { collection: COLLECTION_PARAM },
  },
} as const

export function createDbListHandler(stores: Record<string, IndexedDbStore>) {
  const resolve = makeResolver(stores)
  return async (input: unknown) => {
    const { collection } = input as { collection: string }
    const records = await resolve(collection).list()
    return [{ part_type: 'data' as const, data: { count: records.length, records: records.map(recordView) } }]
  }
}

export function createDbListTool(stores: Record<string, IndexedDbStore>): DistriFnTool {
  return { ...FN_BASE, ...DB_LIST_TOOL_DEF, handler: createDbListHandler(stores) }
}
