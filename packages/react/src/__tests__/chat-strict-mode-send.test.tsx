/**
 * A message sent as soon as the chat is ready (distri-cloud's New conversation sends its first message from
 * `onChatInstanceReady`) must survive React StrictMode. StrictMode runs every effect's cleanup once right after
 * mount; the chat's unmount cleanup disposed the controller then, which nulled the in-flight AbortController
 * ("Cannot read properties of null (reading 'signal')") and the message was never sent (distri-cloud#203).
 * A real unmount must still abort the stream.
 */
import { describe, it, expect, vi, afterEach, beforeAll } from 'vitest'
import { render, cleanup, waitFor } from '@testing-library/react'
import React, { StrictMode } from 'react'
import { ChatInner, type ChatInstance } from '../components/Chat'
import { DistriContext } from '../DistriProvider'

beforeAll(() => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(window.HTMLElement.prototype as any).scrollIntoView = vi.fn()
})

function makeMockDistriClient() {
  return {
    getThread: vi.fn(async () => null),
    listTasks: vi.fn(async () => []),
    getTaskById: vi.fn(async () => null),
    cancelTask: vi.fn(async () => {}),
  } as never
}

/** A stream that stays open until its signal aborts. */
function openStream(signal?: AbortSignal): AsyncGenerator<never> {
  return (async function* () {
    await new Promise<void>((resolve) => {
      if (signal?.aborted) return resolve()
      signal?.addEventListener('abort', () => resolve())
    })
  })()
}

function mountAndSendOnReady(onError: (e: Error) => void) {
  const signals: AbortSignal[] = []
  const invokeStream = vi.fn(async (_p: unknown, _t: unknown, _x: unknown, opts?: { signal?: AbortSignal }) => {
    if (opts?.signal) signals.push(opts.signal)
    return openStream(opts?.signal)
  })
  const agent = {
    name: 'distri',
    getDefinition: () => ({ name: 'distri' }),
    client: { ensureAccessToken: vi.fn(async () => {}), completeTool: vi.fn(async () => {}) },
    invokeStream,
  }
  let sent = false
  const onReady = (i: ChatInstance) => {
    if (sent) return
    sent = true
    void i.sendMessage('hello')
  }
  const view = render(
    <StrictMode>
      <DistriContext.Provider value={{ client: makeMockDistriClient() }}>
        <ChatInner agent={agent as never} threadId="t-new" onChatInstanceReady={onReady} onError={onError} />
      </DistriContext.Provider>
    </StrictMode>,
  )
  return { view, invokeStream, signals }
}

describe('Chat — first message sent on ready, under StrictMode', () => {
  afterEach(() => cleanup())

  it('opens the stream and keeps it open', async () => {
    const onError = vi.fn()
    const { invokeStream, signals } = mountAndSendOnReady(onError)
    await waitFor(() => expect(invokeStream).toHaveBeenCalledTimes(1))
    await new Promise((r) => setTimeout(r, 20))
    expect(signals[0].aborted).toBe(false)
    expect(onError).not.toHaveBeenCalled()
  })

  it('still aborts the stream when the chat really unmounts', async () => {
    const { view, invokeStream, signals } = mountAndSendOnReady(vi.fn())
    await waitFor(() => expect(invokeStream).toHaveBeenCalledTimes(1))
    view.unmount()
    await waitFor(() => expect(signals[0].aborted).toBe(true))
  })
})
