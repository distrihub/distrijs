import type { DistriFnTool } from '@distri/core'
import type { IndexedDbStore } from '../storage/indexeddb-store'
import { COLLECTION_PARAM, FN_BASE, makeResolver, type OnChange } from './shared'

export const DB_CLEAR_TOOL_DEF = {
  name: 'db_clear',
  description: 'Delete every record from a collection.',
  parameters: {
    type: 'object',
    required: ['collection'],
    properties: { collection: COLLECTION_PARAM },
  },
} as const

export function createDbClearHandler(stores: Record<string, IndexedDbStore>, onChange?: OnChange) {
  const resolve = makeResolver(stores)
  return async (input: unknown) => {
    const { collection } = input as { collection: string }
    await resolve(collection).clear()
    onChange?.({ store: collection, op: 'clear' })
    return [{ part_type: 'data' as const, data: { ok: true } }]
  }
}

export function createDbClearTool(stores: Record<string, IndexedDbStore>, onChange?: OnChange): DistriFnTool {
  return { ...FN_BASE, ...DB_CLEAR_TOOL_DEF, handler: createDbClearHandler(stores, onChange) }
}
