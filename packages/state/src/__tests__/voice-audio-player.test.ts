import { describe, it, expect, vi } from 'vitest'
import { AudioElementPlayer, type AudioElementLike, type MediaSourceCtorLike, type MediaSourceLike, type SourceBufferLike } from '../voice/AudioElementPlayer'

const flush = () => new Promise<void>((r) => setTimeout(r, 0))

class FakeSourceBuffer implements SourceBufferLike {
  updating = false
  appended: Uint8Array[] = []
  private listeners: Array<() => void> = []
  appendBuffer(data: ArrayBufferView | ArrayBuffer): void {
    if (this.updating) throw new Error('InvalidStateError: appendBuffer while updating')
    this.appended.push(new Uint8Array(data as Uint8Array))
    this.updating = true
    queueMicrotask(() => {
      this.updating = false
      const ls = this.listeners
      this.listeners = []
      ls.forEach((l) => l())
    })
  }
  addEventListener(type: 'updateend' | 'error', listener: () => void): void {
    if (type === 'updateend') this.listeners.push(listener)
  }
}

class FakeMediaSource implements MediaSourceLike {
  static supported = new Set(['audio/mpeg'])
  static instances: FakeMediaSource[] = []
  static isTypeSupported(type: string): boolean {
    return FakeMediaSource.supported.has(type)
  }
  readyState = 'closed'
  sourceBuffer: FakeSourceBuffer | null = null
  ended = false
  private onOpen: (() => void) | null = null
  constructor() {
    FakeMediaSource.instances.push(this)
  }
  addEventListener(_type: 'sourceopen', listener: () => void): void {
    this.onOpen = listener
  }
  open(): void {
    this.readyState = 'open'
    this.onOpen?.()
  }
  addSourceBuffer(type: string): SourceBufferLike {
    expect(type).toBe('audio/mpeg')
    this.sourceBuffer = new FakeSourceBuffer()
    return this.sourceBuffer
  }
  endOfStream(): void {
    this.ended = true
    this.readyState = 'ended'
  }
}

function makeElement(registry: Map<string, unknown>) {
  const el = {
    _src: '',
    preload: '',
    paused: true,
    ended: false,
    currentSrc: '',
    play: vi.fn(async () => { el.paused = false }),
    pause: vi.fn(() => { el.paused = true }),
    removeAttribute: vi.fn(() => { el._src = '' }),
    onended: null as ((ev: unknown) => unknown) | null,
    onerror: null as ((ev: unknown) => unknown) | null,
    get src() { return this._src },
    set src(v: string) {
      this._src = v
      this.currentSrc = v
      const target = registry.get(v)
      if (target instanceof FakeMediaSource) queueMicrotask(() => target.open())
    },
  }
  return el as unknown as AudioElementLike & typeof el
}

function makePlayer(mediaSource: MediaSourceCtorLike | null = FakeMediaSource) {
  const registry = new Map<string, unknown>()
  let n = 0
  const el = makeElement(registry)
  const revoked: string[] = []
  const player = new AudioElementPlayer({
    createElement: () => el,
    mediaSource,
    createObjectURL: (obj) => { const url = `blob:fake-${++n}`; registry.set(url, obj); return url },
    revokeObjectURL: (url) => { revoked.push(url) },
  })
  return { player, el, revoked, registry }
}

function streamOf(chunks: Uint8Array[], gate?: () => Promise<void>): ReadableStream<Uint8Array> {
  let i = 0
  return new ReadableStream<Uint8Array>({
    async pull(controller) {
      if (gate) await gate()
      if (i < chunks.length) controller.enqueue(chunks[i++])
      else controller.close()
    },
  })
}

