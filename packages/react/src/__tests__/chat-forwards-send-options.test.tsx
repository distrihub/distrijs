/**
 * Regression guard for the ChatInstance.sendMessage options-forwarding bug.
 *
 * `ChatInstance.sendMessage` is typed `(content, options?)` and wired to
 * `handleSendMessage`. That handler used to be declared `(content)` — with NO
 * `options` param — so every per-send option (crucially `metadata.load_skills`,
 * which preloads a skill, and `partsMetadata`) was silently dropped before it
 * ever reached `agent.invokeStream`. The whole skill-preload feature was dead
 * because of it.
 *
 * This test drives a real ChatInstance and asserts the per-send metadata lands
 * in the params passed to `agent.invokeStream`.
 */
import { describe, it, expect, vi, afterEach, beforeAll } from 'vitest'
import { render, cleanup, waitFor, act } from '@testing-library/react'
import React from 'react'
import { ChatInner, type ChatInstance } from '../components/Chat'
import { DistriContext } from '../DistriProvider'

// jsdom doesn't implement scrollIntoView; the chat's auto-scroll effect calls it.
beforeAll(() => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(window.HTMLElement.prototype as any).scrollIntoView = vi.fn()
})

// eslint-disable-next-line @typescript-eslint/no-empty-function
async function* emptyStream(): AsyncGenerator<never> {}

function makeMockAgent(invokeStream: ReturnType<typeof vi.fn>) {
  return {
    name: 'zippy_browser',
    getDefinition: () => ({ name: 'zippy_browser' }),
    client: {
      ensureAccessToken: vi.fn(async () => {}),
      completeTool: vi.fn(async () => {}),
    },
    invokeStream,
  }
}

describe('Chat — forwards per-send options.metadata to agent.invokeStream', () => {
  afterEach(() => cleanup())

  it('load_skills passed to sendMessage reaches invokeStream metadata', async () => {
    const invokeStream = vi.fn(async () => emptyStream())
    const agent = makeMockAgent(invokeStream)
    let instance: ChatInstance | undefined

    render(
      <DistriContext.Provider value={{ client: {} as never }}>
        <ChatInner
          agent={agent as never}
          threadId="t-1"
          onChatInstanceReady={(i) => {
            instance = i
          }}
        />
      </DistriContext.Provider>,
    )

    await waitFor(() => expect(instance).toBeDefined())

    await act(async () => {
      await instance!.sendMessage([{ part_type: 'text', data: 'hi' }], {
        metadata: { load_skills: ['zippy_lesson'] },
      })
    })

    expect(invokeStream).toHaveBeenCalled()
    const params = invokeStream.mock.calls[0][0] as { metadata?: Record<string, unknown> }
    // The exact bug: this used to be undefined because handleSendMessage
    // dropped the options argument.
    expect(params.metadata?.load_skills).toEqual(['zippy_lesson'])
  })

  it('partsMetadata passed to sendMessage also survives to invokeStream', async () => {
    const invokeStream = vi.fn(async () => emptyStream())
    const agent = makeMockAgent(invokeStream)
    let instance: ChatInstance | undefined

    render(
      <DistriContext.Provider value={{ client: {} as never }}>
        <ChatInner
          agent={agent as never}
          threadId="t-2"
          onChatInstanceReady={(i) => {
            instance = i
          }}
        />
      </DistriContext.Provider>,
    )
    await waitFor(() => expect(instance).toBeDefined())

    await act(async () => {
      await instance!.sendMessage([{ part_type: 'text', data: 'x' }], {
        partsMetadata: { 0: { developer: true, save: false } },
      })
    })

    expect(invokeStream).toHaveBeenCalled()
    const params = invokeStream.mock.calls[0][0] as { metadata?: Record<string, unknown> }
    expect(params.metadata?.parts).toMatchObject({ 0: { developer: true, save: false } })
  })
})
