import { describe, it, expect, vi, afterEach } from 'vitest'
import React from 'react'
import { renderHook, waitFor, cleanup, act } from '@testing-library/react'
import type { TaskSummary } from '@distri/core'
import { useBackgroundTasks } from '../useBackgroundTasks'
import { createChatStore, ChatStoreContext, type ChatStore } from '../stores/chatStateStore'
import { DistriContext } from '../DistriProvider'

/**
 * Tests for the background task-monitor hook. Follows the style of
 * chatStateStore-task-tree.test.ts: a fresh store per test, plain objects
 * for wire payloads, and assertions against store state.
 *
 * The DistriClient is mocked — only `listTasks` / `cancelTask` are used.
 */

const ROOT = 'task-root-aaaaaaaa'
const CHILD1 = 'task-child1-bbbbbb'
const CHILD2 = 'task-child2-cccccc'

function summary(overrides: Partial<TaskSummary> = {}): TaskSummary {
  return {
    id: ROOT,
    thread_id: 'thread-1',
    parent_task_id: null,
    status: 'running',
    created_at: 1000,
    updated_at: 2000,
    preview: null,
    last_event_at: null,
    ...overrides,
  }
}

interface MockClient {
  listTasks: ReturnType<typeof vi.fn>
  cancelTask: ReturnType<typeof vi.fn>
}

function makeClient(responses: TaskSummary[] | (() => TaskSummary[])): MockClient {
  const resolve = typeof responses === 'function' ? responses : () => responses
  return {
    listTasks: vi.fn(async () => resolve()),
    cancelTask: vi.fn(async () => undefined),
  }
}

function makeWrapper(store: ChatStore, client: MockClient) {
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(
      DistriContext.Provider,
      { value: { client: client as never, error: null, isLoading: false } },
      React.createElement(ChatStoreContext.Provider, { value: store }, children),
    )
}

afterEach(() => cleanup())

