/**
 * `ChatInstance.subscribe` must keep a stable identity while `isStreaming`
 * flips (the `useMemo` that builds `ChatInstance` re-fires
 * `onChatInstanceReady` on every flip), and it must deliver the raw stream
 * events to listeners.
 */
import { describe, it, expect, vi, afterEach, beforeAll } from 'vitest'
import { render, cleanup, waitFor, act } from '@testing-library/react'
import React from 'react'
import type { DistriChatMessage } from '@distri/core'
import { ChatInner, type ChatInstance } from '../components/Chat'
import { DistriContext } from '../DistriProvider'

beforeAll(() => {
  // jsdom doesn't implement scrollIntoView; the chat's auto-scroll effect calls it.
  Object.assign(window.HTMLElement.prototype, { scrollIntoView: vi.fn() })
})

function makeMockDistriClient() {
  const client = {
    getThread: vi.fn(async () => null),
    listTasks: vi.fn(async () => []),
    getTaskById: vi.fn(async () => null),
    cancelTask: vi.fn(async () => {}),
  }
  return client as never
}

const replyEvents: DistriChatMessage[] = [
  { type: 'run_started', data: {} },
  { type: 'text_message_start', data: { message_id: 'm1', step_id: 's1', role: 'assistant' } },
  { type: 'text_message_content', data: { message_id: 'm1', step_id: 's1', delta: 'Hello there. ' } },
  { type: 'text_message_content', data: { message_id: 'm1', step_id: 's1', delta: 'How are you?' } },
  { type: 'text_message_end', data: { message_id: 'm1', step_id: 's1' } },
  { type: 'run_finished', data: {} },
]

async function* replyStream(): AsyncGenerator<DistriChatMessage> {
  for (const e of replyEvents) {
    await new Promise((r) => setTimeout(r, 0))
    yield e
  }
}

function makeMockAgent(invokeStream: ReturnType<typeof vi.fn>) {
  return {
    name: 'voice_agent',
    getDefinition: () => ({ name: 'voice_agent' }),
    client: {
      ensureAccessToken: vi.fn(async () => {}),
      completeTool: vi.fn(async () => {}),
    },
    invokeStream,
  }
}

describe('ChatInstance.subscribe', () => {
  afterEach(() => cleanup())

  it('keeps its identity across isStreaming flips and delivers raw events', async () => {
    const invokeStream = vi.fn(async () => replyStream())
    const agent = makeMockAgent(invokeStream)
    const instances: ChatInstance[] = []

    render(
      <DistriContext.Provider value={{ client: makeMockDistriClient(), error: null, isLoading: false }}>
        <ChatInner
          agent={agent as never}
          threadId="t-sub"
          onChatInstanceReady={(i) => {
            instances.push(i)
          }}
        />
      </DistriContext.Provider>,
    )

    await waitFor(() => expect(instances.length).toBeGreaterThan(0))
    const first = instances[0]
    const seen: string[] = []
    const unsubscribe = first.subscribe((event) => {
      if ('type' in event) seen.push(event.type)
    })

    await act(async () => {
      await first.sendMessage('hi')
    })

    // isStreaming flipped false → true → false, so onChatInstanceReady re-fired
    // with new ChatInstance objects…
    await waitFor(() => expect(instances.length).toBeGreaterThan(1))
    const last = instances[instances.length - 1]
    expect(last).not.toBe(first)
    // …but `subscribe` is the same function on every one of them.
    instances.forEach((i) => expect(i.subscribe).toBe(first.subscribe))

    expect(seen).toEqual([
      'run_started',
      'text_message_start',
      'text_message_content',
      'text_message_content',
      'text_message_end',
      'run_finished',
    ])

    unsubscribe()
    seen.length = 0
    await act(async () => {
      await last.sendMessage('again')
    })
    expect(seen).toEqual([])
  })
})
