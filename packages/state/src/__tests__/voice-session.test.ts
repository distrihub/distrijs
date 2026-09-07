import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { DistriChatMessage, SttTokenResponse, VoiceSessionOptions, VoiceSpeaker } from '@distri/core'
import { VoiceSession } from '../voice/VoiceSession'
import { FakeSttAdapter } from '../voice/adapters/FakeSttAdapter'
import type { VoiceTiming } from '../voice/VoiceSession'

function makeToken(overrides: Partial<SttTokenResponse> = {}): SttTokenResponse {
  return {
    token_id: `stt_${Math.random().toString(36).slice(2, 8)}`,
    provider: 'deepgram',
    model: 'nova-3',
    token: 'jwt',
    expires_at: new Date(Date.now() + 10 * 60_000).toISOString(),
    single_use: false,
    connect: { url: 'wss://example.test/listen', encoding: 'pcm16', sample_rate: 16000 },
    ...overrides,
  }
}

const FRAME_100MS = new Int16Array(1600)

interface Deferred { promise: Promise<void>; resolve: () => void; reject: (e: unknown) => void }
function deferred(): Deferred {
  let resolve!: () => void
  let reject!: (e: unknown) => void
  const promise = new Promise<void>((res, rej) => { resolve = res; reject = rej })
  return { promise, resolve, reject }
}

const tick = () => vi.advanceTimersByTimeAsync(0)

function harness(opts: { options?: VoiceSessionOptions; speaker?: VoiceSpeaker | null; singleUse?: boolean; timing?: VoiceTiming; micError?: Error } = {}) {
  const adapter = new FakeSttAdapter()
  const sttToken = vi.fn(async () => makeToken({ single_use: opts.singleUse ?? false }))
  const sttUsage = vi.fn(async () => undefined)
  let micFrame: ((f: Int16Array) => void) | null = null
  const mic = {
    start: vi.fn(async (onFrame: (f: Int16Array) => void) => {
      if (opts.micError) throw opts.micError
      micFrame = onFrame
    }),
    stop: vi.fn(),
  }
  const listeners = new Set<(e: DistriChatMessage) => void>()
  const sends: Deferred[] = []
  const chat = {
    sendMessage: vi.fn((_text: string) => {
      const d = deferred()
      sends.push(d)
      return d.promise
    }),
    stopStreaming: vi.fn(),
    subscribe: vi.fn((l: (e: DistriChatMessage) => void) => {
      listeners.add(l)
      return () => { listeners.delete(l) }
    }),
  }
  const speakSignals: AbortSignal[] = []
  const speakResolvers: Array<() => void> = []
  const defaultSpeaker: VoiceSpeaker = {
    speak: vi.fn((_s: string, { signal }: { signal: AbortSignal }) => new Promise<void>((resolve, reject) => {
      speakSignals.push(signal)
      speakResolvers.push(resolve)
      signal.addEventListener('abort', () => reject(Object.assign(new Error('aborted'), { name: 'AbortError' })))
    })),
  }
  const speaker = opts.speaker === undefined ? defaultSpeaker : opts.speaker
  const session = new VoiceSession(
    { client: { sttToken, sttUsage }, chat, mic, speaker, adapterFactory: () => adapter, timing: opts.timing },
    opts.options,
  )
  const emit = (e: DistriChatMessage) => listeners.forEach((l) => l(e))
  const frame = () => micFrame?.(FRAME_100MS)
  const streamReply = (text: string, id = 'm1') => {
    emit({ type: 'text_message_start', data: { message_id: id, step_id: 's', role: 'assistant' } })
    emit({ type: 'text_message_content', data: { message_id: id, step_id: 's', delta: text } })
    emit({ type: 'text_message_end', data: { message_id: id, step_id: 's' } })
  }
  const finishRun = () => {
    emit({ type: 'run_finished', data: {} })
    sends[sends.length - 1]?.resolve()
  }
  return { session, adapter, sttToken, sttUsage, mic, chat, speaker: defaultSpeaker, speakSignals, speakResolvers, sends, emit, frame, streamReply, finishRun }
}

