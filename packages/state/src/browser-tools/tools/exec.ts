/**
 * `exec_js` — run unsafe JavaScript in the browser host with direct access to
 * the agent's IndexedDB collections via a `db` global.
 *
 * This is the escape hatch for cases where the granular `db_*` tools would
 * require dozens of round-trips: the agent writes a small script that loads
 * records, reshapes them, and emits the answer in one tool call. The script
 * runs inside `new Function(...)`, so it can do anything page-script JS can —
 * including hitting `fetch`, `crypto`, etc. Treat the host as the trust
 * boundary.
 *
 * The `db` object surface intentionally mirrors the `db_*` tool set so the
 * agent doesn't have to learn a second API:
 *
 *   db.collections()                       -> CollectionDef[]
 *   db.list(collection)                    -> Array<record>
 *   db.get(collection, id)                 -> record | null
 *   db.search(collection, query)           -> Array<record>
 *   db.put(collection, { id?, data })      -> record
 *   db.delete(collection, id)              -> void
 *   db.clear(collection)                   -> void
 *
 * Each `record` returned has the same shape the `db_*` tools emit:
 * `{ id, ...data, _meta: { createdAt, updatedAt } }`.
 */

import type { DistriFnTool } from '@distri/core'
import type { IndexedDbStore, StoreChangeEvent } from '../storage/indexeddb-store'
import type { CollectionDef, OnChange } from './shared'
import { FN_BASE, makeResolver, recordView } from './shared'

export interface ExecJsParams {
  code: string
  timeout?: number
}

export const EXEC_JS_TOOL_DEF = {
  name: 'exec_js',
  description:
    'Execute unsafe JavaScript code in the browser sandbox with access to the agent\'s IndexedDB collections via a `db` global.',
  prompt:
    'Runs JavaScript directly in the browser host. Use this when assembling an answer from many records would otherwise need dozens of `db_*` calls.\n' +
    '- The code runs as an async function. `return` a value or use `console.log()` — both go to stdout.\n' +
    '- A `db` global is injected with methods that mirror the db_* tools:\n' +
    '    db.collections() -> Array<{ name, description, schema? }>\n' +
    '    db.list(collection) -> Array<record>\n' +
    '    db.get(collection, id) -> record | null\n' +
    '    db.search(collection, query) -> Array<record>\n' +
    '    db.put(collection, { id?, data }) -> record\n' +
    '    db.delete(collection, id) -> void\n' +
    '    db.clear(collection) -> void\n' +
    '  Each record has shape `{ id, ...data, _meta: { createdAt, updatedAt } }`.\n' +
    '- All db.* methods return Promises — use `await`.\n' +
    '- Default timeout is 5000ms, max 30000ms.\n' +
    '- This is browser JS, not Node — no `require`, `process`, or fs.',
  parameters: {
    type: 'object',
    required: ['code'],
    properties: {
      code: { type: 'string', description: 'JavaScript code to execute. Use `await` for db calls; `return` or `console.log()` for output.' },
      timeout: { type: 'number', description: 'Timeout in milliseconds (default 5000, max 30000).' },
    },
  },
} as const

export interface ExecDbApi {
  collections: () => CollectionDef[]
  list: (collection: string) => Promise<Array<Record<string, unknown>>>
  get: (collection: string, id: string) => Promise<Record<string, unknown> | null>
  search: (collection: string, query: string) => Promise<Array<Record<string, unknown>>>
  put: (collection: string, args: { id?: string; data: Record<string, unknown> }) => Promise<Record<string, unknown>>
  delete: (collection: string, id: string) => Promise<void>
  clear: (collection: string) => Promise<void>
}

function buildDbApi(
  stores: Record<string, IndexedDbStore>,
  collections: CollectionDef[],
  onChange?: OnChange,
): ExecDbApi {
  const resolve = makeResolver(stores)
  const notify = (event: StoreChangeEvent) => {
    if (onChange) onChange(event)
  }
  return {
    collections: () => collections.map((c) => ({ name: c.name, description: c.description, schema: c.schema })),
    list: async (collection) => {
      const records = await resolve(collection).list()
      return records.map((r) => recordView(r) as Record<string, unknown>)
    },
    get: async (collection, id) => {
      const r = await resolve(collection).get(id)
      return r ? (recordView(r) as Record<string, unknown>) : null
    },
    search: async (collection, query) => {
      const q = String(query ?? '').toLowerCase()
      const records = await resolve(collection).list()
      const matches = q
        ? records.filter((r) => JSON.stringify(r.data).toLowerCase().includes(q))
        : records
      return matches.map((r) => recordView(r) as Record<string, unknown>)
    },
    put: async (collection, args) => {
      const store = resolve(collection)
      const record = await store.put({ id: args?.id, data: args?.data ?? {} })
      notify({ store: collection, op: 'put', id: record.id })
      return recordView(record) as Record<string, unknown>
    },
    delete: async (collection, id) => {
      await resolve(collection).delete(id)
      notify({ store: collection, op: 'delete', id })
    },
    clear: async (collection) => {
      await resolve(collection).clear()
      notify({ store: collection, op: 'clear' })
    },
  }
}

export interface CreateExecJsHandlerOptions {
  stores: Record<string, IndexedDbStore>
  collections: CollectionDef[]
  onChange?: OnChange
}

export function createExecJsHandler(options: CreateExecJsHandlerOptions) {
  const db = buildDbApi(options.stores, options.collections, options.onChange)
  return async (input: unknown) => {
    const params = (input ?? {}) as ExecJsParams
    const timeoutMs = Math.min(Math.max(params.timeout ?? 5000, 1), 30000)
    const startTime = Date.now()

    let stdout = ''
    let stderr = ''
    let exitCode = 0

    const consoleMock = {
      log: (...args: unknown[]) => { stdout += args.map(stringifyArg).join(' ') + '\n' },
      error: (...args: unknown[]) => { stderr += args.map(stringifyArg).join(' ') + '\n' },
      warn: (...args: unknown[]) => { stderr += args.map(stringifyArg).join(' ') + '\n' },
      info: (...args: unknown[]) => { stdout += args.map(stringifyArg).join(' ') + '\n' },
    }

    try {
      const fn = new Function('console', 'db', `
        return (async () => {
          ${params.code}
        })()
      `)

      let timer: ReturnType<typeof setTimeout> | undefined
      const result = await Promise.race([
        fn(consoleMock, db),
        new Promise((_, reject) => {
          timer = setTimeout(
            () => reject(new Error(`Execution timed out after ${timeoutMs}ms`)),
            timeoutMs,
          )
        }),
      ])
      if (timer) clearTimeout(timer)

      if (result !== undefined && !stdout) {
        stdout = stringifyArg(result) + '\n'
      }
    } catch (err) {
      stderr += (err instanceof Error ? err.message : String(err)) + '\n'
      exitCode = 1
    }

    const durationMs = Date.now() - startTime
    return [{
      part_type: 'data' as const,
      data: {
        stdout: stdout.trimEnd(),
        stderr: stderr.trimEnd(),
        exit_code: exitCode,
        duration_ms: durationMs,
      },
    }]
  }
}

export function createExecJsTool(options: CreateExecJsHandlerOptions): DistriFnTool {
  return { ...FN_BASE, ...EXEC_JS_TOOL_DEF, handler: createExecJsHandler(options) }
}

function stringifyArg(v: unknown): string {
  if (typeof v === 'string') return v
  if (v instanceof Error) return v.message
  try {
    return JSON.stringify(v)
  } catch {
    return String(v)
  }
}
