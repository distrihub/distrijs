import type { DistriFnTool } from '@distri/core'
import { FN_BASE, type CollectionDef } from './shared'

export const DB_COLLECTIONS_TOOL_DEF = {
  name: 'db_collections',
  description:
    'List all available collections with their descriptions and `data` schemas. Call this first to discover what collections exist before using `db_get`, `db_put`, etc.',
  parameters: {
    type: 'object',
    properties: {},
  },
} as const

export function createDbCollectionsHandler(collections: CollectionDef[]) {
  const view = collections.map((c) => ({
    name: c.name,
    description: c.description,
    schema: c.schema ?? null,
  }))
  return async () => {
    return [{ part_type: 'data' as const, data: { count: view.length, collections: view } }]
  }
}

export function createDbCollectionsTool(collections: CollectionDef[]): DistriFnTool {
  return { ...FN_BASE, ...DB_COLLECTIONS_TOOL_DEF, handler: createDbCollectionsHandler(collections) }
}
