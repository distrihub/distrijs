/**
 * useAgent builds the runtime Agent from the A2A card — an end-user token can
 * read it — and never calls GET /agents/{id} (the developer-only definition).
 */
import { describe, it, expect, vi, afterEach } from 'vitest'
import { renderHook, waitFor, cleanup } from '@testing-library/react'
import React from 'react'
import { DistriClient, AGENT_EXTENSION_URI } from '@distri/core'
import { DistriContext } from '../DistriProvider'
import { useAgent } from '../useAgent'

const BASE_URL = 'http://localhost:9999/v1'

describe('useAgent', () => {
  afterEach(() => cleanup())

  it('resolves an id from the card and its agent descriptor', async () => {
    const urls: string[] = []
    const fetchImpl = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input)
      urls.push(url)
      if (url.endsWith('/agents/helper/.well-known/agent-card.json')) {
        return new Response(JSON.stringify({
          name: 'helper',
          description: 'Helps',
          capabilities: {
            streaming: true,
            extensions: [{
              uri: AGENT_EXTENSION_URI,
              params: { agent_type: 'standard_agent', external_tools: ['pick'], any_tool: false, browser_streaming: true },
            }],
          },
        }), { status: 200, headers: { 'Content-Type': 'application/json' } })
      }
      return new Response(JSON.stringify({ error: 'forbidden' }), { status: 403 })
    })
    const client = new DistriClient({ baseUrl: BASE_URL, accessToken: 'end-user', fetchImpl, retryAttempts: 0 })
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <DistriContext.Provider value={{ client, error: null, isLoading: false } as never}>{children}</DistriContext.Provider>
    )

    const { result } = renderHook(() => useAgent({ agentIdOrDef: 'helper' }), { wrapper })

    await waitFor(() => expect(result.current.agent?.name).toBe('helper'))
    expect(result.current.error).toBeNull()
    expect(result.current.agent?.browserStreaming).toBe(true)
    expect(result.current.agent?.validateExternalTools([]).missingTools).toEqual(['pick'])
    expect(urls).toEqual([`${BASE_URL}/agents/helper/.well-known/agent-card.json`])
  })
})
