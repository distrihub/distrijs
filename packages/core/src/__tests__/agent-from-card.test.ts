import { describe, expect, it, vi } from 'vitest'
import { DistriClient } from '../distri-client'
import { Agent, ExternalToolValidationError } from '../agent'
import { AGENT_EXTENSION_URI, agentDescriptorFromCard, extensionUri } from '../a2a'
import { DURABLE_RUNS_EXTENSION_URI } from '../durable-runs'
import type { DistriBaseTool } from '../types'

/**
 * Agents are used, not read (spec 2026-11-20-a2a-extensions §5): the runtime
 * Agent is built from the A2A card and its `agent` extension; the definition
 * (`GET /agents/{id}`) is a developer call only, which an end-user token may
 * not make.
 */

const BASE_URL = 'http://localhost:9999/v1'

const descriptor = {
  agent_type: 'standard_agent',
  external_tools: ['pick_color', 'show_map'],
  any_tool: false,
  runtime: 'web',
  browser_streaming: true,
  version_no: 7,
}

const card = (name: string, params: Record<string, unknown> = descriptor, durable = false) => ({
  name,
  description: `${name} agent`,
  version: '7',
  iconUrl: `https://cdn/${name}.png`,
  supportedInterfaces: [{ url: `http://internal/v1/agents/${name}`, protocolBinding: 'JSONRPC', protocolVersion: '1.0' }],
  capabilities: {
    streaming: true,
    extensions: [
      { uri: extensionUri('client-tools'), required: false, params: {} },
      ...(durable ? [{ uri: DURABLE_RUNS_EXTENSION_URI, required: false, params: {} }] : []),
      { uri: AGENT_EXTENSION_URI, required: false, params },
    ],
  },
  skills: [],
})

/**
 * A server as an end-user token sees it: cards and A2A calls work, the
 * definition (`GET /agents/{id}`, `GET /agents`) is 403.
 */
function endUserServer(durable = false) {
  const urls: string[] = []
  const fetchImpl = vi.fn(async (input: RequestInfo | URL, init: RequestInit = {}) => {
    const url = String(input)
    const method = init.method ?? 'GET'
    urls.push(`${method} ${url}`)
    const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })
    const m = url.match(/\/agents\/([^/]+)\/\.well-known\/agent-card\.json$/)
    if (m) return json(card(m[1], descriptor, durable))
    if (url === `${BASE_URL}/agents/cards`) return json([card('assistant'), card('researcher', { ...descriptor, external_tools: [], browser_streaming: false })])
    if (method === 'GET' && /\/agents(\/[^/]+)?$/.test(url)) return json({ error: 'forbidden' }, 403)
    if (method === 'POST' && url === `${BASE_URL}/agents/assistant`) {
      return new Response('', { status: 200, headers: { 'Content-Type': 'text/event-stream' } })
    }
    return json({}, 404)
  })
  return { fetchImpl, urls }
}

const tool = (name: string): DistriBaseTool => {
  const t: DistriBaseTool = { type: 'function', name, description: name, parameters: { type: 'object', properties: {} } }
  return t
}

const definitionCalls = (urls: string[]) => urls.filter((u) => /^GET .*\/agents(\/[^/.]+)?$/.test(u) && !u.endsWith('/agents/cards'))

