import { describe, expect, it, vi } from 'vitest'
import { DistriClient } from '../distri-client'
import { Agent } from '../agent'
import { AGENT_EXTENSION_URI, agentRef, agentRefPath, parseAgentRef } from '../a2a'

/**
 * Running a saved version of an agent (spec 2026-11-20-agent-versions V1, V4):
 * an agent reference is `name` or `name@N`; every per-agent URL (card,
 * JSON-RPC, complete-tool) uses the encoded reference — `/` as %2F, `@` raw.
 */

const BASE_URL = 'http://localhost:9999/v1'

const card = (name: string, versionNo: number) => ({
  name,
  description: `${name} agent`,
  version: '0.2.0',
  supportedInterfaces: [{ url: `http://internal/v1/agents/${name}@${versionNo}`, protocolBinding: 'JSONRPC', protocolVersion: '1.0' }],
  capabilities: {
    streaming: true,
    extensions: [{
      uri: AGENT_EXTENSION_URI,
      required: false,
      params: { agent_type: 'standard_agent', external_tools: [], any_tool: false, browser_streaming: false, version_no: versionNo },
    }],
  },
  skills: [],
})

/** A server with versions 1..5 (5 is latest) of every agent. */
function versionedServer() {
  const urls: string[] = []
  const fetchImpl = vi.fn(async (input: RequestInfo | URL, init: RequestInit = {}) => {
    const url = String(input)
    const method = init.method ?? 'GET'
    urls.push(`${method} ${url}`)
    const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })
    const m = url.match(/\/agents\/([^/]+)\/\.well-known\/agent-card\.json$/)
    if (m) {
      const [rawName, sel] = decodeURIComponent(m[1]).split('@')
      const versionNo = !sel || sel === 'latest' ? 5 : Number(sel)
      return json(card(rawName, versionNo))
    }
    if (method === 'POST' && url.endsWith('/complete-tool')) return json({ status: 'completed' })
    if (method === 'POST') {
      return json({ jsonrpc: '2.0', id: 1, result: { message: { messageId: 'm1', role: 'ROLE_AGENT', parts: [{ text: 'ok' }] } } })
    }
    return json({}, 404)
  })
  const client = new DistriClient({ baseUrl: BASE_URL, fetchImpl, accessToken: 't', retryAttempts: 0 })
  return { client, urls }
}

describe('agentRef / parseAgentRef', () => {
  it('prints a reference', () => {
    expect(agentRef('a')).toBe('a')
    expect(agentRef('a', 3)).toBe('a@3')
    expect(agentRef('a', 'latest')).toBe('a@latest')
    expect(agentRef('pkg/a', 2)).toBe('pkg/a@2')
  })

  it('parses and round-trips', () => {
    expect(parseAgentRef('a')).toEqual({ name: 'a' })
    expect(parseAgentRef('a@3')).toEqual({ name: 'a', version: 3 })
    expect(parseAgentRef('a@latest')).toEqual({ name: 'a', version: 'latest' })
    expect(parseAgentRef('pkg/a@2')).toEqual({ name: 'pkg/a', version: 2 })
    for (const r of ['a', 'a@3', 'a@latest', 'pkg/a@2']) {
      const { name, version } = parseAgentRef(r)
      expect(agentRef(name, version)).toBe(r)
    }
  })

  it('rejects malformed references and versions', () => {
    for (const bad of ['a@', 'a@x', 'a@0', '@3', 'a@1.5', 'a@-1', '']) {
      expect(() => parseAgentRef(bad), bad).toThrow()
    }
    expect(() => agentRef('a', 0)).toThrow()
    expect(() => agentRef('a', 1.5)).toThrow()
    expect(() => agentRef('a@2', 3)).toThrow()
  })

  it('encodes a reference as a path segment: / as %2F, @ raw', () => {
    expect(agentRefPath('a')).toBe('a')
    expect(agentRefPath('a@3')).toBe('a@3')
    expect(agentRefPath('a@latest')).toBe('a@latest')
    expect(agentRefPath('pkg/a@2')).toBe('pkg%2Fa@2')
    expect(agentRefPath('pkg/a')).toBe('pkg%2Fa')
  })
})

