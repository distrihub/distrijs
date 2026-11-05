import { describe, it, expect, afterEach } from 'vitest'
import React from 'react'
import { renderHook, cleanup, act } from '@testing-library/react'
import type { DistriEvent } from '@distri/core'
import { ChatStoreContext, createChatStore } from '../stores/chatStateStore'
import { useAgentList } from '../hooks/useAgentList'

afterEach(() => cleanup())

const ev = (e: unknown) => e as DistriEvent

describe('useAgentList', () => {
  it('follows the store: a helper appears running, then finishes', () => {
    const store = createChatStore()
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <ChatStoreContext.Provider value={store}>{children}</ChatStoreContext.Provider>
    )
    const { result } = renderHook(() => useAgentList({ helpersOnly: true }), { wrapper })
    expect(result.current.rows).toEqual([])

    act(() => {
      store.getState().processMessage(ev({ type: 'run_started', taskId: 'lead', data: { taskId: 'lead' } }), true)
      store.getState().processMessage(ev({
        type: 'run_started', taskId: 'a', parentTaskId: 'lead', title: 'Friction', timestamp: 1000, data: { taskId: 'a' },
      }), true)
    })
    expect(result.current.rows.map(r => [r.title, r.status])).toEqual([['Friction', 'running']])
    expect(result.current.summary.running).toBe(1)

    act(() => {
      store.getState().processMessage(ev({ type: 'run_finished', taskId: 'a', parentTaskId: 'lead', timestamp: 7000, data: { taskId: 'a' } }), true)
    })
    expect(result.current.rows[0]).toMatchObject({ status: 'completed', durationMs: 6000 })
    expect(result.current.summary).toMatchObject({ running: 0, done: 1 })
  })
})
