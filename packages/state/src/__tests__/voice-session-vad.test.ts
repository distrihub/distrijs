import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { DistriChatMessage, SttTokenResponse, VoiceSessionOptions, VoiceSpeaker } from '@distri/core'
import { VoiceSession } from '../voice/VoiceSession'
import { FakeSttAdapter } from '../voice/adapters/FakeSttAdapter'
import { FakeVad } from '../voice/vad/FakeVad'

function makeToken(): SttTokenResponse {
  return {
    token_id: 'stt_vad',
    provider: 'deepgram',
    model: 'nova-3',
    token: 'jwt',
    expires_at: new Date(Date.now() + 10 * 60_000).toISOString(),
    single_use: false,
    connect: { url: 'wss://example.test/listen', encoding: 'pcm16', sample_rate: 16000 },
  }
}

const FRAME = new Int16Array(1600)
const tick = () => vi.advanceTimersByTimeAsync(0)

function harness(options: VoiceSessionOptions, withSpeaker = false) {
  const adapter = new FakeSttAdapter()
  const vad = new FakeVad()
  let micFrame: ((f: Int16Array) => void) | null = null
  const mic = { start: vi.fn(async (onFrame: (f: Int16Array) => void) => { micFrame = onFrame }), stop: vi.fn() }
  const listeners = new Set<(e: DistriChatMessage) => void>()
  let resolveSend: (() => void) | null = null
  const chat = {
    sendMessage: vi.fn(() => new Promise<void>((r) => { resolveSend = r })),
    stopStreaming: vi.fn(),
    subscribe: vi.fn((l: (e: DistriChatMessage) => void) => { listeners.add(l); return () => { listeners.delete(l) } }),
  }
  const signals: AbortSignal[] = []
  const speaker: VoiceSpeaker | null = withSpeaker
    ? {
      speak: vi.fn((_s: string, { signal }: { signal: AbortSignal }) => new Promise<void>((_resolve, reject) => {
        signals.push(signal)
        signal.addEventListener('abort', () => reject(Object.assign(new Error('aborted'), { name: 'AbortError' })))
      })),
    }
    : null
  const session = new VoiceSession(
    { client: { sttToken: vi.fn(async () => makeToken()), sttUsage: vi.fn(async () => undefined) }, chat, mic, speaker, adapterFactory: () => adapter, vad },
    options,
  )
  const emit = (e: DistriChatMessage) => listeners.forEach((l) => l(e))
  const frame = () => micFrame?.(FRAME)
  const streamReply = (text: string) => {
    emit({ type: 'text_message_start', data: { message_id: 'm1', step_id: 's', role: 'assistant' } })
    emit({ type: 'text_message_content', data: { message_id: 'm1', step_id: 's', delta: text } })
    emit({ type: 'text_message_end', data: { message_id: 'm1', step_id: 's' } })
  }
  const finishRun = () => { emit({ type: 'run_finished', data: {} }); resolveSend?.() }
  return { session, adapter, vad, mic, chat, speaker, signals, frame, streamReply, finishRun }
}

