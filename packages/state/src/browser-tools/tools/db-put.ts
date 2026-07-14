import type { DistriFnTool } from '@distri/core'
import type { IndexedDbStore } from '../storage/indexeddb-store'
import { COLLECTION_PARAM, FN_BASE, makeResolver, recordView, type OnChange } from './shared'

export const DB_PUT_TOOL_DEF = {
  name: 'db_put',
  description:
    'Insert or update one record in a collection. Returns the stored record. Omit `id` to create a new record (a uuid is generated).',
  parameters: {
    type: 'object',
    required: ['collection', 'data'],
    properties: {
      collection: COLLECTION_PARAM,
      id: { type: 'string', description: 'Record id. Omit to create.' },
      data: { type: 'object', additionalProperties: true, description: 'Per-collection payload.' },
    },
  },
} as const

export function createDbPutHandler(stores: Record<string, IndexedDbStore>, onChange?: OnChange) {
  const resolve = makeResolver(stores)
  return async (input: unknown) => {
    const { collection, id, data } = input as { collection: string; id?: string; data: Record<string, unknown> }
    const record = await resolve(collection).put({ id, data })
    onChange?.({ store: collection, op: 'put', id: record.id })
    return [{ part_type: 'data' as const, data: { ok: true, record: recordView(record) } }]
  }
}

export function createDbPutTool(stores: Record<string, IndexedDbStore>, onChange?: OnChange): DistriFnTool {
  return { ...FN_BASE, ...DB_PUT_TOOL_DEF, handler: createDbPutHandler(stores, onChange) }
}
