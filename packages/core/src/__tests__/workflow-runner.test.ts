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
  entryPointId?: string,
): Promise<WorkflowEvent[]> {
  const events: WorkflowEvent[] = []
  for await (const event of runner.run(def, input, entryPointId)) {
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

// ── Multi-Entry Point Tests ───────────────────────────────────────────────

describe('Multi-Entry Points', () => {
  function gradingWorkflow(): WorkflowDefinition {
    return {
      id: 'grading-pipeline',
      workflow_type: 'grading',
      steps: [
        { id: 'detect', label: 'Detect documents', kind: { type: 'api_call', method: 'POST', url: '/detect' } },
        { id: 'create_content', label: 'Create content', kind: { type: 'api_call', method: 'POST', url: '/content' }, depends_on: ['detect'] },
        { id: 'configure_eval', label: 'Configure eval', kind: { type: 'api_call', method: 'POST', url: '/eval' }, depends_on: ['create_content'] },
        { id: 'review', label: 'Review', kind: { type: 'wait_for_input', message: 'Review the eval config' }, depends_on: ['configure_eval'] },
        { id: 'grade', label: 'Grade', kind: { type: 'api_call', method: 'POST', url: '/grade' }, depends_on: ['review'] },
        { id: 'report', label: 'Report', kind: { type: 'api_call', method: 'POST', url: '/report' }, depends_on: ['grade'] },
      ],
      entry_points: [
        {
          id: 'grade_only',
          label: 'Grade Only',
          description: 'Skip to grading with preset data',
          starts_at: 'grade',
          preset_results: {
            detect: { documents: ['doc1', 'doc2'] },
            create_content: { content_id: 'c1' },
            configure_eval: { rubric_id: 'r1', criteria: ['accuracy', 'clarity'] },
            review: { approved: true },
          },
          required_inputs: ['activity_id'],
        },
        {
          id: 'review_and_grade',
          label: 'Review & Grade',
          starts_at: 'review',
          preset_results: {
            detect: { documents: ['doc1'] },
            create_content: { content_id: 'c1' },
            configure_eval: { rubric_id: 'r1' },
          },
        },
      ],
    }
  }

  it('full run pauses at wait_for_input checkpoint', async () => {
    const def = gradingWorkflow()
    const runner = new WorkflowRunner(mockClient(), {
      executeStep: async (step) => {
        return { status: 'done', result: { [`${step.id}_done`]: true } }
      },
    })

    const events = await collectEvents(runner, def)
    const waitEvent = events.find(e => e.event === 'step_waiting') as any
    expect(waitEvent).toBeDefined()
    expect(waitEvent.step_id).toBe('review')

    // When paused, a workflow_paused event is emitted (not workflow_completed)
    const pausedEvent = events.find(e => e.event === 'workflow_paused') as any
    expect(pausedEvent).toBeDefined()
    expect(pausedEvent.step_id).toBe('review')
  })

  it('grade_only entry point skips to grade step', async () => {
    const def = gradingWorkflow()
    const executedSteps: string[] = []

    const runner = new WorkflowRunner(mockClient(), {
      executeStep: async (step) => {
        executedSteps.push(step.id)
        return { status: 'done', result: { [`${step.id}_done`]: true } }
      },
    })

    const events = await collectEvents(runner, def, { activity_id: 'act-123' }, 'grade_only')

    // Only grade and report should execute (detect, create_content, configure_eval, review are skipped)
    expect(executedSteps).toEqual(['grade', 'report'])

    const completed = events.find(e => e.event === 'workflow_completed') as any
    expect(completed.status).toBe('completed')
    expect(completed.steps_done).toBe(2)
  })

  it('review_and_grade entry point pauses at review checkpoint', async () => {
    const def = gradingWorkflow()

    const runner = new WorkflowRunner(mockClient(), {
      executeStep: async (step) => {
        return { status: 'done', result: {} }
      },
    })

    const events = await collectEvents(runner, def, {}, 'review_and_grade')

    // Should pause at review (wait_for_input)
    const waitEvent = events.find(e => e.event === 'step_waiting') as any
    expect(waitEvent).toBeDefined()
    expect(waitEvent.step_id).toBe('review')

    // Skipped steps should not have step_started events
    const startedIds = events
      .filter(e => e.event === 'step_started')
      .map(e => (e as any).step_id)
    expect(startedIds).not.toContain('detect')
    expect(startedIds).not.toContain('create_content')
    expect(startedIds).not.toContain('configure_eval')
  })

  it('entry point preset results flow into downstream steps via input mapping', async () => {
    const captured: Record<string, unknown> = {}

    const def: WorkflowDefinition = {
      id: 'data-flow-entry',
      workflow_type: 'test',
      steps: [
        { id: 'detect', label: 'Detect', kind: { type: 'api_call', method: 'POST', url: '/detect' } },
        { id: 'eval', label: 'Eval', kind: { type: 'api_call', method: 'POST', url: '/eval' }, depends_on: ['detect'] },
        {
          id: 'grade',
          label: 'Grade',
          kind: { type: 'tool_call', tool_name: 'grade_tool' },
          depends_on: ['eval'],
          input: { rubric: '{steps.eval.rubric_id}', activity: '{input.activity_id}' },
        },
      ],
      entry_points: [{
        id: 'grade_only',
        label: 'Grade Only',
        starts_at: 'grade',
        preset_results: {
          detect: { docs: ['d1'] },
          eval: { rubric_id: 'rubric-abc' },
        },
        required_inputs: ['activity_id'],
      }],
    }

    const runner = new WorkflowRunner(mockClient(), {
      executeStep: async (step, resolvedInput) => {
        captured[step.id] = resolvedInput
        return { status: 'done', result: { score: 95 } }
      },
    })

    await collectEvents(runner, def, { activity_id: 'act-456' }, 'grade_only')

    expect(captured.grade).toEqual({ rubric: 'rubric-abc', activity: 'act-456' })
  })

  it('nonexistent entry point throws error', async () => {
    const def = gradingWorkflow()
    const runner = new WorkflowRunner(mockClient())

    await expect(async () => {
      for await (const _ of runner.run(def, {}, 'nonexistent')) { /* drain */ }
    }).rejects.toThrow(/Entry point 'nonexistent' not found/)
  })

  it('entry point with parallel fan-out from merge', async () => {
    const executedSteps: string[] = []

    const def: WorkflowDefinition = {
      id: 'parallel-entry',
      workflow_type: 'test',
      steps: [
        { id: 'detect', label: 'Detect', kind: { type: 'checkpoint', message: '' } },
        { id: 'analyze_a', label: 'A', kind: { type: 'checkpoint', message: '' }, depends_on: ['detect'], execution: 'parallel' },
        { id: 'analyze_b', label: 'B', kind: { type: 'checkpoint', message: '' }, depends_on: ['detect'], execution: 'parallel' },
        { id: 'merge', label: 'Merge', kind: { type: 'checkpoint', message: '' }, depends_on: ['analyze_a', 'analyze_b'] },
        { id: 'report', label: 'Report', kind: { type: 'checkpoint', message: '' }, depends_on: ['merge'] },
      ],
      entry_points: [{
        id: 'from_merge',
        label: 'From Merge',
        starts_at: 'merge',
        preset_results: {
          detect: { items: ['i1'] },
          analyze_a: { result: 'a' },
          analyze_b: { result: 'b' },
        },
      }],
    }

    const runner = new WorkflowRunner(mockClient(), {
      executeStep: async (step) => {
        executedSteps.push(step.id)
        return { status: 'done', result: {} }
      },
    })

    const events = await collectEvents(runner, def, {}, 'from_merge')
    expect(executedSteps).toEqual(['merge', 'report'])

    const completed = events.find(e => e.event === 'workflow_completed') as any
    expect(completed.status).toBe('completed')
  })

  it('multiple entry points produce independent valid workflows', async () => {
    const { applyEntryPoint } = await import('../workflow')
    const def = gradingWorkflow()

    const ep1 = applyEntryPoint(def, 'grade_only')
    const ep2 = applyEntryPoint(def, 'review_and_grade')

    // grade_only: detect, create_content, configure_eval, review skipped; grade, report pending
    const skipped1 = ep1.steps.filter(s => s.status === 'skipped')
    const pending1 = ep1.steps.filter(s => !s.status || s.status === 'pending')
    expect(skipped1.length).toBe(4)
    expect(pending1.length).toBe(2)

    // review_and_grade: detect, create_content, configure_eval skipped; review, grade, report pending
    const skipped2 = ep2.steps.filter(s => s.status === 'skipped')
    const pending2 = ep2.steps.filter(s => !s.status || s.status === 'pending')
    expect(skipped2.length).toBe(3)
    expect(pending2.length).toBe(3)
  })
})

// ── Checkpoint + WaitForInput Scenarios ───────────────────────────────────

describe('Checkpoint & WaitForInput', () => {
  it('checkpoint step executes normally (not a pause)', async () => {
    const def: WorkflowDefinition = {
      id: 'checkpoint-test',
      workflow_type: 'test',
      steps: [
        { id: 'fetch', label: 'Fetch', kind: { type: 'api_call', method: 'GET', url: '/data' } },
        { id: 'verify', label: 'Verify', kind: { type: 'checkpoint', message: 'Check data' }, depends_on: ['fetch'] },
        { id: 'save', label: 'Save', kind: { type: 'api_call', method: 'POST', url: '/save' }, depends_on: ['verify'] },
      ],
    }

    const runner = new WorkflowRunner(mockClient(), {
      executeStep: async () => ({ status: 'done', result: { ok: true } }),
    })

    const events = await collectEvents(runner, def)
    const completed = events.find(e => e.event === 'workflow_completed') as any
    expect(completed.status).toBe('completed')
    expect(completed.steps_done).toBe(3)
  })

  it('multiple wait_for_input steps pause sequentially', async () => {
    const def: WorkflowDefinition = {
      id: 'multi-wait-test',
      workflow_type: 'test',
      steps: [
        { id: 'step1', label: 'Step 1', kind: { type: 'checkpoint', message: 'one' } },
        { id: 'review1', label: 'First Review', kind: { type: 'wait_for_input', message: 'Review data' }, depends_on: ['step1'] },
        { id: 'step2', label: 'Process', kind: { type: 'checkpoint', message: 'two' }, depends_on: ['review1'] },
        { id: 'review2', label: 'Final Review', kind: { type: 'wait_for_input', message: 'Final approval' }, depends_on: ['step2'] },
        { id: 'step3', label: 'Submit', kind: { type: 'checkpoint', message: 'three' }, depends_on: ['review2'] },
      ],
    }

    const runner = new WorkflowRunner(mockClient())
    const events = await collectEvents(runner, def)

    // Should pause at first wait_for_input
    const waitEvent = events.find(e => e.event === 'step_waiting') as any
    expect(waitEvent).toBeDefined()
    expect(waitEvent.step_id).toBe('review1')

    // When paused, a workflow_paused event is emitted (not workflow_completed)
    const pausedEvent = events.find(e => e.event === 'workflow_paused') as any
    expect(pausedEvent).toBeDefined()
    expect(pausedEvent.step_id).toBe('review1')

    // step2, review2, step3 should not have started
    const startedIds = events
      .filter(e => e.event === 'step_started')
      .map(e => (e as any).step_id)
    expect(startedIds).not.toContain('step2')
    expect(startedIds).not.toContain('review2')
    expect(startedIds).not.toContain('step3')
  })

  it('skip_if interacts correctly with entry points', async () => {
    const executedSteps: string[] = []

    const def: WorkflowDefinition = {
      id: 'skip-entry-combo',
      workflow_type: 'test',
      steps: [
        { id: 'detect', label: 'Detect', kind: { type: 'checkpoint', message: '' }, skip_if: '{input.activity_id}' },
        { id: 'eval', label: 'Eval', kind: { type: 'checkpoint', message: '' }, depends_on: ['detect'] },
        { id: 'grade', label: 'Grade', kind: { type: 'checkpoint', message: '' }, depends_on: ['eval'] },
      ],
      entry_points: [{
        id: 'from_eval',
        label: 'From Eval',
        starts_at: 'eval',
        preset_results: {},
      }],
    }

    const runner = new WorkflowRunner(mockClient(), {
      executeStep: async (step) => {
        executedSteps.push(step.id)
        return { status: 'done', result: {} }
      },
    })

    await collectEvents(runner, def, { activity_id: 'act-789' }, 'from_eval')

    // detect is skipped by entry point, eval and grade execute
    expect(executedSteps).toEqual(['eval', 'grade'])
  })
})
