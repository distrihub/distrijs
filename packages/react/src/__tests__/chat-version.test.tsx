/**
 * Agent versions (spec 2026-11-20-agent-versions V4): `<Chat version>` and
 * `<Assistant version>` pass the version to useAgent; changing it swaps the
 * agent but keeps the chat (its thread).
 */
import { describe, it, expect, vi, afterEach, beforeAll } from 'vitest'
import { render, cleanup, waitFor, act } from '@testing-library/react'
import React from 'react'
import type { ChatInstance } from '../components/Chat'
import { DistriContext } from '../DistriProvider'

const useAgentCalls: Array<{ agentIdOrDef: unknown; version?: unknown; enabled?: boolean }> = []
const loadingVersions = new Set<unknown>()
let lastAgent: unknown = null

async function* emptyStream(): AsyncGenerator<never> {}

const agents = new Map<unknown, unknown>()
function agentFor(version: unknown) {
  if (!agents.has(version)) {
    agents.set(version, {
      name: 'helper',
      version,
      getDefinition: () => ({ name: 'helper' }),
      client: { ensureAccessToken: vi.fn(async () => {}), completeTool: vi.fn(async () => {}) },
      invokeStream: vi.fn(async () => emptyStream()),
    })
  }
  return agents.get(version)
}

vi.mock('../useAgent', () => ({
  useAgent: (opts: { agentIdOrDef: unknown; version?: unknown; enabled?: boolean }) => {
    useAgentCalls.push(opts)
    if (!opts.enabled) return { agent: null, loading: false, error: null }
    // While a new version loads, useAgent keeps the previous agent.
    if (loadingVersions.has(opts.version)) return { agent: lastAgent, loading: true, error: null }
    lastAgent = agentFor(opts.version)
    return { agent: lastAgent, loading: false, error: null }
  },
}))
vi.mock('../components/AuthLoading', () => ({
  AuthLoading: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

import { Chat } from '../components/Chat'
import { Assistant } from '../assistant'

beforeAll(() => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(window.HTMLElement.prototype as any).scrollIntoView = vi.fn()
})

const client = () =>
  ({
    getThread: vi.fn(async () => null),
    listTasks: vi.fn(async () => []),
    getTaskById: vi.fn(async () => null),
    cancelTask: vi.fn(async () => {}),
  }) as never

afterEach(() => {
  cleanup()
  useAgentCalls.length = 0
  loadingVersions.clear()
  agents.clear()
  lastAgent = null
})

describe('<Chat version>', () => {
  it('passes version to useAgent', () => {
    render(
      <DistriContext.Provider value={{ client: client() }}>
        <Chat agentId="helper" version={3} />
      </DistriContext.Provider>,
    )
    expect(useAgentCalls.at(-1)).toMatchObject({ agentIdOrDef: 'helper', version: 3, enabled: true })
  })

  it('changing version swaps the agent and keeps the thread', async () => {
    const instances: ChatInstance[] = []
    const ui = (version: number) => (
      <DistriContext.Provider value={{ client: client() }}>
        <Chat agentId="helper" version={version} onChatInstanceReady={(i) => instances.push(i)} />
      </DistriContext.Provider>
    )
    const { rerender } = render(ui(3))
    await waitFor(() => expect(instances.length).toBeGreaterThan(0))
    await act(async () => { await instances.at(-1)!.sendMessage('one') })
    const v3 = agentFor(3) as { invokeStream: ReturnType<typeof vi.fn> }
    const thread1 = (v3.invokeStream.mock.calls[0][0] as { message: { contextId: string } }).message.contextId

    // v4 is loading: the chat stays mounted on the previous agent.
    loadingVersions.add(4)
    rerender(ui(4))
    expect(useAgentCalls.at(-1)).toMatchObject({ version: 4 })
    loadingVersions.clear()
    rerender(ui(4))

    await act(async () => { await instances.at(-1)!.sendMessage('two') })
    const v4 = agentFor(4) as { invokeStream: ReturnType<typeof vi.fn> }
    await waitFor(() => expect(v4.invokeStream).toHaveBeenCalled())
    const thread2 = (v4.invokeStream.mock.calls[0][0] as { message: { contextId: string } }).message.contextId
    expect(thread2).toBe(thread1)
  })
})

describe('<Assistant version>', () => {
  it('passes version through Chat to useAgent', () => {
    render(
      <DistriContext.Provider value={{ client: client() }}>
        <Assistant agentId="helper" version={2} defaultOpen threadId="t-1" />
      </DistriContext.Provider>,
    )
    expect(useAgentCalls.some((c) => c.agentIdOrDef === 'helper' && c.version === 2)).toBe(true)
  })
})
