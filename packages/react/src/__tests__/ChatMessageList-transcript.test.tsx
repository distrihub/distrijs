import { describe, it, expect, afterEach } from 'vitest'
import React from 'react'
import { render, screen, cleanup, fireEvent, renderHook } from '@testing-library/react'
import type { DistriChatMessage, DistriEvent, DistriMessage, DistriPart } from '@distri/core'
import { ChatMessageList } from '../components/ChatMessageList'
import { ChatStore, ChatStoreContext, ToolCallState, createChatStore } from '../stores/chatStateStore'
import { useTranscript } from '../hooks/useTranscript'
import type { AssistantTextSlotProps, ChatMessageComponents, ToolStepsSlotProps } from '../types'

/**
 * ChatMessageList renders the shared transcript block model: one answer per
 * turn, developer parts hidden, tool runs optionally folded, and host slots.
 */

afterEach(() => cleanup())

const msg = (id: string, role: DistriMessage['role'], parts: DistriPart[] | string, extra: Partial<DistriMessage> = {}): DistriMessage => ({
  id,
  role,
  parts: typeof parts === 'string' ? [{ part_type: 'text', data: parts }] : parts,
  created_at: 1,
  ...extra,
})

const toolCallsEvent = (calls: Array<[string, string]>, taskId = 't1'): DistriEvent => ({
  type: 'tool_calls',
  taskId,
  data: { tool_calls: calls.map(([tool_call_id, tool_name]) => ({ tool_call_id, tool_name, input: {} })) },
} as DistriEvent)

function storeWithTools(calls: Array<[string, string, ToolCallState['status']?]>): ChatStore {
  const store = createChatStore()
  const toolCalls = new Map<string, ToolCallState>()
  for (const [id, name, status = 'completed'] of calls) {
    toolCalls.set(id, { tool_call_id: id, tool_name: name, input: {}, status, startTime: 1, endTime: 2 })
  }
  store.setState({ toolCalls })
  return store
}

function renderList(messages: DistriChatMessage[], props: Partial<React.ComponentProps<typeof ChatMessageList>> = {}, store = createChatStore()) {
  return render(
    <ChatStoreContext.Provider value={store}>
      <ChatMessageList messages={messages} {...props} />
    </ChatStoreContext.Provider>,
  )
}

describe('ChatMessageList: one answer per turn', () => {
  it('hides a draft that called final once the is_final answer arrives', () => {
    const messages: DistriChatMessage[] = [
      msg('u1', 'user', 'Plan Kyoto'),
      msg('d1', 'assistant', 'Rough Kyoto draft', { taskId: 't1' }),
      toolCallsEvent([['f1', 'final']]),
      msg('a1', 'assistant', 'Final Kyoto plan', { taskId: 't1', is_final: true }),
    ]
    renderList(messages)
    expect(screen.queryByText('Rough Kyoto draft')).toBeNull()
    expect(screen.getByText('Final Kyoto plan')).toBeInTheDocument()
  })

  it('shows the answer once when the same id arrives live and from history', () => {
    const live = msg('a1', 'assistant', 'Only once', { taskId: 't1' })
    renderList([live, { ...live, is_final: true }])
    expect(screen.getAllByText('Only once')).toHaveLength(1)
  })
})

describe('ChatMessageList: part visibility', () => {
  const withContext = msg('u1', 'user', [
    { part_type: 'text', data: '[app context] secret' },
    { part_type: 'text', data: 'What next?' },
  ], { metadata: { parts: { 0: { developer: true, save: false } } } })

  it('hides developer parts by default', () => {
    renderList([withContext])
    expect(screen.queryByText(/secret/)).toBeNull()
    expect(screen.getByText(/What next\?/)).toBeInTheDocument()
  })

  it('honours a host hideParts predicate', () => {
    renderList([withContext], { hideParts: (part) => part.part_type === 'text' && part.data.startsWith('What') })
    expect(screen.getByText(/secret/)).toBeInTheDocument()
    expect(screen.queryByText(/What next\?/)).toBeNull()
  })
})

