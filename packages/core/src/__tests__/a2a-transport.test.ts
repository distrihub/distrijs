import { describe, expect, it, vi } from 'vitest'
import eventStreamFixture from './fixtures/a2a-1.0-event-stream.json'
import standardFixture from './fixtures/a2a-1.0-standard.json'
import { DistriClient } from '../distri-client'
import { Agent } from '../agent'
import { A2A_EXTENSIONS_HEADER, A2A_VERSION_HEADER, PART_TYPE_KEY, extensionUri, resolveExtensions } from '../a2a'
import type { DistriChatMessage, DistriMessage } from '../types'

/**
 * The A2A 1.0 transport: method names, the activation headers, the 1.0
 * request body, reading the echoed `A2A-Extensions`, and the stream mode
 * that follows from it.
 */

const BASE_URL = 'http://localhost:9999/v1'

const sse = (frames: unknown[]) => frames.map((f) => `data: ${JSON.stringify(f)}\n\n`).join('')

const card = (name = 'assistant', extensions: unknown[] = []) => ({
  name,
  description: 'Helps',
  version: '3',
  supportedInterfaces: [{ url: `http://internal/v1/agents/${name}`, protocolBinding: 'JSONRPC', protocolVersion: '1.0' }],
  capabilities: { streaming: true, extensions },
  defaultInputModes: ['text/plain'],
  defaultOutputModes: ['text/plain'],
  skills: [],
})

interface Call { url: string; init: RequestInit; headers: Headers; body: Record<string, unknown> }

function server(opts: { echo?: string | null; stream?: unknown[]; result?: unknown } = {}) {
  const calls: Call[] = []
  const fetchImpl = vi.fn(async (input: RequestInfo | URL, init: RequestInit = {}) => {
    const url = String(input)
    const headers = new Headers(init.headers)
    const body = init.body ? JSON.parse(String(init.body)) : {}
    calls.push({ url, init, headers, body })
    if (url.endsWith('/.well-known/agent-card.json')) {
      return new Response(JSON.stringify(card()), { status: 200, headers: { 'Content-Type': 'application/json' } })
    }
    const echo: Record<string, string> = {}
    const requested = headers.get(A2A_EXTENSIONS_HEADER)
    const echoed = opts.echo === undefined ? requested : opts.echo
    if (echoed) echo[A2A_EXTENSIONS_HEADER] = echoed
    if (body.method === 'SendStreamingMessage' || body.method === 'SubscribeToTask') {
      return new Response(sse(opts.stream ?? []), { status: 200, headers: { 'Content-Type': 'text/event-stream', ...echo } })
    }
    return new Response(JSON.stringify({ jsonrpc: '2.0', id: body.id, result: opts.result ?? {} }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...echo },
    })
  })
  return { fetchImpl, calls }
}

const userMessage = {
  kind: 'message' as const,
  messageId: 'u1',
  role: 'user' as const,
  contextId: 'th-1',
  parts: [
    { kind: 'text' as const, text: 'hi' },
    { kind: 'data' as const, data: { tool_call_id: 'c1', tool_name: 'pick', parts: [] }, metadata: { [PART_TYPE_KEY]: 'tool_result' } },
  ],
}

const rpcCalls = (calls: Call[]) => calls.filter((c) => typeof c.body.method === 'string')

