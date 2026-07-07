import { describe, it, expect, vi, afterEach } from 'vitest'
import { renderHook, waitFor, cleanup, act } from '@testing-library/react'
import type { Agent, DistriChatMessage, DistriMessage } from '@distri/core'
import { useTaskStreaming } from '../useTaskStreaming'
import { createChatStore, type ChatStore } from '../stores/chatStateStore'

/**
 * Read-only task following hook (Phase 1). A fake Agent supplies the
 * `resubscribe` async generator; we drive it and assert against the store.
 */

const TASK = 't1'

function assistantMsg(id: string, text: string): DistriChatMessage {
  return {
    id,
    role: 'assistant',
    parts: [{ part_type: 'text', data: text }],
    created_at: 1,
    taskId: TASK,
  } as unknown as DistriChatMessage
}

function userMsg(id: string, text: string): DistriChatMessage {
  return {
    id,
    role: 'user',
    parts: [{ part_type: 'text', data: text }],
    created_at: 0,
    taskId: TASK,
  } as unknown as DistriChatMessage
}

const evt = (type: string, data: Record<string, unknown> = {}): DistriChatMessage =>
  ({ type, taskId: TASK, data } as unknown as DistriChatMessage)

// A four-event text stream that renders as a single assistant message "hello".
const textStreamLog = (): DistriChatMessage[] => [
  evt('text_message_start', { message_id: 'm1', role: 'assistant' }),
  evt('text_message_content', { message_id: 'm1', delta: 'hel' }),
  evt('text_message_content', { message_id: 'm1', delta: 'lo' }),
  evt('text_message_end', { message_id: 'm1' }),
  evt('run_finished', { taskId: TASK }),
]

function makeAgent(logFactory: () => DistriChatMessage[]) {
  const resubscribe = vi.fn(async function* (_taskId: string) {
    for (const e of logFactory()) yield e
  })
  return { resubscribe } as unknown as Agent
}

function deferred<T = void>() {
  let resolve!: (v: T) => void
  const promise = new Promise<T>((r) => { resolve = r })
  return { promise, resolve }
}

function assistantText(messages: DistriChatMessage[]): string[] {
  return messages
    .filter((m) => (m as DistriMessage).role === 'assistant')
    .map((m) => ((m as DistriMessage).parts.find((p) => p.part_type === 'text') as { data?: string } | undefined)?.data ?? '')
}

afterEach(() => cleanup())

describe('useTaskStreaming', () => {
  it('seeds persisted history then appends the streamed tail', async () => {
    const agent = makeAgent(() => [assistantMsg('a1', 'streamed reply'), evt('run_finished', { taskId: TASK })])
    const initialMessages = [userMsg('u1', 'the original question')]

    const { result } = renderHook(() =>
      useTaskStreaming({ agent, taskId: TASK, initialMessages }),
    )

    await waitFor(() => expect(result.current.isTerminal).toBe(true))

    // History first, streamed tail after.
    expect(result.current.messages[0]).toMatchObject({ id: 'u1', role: 'user' })
    expect(assistantText(result.current.messages)).toContain('streamed reply')
  })

  it('sets isTerminal when the followed task finishes', async () => {
    const agent = makeAgent(() => [evt('run_started', { taskId: TASK }), evt('run_finished', { taskId: TASK })])

    const { result } = renderHook(() => useTaskStreaming({ agent, taskId: TASK }))

    await waitFor(() => expect(result.current.isTerminal).toBe(true))
    expect(result.current.isStreaming).toBe(false)
  })

  it('clears and replays on reconnect — text deltas are not doubled', async () => {
    const agent = makeAgent(textStreamLog)
    const store: ChatStore = createChatStore()

    const { result } = renderHook(() => useTaskStreaming({ agent, taskId: TASK, store }))
    await waitFor(() => expect(result.current.isTerminal).toBe(true))
    expect(assistantText(store.getState().messages)).toEqual(['hello'])

    act(() => result.current.reconnect())

    await waitFor(() => expect((agent.resubscribe as ReturnType<typeof vi.fn>).mock.calls.length).toBe(2))
    await waitFor(() => expect(result.current.isTerminal).toBe(true))

    // Exactly one assistant message, text still "hello" (not "hellohello").
    expect(assistantText(store.getState().messages)).toEqual(['hello'])
  })

  it('stops processing events after unmount (cooperative abort)', async () => {
    const gate = deferred()
    const resubscribe = vi.fn(async function* (_taskId: string) {
      yield evt('run_started', { taskId: TASK })
      await gate.promise
      yield assistantMsg('late', 'should be ignored')
    })
    const agent = { resubscribe } as unknown as Agent
    const store: ChatStore = createChatStore()

    const { unmount } = renderHook(() => useTaskStreaming({ agent, taskId: TASK, store }))

    await waitFor(() => expect(store.getState().currentTaskId).toBe(TASK))

    unmount()
    // Release the blocked generator only after unmount; the loop must break
    // on the aborted signal before processing the late event.
    await act(async () => { gate.resolve(); await Promise.resolve() })

    expect(assistantText(store.getState().messages)).not.toContain('should be ignored')
  })

  it('does not connect when disabled or taskId is null', async () => {
    const agent = makeAgent(() => [evt('run_finished', { taskId: TASK })])

    const { rerender } = renderHook(
      ({ enabled }: { enabled: boolean }) => useTaskStreaming({ agent, taskId: TASK, enabled }),
      { initialProps: { enabled: false } },
    )
    await Promise.resolve()
    expect(agent.resubscribe as ReturnType<typeof vi.fn>).not.toHaveBeenCalled()

    rerender({ enabled: true })
    await waitFor(() => expect(agent.resubscribe as ReturnType<typeof vi.fn>).toHaveBeenCalledTimes(1))
  })
})