describe('AudioElementPlayer.playStream', () => {
  it('MediaSource path: appends chunks in order as they arrive, starts playback once, ends the stream, resolves on ended', async () => {
    FakeMediaSource.instances = []
    const { player, el, revoked } = makePlayer()
    const chunks = [new Uint8Array([1, 2]), new Uint8Array([3]), new Uint8Array([4, 5, 6])]
    const done = player.playStream(streamOf(chunks), 'audio/mpeg; charset=binary')
    let settled = false
    done.then(() => { settled = true })

    for (let i = 0; i < 10; i += 1) await flush()
    const ms = FakeMediaSource.instances[0]
    expect(ms.sourceBuffer!.appended.map((c) => Array.from(c))).toEqual([[1, 2], [3], [4, 5, 6]])
    expect(el.play).toHaveBeenCalledTimes(1)
    expect(ms.ended).toBe(true)
    expect(settled).toBe(false) // waits for the element to finish playing

    el.onended!(undefined)
    await done
    expect(revoked).toEqual(['blob:fake-1'])
    expect(el.removeAttribute).toHaveBeenCalledWith('src')
  })

  it('abort mid-stream rejects with AbortError, cancels the reader and pauses', async () => {
    FakeMediaSource.instances = []
    const { player, el } = makePlayer()
    let release!: () => void
    const gate = () => new Promise<void>((r) => { release = r })
    const chunks = [new Uint8Array([1]), new Uint8Array([2]), new Uint8Array([3])]
    const controller = new AbortController()
    const cancelled = vi.fn()
    const stream = new ReadableStream<Uint8Array>({
      async pull(c) {
        await gate()
        if (chunks.length) c.enqueue(chunks.shift()!)
        else c.close()
      },
      cancel: cancelled,
    })
    const done = player.playStream(stream, 'audio/mpeg', { signal: controller.signal })
    await flush()
    release()
    for (let i = 0; i < 5; i += 1) await flush()
    expect(FakeMediaSource.instances[0].sourceBuffer!.appended).toHaveLength(1)

    controller.abort()
    await expect(done).rejects.toMatchObject({ name: 'AbortError' })
    expect(el.pause).toHaveBeenCalled()
    release()
    await flush()
    expect(cancelled).toHaveBeenCalled()
  })

  it('stop() during a stream rejects the pending playStream()', async () => {
    FakeMediaSource.instances = []
    const { player, el } = makePlayer()
    const done = player.playStream(streamOf([new Uint8Array([1])]), 'audio/mpeg')
    for (let i = 0; i < 5; i += 1) await flush()
    player.stop()
    await expect(done).rejects.toMatchObject({ name: 'AbortError' })
    expect(el.pause).toHaveBeenCalled()
  })

  it('falls back to buffering the whole stream into a Blob when the type is unsupported', async () => {
    FakeMediaSource.instances = []
    const { player, el, registry } = makePlayer()
    const done = player.playStream(streamOf([new Uint8Array([1, 2]), new Uint8Array([3])]), 'audio/wav')
    for (let i = 0; i < 10; i += 1) await flush()
    expect(FakeMediaSource.instances).toHaveLength(0)
    expect(el.play).toHaveBeenCalledTimes(1)
    const blob = registry.get(el.src) as Blob
    expect(blob).toBeInstanceOf(Blob)
    expect(blob.type).toBe('audio/wav')
    expect(new Uint8Array(await blob.arrayBuffer())).toEqual(new Uint8Array([1, 2, 3]))
    el.onended!(undefined)
    await done
  })

  it('falls back when MediaSource does not exist at all (Safari-like)', async () => {
    const { player, el, registry } = makePlayer(null)
    const done = player.playStream(streamOf([new Uint8Array([9])]), 'audio/mpeg')
    for (let i = 0; i < 10; i += 1) await flush()
    expect(registry.get(el.src)).toBeInstanceOf(Blob)
    el.onended!(undefined)
    await done
  })

  it('an aborted fallback rejects with AbortError without playing', async () => {
    const { player, el } = makePlayer(null)
    const controller = new AbortController()
    controller.abort()
    await expect(player.playStream(streamOf([new Uint8Array([9])]), 'audio/mpeg', { signal: controller.signal })).rejects.toMatchObject({ name: 'AbortError' })
    expect(el.play).not.toHaveBeenCalled()
  })
})

describe('AudioElementPlayer.play', () => {
  it('plays a buffer through the one owned element and stop() aborts it', async () => {
    const { player, el } = makePlayer()
    const done = player.play({ audio: new Uint8Array([1, 2, 3]), contentType: 'audio/mpeg' })
    await flush()
    expect(el.play).toHaveBeenCalledTimes(1)
    expect(player.element).toBe(el)
    player.stop()
    await expect(done).rejects.toMatchObject({ name: 'AbortError' })
  })
})