describe('Agent.create from the card', () => {
  it('fetches the 1.0 card and reads the agent descriptor', async () => {
    const { fetchImpl, urls } = endUserServer()
    const client = new DistriClient({ baseUrl: BASE_URL, fetchImpl, accessToken: 'end-user-token', retryAttempts: 0 })
    const agent = await Agent.create('assistant', client)

    expect(urls).toEqual([`GET ${BASE_URL}/agents/assistant/.well-known/agent-card.json`])
    expect(agent.name).toBe('assistant')
    expect(agent.description).toBe('assistant agent')
    expect(agent.iconUrl).toBe('https://cdn/assistant.png')
    expect(agent.agentType).toBe('standard_agent')
    expect(agent.descriptor).toEqual(descriptor)
    expect(agent.browserStreaming).toBe(true)
    expect(agent.card?.name).toBe('assistant')
  })

  it('checks the required external tools from the descriptor', async () => {
    const { fetchImpl } = endUserServer()
    const agent = await Agent.create('assistant', new DistriClient({ baseUrl: BASE_URL, fetchImpl, accessToken: 'end-user-token', retryAttempts: 0 }))

    const missing = agent.validateExternalTools([tool('pick_color')])
    expect(missing).toMatchObject({ isValid: false, requiredTools: ['pick_color', 'show_map'], missingTools: ['show_map'] })
    expect(agent.validateExternalTools([tool('pick_color'), tool('show_map')]).isValid).toBe(true)
    await expect(agent.invokeStream({ message: { kind: 'message', messageId: 'u', role: 'user', parts: [{ kind: 'text', text: 'hi' }] } }, [tool('pick_color')]))
      .rejects.toBeInstanceOf(ExternalToolValidationError)
  })

  it('any_tool requires nothing', async () => {
    const client = new DistriClient({ baseUrl: BASE_URL, fetchImpl: endUserServer().fetchImpl, accessToken: 'end-user-token', retryAttempts: 0 })
    const agent = Agent.fromCard(card('x', { ...descriptor, any_tool: true, external_tools: [] }) as never, client)
    expect(agent.validateExternalTools([]).isValid).toBe(true)
  })

  it('an older card without the descriptor requires nothing and is a standard agent', () => {
    const client = new DistriClient({ baseUrl: BASE_URL, fetchImpl: endUserServer().fetchImpl, accessToken: 'end-user-token', retryAttempts: 0 })
    const plain = { name: 'old', capabilities: { streaming: true } }
    expect(agentDescriptorFromCard(plain)).toBeNull()
    const agent = Agent.fromCard(plain as never, client)
    expect(agent.validateExternalTools([]).isValid).toBe(true)
    expect(agent.browserStreaming).toBe(false)
  })

  it('end-user path never calls GET /agents/{id}: create, stream, durable check, list', async () => {
    const { fetchImpl, urls } = endUserServer(true)
    const client = new DistriClient({ baseUrl: BASE_URL, fetchImpl, accessToken: 'end-user-token', retryAttempts: 0 })
    const agent = await Agent.create('assistant', client)
    const stream = await agent.invokeStream(
      { message: { kind: 'message', messageId: 'u', role: 'user', parts: [{ kind: 'text', text: 'hi' }] } },
      [tool('pick_color'), tool('show_map')],
    )
    for await (const _frame of stream) { void _frame }
    expect(await agent.supportsDurableRuns()).toBe(true)
    const all = await Agent.list(client)

    expect(all.map((a) => a.name)).toEqual(['assistant', 'researcher'])
    expect(all[1].browserStreaming).toBe(false)
    expect(definitionCalls(urls)).toEqual([])
    // The card is fetched once and reused for the durable-runs answer.
    expect(urls.filter((u) => u.includes('agent-card.json'))).toHaveLength(1)
  })

  it('getDefinition() is the explicit developer call (GET /agents/{id})', async () => {
    const definition = { name: 'assistant', description: 'd', instructions: 'secret prompt', tools: { external: ['pick_color'] } }
    const fetchImpl = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input)
      if (url.endsWith('agent-card.json')) return new Response(JSON.stringify(card('assistant')), { status: 200 })
      if (url === `${BASE_URL}/agents/assistant`) return new Response(JSON.stringify(definition), { status: 200 })
      return new Response('{}', { status: 404 })
    })
    const client = new DistriClient({ baseUrl: BASE_URL, fetchImpl, accessToken: 'end-user-token', retryAttempts: 0 })
    const agent = await Agent.create('assistant', client)
    expect(fetchImpl).toHaveBeenCalledTimes(1)
    expect(await agent.getDefinition()).toMatchObject({ instructions: 'secret prompt' })
    expect(fetchImpl.mock.calls.map(([u]) => String(u))).toContain(`${BASE_URL}/agents/assistant`)
  })

  it('a definition passed in still works (developer surfaces), without fetching', async () => {
    const fetchImpl = vi.fn()
    const client = new DistriClient({ baseUrl: BASE_URL, fetchImpl, accessToken: 'end-user-token', retryAttempts: 0 })
    const def = { name: 'dev', description: 'd', agent_type: 'workflow_agent', tools: { external: ['a', '*'] }, browser_config: { enabled: true } }
    const agent = await Agent.create(def as never, client)
    expect(fetchImpl).not.toHaveBeenCalled()
    expect(agent.agentType).toBe('workflow_agent')
    expect(agent.browserStreaming).toBe(true)
    expect(agent.validateExternalTools([]).isValid).toBe(true) // '*' accepts any
    expect(await agent.getDefinition()).toBe(def)
  })
})