/** Press, wait for the mic/socket, hold `holdMs`, release. */
async function holdAndRelease(h: ReturnType<typeof harness>, holdMs = 600, framesDuringHold = 3) {
  h.session.press()
  await tick()
  for (let i = 0; i < framesDuringHold; i += 1) h.frame()
  await vi.advanceTimersByTimeAsync(holdMs)
  h.session.release()
}

describe('VoiceSession — hold to talk', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('press opens the mic, mints a token, connects and forwards frames only while held', async () => {
    const h = harness()
    expect(h.session.snapshot.state).toBe('idle')
    h.frame() // nothing wired yet
    h.session.press()
    expect(h.session.snapshot.state).toBe('listening')
    await tick()
    expect(h.mic.start).toHaveBeenCalledTimes(1)
    expect(h.sttToken).toHaveBeenCalledTimes(1)
    expect(h.adapter.connectCount).toBe(1)

    h.frame()
    h.frame()
    expect(h.adapter.frames).toHaveLength(2)

    await vi.advanceTimersByTimeAsync(500)
    h.session.release()
    expect(h.session.snapshot.state).toBe('finalizing')
    expect(h.adapter.finalizeCount).toBe(1)
    h.frame() // after release: dropped
    expect(h.adapter.frames).toHaveLength(2)
  })

  it('release commits finals joined with the trailing interim once the provider finalizes', async () => {
    const h = harness()
    h.session.press()
    await tick()
    h.adapter.emitFinal('hello there')
    h.adapter.emitInterim('how are you')
    expect(h.session.snapshot.transcript).toEqual({ interim: 'how are you', finals: ['hello there'] })
    await vi.advanceTimersByTimeAsync(600)
    h.session.release()
    expect(h.chat.sendMessage).not.toHaveBeenCalled()
    h.adapter.emitFinalized()
    expect(h.chat.sendMessage).toHaveBeenCalledWith('hello there how are you')
    expect(h.session.snapshot.state).toBe('thinking')
    expect(h.session.snapshot.transcript).toEqual({ interim: '', finals: [] })
  })

  it('a late final that arrives during finalizing is included', async () => {
    const h = harness()
    h.session.press()
    await tick()
    h.adapter.emitInterim('turn on the')
    await vi.advanceTimersByTimeAsync(600)
    h.session.release()
    h.adapter.emitFinal('turn on the lights')
    h.adapter.emitFinalized()
    expect(h.chat.sendMessage).toHaveBeenCalledWith('turn on the lights')
  })

  it('falls back to finalizeTimeoutMs when the provider never confirms', async () => {
    const h = harness({ options: { turn: { finalizeTimeoutMs: 1500 } } })
    h.session.press()
    await tick()
    h.adapter.emitFinal('what time is it')
    await vi.advanceTimersByTimeAsync(600)
    h.session.release()
    await vi.advanceTimersByTimeAsync(1400)
    expect(h.chat.sendMessage).not.toHaveBeenCalled()
    await vi.advanceTimersByTimeAsync(100)
    expect(h.chat.sendMessage).toHaveBeenCalledWith('what time is it')
  })

  it('empty text is a no-op back to ready', async () => {
    const h = harness()
    await holdAndRelease(h)
    h.adapter.emitFinalized()
    expect(h.chat.sendMessage).not.toHaveBeenCalled()
    expect(h.session.snapshot.state).toBe('ready')
  })

  it('cancel drops the turn without sending', async () => {
    const h = harness()
    h.session.press()
    await tick()
    h.adapter.emitFinal('never send this')
    h.session.cancel()
    expect(h.session.snapshot.state).toBe('ready')
    expect(h.session.snapshot.transcript.finals).toEqual([])
    expect(h.chat.sendMessage).not.toHaveBeenCalled()
    h.frame()
    expect(h.adapter.frames).toHaveLength(0)
  })

  it('a press shorter than tapMs switches to manual listening; the next tap commits', async () => {
    const h = harness({ options: { turn: { tapMs: 250 } } })
    h.session.press()
    await tick()
    await vi.advanceTimersByTimeAsync(100)
    h.session.release()
    // still listening, now in manual mode
    expect(h.session.snapshot.state).toBe('listening')
    expect(h.session.snapshot.mode).toBe('manual')
    h.frame()
    expect(h.adapter.frames).toHaveLength(1)
    h.adapter.emitFinal('tap to talk works')

    // second tap
    h.session.press()
    await vi.advanceTimersByTimeAsync(50)
    h.session.release()
    expect(h.session.snapshot.state).toBe('finalizing')
    h.adapter.emitFinalized()
    expect(h.chat.sendMessage).toHaveBeenCalledWith('tap to talk works')
    expect(h.session.snapshot.mode).toBe('hold')
  })

  it('commitTurn() also ends a tap-started manual turn', async () => {
    const h = harness()
    h.session.press()
    await tick()
    h.session.release() // instant tap
    expect(h.session.snapshot.mode).toBe('manual')
    h.adapter.emitFinal('done now')
    h.session.commitTurn()
    h.adapter.emitFinalized()
    expect(h.chat.sendMessage).toHaveBeenCalledWith('done now')
  })

  it('a release that lands before the socket is ready is applied once it is', async () => {
    const h = harness()
    let connectResolve!: () => void
    const slowAdapter = new FakeSttAdapter({ onConnect: () => new Promise<void>((r) => { connectResolve = r }) })
    const session = new VoiceSession(
      { client: { sttToken: h.sttToken, sttUsage: h.sttUsage }, chat: h.chat, mic: h.mic, speaker: null, adapterFactory: () => slowAdapter },
    )
    session.press()
    await tick()
    await vi.advanceTimersByTimeAsync(600)
    session.release()
    expect(session.snapshot.state).toBe('listening')
    connectResolve()
    await tick()
    expect(session.snapshot.state).toBe('finalizing')
    expect(slowAdapter.finalizeCount).toBe(1)
  })
})

