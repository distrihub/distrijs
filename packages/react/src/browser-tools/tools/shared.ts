import type { IndexedDbStore, StoreRecord, StoreChangeEvent } from '../storage/indexeddb-store'

export interface CollectionDef<T = Record<string, unknown>> {
  /** Logical name. Also the IDB database suffix. */
  name: string
  /** One-line description of what rows in this collection represent. */
  description: string
  /**
   * JSON Schema for the `data` field. Surfaced to the agent via the
   * `db_collections` tool / system-prompt helper so it knows the per-collection
   * record shape.
   */
  schema?: object
  /** Optional pre-existing store instance (otherwise IndexedDbStore.forName(name)). */
  store?: IndexedDbStore<T>
}

export type OnChange = (event: StoreChangeEvent) => void

export const FN_BASE = { type: 'function' as const, isExternal: true, autoExecute: true }

export const COLLECTION_PARAM = {
  type: 'string' as const,
  description:
    'Which collection to operate on. The set of valid collections is application-specific — call `db_collections` or consult the system prompt.',
}

export function recordView<T>(r: StoreRecord<T>) {
  return { id: r.id, ...r.data, _meta: { createdAt: r.createdAt, updatedAt: r.updatedAt } }
}

/**
 * Parse a `data:` URL into mime + base64 payload. Returns null if the string
 * isn't a `data:...;base64,...` URL.
 */
function parseDataUrl(s: string): { mime: string; base64: string } | null {
  const m = /^data:([^;,]+);base64,(.+)$/s.exec(s)
  if (!m) return null
  return { mime: m[1], base64: m[2] }
}

/**
 * Split a record view so any string field that holds a `data:image/...` URL is
 * emitted as a separate `image` part instead of riding along as a multi-KB
 * base64 blob inside the JSON `data` part.
 *
 * Why: the worker LLM is multimodal and can OCR an image — but only if it
 * arrives as a real `image` content part, not a base64 string buried in a
 * tool-result JSON. The LLM client at `distri-core/src/llm.rs` already handles
 * `Part::Image` in tool results, so all we need is to split the record here.
 */
export function recordToParts(record: Record<string, unknown> | null) {
  if (record == null) {
    return [{ part_type: 'data' as const, data: { record: null } }]
  }
  const cleaned: Record<string, unknown> = {}
  const images: Array<{ name: string; mime: string; base64: string }> = []
  for (const [k, v] of Object.entries(record)) {
    if (typeof v === 'string') {
      const parsed = parseDataUrl(v)
      if (parsed && parsed.mime.startsWith('image/')) {
        images.push({ name: k, mime: parsed.mime, base64: parsed.base64 })
        continue
      }
    }
    cleaned[k] = v
  }
  const parts: Array<
    | { part_type: 'data'; data: object }
    | { part_type: 'image'; data: { type: 'bytes'; mime_type: string; bytes: string; name?: string } }
  > = [{ part_type: 'data', data: { record: cleaned } }]
  for (const img of images) {
    parts.push({
      part_type: 'image',
      data: { type: 'bytes', mime_type: img.mime, bytes: img.base64, name: img.name },
    })
  }
  return parts
}

export function makeResolver(stores: Record<string, IndexedDbStore>) {
  const allowed = Object.keys(stores)
  return (name: string): IndexedDbStore => {
    const store = stores[name]
    if (!store) {
      throw new Error(`Unknown collection "${name}". Allowed: ${allowed.join(', ')}.`)
    }
    return store
  }
}
