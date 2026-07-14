import type { DistriFnTool } from '@distri/core'
import type { IndexedDbStore } from '../storage/indexeddb-store'
import { COLLECTION_PARAM, FN_BASE, makeResolver, type OnChange } from './shared'

export const DB_DELETE_TOOL_DEF = {
  name: 'db_delete',
  description: 'Delete one record from a collection by id.',
  parameters: {
    type: 'object',
    required: ['collection', 'id'],
    properties: { collection: COLLECTION_PARAM, id: { type: 'string' } },
  },
} as const

export function createDbDeleteHandler(stores: Record<string, IndexedDbStore>, onChange?: OnChange) {
  const resolve = makeResolver(stores)
  return async (input: unknown) => {
    const { collection, id } = input as { collection: string; id: string }
    await resolve(collection).delete(id)
    onChange?.({ store: collection, op: 'delete', id })
    return [{ part_type: 'data' as const, data: { ok: true } }]
  }
}

export function createDbDeleteTool(stores: Record<string, IndexedDbStore>, onChange?: OnChange): DistriFnTool {
  return { ...FN_BASE, ...DB_DELETE_TOOL_DEF, handler: createDbDeleteHandler(stores, onChange) }
}
