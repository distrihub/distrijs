import { describe, it, expect, afterEach } from 'vitest'
import React from 'react'
import { render, screen, cleanup, fireEvent } from '@testing-library/react'
import type { DistriChatMessage, DistriEvent, DistriMessage } from '@distri/core'
import { ChatMessageList } from '../components/ChatMessageList'
import { ChatStoreContext, TaskState, ToolCallState, createChatStore } from '../stores/chatStateStore'

afterEach(() => cleanup())

const toolCallsEvent = (taskId: string, calls: Array<[string, string]>): DistriEvent => ({
  type: 'tool_calls',
  taskId,
  data: { tool_calls: calls.map(([tool_call_id, tool_name]) => ({ tool_call_id, tool_name, input: {} })) },
} as DistriEvent)

const text = (id: string, role: DistriMessage['role'], data: string, taskId?: string): DistriMessage =>
  ({ id, role, parts: [{ part_type: 'text', data }], created_at: 1, ...(taskId ? { taskId } : {}) })

function setup() {
  const store = createChatStore()
  const call = (id: string, name: string, taskId: string): ToolCallState =>
    ({ tool_call_id: id, tool_name: name, input: {}, status: 'completed', startTime: 1, endTime: 2, taskId } as ToolCallState)
  store.setState({
    toolCalls: new Map([
      ['inv1', call('inv1', 'invoke_agent', 't1')],
      ['x1', call('x1', 'lookup_reference', 'c1')],
      ['x2', call('x2', 'lookup_reference', 'c1')],
    ]),
    tasks: new Map<string, TaskState>([
      ['t1', { id: 't1', title: 'Agent Run', status: 'running', childTaskIds: ['c1'] }],
      ['c1', {
        id: 'c1', parentTaskId: 't1', parentToolCallId: 'inv1', agentId: 'zippy_lesson',
        title: 'Friction on a ramp', status: 'completed', childTaskIds: [], startTime: 4000, endTime: 10000,
      }],
    ]),
  })
  const messages: DistriChatMessage[] = [
    text('u1', 'user', 'Write the course', 't1'),
    toolCallsEvent('t1', [['inv1', 'invoke_agent']]),
    toolCallsEvent('c1', [['x1', 'lookup_reference'], ['x2', 'lookup_reference']]),
    text('a1', 'assistant', 'All lessons written', 't1'),
  ]
  return { store, messages }
}

function renderList(props: Partial<React.ComponentProps<typeof ChatMessageList>> = {}) {
  const { store, messages } = setup()
  return render(
    <ChatStoreContext.Provider value={store}>
      <ChatMessageList messages={messages} {...props} />
    </ChatStoreContext.Provider>,
  )
}

describe('a helper\'s card in the chat', () => {
  it('sits right under the call that started it, before the lead\'s answer', () => {
    const { container } = renderList()
    const card = container.querySelector('[data-task-id="c1"]')!
    expect(card).not.toBeNull()
    expect(container.querySelectorAll('[data-task-id="c1"]')).toHaveLength(1)
    const answer = screen.getByText('All lessons written')
    expect(card.compareDocumentPosition(answer) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  it('is named by the title the server gave, and shows the time between its frames', () => {
    renderList()
    expect(screen.getByText('Friction on a ramp')).toBeInTheDocument()
    expect(screen.getByText('6.0s')).toBeInTheDocument()
  })

  it('draws each of its tool calls once, grouped like the chat', () => {
    const { container } = renderList({
      groupToolCalls: 'run',
      toolLabels: { lookup_reference: 'Looked up references' },
    })
    fireEvent.click(container.querySelector('[data-task-id="c1"] button')!)
    const card = container.querySelector('[data-task-id="c1"]')!
    // one folded row for the two calls, not one row per call plus a second set
    expect(card.textContent!.match(/Looked up references/g)).toHaveLength(1)
    expect(card.textContent).toMatch(/2 steps/)
  })

  it('draws the calls once without grouping too', () => {
    const { container } = renderList({ toolLabels: { lookup_reference: 'Looked up references' } })
    fireEvent.click(container.querySelector('[data-task-id="c1"] button')!)
    const card = container.querySelector('[data-task-id="c1"]')!
    expect(card.textContent!.match(/lookup_reference|Looked up references/g)!.length).toBeLessThanOrEqual(2)
  })

  it('falls back to the catch-all tree when the call that started it is not shown', () => {
    const { store, messages } = setup()
    store.setState({
      tasks: new Map(store.getState().tasks).set('c1', { ...store.getState().tasks.get('c1')!, parentToolCallId: 'gone' }),
    })
    const { container } = render(
      <ChatStoreContext.Provider value={store}>
        <ChatMessageList messages={messages} />
      </ChatStoreContext.Provider>,
    )
    expect(container.querySelectorAll('[data-task-id="c1"]')).toHaveLength(1)
  })
})
