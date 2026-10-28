/**
 * A Chat given no threadId (or '') must start its own conversation. It used to
 * send an empty contextId, so every visitor of an embed or a `@distri/react`
 * app wrote into one shared thread with the id '' — and the agent read the
 * other visitors' messages as history.
 */
import { describe, it, expect, vi, afterEach, beforeAll } from 'vitest'
import { render, cleanup, waitFor, act } from '@testing-library/react'
import React from 'react'
import { ChatInner, type ChatInstance } from '../components/Chat'
import { DistriContext } from '../DistriProvider'

beforeAll(() => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(window.HTMLElement.prototype as any).scrollIntoView = vi.fn()
})

// eslint-disable-next-line @typescript-eslint/no-empty-function
async function* emptyStream(): AsyncGenerator<never> {}

function makeMockDistriClient() {
  return {
    getThread: vi.fn(async () => null),
    listTasks: vi.fn(async () => []),
    getTaskById: vi.fn(async () => null),
    cancelTask: vi.fn(async () => {}),
  } as never
}

/** Mount a Chat, send one message, return the contextId it was sent with. */
async function sentContextId(threadId?: string): Promise<string | undefined> {
  const invokeStream = vi.fn(async () => emptyStream())
  const agent = {
    name: 'shop_helper',
    getDefinition: () => ({ name: 'shop_helper' }),
    client: { ensureAccessToken: vi.fn(async () => {}), completeTool: vi.fn(async () => {}) },
    invokeStream,
  }
  let instance: ChatInstance | undefined
  render(
    <DistriContext.Provider value={{ client: makeMockDistriClient() }}>
      <ChatInner agent={agent as never} threadId={threadId} onChatInstanceReady={(i) => (instance = i)} />
    </DistriContext.Provider>,
  )
  await waitFor(() => expect(instance).toBeDefined())
  await act(async () => {
    await instance!.sendMessage('hi')
  })
  const params = invokeStream.mock.calls[0][0] as { message: { contextId?: string } }
  cleanup()
  return params.message.contextId
}

describe('Chat — thread id', () => {
  afterEach(() => cleanup())

  it('uses the threadId it is given', async () => {
    expect(await sentContextId('t-9')).toBe('t-9')
  })

  it('without a threadId, each mount gets its own non-empty id', async () => {
    const a = await sentContextId()
    const b = await sentContextId('')
    expect(a).toBeTruthy()
    expect(b).toBeTruthy()
    expect(a).not.toBe(b)
  })
})
