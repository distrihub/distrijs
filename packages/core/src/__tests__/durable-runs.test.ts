import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { DistriClient } from '../distri-client'
import { DURABLE_RUNS_EXTENSION_URI, ToolCallClosedError, cardHasDurableRuns } from '../durable-runs'
import { decodeA2AStreamEvent } from '../encoder'
import { ApiError, ToolResult } from '../types'

/**
 * Durable runs, client side (spec 2026-11-20-durable-runs-and-nodes §2.7, S3–S6):
 * pending-call list and claim, complete-tool retry/duplicate/expired,
 * capability detection, and the `run_parked` / `attempt` wire decoding.
 */

const BASE_URL = 'http://localhost:9999/v1'

let fetchMock: ReturnType<typeof vi.fn>
const originalFetch = globalThis.fetch

function makeClient(): DistriClient {
  return new DistriClient({
    baseUrl: BASE_URL,
    headers: { Authorization: 'Bearer test-token' },
    retryAttempts: 0,
    completeToolRetry: { attempts: 4, baseDelayMs: 1, maxDelayMs: 2 },
  })
}

const json = (body: unknown, status = 200, headers: Record<string, string> = {}) =>
  new Response(body === undefined ? '' : JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...headers },
  })

const result: ToolResult = {
  tool_call_id: 'call-1',
  tool_name: 'book_table',
  parts: [{ part_type: 'data', data: { result: 'ok', success: true, error: null } }],
}

beforeEach(() => {
  fetchMock = vi.fn()
  globalThis.fetch = fetchMock as unknown as typeof fetch
})

afterEach(() => {
  globalThis.fetch = originalFetch
})

describe('listPendingCalls', () => {
  const call = {
    id: 'call-1', task_id: 'task-1', thread_id: 'th-1', kind: 'client_tool', tool_name: 'book_table',
    request: { tool_call_id: 'call-1', tool_name: 'book_table', input: { party: 2 } }, status: 'pending',
  }

  it('lists a thread\'s pending calls', async () => {
    fetchMock.mockResolvedValueOnce(json([call]))
    const calls = await makeClient().listPendingCalls({ threadId: 'th-1' })
    expect(fetchMock.mock.calls[0][0]).toBe(`${BASE_URL}/threads/th-1/pending-calls`)
    expect(calls).toEqual([call])
  })

  it('lists a task\'s pending calls', async () => {
    fetchMock.mockResolvedValueOnce(json([call]))
    await makeClient().listPendingCalls({ taskId: 'task-1' })
    expect(fetchMock.mock.calls[0][0]).toBe(`${BASE_URL}/tasks/task-1/pending-calls`)
  })

  it('an old server (404) has none', async () => {
    fetchMock.mockResolvedValueOnce(json({ error: 'not found' }, 404))
    expect(await makeClient().listPendingCalls({ threadId: 'th-1' })).toEqual([])
  })
})

describe('claimPendingCall', () => {
  it('posts the instance id; 200 is a claim', async () => {
    fetchMock.mockResolvedValueOnce(json({ claimed: true, until: '2026-11-20T10:00:00Z' }))
    const res = await makeClient().claimPendingCall('call-1', 'tab-a')
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe(`${BASE_URL}/pending-calls/call-1/claim`)
    expect(init.method).toBe('POST')
    expect(JSON.parse(init.body)).toEqual({ instance_id: 'tab-a' })
    expect(res).toEqual({ claimed: true, until: '2026-11-20T10:00:00Z' })
  })

  it('409 means another window holds it', async () => {
    fetchMock.mockResolvedValueOnce(json({ claimed_by: 'tab-b', until: '2026-11-20T10:00:00Z' }, 409))
    const res = await makeClient().claimPendingCall('call-1', 'tab-a')
    expect(res).toEqual({ claimed: false, claimed_by: 'tab-b', until: '2026-11-20T10:00:00Z' })
  })
})