describe('useBackgroundTasks', () => {
  it('initial fetch populates the store with mapped statuses, tree wiring, and metadata', async () => {
    const store = createChatStore()
    const client = makeClient([
      summary({ id: ROOT, status: 'running' }),
      summary({
        id: CHILD1,
        parent_task_id: ROOT,
        status: 'completed',
        preview: 'rendered scene 2',
        last_event_at: 3000,
      }),
      summary({ id: CHILD2, parent_task_id: ROOT, status: 'canceled' }),
    ])

    const { result } = renderHook(
      () => useBackgroundTasks('thread-1', { pollMs: 60_000 }),
      { wrapper: makeWrapper(store, client) },
    )

    await waitFor(() => expect(result.current.tasks).toHaveLength(3))

    expect(client.listTasks).toHaveBeenCalledWith({ threadId: 'thread-1', parentTaskId: undefined })

    const root = store.getState().tasks.get(ROOT)!
    expect(root.status).toBe('running')
    expect(root.parentTaskId).toBeUndefined()
    expect(root.childTaskIds).toEqual([CHILD1, CHILD2])
    expect(root.startTime).toBe(1000)

    const child1 = store.getState().tasks.get(CHILD1)!
    expect(child1.parentTaskId).toBe(ROOT)
    expect(child1.status).toBe('completed')
    expect(child1.endTime).toBe(3000) // terminal → last_event_at
    expect(child1.metadata).toMatchObject({
      preview: 'rendered scene 2',
      last_event_at: 3000,
      remote_status: 'completed',
    })

    // canceled has no TaskState equivalent → failed, raw status preserved.
    const child2 = store.getState().tasks.get(CHILD2)!
    expect(child2.status).toBe('failed')
    expect(child2.metadata).toMatchObject({ remote_status: 'canceled' })
  })

  it('maps input_required to running (non-terminal) and keeps polling on it', async () => {
    const store = createChatStore()
    const client = makeClient([summary({ id: ROOT, status: 'input_required' })])

    const { result } = renderHook(
      () => useBackgroundTasks('thread-1', { pollMs: 20 }),
      { wrapper: makeWrapper(store, client) },
    )

    await waitFor(() => expect(result.current.tasks).toHaveLength(1))
    expect(store.getState().tasks.get(ROOT)!.status).toBe('running')

    // input_required is non-terminal, so the poll loop must keep going.
    await waitFor(() => expect(client.listTasks.mock.calls.length).toBeGreaterThanOrEqual(3))
  })

  it('stops polling once every listed task is terminal', async () => {
    const store = createChatStore()
    const client = makeClient([
      summary({ id: ROOT, status: 'completed' }),
      summary({ id: CHILD1, parent_task_id: ROOT, status: 'failed' }),
    ])

    const { result } = renderHook(
      () => useBackgroundTasks('thread-1', { pollMs: 20 }),
      { wrapper: makeWrapper(store, client) },
    )

    await waitFor(() => expect(result.current.tasks).toHaveLength(2))
    expect(client.listTasks).toHaveBeenCalledTimes(1)

    // Give the (stopped) loop several poll intervals — no further fetches.
    await act(() => new Promise((r) => setTimeout(r, 120)))
    expect(client.listTasks).toHaveBeenCalledTimes(1)
  })

  it('refresh() re-fetches after polling has stopped', async () => {
    const store = createChatStore()
    const client = makeClient([summary({ id: ROOT, status: 'completed' })])

    const { result } = renderHook(
      () => useBackgroundTasks('thread-1', { pollMs: 20 }),
      { wrapper: makeWrapper(store, client) },
    )

    await waitFor(() => expect(result.current.tasks).toHaveLength(1))
    expect(client.listTasks).toHaveBeenCalledTimes(1)

    await act(() => result.current.refresh())
    expect(client.listTasks).toHaveBeenCalledTimes(2)
  })

  it('hydrates a placeholder parent for parentTaskId-scoped listings (root excluded)', async () => {
    const store = createChatStore()
    const client = makeClient([
      summary({ id: CHILD1, parent_task_id: ROOT, status: 'running' }),
    ])

    const { result } = renderHook(
      () => useBackgroundTasks('thread-1', { parentTaskId: ROOT, pollMs: 60_000 }),
      { wrapper: makeWrapper(store, client) },
    )

    await waitFor(() => expect(result.current.tasks).toHaveLength(1))
    expect(client.listTasks).toHaveBeenCalledWith({ threadId: 'thread-1', parentTaskId: ROOT })

    // The scoped listing excludes ROOT, but SubTaskTree needs a root to
    // anchor at — the merge hydrates a placeholder.
    const root = store.getState().tasks.get(ROOT)!
    expect(root).toBeTruthy()
    expect(root.childTaskIds).toEqual([CHILD1])
    expect(store.getState().getTaskTree(ROOT).map((t) => t.id)).toEqual([ROOT, CHILD1])
  })

  it('merging is idempotent and preserves event-path state (title, children, startTime)', async () => {
    const store = createChatStore()
    // Seed the store via the event path first.
    store.getState().processMessage(
      { type: 'run_started', taskId: ROOT, data: { taskId: ROOT } } as never,
      true,
    )
    store.getState().updateTask(ROOT, { title: 'Sub-agent: planner', startTime: 42 })

    const client = makeClient([
      summary({ id: ROOT, status: 'completed', last_event_at: 5000 }),
      summary({ id: CHILD1, parent_task_id: ROOT, status: 'running' }),
    ])

    const { result } = renderHook(
      () => useBackgroundTasks('thread-1', { pollMs: 20 }),
      { wrapper: makeWrapper(store, client) },
    )

    // Wait for at least two polls so the merge runs more than once.
    await waitFor(() => expect(client.listTasks.mock.calls.length).toBeGreaterThanOrEqual(2))
    expect(result.current.tasks).toHaveLength(2)

    const root = store.getState().tasks.get(ROOT)!
    expect(root.title).toBe('Sub-agent: planner') // event-path title preserved
    expect(root.startTime).toBe(42)               // event-path startTime preserved
    expect(root.status).toBe('completed')         // poll status applied
    expect(root.childTaskIds.filter((id) => id === CHILD1)).toHaveLength(1) // no dupes
  })

  it('cancel() delegates to client.cancelTask(agentId, taskId) and refreshes', async () => {
    const store = createChatStore()
    const client = makeClient([summary({ id: ROOT, status: 'completed' })])

    const { result } = renderHook(
      () => useBackgroundTasks('thread-1', { pollMs: 60_000, agentId: 'blink_video' }),
      { wrapper: makeWrapper(store, client) },
    )
    await waitFor(() => expect(result.current.tasks).toHaveLength(1))

    await act(() => result.current.cancel(ROOT))
    expect(client.cancelTask).toHaveBeenCalledWith('blink_video', ROOT)
    expect(client.listTasks.mock.calls.length).toBeGreaterThanOrEqual(2) // refreshed after cancel
  })

  it('cancel() without an agentId rejects with a clear error', async () => {
    const store = createChatStore()
    const client = makeClient([summary({ id: ROOT, status: 'completed' })])

    const { result } = renderHook(
      () => useBackgroundTasks('thread-1', { pollMs: 60_000 }),
      { wrapper: makeWrapper(store, client) },
    )
    await waitFor(() => expect(result.current.tasks).toHaveLength(1))

    await expect(result.current.cancel(ROOT)).rejects.toThrow(/agentId/)
    expect(client.cancelTask).not.toHaveBeenCalled()
  })

  it('does nothing while disabled, fetches once enabled', async () => {
    const store = createChatStore()
    const client = makeClient([summary({ id: ROOT, status: 'completed' })])

    const { result, rerender } = renderHook(
      ({ enabled }: { enabled: boolean }) =>
        useBackgroundTasks('thread-1', { pollMs: 60_000, enabled }),
      { wrapper: makeWrapper(store, client), initialProps: { enabled: false } },
    )

    await act(() => new Promise((r) => setTimeout(r, 30)))
    expect(client.listTasks).not.toHaveBeenCalled()
    expect(result.current.tasks).toHaveLength(0)

    rerender({ enabled: true })
    await waitFor(() => expect(result.current.tasks).toHaveLength(1))
    expect(client.listTasks).toHaveBeenCalledTimes(1)
  })
})
