import { describe, it, expect, afterEach } from 'vitest'
import React from 'react'
import { render, screen, cleanup } from '@testing-library/react'
import type { DistriChatMessage, DistriMessage } from '@distri/core'
import { ChatMessageList } from '../components/ChatMessageList'
import { ChatStoreContext, createChatStore } from '../stores/chatStateStore'

afterEach(() => cleanup())

const call = (id: string, name: string) => ({ part_type: 'tool_call' as const, data: { tool_call_id: id, tool_name: name, input: {} } })
const msg = (id: string, role: DistriMessage['role'], parts: DistriMessage['parts'], extra: Partial<DistriMessage> = {}): DistriMessage =>
  ({ id, role, parts, created_at: 1, taskId: 't1', ...extra })

const history: DistriChatMessage[] = [
  msg('u1', 'user', [{ part_type: 'text', data: 'Write a lesson' }]),
  msg('a1', 'assistant', [call('c1', 'lookup_reference'), call('c2', 'lookup_reference')]),
  msg('a2', 'assistant', [{ part_type: 'text', data: 'The lesson is ready' }], { is_final: true }),
]

describe('a reloaded thread (history only, no live events)', () => {
  it('shows the steps the lead took, folded when grouping by run', () => {
    const store = createChatStore()
    store.getState().hydrateToolCalls(history)
    render(
      <ChatStoreContext.Provider value={store}>
        <ChatMessageList messages={history} groupToolCalls="run" toolLabels={{ lookup_reference: 'Looked up references' }} />
      </ChatStoreContext.Provider>,
    )
    expect(screen.getByText(/2 steps/)).toBeInTheDocument()
    expect(screen.getByText(/Looked up references/)).toBeInTheDocument()
    expect(screen.getByText('The lesson is ready')).toBeInTheDocument()
  })

  it('draws no row until the states are seeded (hydrateToolCalls)', () => {
    // A row needs a state per call; useChat seeds them from history.
    const store = createChatStore()
    const { container } = render(
      <ChatStoreContext.Provider value={store}>
        <ChatMessageList messages={history} groupToolCalls="run" />
      </ChatStoreContext.Provider>,
    )
    expect(container.textContent).not.toMatch(/steps/)
  })
})
