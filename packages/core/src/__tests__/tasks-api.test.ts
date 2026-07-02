import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { DistriClient } from '../distri-client'
import { ApiError, TaskSummary } from '../types'

/**
 * Tests for the task-monitor client surface:
 *   - listTasks    → GET /tasks?thread_id=&parent_task_id=&status=&limit=&offset=
 *   - getTaskById  → GET /tasks/{id}
 *   - subscribeTaskEvents → GET /tasks/{id}/events (SSE)
 *
 * fetch is mocked globally. The client is constructed with a static
 * Authorization header so the managed-token machinery is skipped entirely
 * (see DistriClient.hasStaticAuthHeader).
 */

const BASE_URL = 'http://localhost:9999/v1'

let fetchMock: ReturnType<typeof vi.fn>
const originalFetch = globalThis.fetch

function makeClient(): DistriClient {
  return new DistriClient({
    baseUrl: BASE_URL,
    headers: { Authorization: 'Bearer test-token' },
    retryAttempts: 0,
  })
}

function summary(overrides: Partial<TaskSummary> = {}): TaskSummary {
  return {
    id: 'task-1',
    thread_id: 'thread-1',
    parent_task_id: null,
    status: 'running',
    created_at: 1000,
    updated_at: 2000,
    preview: null,
    last_event_at: null,
    ...overrides,
  }
}

beforeEach(() => {
  fetchMock = vi.fn()
  globalThis.fetch = fetchMock as unknown as typeof fetch
})

afterEach(() => {
  globalThis.fetch = originalFetch
})

describe('DistriClient.listTasks', () => {
  it('builds the URL with all snake_case query params', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify([]), { status: 200, headers: { 'Content-Type': 'application/json' } }),
    )
    const client = makeClient()

    await client.listTasks({
      threadId: 'th-1',
      parentTaskId: 'pt-1',
      status: 'running',
      limit: 10,
      offset: 5,
    })

    expect(fetchMock).toHaveBeenCalledTimes(1)
    const url = fetchMock.mock.calls[0][0] as string
    expect(url).toBe(
      `${BASE_URL}/tasks?thread_id=th-1&parent_task_id=pt-1&status=running&limit=10&offset=5`,
    )
  })

  it('omits the query string entirely when no params are given', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify([]), { status: 200 }),
    )
    const client = makeClient()

    await client.listTasks()

    const url = fetchMock.mock.calls[0][0] as string
    expect(url).toBe(`${BASE_URL}/tasks`)
  })

  it('parses the JSON array response into TaskSummary objects', async () => {
    const tasks = [
      summary({ id: 'root', status: 'running' }),
      summary({
        id: 'child',
        parent_task_id: 'root',
        status: 'completed',
        preview: 'generated 3 scenes',
        last_event_at: 3000,
      }),
    ]
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify(tasks), { status: 200 }),
    )
    const client = makeClient()

    const result = await client.listTasks({ threadId: 'thread-1' })

    expect(result).toHaveLength(2)
    expect(result[0].id).toBe('root')
    expect(result[0].parent_task_id).toBeNull()
    expect(result[1].parent_task_id).toBe('root')
    expect(result[1].preview).toBe('generated 3 scenes')
    expect(result[1].last_event_at).toBe(3000)
  })

  it('throws ApiError on a non-ok response', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response('boom', { status: 500, statusText: 'Internal Server Error' }),
    )
    const client = makeClient()

    await expect(client.listTasks()).rejects.toMatchObject({
      name: 'ApiError',
      statusCode: 500,
    })
  })
})