describe('VoiceSession — speaking and barge-in', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  async function sendTurn(h: ReturnType<typeof harness>, text = 'tell me a story') {
    h.session.press()
    await tick()
    h.adapter.emitFinal(text)
    await vi.advanceTimersByTimeAsync(600)
    h.session.release()
    h.adapter.emitFinalized()
    expect(h.chat.sendMessage).toHaveBeenCalledWith(text)
    expect(h.session.snapshot.state).toBe('thinking')
  }

  it('thinking → speaking on the first sentence → ready when the queue drains after run_finished', async () => {
    const h = harness()
    await sendTurn(h)
    h.streamReply('Once upon a time there was a fox. It was very clever indeed.')
    await tick()
    expect(h.speaker.speak).toHaveBeenCalledTimes(1)
    expect(h.speaker.speak).toHaveBeenCalledWith('Once upon a time there was a fox.', expect.anything())
    expect(h.session.snapshot.state).toBe('speaking')
    expect(h.session.snapshot.playback).toEqual({ spokenSentences: 0, totalSentences: 2 })

    h.finishRun()
    await tick()
    expect(h.session.snapshot.state).toBe('speaking') // queue still non-empty

    h.speakResolvers[0]()
    await tick()
    expect(h.speaker.speak).toHaveBeenCalledTimes(2)
    h.speakResolvers[1]()
    await tick()
    expect(h.session.snapshot.state).toBe('ready')
    expect(h.session.snapshot.playback).toEqual({ spokenSentences: 2, totalSentences: 2 })
  })

  it('ignores deltas for non-assistant messages', async () => {
    const h = harness()
    await sendTurn(h)
    h.emit({ type: 'text_message_start', data: { message_id: 'u1', step_id: 's', role: 'user' } })
    h.emit({ type: 'text_message_content', data: { message_id: 'u1', step_id: 's', delta: 'Do not speak this sentence.' } })
    h.emit({ type: 'text_message_end', data: { message_id: 'u1', step_id: 's' } })
    await tick()
    expect(h.speaker.speak).not.toHaveBeenCalled()
  })

  it('press during speaking calls stopStreaming, aborts the speaker and listens', async () => {
    const h = harness()
    await sendTurn(h)
    h.streamReply('This is a long sentence that keeps going. And another one follows.')
    await tick()
    expect(h.session.snapshot.state).toBe('speaking')
    expect(h.speakSignals[0].aborted).toBe(false)

    h.session.press()
    expect(h.chat.stopStreaming).toHaveBeenCalledTimes(1)
    expect(h.speakSignals[0].aborted).toBe(true)
    expect(h.session.snapshot.state).toBe('listening')
    await tick()
    // the second sentence was dropped, never spoken
    expect(h.speaker.speak).toHaveBeenCalledTimes(1)
    h.frame()
    expect(h.adapter.frames).toHaveLength(1)
  })

  it('press during thinking also interrupts the run', async () => {
    const h = harness()
    await sendTurn(h)
    h.session.press()
    expect(h.chat.stopStreaming).toHaveBeenCalledTimes(1)
    expect(h.session.snapshot.state).toBe('listening')
  })

  it('with tts: false the state goes thinking → ready on run_finished', async () => {
    const h = harness({ speaker: null })
    await sendTurn(h)
    h.streamReply('Nothing is spoken here at all.')
    h.finishRun()
    await tick()
    expect(h.session.snapshot.state).toBe('ready')
  })

  it('review: true hands the text to onReview instead of sending', async () => {
    const onReview = vi.fn()
    const h = harness({ options: { review: true, onReview } })
    h.session.press()
    await tick()
    h.adapter.emitFinal('put this in the composer')
    await vi.advanceTimersByTimeAsync(600)
    h.session.release()
    h.adapter.emitFinalized()
    expect(onReview).toHaveBeenCalledWith('put this in the composer')
    expect(h.chat.sendMessage).not.toHaveBeenCalled()
    expect(h.session.snapshot.state).toBe('ready')
  })
})