describe('JSON-RPC methods and headers', () => {
  it('SendStreamingMessage with A2A-Version and the default extensions, in 1.0 shape', async () => {
    const { fetchImpl, calls } = server({ stream: [] })
    const client = new DistriClient({ baseUrl: BASE_URL, fetchImpl, accessToken: 'end-user-token', retryAttempts: 0 })
    for await (const _frame of client.sendMessageStream('assistant', { message: userMessage })) { void _frame }

    const [rpc] = rpcCalls(calls)
    expect(rpc.url).toBe(`${BASE_URL}/agents/assistant`)
    expect(rpc.body.method).toBe('SendStreamingMessage')
    expect(rpc.headers.get(A2A_VERSION_HEADER)).toBe('1.0')
    expect(rpc.headers.get('Accept')).toBe('text/event-stream')
    const activated = rpc.headers.get(A2A_EXTENSIONS_HEADER)!.split(',').map((s) => s.trim())
    expect(activated).toEqual(expect.arrayContaining([
      extensionUri('event-stream'), extensionUri('client-tools'), extensionUri('durable-runs'),
      extensionUri('hooks'), extensionUri('context'), extensionUri('mcp-apps'), extensionUri('browser'),
    ]))
    // The auto-registered `distri_request` dynamic tool rides in
    // `definition_overrides`, a run-config key.
    expect(activated).toContain(extensionUri('run-config'))
    expect(activated).not.toContain(extensionUri('observability'))
    expect(activated).not.toContain(extensionUri('channels'))

    const params = rpc.body.params as { message: Record<string, unknown> }
    expect(params.message).toEqual({
      messageId: 'u1',
      contextId: 'th-1',
      role: 'ROLE_USER',
      parts: [
        { text: 'hi' },
        { data: { tool_call_id: 'c1', tool_name: 'pick', parts: [] }, metadata: { [PART_TYPE_KEY]: 'tool_result' } },
      ],
    })
    // No card fetch is needed to talk to the agent.
    expect(calls.some((c) => c.url.includes('.well-known'))).toBe(false)
  })

  it('adds observability only when it sends tags / trace_context', async () => {
    const { fetchImpl, calls } = server({ stream: [] })
    const client = new DistriClient({ baseUrl: BASE_URL, fetchImpl, accessToken: 'end-user-token', retryAttempts: 0 })
    const params = { message: userMessage, metadata: { tags: { env: 'test' }, trace_context: { traceparent: '00-a-b-01' } } }
    for await (const _frame of client.sendMessageStream('assistant', params)) { void _frame }
    const activated = rpcCalls(calls)[0].headers.get(A2A_EXTENSIONS_HEADER)!
    expect(activated).toContain(extensionUri('observability'))
  })

  it('resolveExtensions: run-config / observability / browser follow the metadata keys', () => {
    const base = resolveExtensions(['event-stream'])
    expect(base).toEqual([extensionUri('event-stream')])
    expect(resolveExtensions(['event-stream'], { env_vars: {}, load_skills: [] })).toEqual([extensionUri('event-stream'), extensionUri('run-config')])
    expect(resolveExtensions([], { tags: {}, browser_session_id: 'b' })).toEqual([extensionUri('observability'), extensionUri('browser')])
    expect(resolveExtensions([], { something_else: 1 })).toEqual([])
  })

  it('the extension set is configurable (durable-runs pulls in client-tools)', async () => {
    const { fetchImpl, calls } = server({ result: { task: { id: 't', contextId: 'c', status: { state: 'TASK_STATE_COMPLETED' } } } })
    const client = new DistriClient({ baseUrl: BASE_URL, fetchImpl, accessToken: 'end-user-token', retryAttempts: 0, a2aExtensions: ['durable-runs', 'urn:example:other'] })
    await client.sendMessage('assistant', { message: { ...userMessage, parts: [{ kind: 'text', text: 'hi' }] } })
    const value = rpcCalls(calls)[0].headers.get(A2A_EXTENSIONS_HEADER)!
    expect(value.split(',').map((s) => s.trim())).toEqual([extensionUri('durable-runs'), 'urn:example:other', extensionUri('run-config'), extensionUri('client-tools')])
  })

  it('an empty set sends no A2A-Extensions header (plain A2A)', async () => {
    const { fetchImpl, calls } = server({ result: {} })
    const client = new DistriClient({ baseUrl: BASE_URL, fetchImpl, accessToken: 'end-user-token', retryAttempts: 0, a2aExtensions: [] })
    await client.getTask('assistant', 't1')
    expect(rpcCalls(calls)[0].headers.get(A2A_EXTENSIONS_HEADER)).toBeNull()
    expect(rpcCalls(calls)[0].headers.get(A2A_VERSION_HEADER)).toBe('1.0')
  })

  it('uses the 1.0 names for every task method', async () => {
    const task = { id: 't1', contextId: 'c', status: { state: 'TASK_STATE_WORKING', timestamp: '2026-11-20T12:00:00.000Z' } }
    const { fetchImpl, calls } = server({ result: task, stream: [] })
    const client = new DistriClient({ baseUrl: BASE_URL, fetchImpl, accessToken: 'end-user-token', retryAttempts: 0 })
    const got = await client.getTask('assistant', 't1')
    expect(got).toMatchObject({ kind: 'task', id: 't1', status: { state: 'working' } })
    await client.cancelTask('assistant', 't1')
    for await (const _frame of client.resubscribeTask('assistant', 't1')) { void _frame }
    await client.listAgentTasks('assistant', { contextId: 'c', pageSize: 5 })
    expect(rpcCalls(calls).map((c) => [c.body.method, c.body.params])).toEqual([
      ['GetTask', { id: 't1' }],
      ['CancelTask', { id: 't1' }],
      ['SubscribeToTask', { id: 't1' }],
      ['ListTasks', { contextId: 'c', pageSize: 5 }],
    ])
  })

  it('SendMessage returns the {task} result in the internal shape', async () => {
    const { fetchImpl } = server({
      result: {
        task: {
          id: 't1', contextId: 'c',
          status: { state: 'TASK_STATE_COMPLETED', message: { messageId: 'f', role: 'ROLE_AGENT', parts: [{ text: 'done' }] }, timestamp: '2026-11-20T12:00:00.000Z' },
        },
      },
    })
    const client = new DistriClient({ baseUrl: BASE_URL, fetchImpl, accessToken: 'end-user-token', retryAttempts: 0 })
    const res = await client.sendMessage('assistant', { message: userMessage })
    expect(res).toMatchObject({ kind: 'task', status: { state: 'completed', message: { role: 'agent', parts: [{ kind: 'text', text: 'done' }] } } })
  })

  it('a JSON-RPC error frame in the stream surfaces as an error', async () => {
    const { fetchImpl } = server({ stream: [{ jsonrpc: '2.0', id: 'r', error: { code: -32008, message: 'extension required' } }] })
    const client = new DistriClient({ baseUrl: BASE_URL, fetchImpl, accessToken: 'end-user-token', retryAttempts: 0 })
    const drain = async () => { for await (const _frame of client.sendMessageStream('assistant', { message: userMessage })) { void _frame } }
    await expect(drain()).rejects.toThrow('extension required')
  })
})

