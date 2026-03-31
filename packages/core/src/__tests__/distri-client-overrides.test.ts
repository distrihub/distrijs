import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { DistriClient } from '../distri-client'

/**
 * Tests for distri_request platform tool injection.
 * The DistriClient should automatically inject a `distri_request` dynamic tool
 * into every outgoing message's metadata.definition_overrides.dynamic_tools.
 */

let capturedBodies: Record<string, unknown>[] = []
const originalFetch = globalThis.fetch

beforeEach(() => {
  capturedBodies = []
  // Mock fetch to capture request bodies, handling both agent card and RPC calls
  globalThis.fetch = vi.fn(async (url: RequestInfo | URL, init?: RequestInit) => {
    const urlStr = typeof url === 'string' ? url : url.toString()

    // Agent card fetch (GET /.well-known/agent.json)
    if (urlStr.includes('.well-known/agent.json') || (!init?.method || init.method === 'GET')) {
      return new Response(JSON.stringify({
        name: 'test-agent',
        url: urlStr.replace('/.well-known/agent.json', ''),
        version: '1.0',
        capabilities: { streaming: true },
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // RPC call (POST) - capture the body
    if (init?.body) {
      try {
        capturedBodies.push(JSON.parse(init.body as string))
      } catch { /* ignore */ }
    }

    return new Response(JSON.stringify({
      jsonrpc: '2.0',
      id: '1',
      result: {
        kind: 'message',
        messageId: 'msg-1',
        role: 'agent',
        parts: [{ kind: 'text', text: 'ok' }],
      },
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  }) as typeof fetch
})

afterEach(() => {
  globalThis.fetch = originalFetch
})

/** Extract dynamic_tools from the last captured JSON-RPC request body */
function getInjectedTools(): Array<Record<string, unknown>> {
  // Find the sendMessage/sendStream RPC call (not the agent card fetch)
  const rpcBody = capturedBodies.find(b =>
    b.method === 'message/send' || b.method === 'message/stream'
  )
  if (!rpcBody) return []
  const params = rpcBody.params as Record<string, unknown> | undefined
  if (!params) return []
  const meta = params.metadata as Record<string, unknown> | undefined
  const overrides = meta?.definition_overrides as Record<string, unknown> | undefined
  return (overrides?.dynamic_tools ?? []) as Array<Record<string, unknown>>
}

describe('DistriClient distri_request injection', () => {
  it('injects distri_request with api key auth', async () => {
    const client = new DistriClient({
      baseUrl: 'http://localhost:1341/v1',
      headers: { 'x-api-key': 'dak_test123' },
      workspaceId: 'ws-abc',
    })

    try {
      await client.sendMessage('test-agent', {
        message: {
          kind: 'message',
          messageId: 'test-msg',
          role: 'user',
          parts: [{ kind: 'text', text: 'hello' }],
        },
      })
    } catch { /* network errors ok */ }

    const tools = getInjectedTools()
    expect(tools).toHaveLength(1)
    expect(tools[0].name).toBe('distri_request')
    // Wire format must use "type" (matches Rust serde rename), NOT "factory_type"
    expect(tools[0].type).toBe('http')
    expect(tools[0]).not.toHaveProperty('factory_type')

    const config = tools[0].config as Record<string, unknown>
    expect(config.base_url).toBe('http://localhost:1341/v1')

    const headers = config.headers as Record<string, string>
    expect(headers['x-api-key']).toBe('dak_test123')
    expect(headers['x-workspace-id']).toBe('ws-abc')
    expect(headers).not.toHaveProperty('Authorization')
  })

  it('injects distri_request with bearer token auth', async () => {
    const client = new DistriClient({
      baseUrl: 'https://api.distri.dev/v1',
      headers: { Authorization: 'Bearer jwt-token-xyz' },
      workspaceId: 'ws-456',
    })

    try {
      await client.sendMessage('test-agent', {
        message: {
          kind: 'message',
          messageId: 'msg-2',
          role: 'user',
          parts: [{ kind: 'text', text: 'test' }],
        },
      })
    } catch {}

    const tools = getInjectedTools()
    expect(tools).toHaveLength(1)

    const config = tools[0].config as Record<string, unknown>
    expect(config.base_url).toBe('https://api.distri.dev/v1')

    const headers = config.headers as Record<string, string>
    expect(headers['Authorization']).toBe('Bearer jwt-token-xyz')
    expect(headers['x-workspace-id']).toBe('ws-456')
    expect(headers).not.toHaveProperty('x-api-key')
  })

  it('does not duplicate if distri_request already present', async () => {
    const client = new DistriClient({
      baseUrl: 'http://localhost:1341/v1',
      headers: { 'x-api-key': 'dak_test' },
    })

    try {
      await client.sendMessage('test-agent', {
        message: {
          kind: 'message',
          messageId: 'msg-3',
          role: 'user',
          parts: [{ kind: 'text', text: 'test' }],
        },
        metadata: {
          definition_overrides: {
            dynamic_tools: [
              {
                name: 'distri_request',
                type: 'http',
                config: { base_url: 'http://custom:9999', headers: {} },
              },
            ],
          },
        },
      })
    } catch {}

    const tools = getInjectedTools()
    expect(tools).toHaveLength(1)
    const config = tools[0].config as Record<string, unknown>
    expect(config.base_url).toBe('http://custom:9999')
  })

  it('preserves existing definition_overrides fields', async () => {
    const client = new DistriClient({
      baseUrl: 'http://localhost:1341/v1',
      headers: { 'x-api-key': 'dak_test' },
    })

    try {
      await client.sendMessage('test-agent', {
        message: {
          kind: 'message',
          messageId: 'msg-4',
          role: 'user',
          parts: [{ kind: 'text', text: 'test' }],
        },
        metadata: {
          definition_overrides: {
            model: 'gpt-4o',
            use_browser: true,
          },
          some_other_field: 'keep me',
        },
      })
    } catch {}

    const rpcBody = capturedBodies.find(b => b.method === 'message/send')
    const params = rpcBody?.params as Record<string, unknown>
    const meta = params?.metadata as Record<string, unknown>
    expect(meta?.some_other_field).toBe('keep me')

    const overrides = meta?.definition_overrides as Record<string, unknown>
    expect(overrides?.model).toBe('gpt-4o')
    expect(overrides?.use_browser).toBe(true)
    expect((overrides?.dynamic_tools as unknown[])?.length).toBe(1)
  })

  it('works with no metadata at all', async () => {
    const client = new DistriClient({
      baseUrl: 'http://localhost:1341/v1',
      headers: { 'x-api-key': 'dak_test' },
      workspaceId: 'ws-1',
    })

    try {
      await client.sendMessage('test-agent', {
        message: {
          kind: 'message',
          messageId: 'msg-5',
          role: 'user',
          parts: [{ kind: 'text', text: 'test' }],
        },
      })
    } catch {}

    const tools = getInjectedTools()
    expect(tools).toHaveLength(1)
    expect(tools[0].name).toBe('distri_request')
  })
})
