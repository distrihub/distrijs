import { describe, it, expect, vi } from 'vitest'
import { WorkflowRunner, resolveTemplate, resolveValue, type WorkflowEvent, type ExecutionContext } from '../workflow-runner'
import type { WorkflowDefinition, StepResult, WorkflowStep } from '../workflow'

// ── Mock DistriClient ──────────────────────────────────────────────────────

function mockClient(toolResults: Record<string, unknown> = {}) {
  return {
    callTool: vi.fn(async (toolName: string, input: Record<string, unknown>) => {
      return toolResults[toolName] ?? { tool: toolName, input }
    }),
  } as any
}

// ── Helper: collect all events from a run ──────────────────────────────────

async function collectEvents(
  runner: WorkflowRunner,
  def: WorkflowDefinition,
  input: Record<string, unknown> = {},
): Promise<WorkflowEvent[]> {
  const events: WorkflowEvent[] = []
  for await (const event of runner.run(def, input)) {
    events.push(event)
  }
  return events
}

// ── Namespace Resolution Tests ─────────────────────────────────────────────

describe('resolveTemplate', () => {
  const ctx: ExecutionContext = {
    input: { doc_id: 'abc123', class_id: 'xyz' },
    steps: {
      fetch: { content: 'Hello world', title: 'My Essay', metadata: { author: 'Alice', pages: 5 } },
      detect: { questions: [{ id: 1 }, { id: 2 }], title: 'Detected' },
    },
    env: { api_base: 'http://localhost:8086', auth_token: 'bearer-xyz' },
  }

  it('resolves {input.X}', () => {
    expect(resolveTemplate('{input.doc_id}', ctx)).toBe('abc123')
  })

  it('resolves {steps.X.Y}', () => {
    expect(resolveTemplate('{steps.fetch.content}', ctx)).toBe('Hello world')
  })

  it('resolves {env.X}', () => {
    expect(resolveTemplate('{env.api_base}/docs', ctx)).toBe('http://localhost:8086/docs')
  })

  it('resolves multiple references in one string', () => {
    expect(resolveTemplate('{env.api_base}/classes/{input.class_id}/docs/{input.doc_id}', ctx))
      .toBe('http://localhost:8086/classes/xyz/docs/abc123')
  })

  it('leaves unknown references as-is', () => {
    expect(resolveTemplate('{input.missing}', ctx)).toBe('{input.missing}')
  })

  it('backward compat: {context.X} checks input first', () => {
    expect(resolveTemplate('{context.doc_id}', ctx)).toBe('abc123')
  })
})

describe('resolveValue', () => {
  const ctx: ExecutionContext = {
    input: { tags: ['math', 'science'] },
    steps: {
      fetch: { items: [1, 2, 3], count: 3, metadata: { author: 'Alice' } },
    },
    env: {},
  }

  it('full-value reference preserves array', () => {
    const resolved = resolveValue('{steps.fetch.items}', ctx)
    expect(Array.isArray(resolved)).toBe(true)
    expect(resolved).toEqual([1, 2, 3])
  })

  it('full-value reference preserves number', () => {
    expect(resolveValue('{steps.fetch.count}', ctx)).toBe(3)
  })

  it('full-value reference preserves object', () => {
    const resolved = resolveValue('{steps.fetch.metadata}', ctx)
    expect(resolved).toEqual({ author: 'Alice' })
  })

  it('resolves nested objects', () => {
    const val = { name: '{steps.fetch.metadata.author}', count: 5 }
    const resolved = resolveValue(val, ctx)
    expect(resolved).toEqual({ name: 'Alice', count: 5 })
  })

  it('resolves arrays', () => {
    const val = ['{input.tags}', '{steps.fetch.count}']
    const resolved = resolveValue(val, ctx) as unknown[]
    expect(Array.isArray(resolved[0])).toBe(true) // tags is array
    expect(resolved[1]).toBe(3) // count is number
  })
})

// ── Cycle Detection ────────────────────────────────────────────────────────

describe('cycle detection', () => {
  const client = mockClient()

  it('rejects circular dependencies', async () => {
    const def: WorkflowDefinition = {
      id: 'cycle-test',
      workflow_type: 'test',
      steps: [
        { id: 'a', label: 'A', kind: { type: 'checkpoint', message: '' }, depends_on: ['c'] },
        { id: 'b', label: 'B', kind: { type: 'checkpoint', message: '' }, depends_on: ['a'] },
        { id: 'c', label: 'C', kind: { type: 'checkpoint', message: '' }, depends_on: ['b'] },
      ],
    }
    const runner = new WorkflowRunner(client)
    await expect(async () => {
      for await (const _ of runner.run(def)) { /* drain */ }
    }).rejects.toThrow(/Circular dependency/)
  })

  it('rejects missing dependency', async () => {
    const def: WorkflowDefinition = {
      id: 'missing-test',
      workflow_type: 'test',
      steps: [
        { id: 'a', label: 'A', kind: { type: 'checkpoint', message: '' }, depends_on: ['nonexistent'] },
      ],
    }
    const runner = new WorkflowRunner(client)
    await expect(async () => {
      for await (const _ of runner.run(def)) { /* drain */ }
    }).rejects.toThrow(/does not exist/)
  })

  it('accepts valid DAG', async () => {
    const def: WorkflowDefinition = {
      id: 'valid-dag',
      workflow_type: 'test',
      steps: [
        { id: 'a', label: 'A', kind: { type: 'checkpoint', message: 'ok' } },
        { id: 'b', label: 'B', kind: { type: 'checkpoint', message: 'ok' }, depends_on: ['a'] },
        { id: 'c', label: 'C', kind: { type: 'checkpoint', message: 'ok' }, depends_on: ['a', 'b'] },
      ],
    }
    const runner = new WorkflowRunner(client)
    const events = await collectEvents(runner, def)
    expect(events.find(e => e.event === 'workflow_completed')!).toMatchObject({ status: 'completed' })
  })
})