describe('VoiceSession — socket policy, tokens, usage', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('keeps the idle socket alive every 5 s and closes it after idleCloseMs; the next press reconnects with the same token', async () => {
    const h = harness()
    await holdAndRelease(h)
    h.adapter.emitFinalized()
    expect(h.session.snapshot.state).toBe('ready')

    await vi.advanceTimersByTimeAsync(5_000)
    expect(h.adapter.keepAliveCount).toBe(1)
    await vi.advanceTimersByTimeAsync(10_000)
    expect(h.adapter.keepAliveCount).toBe(3)
    expect(h.adapter.closeCount).toBe(0)
    await vi.advanceTimersByTimeAsync(5_000)
    expect(h.adapter.closeCount).toBe(1)
    expect(h.adapter.connected).toBe(false)

    h.session.press()
    await tick()
    expect(h.adapter.connectCount).toBe(2)
    expect(h.sttToken).toHaveBeenCalledTimes(1)
    expect(h.adapter.connectedWith[1]).toBe(h.adapter.connectedWith[0])
  })

  it('keep-alive stops while listening', async () => {
    const h = harness()
    await h.session.prepare()
    expect(h.session.snapshot.state).toBe('ready')
    await vi.advanceTimersByTimeAsync(5_000)
    expect(h.adapter.keepAliveCount).toBe(1)
    h.session.press()
    await vi.advanceTimersByTimeAsync(15_000)
    expect(h.adapter.keepAliveCount).toBe(1)
    expect(h.adapter.closeCount).toBe(0)
  })

  it('single_use tokens are minted for every connection', async () => {
    const h = harness({ singleUse: true, options: { turn: { idleCloseMs: 1_000 } } })
    await holdAndRelease(h)
    h.adapter.emitFinalized()
    await vi.advanceTimersByTimeAsync(1_000)
    expect(h.adapter.closeCount).toBe(1)
    h.session.press()
    await tick()
    expect(h.adapter.connectCount).toBe(2)
    expect(h.sttToken).toHaveBeenCalledTimes(2)
  })

  it('refreshes the token after tokenRefreshMs on a live connection', async () => {
    const h = harness({ timing: { tokenRefreshMs: 8 * 60_000 } })
    await h.session.prepare()
    expect(h.sttToken).toHaveBeenCalledTimes(1)
    h.session.press() // keep the socket open
    await tick()
    await vi.advanceTimersByTimeAsync(8 * 60_000)
    expect(h.sttToken).toHaveBeenCalledTimes(2)
    expect(h.adapter.refreshedTokens).toHaveLength(1)
  })

  it('reports cumulative captured audio every 60 s and on stop()', async () => {
    const h = harness()
    h.session.press()
    await tick()
    for (let i = 0; i < 10; i += 1) h.frame() // 1000 ms
    await vi.advanceTimersByTimeAsync(60_000)
    expect(h.sttUsage).toHaveBeenCalledTimes(1)
    expect(h.sttUsage).toHaveBeenCalledWith({ token_id: h.adapter.connectedWith[0].token_id, audio_ms: 1000 })

    for (let i = 0; i < 5; i += 1) h.frame() // +500 ms
    h.session.stop()
    expect(h.sttUsage).toHaveBeenCalledTimes(2)
    expect(h.sttUsage).toHaveBeenLastCalledWith({ token_id: h.adapter.connectedWith[0].token_id, audio_ms: 1500 })
    expect(h.mic.stop).toHaveBeenCalledTimes(1)
    expect(h.adapter.closeCount).toBe(1)
    expect(h.session.snapshot.state).toBe('idle')

    // nothing new → no duplicate report
    h.session.stop()
    expect(h.sttUsage).toHaveBeenCalledTimes(2)
  })

  it('mic permission denied moves to error and reports it', async () => {
    const onError = vi.fn()
    const h = harness({ micError: new Error('Permission denied'), options: { onError } })
    h.session.press()
    await tick()
    expect(h.session.snapshot.state).toBe('error')
    expect(h.session.snapshot.error?.message).toBe('Permission denied')
    expect(onError).toHaveBeenCalledTimes(1)
    expect(h.sttToken).not.toHaveBeenCalled()
  })

  it('setChat re-binds the event subscription', async () => {
    const h = harness()
    expect(h.chat.subscribe).toHaveBeenCalledTimes(1)
    const other = { sendMessage: vi.fn(async () => undefined), stopStreaming: vi.fn(), subscribe: vi.fn(() => () => undefined) }
    h.session.setChat(other)
    expect(other.subscribe).toHaveBeenCalledTimes(1)
    h.session.press()
    await tick()
    h.adapter.emitFinal('to the new chat')
    await vi.advanceTimersByTimeAsync(600)
    h.session.release()
    h.adapter.emitFinalized()
    expect(other.sendMessage).toHaveBeenCalledWith('to the new chat')
    expect(h.chat.sendMessage).not.toHaveBeenCalled()
  })
})

