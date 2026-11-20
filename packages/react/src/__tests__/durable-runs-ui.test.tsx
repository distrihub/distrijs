/**
 * Durable runs in the React layer (spec 2026-11-20-durable-runs-and-nodes §2.7):
 * a parked run says "Waiting for you", a tool row says when its call expired or
 * runs in another window, and useChat answers a reloaded thread's pending calls.
 */
import { describe, it, expect, vi, afterEach } from 'vitest'
import React from 'react'
import { render, screen, cleanup, renderHook, waitFor } from '@testing-library/react'
import { ContextRow } from '../components/ContextRow'
import { MinimalToolRow } from '../components/renderers/tools/MinimalToolRow'
import { HttpToolCard } from '../components/renderers/tools/HttpToolCard'
import { RichToolCard } from '../components/renderers/tools/RichToolCard'
import { useChat } from '../useChat'
import type { ToolCallState } from '../stores/chatStateStore'

afterEach(() => cleanup())

const row = (overrides: Partial<ToolCallState>): ToolCallState => ({
  tool_call_id: 'c1',
  tool_name: 'book_table',
  input: {},
  status: 'running',
  startTime: Date.now(),
  ...overrides,
})

describe('parked run indicator', () => {
  it('shows "Waiting for you" instead of the thinking strip', () => {
    render(<ContextRow isStreaming waitingForYou />)
    expect(screen.getByTestId('run-waiting-for-you')).toHaveTextContent('Waiting for you')
  })

  it('is absent when the run is not parked', () => {
    render(<ContextRow isStreaming={false} />)
    expect(screen.queryByTestId('run-waiting-for-you')).toBeNull()
  })
})

describe('tool row durable states', () => {
  it('an expired call says so', () => {
    render(
      <MinimalToolRow
        summary={{ verb: 'Book table' } as never}
        state={row({ status: 'error', remoteStatus: 'expired', error: 'Expired: the agent stopped waiting for this result' })}
      />,
    )
    expect(screen.getByTestId('tool-row-expired')).toHaveTextContent('expired')
  })

  it('a call claimed by another window says so', () => {
    render(<MinimalToolRow summary={{ verb: 'Book table' } as never} state={row({ remoteStatus: 'running_elsewhere' })} />)
    expect(screen.getByTestId('tool-row-elsewhere')).toHaveTextContent('running in another window')
  })
})

describe('cards show the durable states too', () => {
  // distri_request renders as an HTTP card, not a row: the tag must be there as well.
  it('an HTTP card held by another window says so', () => {
    const toolCall = { tool_call_id: 'c1', tool_name: 'distri_request', input: { method: 'POST', path: '/skills' } }
    render(<HttpToolCard toolCall={toolCall as never} state={row({ remoteStatus: 'running_elsewhere' })} />)
    expect(screen.getByTestId('tool-row-elsewhere').textContent).toBe('running in another window')
  })

  it('an expired rich card says so', () => {
    render(<RichToolCard summary={{ verb: 'Book table' } as never} state={row({ status: 'error', remoteStatus: 'expired' })} />)
    expect(screen.getByTestId('tool-row-expired').textContent).toBe('expired')
  })
})

describe('useChat after a reload', () => {
  it('answers the thread\'s pending client-tool call once', async () => {
    const handler = vi.fn(async () => ({ booked: true }))
    const tool = { type: 'function', name: 'book_table', description: '', parameters: {}, handler, autoExecute: true }
    const completeTool = vi.fn(async () => ({ status: 'completed' }))
    const agent = {
      name: 'shop_helper',
      client: { ensureAccessToken: vi.fn(async () => {}), hasCapability: () => false },
      supportsDurableRuns: vi.fn(async () => true),
      listPendingCalls: vi.fn(async () => [{
        id: 'c1', task_id: 'task-1', thread_id: 'th-1', kind: 'client_tool', tool_name: 'book_table',
        request: { tool_call_id: 'c1', tool_name: 'book_table', input: { party: 2 } }, status: 'pending',
      }]),
      claimPendingCall: vi.fn(async () => ({ claimed: true })),
      completeTool,
      // The follow after recovery: the run finishes.
      resubscribe: vi.fn(async function* () {
        yield { type: 'run_parked', taskId: 'task-1', data: { taskId: 'task-1', pending: ['c1'] } }
        yield { type: 'run_finished', taskId: 'task-1', data: { taskId: 'task-1' } }
      }),
    }
    const externalTools = [tool]
    renderHook(() => useChat({ threadId: 'th-1', agent: agent as never, externalTools: externalTools as never, threadKnown: true }))

    await waitFor(() => expect(completeTool).toHaveBeenCalledTimes(1))
    expect(agent.listPendingCalls).toHaveBeenCalledWith({ threadId: 'th-1' })
    expect(handler).toHaveBeenCalledTimes(1)
    expect(handler).toHaveBeenCalledWith({ party: 2 })
  })

  it('an old server: nothing is listed', async () => {
    const agent = {
      name: 'shop_helper',
      client: { ensureAccessToken: vi.fn(async () => {}) },
      supportsDurableRuns: vi.fn(async () => false),
      listPendingCalls: vi.fn(async () => []),
    }
    renderHook(() => useChat({ threadId: 'th-1', agent: agent as never, threadKnown: true }))
    await waitFor(() => expect(agent.supportsDurableRuns).toHaveBeenCalled())
    expect(agent.listPendingCalls).not.toHaveBeenCalled()
  })
})
