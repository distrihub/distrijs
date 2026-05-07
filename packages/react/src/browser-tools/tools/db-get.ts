import type { DistriFnTool } from '@distri/core'
import type { IndexedDbStore } from '../storage/indexeddb-store'
import { COLLECTION_PARAM, FN_BASE, makeResolver, recordToParts, recordView } from './shared'

export const DB_GET_TOOL_DEF = {
  name: 'db_get',
  description: 'Fetch one record from a collection by id. Returns null when missing.',
  parameters: {
    type: 'object',
    required: ['collection', 'id'],
    properties: {
      collection: COLLECTION_PARAM,
      id: { type: 'string' },
    },
  },
} as const

export function createDbGetHandler(stores: Record<string, IndexedDbStore>) {
  const resolve = makeResolver(stores)
  return async (input: unknown) => {
    const { collection, id } = input as { collection: string; id: string }
    const record = await resolve(collection).get(id)
    return recordToParts(record ? recordView(record) : null)
  }
}

export function createDbGetTool(stores: Record<string, IndexedDbStore>): DistriFnTool {
  return { ...FN_BASE, ...DB_GET_TOOL_DEF, handler: createDbGetHandler(stores) }
}
