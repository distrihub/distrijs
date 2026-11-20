/**
 * G4 (distri-cloud docs/specs/2026-11-20-a2a-wire-contract.md): useChat does
 * not ask the server about a thread id the client minted until its first send.
 */
import { describe, it, expect, vi, afterEach } from 'vitest'
import { act, cleanup, renderHook, waitFor } from '@testing-library/react'
import { useChat } from '../useChat'

afterEach(() => cleanup())

async function* streamOf(events: unknown[]) {
  for (const e of events) yield e
}

function agentStub() {
  return {
    name: 'shop_helper',
    client: { ensureAccessToken: vi.fn(async () => {}), getThread: vi.fn(), getThreadMessages: vi.fn() },
    supportsDurableRuns: vi.fn(async () => true),
    listPendingCalls: vi.fn(async () => []),
    getThreadMessages: vi.fn(async () => []),
    invokeStream: vi.fn(async () => streamOf([
      { type: 'run_started', taskId: 'task-1', data: { taskId: 'task-1' } },
      { type: 'run_finished', taskId: 'task-1', data: { taskId: 'task-1' } },
    ])),
  }
}

const flush = () => act(async () => { await new Promise((r) => setTimeout(r, 20)) })

describe('useChat and threadKnown (G4)', () => {
  it('a new thread (threadKnown: false) makes no pending-calls, thread or conversation request before the first send', async () => {
    const agent = agentStub()
    renderHook(() => useChat({ threadId: 'th-new', agent: agent as never, threadKnown: false }))
    await flush()
    expect(agent.listPendingCalls).not.toHaveBeenCalled()
    expect(agent.client.getThread).not.toHaveBeenCalled()
    expect(agent.client.getThreadMessages).not.toHaveBeenCalled()
    expect(agent.getThreadMessages).not.toHaveBeenCalled()
  })

  it('after the first send the new thread is known and recovery may ask', async () => {
    const agent = agentStub()
    const { result, rerender } = renderHook(
      ({ tools }: { tools: unknown[] }) => useChat({ threadId: 'th-new', agent: agent as never, externalTools: tools as never, threadKnown: false }),
      { initialProps: { tools: [] as unknown[] } },
    )
    await act(async () => { await result.current.sendMessage('hello') })
    expect(agent.invokeStream).toHaveBeenCalledTimes(1)
    // A change that re-runs recovery (the tool set) now lists the thread's calls.
    rerender({ tools: [{ type: 'function', name: 'book_table', description: '', parameters: {}, handler: vi.fn() }] })
    await waitFor(() => expect(agent.listPendingCalls).toHaveBeenCalledWith({ threadId: 'th-new' }))
  })

  it('by default a thread is known (reopened with no initialMessages): recovery asks', async () => {
    const agent = agentStub()
    renderHook(() => useChat({ threadId: 'th-old', agent: agent as never }))
    await waitFor(() => expect(agent.listPendingCalls).toHaveBeenCalledWith({ threadId: 'th-old' }))
  })

  it('a new thread the caller later marks known (threadKnown false -> true) is recovered', async () => {
    const agent = agentStub()
    const { rerender } = renderHook(
      ({ known }: { known: boolean }) => useChat({ threadId: 'th-x', agent: agent as never, threadKnown: known }),
      { initialProps: { known: false } },
    )
    await flush()
    expect(agent.listPendingCalls).not.toHaveBeenCalled()
    rerender({ known: true })
    await waitFor(() => expect(agent.listPendingCalls).toHaveBeenCalledWith({ threadId: 'th-x' }))
  })
})
