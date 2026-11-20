import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { DistriClient } from '../distri-client'
import { A2AStreamDecoder, decodeA2AStreamEvent } from '../encoder'
import { CREATED_AT_KEY, extensionUri } from '../a2a'
import type { DistriMessage } from '../types'

/**
 * Wire gaps closed after distri 34f4922 (distri-cloud
 * docs/specs/2026-11-20-a2a-wire-contract.md, "G1–G4"):
 *  G1 `metadata["distri/created_at"]` is the time of a 1.0 message / artifact update;
 *  G2 a plain-A2A answer to an INPUT_REQUIRED task (`respondToTask`);
 *  G3 `GET /tasks/{id}/events` sends `A2A-Version` and `A2A-Extensions`;
 *  G4 pending-calls 404 is `[]` (the thread-known part lives in @distri/state).
 */

const BASE_URL = 'http://localhost:9999/v1'
const T = '2026-11-20T12:00:05.250Z'

let fetchMock: ReturnType<typeof vi.fn>
const originalFetch = globalThis.fetch

beforeEach(() => {
  fetchMock = vi.fn()
  globalThis.fetch = fetchMock as unknown as typeof fetch
})
afterEach(() => {
  globalThis.fetch = originalFetch
})

const makeClient = () => new DistriClient({ baseUrl: BASE_URL, headers: { Authorization: 'Bearer t' }, retryAttempts: 0 })
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

describe('G1: distri/created_at', () => {
  it('is the created_at of a live {message} frame', () => {
    const decoder = new A2AStreamDecoder({ eventStream: true })
    const [msg] = decoder.decode({
      message: { messageId: 'a1', taskId: 't1', role: 'ROLE_AGENT', parts: [{ text: 'Hi' }], metadata: { [CREATED_AT_KEY]: T } },
    }) as DistriMessage[]
    expect(CREATED_AT_KEY).toBe('distri/created_at')
    expect(msg.created_at).toBe(Date.parse(T))
  })

  it('is the created_at of a live file artifactUpdate, and the timestamp of text artifact events', () => {
    const decoder = new A2AStreamDecoder({ eventStream: false })
    const [file] = decoder.decode({
      artifactUpdate: {
        taskId: 't1', contextId: 'c1', metadata: { [CREATED_AT_KEY]: T },
        artifact: { artifactId: 'f1', parts: [{ url: 'https://x.test/a.png', mediaType: 'image/png', filename: 'a.png' }] },
      },
    }) as DistriMessage[]
    expect(file.created_at).toBe(Date.parse(T))

    const events = decoder.decode({
      artifactUpdate: {
        taskId: 't1', contextId: 'c1', append: false, lastChunk: true, metadata: { [CREATED_AT_KEY]: T },
        artifact: { artifactId: 'm1', name: 'response', parts: [{ text: 'Hello' }] },
      },
    }) as Array<{ type: string; timestamp?: number }>
    expect(events.map((e) => e.type)).toEqual(['text_message_start', 'text_message_content', 'text_message_end'])
    expect(events.every((e) => e.timestamp === Date.parse(T))).toBe(true)
  })

  it('falls back when absent (message: as before; file artifact: now)', () => {
    const before = Date.now()
    const msg = decodeA2AStreamEvent({ message: { messageId: 'a1', role: 'ROLE_AGENT', parts: [{ text: 'Hi' }] } }) as DistriMessage
    expect(msg.created_at).toBeUndefined()
    const file = decodeA2AStreamEvent({
      artifactUpdate: { taskId: 't1', artifact: { artifactId: 'f1', parts: [{ url: 'https://x.test/a.png' }] } },
    }) as DistriMessage
    expect(file.created_at).toBeGreaterThanOrEqual(before)
  })

  it('is read from GET /threads/{id}/messages history', async () => {
    fetchMock.mockResolvedValueOnce(json([
      { message: { messageId: 'u1', contextId: 'c1', role: 'ROLE_USER', parts: [{ text: 'Pick one' }], metadata: { [CREATED_AT_KEY]: '2026-11-20T12:00:00.000Z' } } },
      { message: { messageId: 'a1', contextId: 'c1', taskId: 't1', role: 'ROLE_AGENT', parts: [{ text: 'Done' }], metadata: { [CREATED_AT_KEY]: T } } },
      { artifactUpdate: { taskId: 't1', metadata: { [CREATED_AT_KEY]: T }, artifact: { artifactId: 'f1', parts: [{ url: 'https://x.test/a.png' }] } } },
    ]))
    const client = makeClient()
    const raw = await client.getThreadMessages('c1')
    const decoded = raw.map(decodeA2AStreamEvent) as DistriMessage[]
    expect(decoded.map((m) => m.created_at)).toEqual([Date.parse('2026-11-20T12:00:00.000Z'), Date.parse(T), Date.parse(T)])

    fetchMock.mockResolvedValueOnce(json([
      { message: { messageId: 'u1', role: 'ROLE_USER', parts: [{ text: 'x' }], metadata: { [CREATED_AT_KEY]: T } } },
    ]))
    const [distri] = await client.getThreadMessagesAsDistri('c1')
    expect(distri.created_at).toBe(Date.parse(T))
  })
})