describe('Agent.create with a version', () => {
  it('version: 3 uses the pinned card, endpoint and complete-tool', async () => {
    const { client, urls } = versionedServer()
    const agent = await Agent.create('assistant', client, { version: 3 })

    expect(urls).toEqual([`GET ${BASE_URL}/agents/assistant@3/.well-known/agent-card.json`])
    expect(agent.name).toBe('assistant')
    expect(agent.id).toBe('assistant')
    expect(agent.ref).toBe('assistant@3')
    expect(agent.version).toBe(3)

    await agent.invoke({ message: { kind: 'message', messageId: 'u1', role: 'user', parts: [{ kind: 'text', text: 'hi' }] } } as never)
    expect(urls[1]).toBe(`POST ${BASE_URL}/agents/assistant@3`)

    await agent.completeTool({ tool_call_id: 'c1', tool_name: 't', parts: [] } as never)
    expect(urls[2]).toBe(`POST ${BASE_URL}/agents/assistant@3/complete-tool`)
  })

  it("version: 'latest' addresses name@latest", async () => {
    const { client, urls } = versionedServer()
    const agent = await Agent.create('assistant', client, { version: 'latest' })
    expect(urls).toEqual([`GET ${BASE_URL}/agents/assistant@latest/.well-known/agent-card.json`])
    expect(agent.ref).toBe('assistant@latest')
    expect(agent.version).toBe(5)
  })

  it('no version addresses the bare name; agent.version is the latest version_no', async () => {
    const { client, urls } = versionedServer()
    const agent = await Agent.create('assistant', client)
    expect(urls).toEqual([`GET ${BASE_URL}/agents/assistant/.well-known/agent-card.json`])
    expect(agent.ref).toBe('assistant')
    expect(agent.version).toBe(5)
  })

  it('a package name with a version encodes / as %2F and keeps @', async () => {
    const { client, urls } = versionedServer()
    const agent = await Agent.create('pkg/a', client, { version: 2 })
    expect(urls).toEqual([`GET ${BASE_URL}/agents/pkg%2Fa@2/.well-known/agent-card.json`])
    expect(agent.name).toBe('pkg/a')
    expect(agent.version).toBe(2)

    await agent.invoke({ message: { kind: 'message', messageId: 'u1', role: 'user', parts: [{ kind: 'text', text: 'hi' }] } } as never)
    expect(urls[1]).toBe(`POST ${BASE_URL}/agents/pkg%2Fa@2`)
  })

  it('an id written as name@N works the same way', async () => {
    const { client, urls } = versionedServer()
    const agent = await Agent.create('assistant@3', client)
    expect(urls).toEqual([`GET ${BASE_URL}/agents/assistant@3/.well-known/agent-card.json`])
    expect(agent.name).toBe('assistant')
    expect(agent.ref).toBe('assistant@3')
    expect(agent.version).toBe(3)
  })

  it('an explicit version option wins over one written in the id', async () => {
    const { client, urls } = versionedServer()
    const agent = await Agent.create('assistant@3', client, { version: 4 })
    expect(urls).toEqual([`GET ${BASE_URL}/agents/assistant@4/.well-known/agent-card.json`])
    expect(agent.version).toBe(4)
  })

  it('caches cards per reference, not per name', async () => {
    const { client, urls } = versionedServer()
    const v3 = await Agent.create('assistant', client, { version: 3 })
    const v3again = await Agent.create('assistant@3', client)
    const latest = await Agent.create('assistant', client)
    const v4 = await Agent.create('assistant', client, { version: 4 })

    expect(v3.version).toBe(3)
    expect(v3again.version).toBe(3)
    expect(latest.version).toBe(5)
    expect(v4.version).toBe(4)
    expect(urls).toEqual([
      `GET ${BASE_URL}/agents/assistant@3/.well-known/agent-card.json`,
      `GET ${BASE_URL}/agents/assistant/.well-known/agent-card.json`,
      `GET ${BASE_URL}/agents/assistant@4/.well-known/agent-card.json`,
    ])
  })

  it('agent.version is undefined when the card carries no version_no', () => {
    const { client } = versionedServer()
    const c = card('x', 1)
    ;(c.capabilities.extensions[0].params as Record<string, unknown>).version_no = undefined
    const agent = Agent.fromCard(c as never, client)
    expect(agent.version).toBeUndefined()
  })
})
