import { describe, it, expect } from 'vitest'
import {
  createExecJsHandler,
  createExecJsTool,
  EXEC_JS_TOOL_DEF,
} from '../browser-tools/tools/exec'
import { IndexedDbStore } from '../browser-tools/storage/indexeddb-store'
import type { CollectionDef } from '../browser-tools/tools/shared'

interface ExecResult {
  stdout: string
  stderr: string
  exit_code: number
  duration_ms: number
}

let suiteId = 0
function uniqueName(base: string) {
  suiteId += 1
  return `${base}-${Date.now().toString(36)}-${suiteId}`
}

function makeFixture(extraCollections: CollectionDef[] = []) {
  const itemsName = uniqueName('items')
  const tagsName = uniqueName('tags')
  const collections: CollectionDef[] = [
    { name: itemsName, description: 'Test items' },
    { name: tagsName, description: 'Test tags' },
    ...extraCollections,
  ]
  const stores: Record<string, IndexedDbStore> = {}
  for (const c of collections) {
    stores[c.name] = IndexedDbStore.forName(c.name)
  }
  return { collections, stores, itemsName, tagsName }
}

async function runExec(
  fixture: ReturnType<typeof makeFixture>,
  code: string,
  opts: { timeout?: number; onChange?: (e: unknown) => void } = {},
): Promise<ExecResult> {
  const handler = createExecJsHandler({
    stores: fixture.stores,
    collections: fixture.collections,
    onChange: opts.onChange as never,
  })
  const parts = await handler({ code, timeout: opts.timeout })
  return (parts[0] as { data: ExecResult }).data
}