describe('VoiceSession — auto and manual modes', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('manual: start() listens until commitTurn()', async () => {
    const h = harness({ options: { turn: { mode: 'manual' } } })
    await h.session.start()
    expect(h.session.snapshot.state).toBe('listening')
    h.frame()
    expect(h.adapter.frames).toHaveLength(1)
    h.adapter.emitFinal('first part')
    await vi.advanceTimersByTimeAsync(10_000)
    expect(h.session.snapshot.state).toBe('listening') // no timer in manual
    h.session.commitTurn()
    h.adapter.emitFinalized()
    expect(h.chat.sendMessage).toHaveBeenCalledWith('first part')
  })

  it('auto: commits silenceMs after the last final, waits maxSilenceMs after a conjunction, resumes listening after the reply', async () => {
    const h = harness({ speaker: null, options: { turn: { mode: 'auto', silenceMs: 900, maxSilenceMs: 2500 } } })
    await h.session.start()
    h.adapter.emitFinal('I want to go home and')
    await vi.advanceTimersByTimeAsync(900)
    expect(h.session.snapshot.state).toBe('listening') // conjunction → longer wait
    h.adapter.emitFinal('then sleep')
    await vi.advanceTimersByTimeAsync(899)
    expect(h.session.snapshot.state).toBe('listening')
    await vi.advanceTimersByTimeAsync(1)
    expect(h.session.snapshot.state).toBe('finalizing')
    h.adapter.emitFinalized()
    expect(h.chat.sendMessage).toHaveBeenCalledWith('I want to go home and then sleep')
    expect(h.session.snapshot.state).toBe('thinking')
    h.frame()
    expect(h.adapter.frames).toHaveLength(0) // not forwarded while thinking
    h.finishRun()
    await tick()
    expect(h.session.snapshot.state).toBe('listening')
    h.frame()
    expect(h.adapter.frames).toHaveLength(1)
  })
})
