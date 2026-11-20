/**
 * Agent versions (distri-cloud docs/specs/2026-11-20-agent-versions.md V4):
 * `useAgent({ agentIdOrDef, version })` loads the pinned card; changing the
 * version refetches it and swaps the agent without dropping to null.
 */
import { describe, it, expect, vi, afterEach } from 'vitest'
import { renderHook, waitFor, cleanup } from '@testing-library/react'
import React from 'react'
import { DistriClient, AGENT_EXTENSION_URI } from '@distri/core'
import { DistriContext } from '../DistriProvider'
import { useAgent } from '../useAgent'

const BASE_URL = 'http://localhost:9999/v1'

function server() {
  const urls: string[] = []
  const fetchImpl = vi.fn(async (input: RequestInfo | URL) => {
    const url = String(input)
    urls.push(url)
    const m = url.match(/\/agents\/([^/]+)\/\.well-known\/agent-card\.json$/)
    if (m) {
      const [name, sel] = decodeURIComponent(m[1]).split('@')
      const versionNo = !sel || sel === 'latest' ? 9 : Number(sel)
      return new Response(JSON.stringify({
        name,
        capabilities: {
          streaming: true,
          extensions: [{
            uri: AGENT_EXTENSION_URI,
            params: { agent_type: 'standard_agent', external_tools: [], any_tool: false, browser_streaming: false, version_no: versionNo },
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
  return { urls, wrapper }
}

const card = (ref: string) => `${BASE_URL}/agents/${ref}/.well-known/agent-card.json`

describe('useAgent with a version', () => {
  afterEach(() => cleanup())

  it('loads the pinned card and exposes agent.version', async () => {
    const { urls, wrapper } = server()
    const { result } = renderHook(() => useAgent({ agentIdOrDef: 'helper', version: 3 }), { wrapper })
    await waitFor(() => expect(result.current.agent?.version).toBe(3))
    expect(result.current.agent?.name).toBe('helper')
    expect(result.current.agent?.ref).toBe('helper@3')
    expect(urls).toEqual([card('helper@3')])
  })

  it('an id written as name@N works the same way', async () => {
    const { urls, wrapper } = server()
    const { result } = renderHook(() => useAgent({ agentIdOrDef: 'helper@2' }), { wrapper })
    await waitFor(() => expect(result.current.agent?.version).toBe(2))
    expect(urls).toEqual([card('helper@2')])
  })

  it('changing the version refetches the card and keeps an agent throughout', async () => {
    const { urls, wrapper } = server()
    const seen: Array<number | undefined | null> = []
    const { result, rerender } = renderHook(
      ({ version }: { version?: number | 'latest' }) => {
        const r = useAgent({ agentIdOrDef: 'helper', version })
        seen.push(r.agent ? r.agent.version : null)
        return r
      },
      { wrapper, initialProps: { version: 3 as number | 'latest' | undefined } },
    )
    await waitFor(() => expect(result.current.agent?.version).toBe(3))
    const firstNonNull = seen.findIndex((v) => v !== null)

    rerender({ version: 4 })
    await waitFor(() => expect(result.current.agent?.version).toBe(4))
    rerender({ version: 'latest' })
    await waitFor(() => expect(result.current.agent?.version).toBe(9))
    rerender({ version: undefined })
    await waitFor(() => expect(result.current.agent?.ref).toBe('helper'))

    expect(urls).toEqual([card('helper@3'), card('helper@4'), card('helper@latest'), card('helper')])
    // Once loaded, a version change never drops the agent to null (the chat stays mounted).
    expect(seen.slice(firstNonNull)).not.toContain(null)
  })
})