describe('ChatMessageList: tool steps', () => {
  const messages: DistriChatMessage[] = [
    msg('u1', 'user', 'go'),
    toolCallsEvent([['c1', 'read_itinerary']]),
    toolCallsEvent([['c2', 'web_search'], ['c3', 'final']]),
    msg('a1', 'assistant', 'Here you go', { taskId: 't1' }),
  ]
  const tools: Array<[string, string]> = [['c1', 'read_itinerary'], ['c2', 'web_search']]

  it("folds consecutive calls into one expandable row with groupToolCalls='run'", () => {
    renderList(messages, {
      groupToolCalls: 'run',
      toolLabels: { read_itinerary: 'Read the itinerary', web_search: 'Searched the web' },
    }, storeWithTools(tools))

    const row = screen.getByRole('button', { name: /2 steps · Read the itinerary, Searched the web/ })
    expect(row).toHaveAttribute('aria-expanded', 'false')
    fireEvent.click(row)
    expect(row).toHaveAttribute('aria-expanded', 'true')
  })

  it('opens a folded run when a call needs the user', () => {
    renderList(messages, { groupToolCalls: 'run' }, storeWithTools([['c1', 'read_itinerary', 'user_action_required'], ['c2', 'web_search']]))
    expect(screen.getByRole('button', { name: /2 steps/ })).toHaveAttribute('aria-expanded', 'true')
  })

  it('passes toolSummaryOverrides through to the tool rows', () => {
    renderList(messages, {
      toolSummaryOverrides: { web_search: () => ({ verb: 'Looked up', subject: 'Fushimi Inari' }) },
    }, storeWithTools(tools))
    expect(screen.getByText(/Fushimi Inari/)).toBeInTheDocument()
  })

  it('lets a ToolSteps slot replace the block', () => {
    const ToolSteps = ({ summary, grouped }: ToolStepsSlotProps) => <div data-testid="steps">{summary}|{String(grouped)}</div>
    renderList(messages, { groupToolCalls: 'run', components: { ToolSteps } }, storeWithTools(tools))
    expect(screen.getAllByTestId('steps')).toHaveLength(1)
    expect(screen.getByTestId('steps').textContent).toMatch(/^2 steps · .*\|true$/)
  })
})

describe('ChatMessageList: slots', () => {
  it('renders UserMessage and AssistantText slots with resolved content', () => {
    const seen: AssistantTextSlotProps[] = []
    const components: ChatMessageComponents = {
      UserMessage: ({ message }) => <div>user:{message.parts.length}</div>,
      AssistantText: (props) => { seen.push(props); return <div>assistant:{props.text}</div> },
    }
    renderList([
      msg('u1', 'user', [{ part_type: 'text', data: 'ctx' }, { part_type: 'text', data: 'hi' }], { metadata: { parts: { 0: { developer: true } } } }),
      msg('a1', 'assistant', 'Answer', { taskId: 't1', is_final: true }),
    ], { components })
    expect(screen.getByText('user:1')).toBeInTheDocument()
    expect(screen.getByText('assistant:Answer')).toBeInTheDocument()
    expect(seen[0]).toMatchObject({ isFinal: true, isStreaming: false })
  })

  it('passes markdown overrides to react-markdown, keeping custom link schemes', () => {
    const clicked: string[] = []
    const components: ChatMessageComponents = {
      markdown: {
        a: ({ href, children }) => <button onClick={() => clicked.push(String(href))}>{children}</button>,
      },
    }
    renderList([msg('a1', 'assistant', 'Visit [Fushimi Inari](stop:42) or [bad](javascript:alert(1))')], { components })
    fireEvent.click(screen.getByRole('button', { name: 'Fushimi Inari' }))
    fireEvent.click(screen.getByRole('button', { name: 'bad' }))
    expect(clicked).toEqual(['stop:42', ''])
  })
})

describe('useTranscript', () => {
  it('returns the block model ChatMessageList renders', () => {
    const messages: DistriChatMessage[] = [msg('u1', 'user', 'a'), toolCallsEvent([['c1', 'x']]), toolCallsEvent([['c2', 'y']])]
    const { result } = renderHook(() => useTranscript(messages, { groupToolCalls: 'run' }))
    expect(result.current.map(b => b.kind)).toEqual(['user', 'steps'])
  })
})
