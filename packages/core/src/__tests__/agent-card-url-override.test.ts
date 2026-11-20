import { describe, it, expect, vi } from 'vitest'
import { DistriClient } from '../distri-client'
import { Agent } from '../agent'

/**
 * The server advertises its own idea of where it lives in the agent card
 * (`supportedInterfaces[0].url`, e.g. an internal host). When the client
 * reaches the server through a custom base URL (proxy, tunnel, different
 * hostname), A2A calls must still go to `${baseUrl}/agents/{id}` — never to
 * the card's URL. Talking to an agent needs no card fetch at all.
 */

const BASE_URL = 'https://proxy.example.com/custom/v1'
const INTERNAL_URL = 'http://internal-host:8080/v1/agents/test-agent'

function makeFetch() {
  return vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input)
    if (url.includes('.well-known/agent-card.json')) {
      return new Response(JSON.stringify({
        name: 'test-agent',
        version: '1.0',
        supportedInterfaces: [{ url: INTERNAL_URL, protocolBinding: 'JSONRPC', protocolVersion: '1.0' }],
        capabilities: { streaming: true },
      }), { status: 200, headers: { 'Content-Type': 'application/json' } })
    }
    const body = init?.body ? JSON.parse(init.body as string) : {}
    return new Response(JSON.stringify({
      jsonrpc: '2.0',
      id: body.id ?? 1,
      result: { message: { messageId: 'm1', role: 'ROLE_AGENT', parts: [{ text: 'ok' }] } },
    }), { status: 200, headers: { 'Content-Type': 'application/json' } })
  })
}

const message = { kind: 'message' as const, messageId: 'u1', role: 'user' as const, parts: [{ kind: 'text' as const, text: 'hi' }] }

describe('DistriClient A2A endpoint', () => {
  it('sends JSON-RPC to the configured baseUrl, ignoring the agent card url', async () => {
    const fetchImpl = makeFetch()
    const client = new DistriClient({ baseUrl: BASE_URL, accessToken: 'test-token', fetchImpl, retryAttempts: 0 })

    const agent = await Agent.create('test-agent', client)
    await agent.invoke({ message })

    const urls = fetchImpl.mock.calls.map(([input]) => String(input))
    expect(urls).toEqual([`${BASE_URL}/agents/test-agent/.well-known/agent-card.json`, `${BASE_URL}/agents/test-agent`])
    expect(urls.some((u) => u.startsWith('http://internal-host'))).toBe(false)
  })

  it('fetches the agent card once per agent across Agent.create and the durable-runs check', async () => {
    const fetchImpl = makeFetch()
    const client = new DistriClient({ baseUrl: BASE_URL, accessToken: 'test-token', fetchImpl, retryAttempts: 0 })

    const [agent] = await Promise.all([Agent.create('test-agent', client), client.supportsDurableRuns('test-agent')])
    await agent.supportsDurableRuns()
    await client.sendMessage('test-agent', { message })

    const cardFetches = fetchImpl.mock.calls.filter(([input]) => String(input).includes('.well-known/agent-card.json'))
    expect(cardFetches).toHaveLength(1)
  })
})