describe('echoed A2A-Extensions decide the stream mode', () => {
  async function run(stream: unknown[], echo: string | null) {
    const { fetchImpl } = server({ stream, echo })
    const client = new DistriClient({ baseUrl: BASE_URL, fetchImpl, accessToken: 'end-user-token', retryAttempts: 0 })
    const agent = await Agent.create('assistant', client)
    const out: DistriChatMessage[] = []
    for await (const m of await agent.invokeStream({ message: userMessage })) out.push(m)
    return { out, client }
  }

  it('reads the echo and records what the server activated', async () => {
    const echo = [extensionUri('event-stream'), extensionUri('client-tools')].join(', ')
    const { client } = await run([], echo)
    expect(client.activatedExtensions('assistant')).toEqual([extensionUri('event-stream'), extensionUri('client-tools')])
  })

  it('event-stream echoed: envelopes drive the events', async () => {
    const { out } = await run(eventStreamFixture.frames, extensionUri('event-stream'))
    expect(out.filter((m) => 'type' in m && m.type === 'text_message_content')).toHaveLength(2)
    expect((out[out.length - 1] as DistriMessage).is_final).toBe(true)
  })

  it('no event-stream echoed: standard frames are decoded (text from artifacts)', async () => {
    const { out } = await run(standardFixture.frames, extensionUri('client-tools'))
    const types = out.map((m) => ('type' in m ? m.type : 'message'))
    expect(types).toEqual(['run_started', 'text_message_start', 'text_message_content', 'text_message_content', 'text_message_end', 'message', 'message', 'run_finished'])
  })
})