describe('DistriClient.getTaskById', () => {
  it('fetches GET /tasks/{id} and returns the enriched task', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify(summary({ id: 'task-42', status: 'input_required' })), { status: 200 }),
    )
    const client = makeClient()

    const task = await client.getTaskById('task-42')

    const url = fetchMock.mock.calls[0][0] as string
    expect(url).toBe(`${BASE_URL}/tasks/task-42`)
    expect(task.id).toBe('task-42')
    expect(task.status).toBe('input_required')
  })

  it('URL-encodes the task id', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify(summary()), { status: 200 }),
    )
    const client = makeClient()

    await client.getTaskById('task/with slash')

    const url = fetchMock.mock.calls[0][0] as string
    expect(url).toBe(`${BASE_URL}/tasks/task%2Fwith%20slash`)
  })

  it('throws a 404 ApiError for an unknown task', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ error: 'not found' }), { status: 404 }),
    )
    const client = makeClient()

    const err = await client.getTaskById('missing').catch(e => e)
    expect(err).toBeInstanceOf(ApiError)
    expect(err.statusCode).toBe(404)
    expect(err.message).toContain('missing')
  })
})

describe('DistriClient.subscribeTaskEvents', () => {
  const encoder = new TextEncoder()

  function sseResponse(chunks: string[]): Response {
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        for (const chunk of chunks) {
          controller.enqueue(encoder.encode(chunk))
        }
        controller.close()
      },
    })
    return new Response(stream, {
      status: 200,
      headers: { 'Content-Type': 'text/event-stream' },
    })
  }

  it('parses each data: line as one AgentEvent and resolves when the stream closes', async () => {
    fetchMock.mockResolvedValueOnce(
      sseResponse([
        'data: {"type":"run_started","taskId":"t1"}\n\n',
        'data: {"type":"run_finished","taskId":"t1","parentTaskId":"root"}\n\n',
      ]),
    )
    const client = makeClient()
    const events: unknown[] = []

    await client.subscribeTaskEvents('t1', e => events.push(e))

    const url = fetchMock.mock.calls[0][0] as string
    expect(url).toBe(`${BASE_URL}/tasks/t1/events`)
    expect(events).toEqual([
      { type: 'run_started', taskId: 't1' },
      { type: 'run_finished', taskId: 't1', parentTaskId: 'root' },
    ])
  })

  it('reassembles events split across chunk boundaries', async () => {
    fetchMock.mockResolvedValueOnce(
      sseResponse([
        'data: {"type":"tool_calls","ta',
        'skId":"t1"}\n\ndata: {"type":"run_fin',
        'ished","taskId":"t1"}\n\n',
      ]),
    )
    const client = makeClient()
    const events: unknown[] = []

    await client.subscribeTaskEvents('t1', e => events.push(e))

    expect(events).toEqual([
      { type: 'tool_calls', taskId: 't1' },
      { type: 'run_finished', taskId: 't1' },
    ])
  })

  it('ignores comments, other SSE fields, and non-JSON payloads', async () => {
    fetchMock.mockResolvedValueOnce(
      sseResponse([
        ': keep-alive\n\n',
        'event: message\nid: 7\ndata: {"type":"run_started","taskId":"t1"}\n\n',
        'data: not-json\n\n',
        'data: [DONE]\n\n',
      ]),
    )
    const client = makeClient()
    const events: unknown[] = []

    await client.subscribeTaskEvents('t1', e => events.push(e))

    expect(events).toEqual([{ type: 'run_started', taskId: 't1' }])
  })

  it('flushes a trailing event that is not newline-terminated', async () => {
    fetchMock.mockResolvedValueOnce(
      sseResponse(['data: {"type":"run_finished","taskId":"t1"}']),
    )
    const client = makeClient()
    const events: unknown[] = []

    await client.subscribeTaskEvents('t1', e => events.push(e))

    expect(events).toEqual([{ type: 'run_finished', taskId: 't1' }])
  })

  it('throws a 404 ApiError for an unknown task', async () => {
    fetchMock.mockResolvedValueOnce(new Response('nope', { status: 404 }))
    const client = makeClient()

    await expect(client.subscribeTaskEvents('missing', () => { })).rejects.toMatchObject({
      statusCode: 404,
    })
  })
})
