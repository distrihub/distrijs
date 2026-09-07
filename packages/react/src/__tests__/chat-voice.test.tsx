/**
 * `<Chat voice>` mounts the streaming voice path: the composer renders
 * `<PushToTalkButton>` instead of the legacy whole-clip mic, and a hold →
 * release drives the transcript into `sendMessage` through the real
 * `VoiceSession` wired to a `FakeSttAdapter` and a fake mic.
 */
import { describe, it, expect, vi, afterEach, beforeAll } from 'vitest'
import { render, cleanup, waitFor, act, fireEvent } from '@testing-library/react'
import React from 'react'
import type { SttTokenResponse } from '@distri/core'
import { FakeSttAdapter } from '@distri/state'
import { ChatInner } from '../components/Chat'
import { DistriContext } from '../DistriProvider'

beforeAll(() => {
  // jsdom doesn't implement scrollIntoView; the chat's auto-scroll effect calls it.
  Object.assign(window.HTMLElement.prototype, { scrollIntoView: vi.fn() })
})

// eslint-disable-next-line @typescript-eslint/no-empty-function
async function* emptyStream(): AsyncGenerator<never> {}

const fakeToken: SttTokenResponse = {
  token_id: 'stt_test',
  provider: 'fake',
  model: 'fake',
  token: 'tok',
  expires_at: new Date(Date.now() + 600_000).toISOString(),
  single_use: false,
  connect: { encoding: 'pcm16', sample_rate: 16000 },
}

function makeMockDistriClient() {
  const client = {
    getThread: vi.fn(async () => null),
    listTasks: vi.fn(async () => []),
    getTaskById: vi.fn(async () => null),
    cancelTask: vi.fn(async () => {}),
    sttToken: vi.fn(async () => fakeToken),
    sttUsage: vi.fn(async () => {}),
  }
  return client as never
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

const fakeMic = { start: vi.fn(async () => {}), stop: vi.fn() }

describe('<Chat voice>', () => {
  afterEach(() => cleanup())

  it('renders the push-to-talk button and not the legacy mic', async () => {
    const agent = makeMockAgent(vi.fn(async () => emptyStream()))
    const { findByTestId, queryByTitle } = render(
      <DistriContext.Provider value={{ client: makeMockDistriClient(), error: null, isLoading: false }}>
        <ChatInner agent={agent as never} threadId="t-voice" voice={{ tts: false, deps: { mic: fakeMic } }} />
      </DistriContext.Provider>,
    )
    expect(await findByTestId('push-to-talk')).toBeInTheDocument()
    expect(queryByTitle('Record voice message')).toBeNull()
    expect(queryByTitle('Enable handsfree mode')).toBeNull()
  })

  it('renders a start/stop toggle for auto and manual modes', async () => {
    const agent = makeMockAgent(vi.fn(async () => emptyStream()))
    const { findByTestId, queryByTestId } = render(
      <DistriContext.Provider value={{ client: makeMockDistriClient(), error: null, isLoading: false }}>
        <ChatInner agent={agent as never} threadId="t-voice-manual" voice={{ tts: false, turn: { mode: 'manual' }, deps: { mic: fakeMic } }} />
      </DistriContext.Provider>,
    )
    expect(await findByTestId('voice-toggle')).toBeInTheDocument()
    expect(queryByTestId('push-to-talk')).toBeNull()
  })

  it('voice together with voiceEnabled logs an error and ignores voiceEnabled', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    const agent = makeMockAgent(vi.fn(async () => emptyStream()))
    const { findByTestId, queryByTitle } = render(
      <DistriContext.Provider value={{ client: makeMockDistriClient(), error: null, isLoading: false }}>
        <ChatInner agent={agent as never} threadId="t-conflict" voice={{ tts: false, deps: { mic: fakeMic } }} voiceEnabled />
      </DistriContext.Provider>,
    )
    expect(await findByTestId('push-to-talk')).toBeInTheDocument()
    expect(queryByTitle('Record voice message')).toBeNull()
    expect(consoleError).toHaveBeenCalledWith(expect.stringContaining('mutually exclusive'))
    consoleError.mockRestore()
  })

  it('hold → transcript → release sends the text through the chat', async () => {
    const invokeStream = vi.fn(async () => emptyStream())
    const agent = makeMockAgent(invokeStream)
    const adapter = new FakeSttAdapter({
      onFinalize: (a) => {
        a.emitFinal('what is the capital of France')
        a.emitFinalized()
      },
    })
    const { findByTestId, getByTestId } = render(
      <DistriContext.Provider value={{ client: makeMockDistriClient(), error: null, isLoading: false }}>
        <ChatInner
          agent={agent as never}
          threadId="t-hold"
          voice={{ tts: false, turn: { tapMs: 0 }, stt: { adapter }, deps: { mic: fakeMic } }}
        />
      </DistriContext.Provider>,
    )
    const button = await findByTestId('push-to-talk')

    await act(async () => {
      fireEvent.pointerDown(button, { pointerId: 1, button: 0 })
    })
    await waitFor(() => expect(adapter.connected).toBe(true))
    expect(button).toHaveAttribute('data-voice-state', 'listening')

    await act(async () => {
      adapter.emitInterim('what is the')
    })
    expect(await findByTestId('voice-status')).toHaveTextContent('what is the')

    await act(async () => {
      fireEvent.pointerUp(button, { pointerId: 1 })
    })
    await waitFor(() => expect(invokeStream).toHaveBeenCalled())
    const params = invokeStream.mock.calls[0][0] as { message: { parts: Array<{ text?: string }> } }
    expect(params.message.parts[0].text).toBe('what is the capital of France')
    // The empty-state (hero) composer unmounts once the first message lands and
    // the footer composer takes over, so re-query the button.
    await waitFor(() => expect(getByTestId('push-to-talk')).toHaveAttribute('data-voice-state', 'ready'))
  })
})