describe('exec_js tool', () => {
  describe('tool definition', () => {
    it('exposes a stable name + schema', () => {
      expect(EXEC_JS_TOOL_DEF.name).toBe('exec_js')
      expect(EXEC_JS_TOOL_DEF.parameters.required).toEqual(['code'])
      expect(EXEC_JS_TOOL_DEF.parameters.properties.code.type).toBe('string')
      expect(EXEC_JS_TOOL_DEF.parameters.properties.timeout.type).toBe('number')
    })

    it('createExecJsTool wraps the handler with FN_BASE flags', () => {
      const fx = makeFixture()
      const tool = createExecJsTool({
        stores: fx.stores,
        collections: fx.collections,
      })
      expect(tool.name).toBe('exec_js')
      expect(tool.type).toBe('function')
      expect(tool.isExternal).toBe(true)
      expect(tool.autoExecute).toBe(true)
      expect(typeof tool.handler).toBe('function')
    })
  })

  describe('basic execution', () => {
    it('captures console.log to stdout', async () => {
      const fx = makeFixture()
      const r = await runExec(fx, `console.log('hello', 'world')`)
      expect(r.stdout).toBe('hello world')
      expect(r.stderr).toBe('')
      expect(r.exit_code).toBe(0)
    })

    it('captures console.error / console.warn to stderr', async () => {
      const fx = makeFixture()
      const r = await runExec(
        fx,
        `console.error('boom'); console.warn('careful')`,
      )
      expect(r.stdout).toBe('')
      expect(r.stderr.split('\n')).toEqual(['boom', 'careful'])
      expect(r.exit_code).toBe(0)
    })

    it('uses the return value when nothing was logged', async () => {
      const fx = makeFixture()
      const r = await runExec(fx, `return 1 + 2`)
      expect(r.stdout).toBe('3')
      expect(r.exit_code).toBe(0)
    })

    it('does not stomp logged output with the return value', async () => {
      const fx = makeFixture()
      const r = await runExec(
        fx,
        `console.log('logged'); return 'ignored-because-stdout-set'`,
      )
      expect(r.stdout).toBe('logged')
    })

    it('JSON-stringifies object args to console.log', async () => {
      const fx = makeFixture()
      const r = await runExec(fx, `console.log({ a: 1, b: [2, 3] })`)
      expect(r.stdout).toBe('{"a":1,"b":[2,3]}')
    })

    it('captures thrown errors as stderr + exit_code 1', async () => {
      const fx = makeFixture()
      const r = await runExec(fx, `throw new Error('nope')`)
      expect(r.stderr).toBe('nope')
      expect(r.exit_code).toBe(1)
    })

    it('reports duration_ms as a non-negative number', async () => {
      const fx = makeFixture()
      const r = await runExec(fx, `return 'x'`)
      expect(typeof r.duration_ms).toBe('number')
      expect(r.duration_ms).toBeGreaterThanOrEqual(0)
    })

    it('supports await inside the script', async () => {
      const fx = makeFixture()
      const r = await runExec(
        fx,
        `await new Promise(r => setTimeout(r, 5)); return 'done'`,
      )
      expect(r.stdout).toBe('done')
      expect(r.exit_code).toBe(0)
    })
  })

  describe('timeout', () => {
    it('times out long-running scripts with exit_code 1', async () => {
      const fx = makeFixture()
      const r = await runExec(
        fx,
        `await new Promise(r => setTimeout(r, 200))`,
        { timeout: 20 },
      )
      expect(r.exit_code).toBe(1)
      expect(r.stderr).toMatch(/timed out after 20ms/)
    })

    it('clamps timeout to the 30s ceiling', async () => {
      const fx = makeFixture()
      const r = await runExec(fx, `return 'ok'`, { timeout: 999_999 })
      expect(r.stdout).toBe('ok')
    })
  })

  describe('db API surface', () => {
    it('exposes db.collections() with name/description (no store leak)', async () => {
      const fx = makeFixture()
      const r = await runExec(fx, `return JSON.stringify(db.collections())`)
      const cols = JSON.parse(r.stdout)
      expect(cols).toHaveLength(2)
      expect(cols[0].name).toBe(fx.itemsName)
      expect(cols[0].description).toBe('Test items')
      expect(cols[0]).not.toHaveProperty('store')
    })

    it('db.put inserts a record and returns the recordView shape', async () => {
      const fx = makeFixture()
      const r = await runExec(
        fx,
        `const rec = await db.put(${JSON.stringify(fx.itemsName)}, { data: { title: 'First' } });
         return JSON.stringify({ hasId: typeof rec.id === 'string', title: rec.title, hasMeta: !!rec._meta });`,
      )
      expect(r.exit_code).toBe(0)
      expect(JSON.parse(r.stdout)).toEqual({
        hasId: true,
        title: 'First',
        hasMeta: true,
      })
    })

    it('db.get round-trips a record put via the same API', async () => {
      const fx = makeFixture()
      const r = await runExec(
        fx,
        `const a = await db.put(${JSON.stringify(fx.itemsName)}, { id: 'x1', data: { title: 'A' } });
         const b = await db.get(${JSON.stringify(fx.itemsName)}, 'x1');
         return JSON.stringify({ a_id: a.id, b_id: b.id, title: b.title });`,
      )
      expect(JSON.parse(r.stdout)).toEqual({ a_id: 'x1', b_id: 'x1', title: 'A' })
    })

    it('db.get returns null for missing ids', async () => {
      const fx = makeFixture()
      const r = await runExec(
        fx,
        `return await db.get(${JSON.stringify(fx.itemsName)}, 'does-not-exist')`,
      )
      expect(r.stdout).toBe('null')
    })

    it('db.list returns every record sorted by createdAt', async () => {
      const fx = makeFixture()
      const r = await runExec(
        fx,
        `await db.put(${JSON.stringify(fx.itemsName)}, { id: 'a', data: { n: 1 } });
         await db.put(${JSON.stringify(fx.itemsName)}, { id: 'b', data: { n: 2 } });
         const all = await db.list(${JSON.stringify(fx.itemsName)});
         return JSON.stringify(all.map(r => ({ id: r.id, n: r.n })));`,
      )
      expect(JSON.parse(r.stdout)).toEqual([
        { id: 'a', n: 1 },
        { id: 'b', n: 2 },
      ])
    })

    it('db.search filters by case-insensitive substring of data', async () => {
      const fx = makeFixture()
      const r = await runExec(
        fx,
        `await db.put(${JSON.stringify(fx.itemsName)}, { id: '1', data: { title: 'Celebration day' } });
         await db.put(${JSON.stringify(fx.itemsName)}, { id: '2', data: { title: 'Boring meeting' } });
         await db.put(${JSON.stringify(fx.itemsName)}, { id: '3', data: { title: 'A celebration' } });
         const hits = await db.search(${JSON.stringify(fx.itemsName)}, 'CELEBRATION');
         return JSON.stringify(hits.map(h => h.id).sort());`,
      )
      expect(JSON.parse(r.stdout)).toEqual(['1', '3'])
    })

    it('db.search with empty query returns everything', async () => {
      const fx = makeFixture()
      const r = await runExec(
        fx,
        `await db.put(${JSON.stringify(fx.itemsName)}, { id: '1', data: { x: 1 } });
         await db.put(${JSON.stringify(fx.itemsName)}, { id: '2', data: { x: 2 } });
         const hits = await db.search(${JSON.stringify(fx.itemsName)}, '');
         return hits.length;`,
      )
      expect(r.stdout).toBe('2')
    })

    it('db.delete removes a record', async () => {
      const fx = makeFixture()
      const r = await runExec(
        fx,
        `await db.put(${JSON.stringify(fx.itemsName)}, { id: 'd', data: { x: 1 } });
         await db.delete(${JSON.stringify(fx.itemsName)}, 'd');
         const after = await db.get(${JSON.stringify(fx.itemsName)}, 'd');
         return after === null ? 'gone' : 'still-there';`,
      )
      expect(r.stdout).toBe('gone')
    })

    it('db.clear wipes the collection', async () => {
      const fx = makeFixture()
      const r = await runExec(
        fx,
        `await db.put(${JSON.stringify(fx.itemsName)}, { id: 'a', data: { x: 1 } });
         await db.put(${JSON.stringify(fx.itemsName)}, { id: 'b', data: { x: 2 } });
         await db.clear(${JSON.stringify(fx.itemsName)});
         return (await db.list(${JSON.stringify(fx.itemsName)})).length;`,
      )
      expect(r.stdout).toBe('0')
    })

    it('rejects unknown collection names with a helpful error', async () => {
      const fx = makeFixture()
      const r = await runExec(fx, `await db.list('nope-not-registered')`)
      expect(r.exit_code).toBe(1)
      expect(r.stderr).toMatch(/Unknown collection "nope-not-registered"/)
      expect(r.stderr).toMatch(new RegExp(fx.itemsName))
    })

    it('isolates collections from each other', async () => {
      const fx = makeFixture()
      const r = await runExec(
        fx,
        `await db.put(${JSON.stringify(fx.itemsName)}, { id: 'shared', data: { from: 'items' } });
         const fromTags = await db.get(${JSON.stringify(fx.tagsName)}, 'shared');
         return fromTags === null ? 'isolated' : 'leaked';`,
      )
      expect(r.stdout).toBe('isolated')
    })
  })

  describe('change notifications', () => {
    it('fires onChange for put / delete / clear via exec', async () => {
      const fx = makeFixture()
      const events: Array<{ store: string; op: string; id?: string }> = []
      const r = await runExec(
        fx,
        `await db.put(${JSON.stringify(fx.itemsName)}, { id: 'p1', data: { x: 1 } });
         await db.delete(${JSON.stringify(fx.itemsName)}, 'p1');
         await db.clear(${JSON.stringify(fx.itemsName)});
         return 'ok';`,
        { onChange: (e) => events.push(e as never) },
      )
      expect(r.exit_code).toBe(0)
      expect(events).toEqual([
        { store: fx.itemsName, op: 'put', id: 'p1' },
        { store: fx.itemsName, op: 'delete', id: 'p1' },
        { store: fx.itemsName, op: 'clear' },
      ])
    })
  })

  describe('aggregation pattern (the reason this tool exists)', () => {
    it('reduces across many records in a single tool call', async () => {
      const fx = makeFixture()
      const setup = Array.from({ length: 25 }, (_, i) =>
        `await db.put(${JSON.stringify(fx.itemsName)}, { id: 'r${i}', data: { word_count: ${i + 1} } });`,
      ).join('\n')
      const r = await runExec(
        fx,
        `${setup}
         const all = await db.list(${JSON.stringify(fx.itemsName)});
         const total = all.reduce((n, r) => n + r.word_count, 0);
         return JSON.stringify({ count: all.length, total });`,
      )
      expect(JSON.parse(r.stdout)).toEqual({ count: 25, total: 325 })
    })
  })
})
