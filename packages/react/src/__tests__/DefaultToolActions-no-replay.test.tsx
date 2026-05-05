import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, cleanup } from '@testing-library/react'
import React from 'react'
import { DefaultToolActions } from '../components/renderers/tools/DefaultToolActions'
import type { ToolCall, ToolResult, DistriFnTool, DistriPart } from '@distri/core'
import type { ToolCallState } from '../stores/chatStateStore'

function makeTool(handler = vi.fn(async () => ({ ok: true }))): DistriFnTool {
  return {
    type: 'function',
    name: 'db_put',
    description: 'fake',
    parameters: { type: 'object', properties: {} },
    autoExecute: true,
    isExternal: true,
    handler: handler as DistriFnTool['handler'],
  }
}

function makeCall(id = 'call-1'): ToolCall {
  return { tool_call_id: id, tool_name: 'db_put', input: { collection: 'imports' } }
}

function state(status: ToolCallState['status'], extra: Partial<ToolCallState> = {}): ToolCallState {
  return {
    tool_call_id: 'call-1',
    tool_name: 'db_put',
    input: { collection: 'imports' },
    status,
    startTime: 1,
    isExternal: true,
    isLiveStream: true,
    ...extra,
  }
}

describe('DefaultToolActions — does not re-execute settled tool calls on remount', () => {
  beforeEach(() => {
    localStorage.clear()
  })
  afterEach(() => cleanup())

  it('runs the handler once for a fresh `pending` live tool call (baseline)', async () => {
    const handler = vi.fn(async () => ({ ok: true }))
    const tool = makeTool(handler)
    const completeTool = vi.fn()
    render(
      <DefaultToolActions
        toolCall={makeCall()}
        toolCallState={state('pending')}
        completeTool={completeTool}
        tool={tool}
      />,
    )
    await new Promise(r => setTimeout(r, 10))
    expect(handler).toHaveBeenCalledTimes(1)
  })

  it('does NOT run the handler when the store says status="completed" (already settled)', async () => {
    const handler = vi.fn(async () => ({ ok: true }))
    const tool = makeTool(handler)
    const completeTool = vi.fn()
    render(
      <DefaultToolActions
        toolCall={makeCall()}
        toolCallState={state('completed', { endTime: 5 })}
        completeTool={completeTool}
        tool={tool}
      />,
    )
    await new Promise(r => setTimeout(r, 10))
    expect(handler).not.toHaveBeenCalled()
    expect(completeTool).not.toHaveBeenCalled()
  })

  it('does NOT run the handler when the store says status="running" (in flight)', async () => {
    const handler = vi.fn(async () => ({ ok: true }))
    const tool = makeTool(handler)
    render(
      <DefaultToolActions
        toolCall={makeCall()}
        toolCallState={state('running')}
        completeTool={vi.fn()}
        tool={tool}
      />,
    )
    await new Promise(r => setTimeout(r, 10))
    expect(handler).not.toHaveBeenCalled()
  })

  it('does NOT run the handler when the store says status="error" (already failed)', async () => {
    const handler = vi.fn(async () => ({ ok: true }))
    const tool = makeTool(handler)
    render(
      <DefaultToolActions
        toolCall={makeCall()}
        toolCallState={state('error', { error: 'Bad Request' })}
        completeTool={vi.fn()}
        tool={tool}
      />,
    )
    await new Promise(r => setTimeout(r, 10))
    expect(handler).not.toHaveBeenCalled()
  })

  it('does NOT re-fire when the component is unmounted+remounted with a settled state', async () => {
    // First mount: fresh pending → runs once
    const handler = vi.fn(async () => ({ ok: true }))
    const tool = makeTool(handler)
    const { unmount } = render(
      <DefaultToolActions
        toolCall={makeCall()}
        toolCallState={state('pending')}
        completeTool={vi.fn()}
        tool={tool}
      />,
    )
    await new Promise(r => setTimeout(r, 10))
    expect(handler).toHaveBeenCalledTimes(1)
    unmount()

    // Second mount with the SAME tool_call_id but the store now has a result.
    // Pre-fix this would re-fire because hasTriggeredRef and hasExecuted reset.
    render(
      <DefaultToolActions
        toolCall={makeCall()}
        toolCallState={state('completed', { result: makeResult('call-1') })}
        completeTool={vi.fn()}
        tool={tool}
      />,
    )
    await new Promise(r => setTimeout(r, 10))
    expect(handler).toHaveBeenCalledTimes(1)
  })

  it('does NOT run the handler when isLiveStream=false (historical replay)', async () => {
    const handler = vi.fn(async () => ({ ok: true }))
    const tool = makeTool(handler)
    render(
      <DefaultToolActions
        toolCall={makeCall()}
        toolCallState={state('pending', { isLiveStream: false })}
        completeTool={vi.fn()}
        tool={tool}
      />,
    )
    await new Promise(r => setTimeout(r, 10))
    expect(handler).not.toHaveBeenCalled()
  })
})

function makeResult(id: string): ToolResult {
  const part: DistriPart = { part_type: 'data', data: { ok: true } }
  return { tool_call_id: id, tool_name: 'db_put', parts: [part] }
}