// ── Workflow Execution ─────────────────────────────────────────────────────

describe('WorkflowRunner', () => {
  it('runs sequential steps in order', async () => {
    const def: WorkflowDefinition = {
      id: 'seq-test',
      workflow_type: 'test',
      steps: [
        { id: 's1', label: 'Step 1', kind: { type: 'checkpoint', message: 'one' } },
        { id: 's2', label: 'Step 2', kind: { type: 'checkpoint', message: 'two' }, depends_on: ['s1'] },
        { id: 's3', label: 'Step 3', kind: { type: 'checkpoint', message: 'three' }, depends_on: ['s2'] },
      ],
    }

    const runner = new WorkflowRunner(mockClient())
    const events = await collectEvents(runner, def)

    const starts = events.filter(e => e.event === 'step_started').map(e => (e as any).step_id)
    expect(starts).toEqual(['s1', 's2', 's3'])

    const completed = events.find(e => e.event === 'workflow_completed') as any
    expect(completed.status).toBe('completed')
    expect(completed.steps_done).toBe(3)
  })

  it('runs parallel steps then join', async () => {
    const def: WorkflowDefinition = {
      id: 'parallel-test',
      workflow_type: 'test',
      steps: [
        { id: 'a', label: 'A', kind: { type: 'checkpoint', message: '' }, execution: 'parallel' },
        { id: 'b', label: 'B', kind: { type: 'checkpoint', message: '' }, execution: 'parallel' },
        { id: 'c', label: 'Join', kind: { type: 'checkpoint', message: '' }, depends_on: ['a', 'b'] },
      ],
    }

    const runner = new WorkflowRunner(mockClient())
    const events = await collectEvents(runner, def)

    const starts = events.filter(e => e.event === 'step_started').map(e => (e as any).step_id)
    // a and b should both start before c
    expect(starts.indexOf('c')).toBeGreaterThan(starts.indexOf('a'))
    expect(starts.indexOf('c')).toBeGreaterThan(starts.indexOf('b'))
  })

  it('stops on step failure', async () => {
    const client = mockClient()
    const def: WorkflowDefinition = {
      id: 'fail-test',
      workflow_type: 'test',
      steps: [
        { id: 'ok', label: 'OK', kind: { type: 'checkpoint', message: 'fine' } },
        { id: 'fail', label: 'Fail', kind: { type: 'checkpoint', message: 'bad' }, depends_on: ['ok'] },
        { id: 'after', label: 'After', kind: { type: 'checkpoint', message: '' }, depends_on: ['fail'] },
      ],
    }

    const runner = new WorkflowRunner(client, {
      executeStep: async (step) => {
        if (step.id === 'fail') return { status: 'failed', error: 'boom' }
        return { status: 'done', result: { ok: true } }
      },
    })

    const events = await collectEvents(runner, def)
    const failEvent = events.find(e => e.event === 'step_failed') as any
    expect(failEvent.step_id).toBe('fail')
    expect(failEvent.error).toBe('boom')

    const completed = events.find(e => e.event === 'workflow_completed') as any
    expect(completed.status).toBe('failed')

    // 'after' should never have started
    const starts = events.filter(e => e.event === 'step_started').map(e => (e as any).step_id)
    expect(starts).not.toContain('after')
  })

  it('interdependent steps receive resolved input', async () => {
    const captured: Record<string, unknown> = {}

    const def: WorkflowDefinition = {
      id: 'data-flow-test',
      workflow_type: 'test',
      steps: [
        {
          id: 'fetch',
          label: 'Fetch',
          kind: { type: 'tool_call', tool_name: 'read_doc' },
          input: { doc_id: '{input.doc_id}' },
        },
        {
          id: 'process',
          label: 'Process',
          kind: { type: 'tool_call', tool_name: 'analyze' },
          depends_on: ['fetch'],
          input: { text: '{steps.fetch.content}', class: '{input.class_id}' },
        },
        {
          id: 'save',
          label: 'Save',
          kind: { type: 'tool_call', tool_name: 'persist' },
          depends_on: ['process'],
          input: { summary: '{steps.process.summary}', title: '{steps.fetch.title}' },
        },
      ],
    }

    const runner = new WorkflowRunner(mockClient(), {
      executeStep: async (step, resolvedInput) => {
        captured[step.id] = resolvedInput
        if (step.id === 'fetch') return { status: 'done', result: { content: 'Hello', title: 'Essay' } }
        if (step.id === 'process') return { status: 'done', result: { summary: 'A greeting essay' } }
        return { status: 'done', result: { saved: true } }
      },
    })

    await collectEvents(runner, def, { doc_id: 'doc-1', class_id: 'cls-1' })

    expect(captured.fetch).toEqual({ doc_id: 'doc-1' })
    expect(captured.process).toEqual({ text: 'Hello', class: 'cls-1' })
    expect(captured.save).toEqual({ summary: 'A greeting essay', title: 'Essay' })
  })

  it('preserves array types through step references', async () => {
    let processInput: unknown = null

    const def: WorkflowDefinition = {
      id: 'type-test',
      workflow_type: 'test',
      steps: [
        { id: 'fetch', label: 'Fetch', kind: { type: 'tool_call', tool_name: 't' } },
        {
          id: 'process',
          label: 'Process',
          kind: { type: 'tool_call', tool_name: 't' },
          depends_on: ['fetch'],
          input: { items: '{steps.fetch.items}', count: '{steps.fetch.count}' },
        },
      ],
    }

    const runner = new WorkflowRunner(mockClient(), {
      executeStep: async (step, resolvedInput) => {
        if (step.id === 'fetch') return { status: 'done', result: { items: [1, 2, 3], count: 3 } }
        processInput = resolvedInput
        return { status: 'done', result: {} }
      },
    })

    await collectEvents(runner, def)
    expect(Array.isArray((processInput as any).items)).toBe(true)
    expect((processInput as any).items).toEqual([1, 2, 3])
    expect((processInput as any).count).toBe(3)
  })

  it('calls tool via DistriClient.callTool', async () => {
    const client = mockClient({ greet: { greeting: 'Hello, World!' } })

    const def: WorkflowDefinition = {
      id: 'tool-test',
      workflow_type: 'test',
      steps: [
        { id: 's1', label: 'Greet', kind: { type: 'tool_call', tool_name: 'greet' }, input: { name: 'World' } },
      ],
    }

    const runner = new WorkflowRunner(client)
    const events = await collectEvents(runner, def)

    expect(client.callTool).toHaveBeenCalledWith('greet', { name: 'World' })
    const completed = events.find(e => e.event === 'step_completed') as any
    expect(completed.result).toEqual({ greeting: 'Hello, World!' })
  })

  it('buildRequest hook customizes api_call requests', async () => {
    let capturedUrl = ''
    let capturedHeaders: Record<string, string> = {}

    // Use custom fetch
    const originalFetch = globalThis.fetch
    globalThis.fetch = vi.fn(async (url: string | URL | Request, init?: RequestInit) => {
      capturedUrl = url.toString()
      capturedHeaders = Object.fromEntries(new Headers(init?.headers).entries())
      return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { 'Content-Type': 'application/json' } })
    }) as any

    try {
      const def: WorkflowDefinition = {
        id: 'hook-test',
        workflow_type: 'test',
        steps: [
          { id: 's1', label: 'Call API', kind: { type: 'api_call', method: 'GET', url: '/docs/123' } },
        ],
      }

      const runner = new WorkflowRunner(mockClient(), {
        buildRequest: (step, init, url) => ({
          url: `https://api.myapp.com${url}`,
          init: {
            ...init,
            headers: { ...Object.fromEntries(new Headers(init.headers).entries()), authorization: 'Bearer token123' },
          },
        }),
      })

      await collectEvents(runner, def)

      expect(capturedUrl).toBe('https://api.myapp.com/docs/123')
      expect(capturedHeaders.authorization).toBe('Bearer token123')
    } finally {
      globalThis.fetch = originalFetch
    }
  })

  it('emits correct event sequence', async () => {
    const def: WorkflowDefinition = {
      id: 'event-test',
      workflow_type: 'test',
      steps: [
        { id: 's1', label: 'Step', kind: { type: 'checkpoint', message: 'hi' } },
      ],
    }

    const runner = new WorkflowRunner(mockClient())
    const events = await collectEvents(runner, def)

    expect(events.map(e => e.event)).toEqual([
      'workflow_started',
      'step_started',
      'step_completed',
      'workflow_completed',
    ])
  })

  it('step without input mapping receives full context', async () => {
    let receivedInput: unknown = null

    const def: WorkflowDefinition = {
      id: 'no-mapping-test',
      workflow_type: 'test',
      steps: [
        { id: 's1', label: 'Step', kind: { type: 'tool_call', tool_name: 't' } },
      ],
    }

    const runner = new WorkflowRunner(mockClient(), {
      env: { api_base: 'http://localhost' },
      executeStep: async (_step, resolvedInput) => {
        receivedInput = resolvedInput
        return { status: 'done', result: {} }
      },
    })

    await collectEvents(runner, def, { key: 'value' })
    expect((receivedInput as any).input).toEqual({ key: 'value' })
    expect((receivedInput as any).env).toEqual({ api_base: 'http://localhost' })
  })
})