describe('G3: replay sends the A2A headers', () => {
  it('GET /tasks/{id}/events carries A2A-Version and A2A-Extensions', async () => {
    fetchMock.mockResolvedValueOnce(new Response('data: {"type":"run_finished","taskId":"t1"}\n\n', {
      status: 200, headers: { 'Content-Type': 'text/event-stream' },
    }))
    await makeClient().subscribeTaskEvents('t1', () => {})
    const init = fetchMock.mock.calls[0][1] as RequestInit
    const headers = new Headers(init.headers)
    expect(headers.get('A2A-Version')).toBe('1.0')
    const exts = (headers.get('A2A-Extensions') ?? '').split(',').map((s) => s.trim())
    expect(exts).toEqual(expect.arrayContaining([
      extensionUri('event-stream'), extensionUri('client-tools'), extensionUri('durable-runs'),
    ]))
    expect(headers.get('Accept')).toBe('text/event-stream')
  })

  it('thread history (envelopes too) carries them', async () => {
    fetchMock.mockResolvedValueOnce(json([]))
    await makeClient().getThreadMessages('c1')
    const headers = new Headers((fetchMock.mock.calls[0][1] as RequestInit).headers)
    expect(headers.get('A2A-Version')).toBe('1.0')
    expect(headers.get('A2A-Extensions')).toContain(extensionUri('event-stream'))
  })
})

describe('G4: pending calls of a thread the server does not have', () => {
  it('a 404 is []', async () => {
    fetchMock.mockResolvedValueOnce(json({ error: 'not found' }, 404))
    await expect(makeClient().listPendingCalls({ threadId: 'new-thread' })).resolves.toEqual([])
  })
})

describe('G2: respondToTask (plain A2A answer)', () => {
  it('sends SendMessage on the task with one DataPart {tool_call_id, result} per answer', async () => {
    fetchMock.mockResolvedValueOnce(json({
      jsonrpc: '2.0', id: '1',
      result: { task: { id: 't1', contextId: 'c1', status: { state: 'TASK_STATE_WORKING' } } },
    }))
    const out = await makeClient().respondToTask('shop_helper', 't1', [
      { tool_call_id: 'call-1', result: { booked: true } },
      { tool_call_id: 'call-2', result: 'ok' },
    ], { contextId: 'c1' })

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(url).toBe(`${BASE_URL}/agents/shop_helper`)
    expect(new Headers(init.headers).get('A2A-Version')).toBe('1.0')
    const body = JSON.parse(String(init.body))
    expect(body.method).toBe('SendMessage')
    expect(body.params.message).toMatchObject({
      role: 'ROLE_USER',
      taskId: 't1',
      contextId: 'c1',
      parts: [
        { data: { tool_call_id: 'call-1', result: { booked: true } } },
        { data: { tool_call_id: 'call-2', result: 'ok' } },
      ],
    })
    expect(typeof body.params.message.messageId).toBe('string')
    expect(body.params.message.messageId.length).toBeGreaterThan(0)
    // Plain DataParts: no distri part kind, no distri request metadata.
    expect(body.params.message.parts.every((p: { metadata?: unknown }) => p.metadata === undefined)).toBe(true)
    expect(body.params.metadata).toBeUndefined()
    expect(out).toMatchObject({ kind: 'task', id: 't1' })
  })

  it('a text answer is one text part (the server applies it when exactly one call is pending)', async () => {
    fetchMock.mockResolvedValueOnce(json({ jsonrpc: '2.0', id: '1', result: { task: { id: 't1', status: { state: 'TASK_STATE_COMPLETED' } } } }))
    await makeClient().respondToTask('a', 't1', 'yes')
    const body = JSON.parse(String((fetchMock.mock.calls[0][1] as RequestInit).body))
    expect(body.params.message.parts).toEqual([{ text: 'yes' }])
    expect(body.params.message.taskId).toBe('t1')
  })
})