describe('VoiceSession — auto mode with VAD', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('start() starts the VAD; frames reach STT only from speech start', async () => {
    const h = harness({ turn: { mode: 'auto' } })
    await h.session.start()
    expect(h.vad.startCount).toBe(1)
    expect(h.session.snapshot.state).toBe('listening')
    h.frame()
    h.frame()
    expect(h.vad.frames).toHaveLength(2) // the VAD always sees the mic
    expect(h.adapter.frames).toHaveLength(0) // STT does not, until speech
    h.vad.emitSpeechStart()
    h.frame()
    expect(h.adapter.frames).toHaveLength(1)
  })

  it('speech end without any transcript stops forwarding after silenceMs and keeps listening', async () => {
    const h = harness({ turn: { mode: 'auto', silenceMs: 900 } })
    await h.session.start()
    h.vad.emitSpeechStart()
    h.vad.emitSpeechEnd()
    h.frame()
    expect(h.adapter.frames).toHaveLength(1) // still forwarding during the silence window
    await vi.advanceTimersByTimeAsync(900)
    h.frame()
    expect(h.adapter.frames).toHaveLength(1)
    expect(h.session.snapshot.state).toBe('listening')
    expect(h.chat.sendMessage).not.toHaveBeenCalled()
  })

  it('commits silenceMs after the last final once speech has ended; speech resuming cancels the commit', async () => {
    const h = harness({ turn: { mode: 'auto', silenceMs: 900 } })
    await h.session.start()
    h.vad.emitSpeechStart()
    h.adapter.emitFinal('turn on the lights')
    h.vad.emitSpeechEnd()
    await vi.advanceTimersByTimeAsync(500)
    h.vad.emitSpeechStart() // user continues
    await vi.advanceTimersByTimeAsync(900)
    expect(h.session.snapshot.state).toBe('listening')
    h.adapter.emitFinal('in the kitchen')
    h.vad.emitSpeechEnd()
    await vi.advanceTimersByTimeAsync(900)
    expect(h.session.snapshot.state).toBe('finalizing')
    h.adapter.emitFinalized()
    expect(h.chat.sendMessage).toHaveBeenCalledWith('turn on the lights in the kitchen')
  })

  it('half duplex: speech during speaking is ignored', async () => {
    const h = harness({ turn: { mode: 'auto', silenceMs: 900 }, duplex: 'half' }, true)
    await h.session.start()
    h.vad.emitSpeechStart()
    h.adapter.emitFinal('tell me a story')
    h.vad.emitSpeechEnd()
    await vi.advanceTimersByTimeAsync(900)
    h.adapter.emitFinalized()
    h.streamReply('Once upon a time there was a fox.')
    await tick()
    expect(h.session.snapshot.state).toBe('speaking')
    h.vad.emitSpeechStart()
    await vi.advanceTimersByTimeAsync(1000)
    expect(h.chat.stopStreaming).not.toHaveBeenCalled()
    expect(h.session.snapshot.state).toBe('speaking')
    h.frame()
    expect(h.adapter.frames).toHaveLength(0) // mic ignored while speaking
  })

  it('full duplex: 300 ms of speech during speaking interrupts and listens; shorter speech does not', async () => {
    const h = harness({ turn: { mode: 'auto', silenceMs: 900 }, duplex: 'full' }, true)
    await h.session.start()
    h.vad.emitSpeechStart()
    h.adapter.emitFinal('tell me a story')
    h.vad.emitSpeechEnd()
    await vi.advanceTimersByTimeAsync(900)
    h.adapter.emitFinalized()
    h.streamReply('Once upon a time there was a fox. It was clever.')
    await tick()
    expect(h.session.snapshot.state).toBe('speaking')

    // a cough: 200 ms of speech
    h.vad.emitSpeechStart()
    await vi.advanceTimersByTimeAsync(200)
    h.vad.emitSpeechEnd()
    await vi.advanceTimersByTimeAsync(300)
    expect(h.chat.stopStreaming).not.toHaveBeenCalled()
    expect(h.session.snapshot.state).toBe('speaking')

    // sustained speech
    h.vad.emitSpeechStart()
    await vi.advanceTimersByTimeAsync(299)
    expect(h.chat.stopStreaming).not.toHaveBeenCalled()
    await vi.advanceTimersByTimeAsync(1)
    expect(h.chat.stopStreaming).toHaveBeenCalledTimes(1)
    expect(h.signals[0].aborted).toBe(true)
    expect(h.session.snapshot.state).toBe('listening')
    h.frame()
    expect(h.adapter.frames).toHaveLength(1) // barge-in speech is forwarded
  })

  it('hold mode does not load a VAD; full duplex in hold mode does', async () => {
    const hold = harness({ turn: { mode: 'hold' } })
    await hold.session.prepare()
    expect(hold.vad.startCount).toBe(0)
    const full = harness({ turn: { mode: 'hold' }, duplex: 'full' })
    await full.session.prepare()
    expect(full.vad.startCount).toBe(1)
  })

  it('stop() stops the VAD', async () => {
    const h = harness({ turn: { mode: 'auto' } })
    await h.session.start()
    h.session.stop()
    expect(h.vad.stopCount).toBe(1)
    expect(h.session.snapshot.state).toBe('idle')
  })

  it('a VAD that fails to load puts the session in error', async () => {
    const adapter = new FakeSttAdapter()
    const session = new VoiceSession(
      {
        client: { sttToken: vi.fn(async () => makeToken()), sttUsage: vi.fn(async () => undefined) },
        chat: null,
        mic: { start: vi.fn(async () => undefined), stop: vi.fn() },
        speaker: null,
        adapterFactory: () => adapter,
        vadFactory: () => new FakeVad({ onStart: () => { throw new Error('vad-web missing') } }),
      },
      { turn: { mode: 'auto' } },
    )
    await session.start()
    expect(session.snapshot.state).toBe('error')
    expect(session.snapshot.error?.message).toBe('vad-web missing')
  })
})