describe('completeTool', () => {
  it('posts the result and reports completed', async () => {
    fetchMock.mockResolvedValueOnce(json({ status: 'ok' }))
    const out = await makeClient().completeTool('agent', result)
    expect(out).toEqual({ status: 'completed' })
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe(`${BASE_URL}/agents/agent/complete-tool`)
    expect(JSON.parse(init.body)).toMatchObject({ tool_call_id: 'call-1', tool_response: { tool_name: 'book_table' } })
  })

  it('retries network errors and 5xx with backoff, then succeeds', async () => {
    fetchMock
      .mockRejectedValueOnce(new TypeError('fetch failed'))
      .mockResolvedValueOnce(json({ error: 'bad gateway' }, 502))
      .mockResolvedValueOnce(json({ status: 'ok' }))
    const out = await makeClient().completeTool('agent', result)
    expect(out).toEqual({ status: 'completed' })
    expect(fetchMock).toHaveBeenCalledTimes(3)
  })

  it('gives up after the configured attempts', async () => {
    fetchMock.mockResolvedValue(json({ error: 'unavailable' }, 503))
    await expect(makeClient().completeTool('agent', result)).rejects.toMatchObject({ statusCode: 503 })
    expect(fetchMock).toHaveBeenCalledTimes(4)
  })

  it('a 200 duplicate is a success', async () => {
    fetchMock.mockResolvedValueOnce(json({ status: 'duplicate' }))
    expect(await makeClient().completeTool('agent', result)).toEqual({ status: 'duplicate' })
  })

  it('409 expired is surfaced distinctly and not retried', async () => {
    fetchMock.mockResolvedValueOnce(json({ status: 'expired' }, 409))
    const err = await makeClient().completeTool('agent', result).catch((e) => e)
    expect(err).toBeInstanceOf(ToolCallClosedError)
    expect(err).toMatchObject({ reason: 'expired', statusCode: 409, toolCallId: 'call-1' })
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('409 conflict is a closed call too', async () => {
    fetchMock.mockResolvedValueOnce(json({ status: 'conflict' }, 409))
    await expect(makeClient().completeTool('agent', result)).rejects.toMatchObject({ reason: 'conflict' })
  })

  it('400 unknown call is an ApiError, not retried', async () => {
    fetchMock.mockResolvedValueOnce(new Response('No pending external tool execution found', { status: 400 }))
    const err = await makeClient().completeTool('agent', result).catch((e) => e)
    expect(err).toBeInstanceOf(ApiError)
    expect(err).not.toBeInstanceOf(ToolCallClosedError)
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })
})

const durableCard = (extra: Record<string, unknown> = {}) => ({
  ...extra,
  capabilities: { streaming: true, extensions: [{ uri: DURABLE_RUNS_EXTENSION_URI, required: false }] },
})

describe('durable runs capability', () => {
  it('reads the agent card and caches the answer per agent', async () => {
    fetchMock.mockResolvedValueOnce(json(durableCard({ name: 'a' })))
    const client = makeClient()
    expect(await client.supportsDurableRuns('a')).toBe(true)
    expect(await client.supportsDurableRuns('a')).toBe(true)
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(fetchMock.mock.calls[0][0]).toBe(`${BASE_URL}/agents/a/.well-known/agent-card.json`)
  })

  it('an old server\'s card says nothing: no durable runs', async () => {
    fetchMock.mockResolvedValueOnce(json({ name: 'a', capabilities: { streaming: true } }))
    expect(await makeClient().supportsDurableRuns('a')).toBe(false)
  })

  it('comes from the card only: the removed x-distri-capabilities header is ignored', async () => {
    fetchMock
      .mockResolvedValueOnce(json([], 200, { 'x-distri-capabilities': 'streaming, durable_runs' }))
      .mockResolvedValueOnce(json({ name: 'a', capabilities: { streaming: true } }))
    const client = makeClient()
    await client.listPendingCalls({ threadId: 'th-1' })
    expect(await client.supportsDurableRuns('a')).toBe(false)
    expect(await client.supportsDurableRuns()).toBe(false)
  })

  it('a failed card fetch is not cached', async () => {
    fetchMock.mockRejectedValueOnce(new TypeError('offline')).mockResolvedValueOnce(json(durableCard()))
    const client = makeClient()
    expect(await client.supportsDurableRuns('a')).toBe(false)
    expect(await client.supportsDurableRuns('a')).toBe(true)
  })

  it('helpers', () => {
    expect(cardHasDurableRuns(durableCard())).toBe(true)
    expect(cardHasDurableRuns({ capabilities: { extensions: [{ uri: 'https://example.com/other' }] } })).toBe(false)
    // A custom top-level field is not the standard way to advertise it.
    expect(cardHasDurableRuns({ durable_runs: true })).toBe(false)
    expect(cardHasDurableRuns({ capabilities: { durable_runs: true } })).toBe(false)
    expect(cardHasDurableRuns(null)).toBe(false)
  })
})

describe('wire decoding', () => {
  const frame = (metadata: Record<string, unknown>) => ({
    kind: 'status-update', taskId: 'task-1', contextId: 'th-1', final: false,
    status: { state: 'input-required', timestamp: '2026-11-20T10:00:00Z' }, metadata,
  })

  it('decodes run_parked (not terminal) with its pending calls and deadline', () => {
    const evt = decodeA2AStreamEvent(frame({
      type: 'run_parked', task_id: 'task-1', pending: ['call-1', 'call-2'], deadline: '2026-11-20T10:15:00Z',
    }))
    expect(evt).toMatchObject({
      type: 'run_parked', taskId: 'task-1',
      data: { taskId: 'task-1', pending: ['call-1', 'call-2'], deadline: '2026-11-20T10:15:00Z' },
    })
  })

  it('stamps attempt and step id on step events', () => {
    const evt = decodeA2AStreamEvent(frame({ type: 'step_started', step_id: 's1', step_title: 'x', attempt: 2 }))
    expect(evt).toMatchObject({ type: 'step_started', attempt: 2, stepId: 's1' })
    const plain = decodeA2AStreamEvent(frame({ type: 'step_started', step_id: 's1' }))
    expect(plain).not.toHaveProperty('attempt')
  })
})
