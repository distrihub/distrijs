import { describe, it, expect, vi } from 'vitest'
import { SpeechQueue } from '../voice/SpeechQueue'

interface Deferred<T> { promise: Promise<T>; resolve: (v: T) => void; reject: (e: unknown) => void }
function deferred<T>(): Deferred<T> {
  let resolve!: (v: T) => void
  let reject!: (e: unknown) => void
  const promise = new Promise<T>((res, rej) => { resolve = res; reject = rej })
  return { promise, resolve, reject }
}

const flush = () => new Promise<void>((r) => setTimeout(r, 0))

describe('SpeechQueue', () => {
  it('plays sentences in order, one at a time (plain speak)', async () => {
    const log: string[] = []
    const gates: Deferred<void>[] = []
    const speak = vi.fn(async (s: string) => {
      log.push(`start:${s}`)
      const gate = deferred<void>()
      gates.push(gate)
      await gate.promise
      log.push(`end:${s}`)
    })
    const drained = vi.fn()
    const queue = new SpeechQueue({ speak }, { onDrained: drained })

    const p1 = queue.enqueue('one')
    const p2 = queue.enqueue('two')
    await flush()
    expect(log).toEqual(['start:one'])
    expect(queue.isSpeaking).toBe(true)

    gates[0].resolve()
    await p1
    await flush()
    expect(log).toEqual(['start:one', 'end:one', 'start:two'])

    gates[1].resolve()
    await p2
    await flush()
    expect(log).toEqual(['start:one', 'end:one', 'start:two', 'end:two'])
    expect(queue.spokenSentences).toBe(2)
    expect(queue.totalSentences).toBe(2)
    expect(drained).toHaveBeenCalledTimes(1)
    expect(queue.isSpeaking).toBe(false)
  })

  it('synthesizes N+1 while N plays, and no further ahead', async () => {
    const synthStarted: string[] = []
    const synthGates = new Map<string, Deferred<string>>()
    const playGates = new Map<string, Deferred<void>>()
    const speaker = {
      speak: vi.fn(async () => undefined),
      synthesize: vi.fn((s: string) => {
        synthStarted.push(s)
        const d = deferred<string>()
        synthGates.set(s, d)
        return d.promise
      }),
      play: vi.fn((item: unknown) => {
        const d = deferred<void>()
        playGates.set(item as string, d)
        return d.promise
      }),
    }
    const queue = new SpeechQueue(speaker)
    void queue.enqueue('a')
    void queue.enqueue('b')
    void queue.enqueue('c')
    await flush()

    // a and b are in flight; c is not
    expect(synthStarted).toEqual(['a', 'b'])
    synthGates.get('a')!.resolve('audio-a')
    await flush()
    expect(speaker.play).toHaveBeenCalledWith('audio-a', expect.anything())
    expect(synthStarted).toEqual(['a', 'b']) // still only one ahead while a plays

    playGates.get('audio-a')!.resolve()
    await flush()
    // a finished → b is head, c gets prefetched
    expect(synthStarted).toEqual(['a', 'b', 'c'])
    synthGates.get('b')!.resolve('audio-b')
    await flush()
    expect(speaker.play).toHaveBeenLastCalledWith('audio-b', expect.anything())
    playGates.get('audio-b')!.resolve()
    synthGates.get('c')!.resolve('audio-c')
    await flush()
    await flush()
    playGates.get('audio-c')!.resolve()
    await flush()
    expect(queue.spokenSentences).toBe(3)
    expect(speaker.speak).not.toHaveBeenCalled()
  })

  it('abortAll aborts the in-flight signal and drops the rest', async () => {
    let inFlightSignal: AbortSignal | null = null
    const speak = vi.fn((_s: string, { signal }: { signal: AbortSignal }) => new Promise<void>((_resolve, reject) => {
      inFlightSignal = signal
      signal.addEventListener('abort', () => reject(new Error('aborted')))
    }))
    const drained = vi.fn()
    const queue = new SpeechQueue({ speak }, { onDrained: drained })
    const p1 = queue.enqueue('one')
    const p2 = queue.enqueue('two')
    await flush()
    expect(inFlightSignal).not.toBeNull()

    queue.abortAll()
    expect(inFlightSignal!.aborted).toBe(true)
    await Promise.all([p1, p2])
    await flush()
    expect(speak).toHaveBeenCalledTimes(1)
    expect(queue.size).toBe(0)
    expect(queue.spokenSentences).toBe(0)
    expect(drained).toHaveBeenCalledTimes(1)

    // The queue is usable again afterwards.
    const speak2 = vi.fn(async () => undefined)
    queue.setSpeaker({ speak: speak2 })
    await queue.enqueue('three')
    expect(speak2).toHaveBeenCalledWith('three', expect.anything())
  })

  it('a failing sentence is reported and skipped, not fatal', async () => {
    const onError = vi.fn()
    const speak = vi.fn(async (s: string) => {
      if (s === 'bad') throw new Error('boom')
    })
    const queue = new SpeechQueue({ speak }, { onError })
    await queue.enqueue('bad')
    await queue.enqueue('good sentence')
    expect(onError).toHaveBeenCalledWith(expect.any(Error), 'bad')
    expect(queue.spokenSentences).toBe(1)
    expect(queue.totalSentences).toBe(2)
  })
})
