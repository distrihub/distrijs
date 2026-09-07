/** Anything with audio bytes: a `TtsSpeechResponse`, or a Blob. */
export type PlayableAudio = Blob | { audio: ArrayBuffer | Uint8Array; contentType?: string };

/** The slice of `HTMLAudioElement` the player uses; a test can pass a fake. */
export interface AudioElementLike {
  src: string;
  preload: string;
  readonly paused: boolean;
  readonly ended: boolean;
  readonly currentSrc: string;
  play(): Promise<void> | void;
  pause(): void;
  removeAttribute(name: string): void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onended: ((this: any, ev: any) => any) | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onerror: ((this: any, ev: any) => any) | null;
}

export interface SourceBufferLike {
  readonly updating: boolean;
  appendBuffer(data: ArrayBufferView | ArrayBuffer): void;
  addEventListener(type: 'updateend' | 'error', listener: () => void, options?: { once?: boolean }): void;
}

export interface MediaSourceLike {
  readonly readyState: string;
  addSourceBuffer(type: string): SourceBufferLike;
  endOfStream(): void;
  addEventListener(type: 'sourceopen', listener: () => void, options?: { once?: boolean }): void;
}

export interface MediaSourceCtorLike {
  new (): MediaSourceLike;
  isTypeSupported(type: string): boolean;
}

export interface AudioElementPlayerOptions {
  /** Element factory (default `new Audio()`); tests pass a fake. */
  createElement?: () => AudioElementLike;
  /** MediaSource constructor (default `globalThis.MediaSource`); `null` forces the Blob fallback. */
  mediaSource?: MediaSourceCtorLike | null;
  createObjectURL?: (obj: unknown) => string;
  revokeObjectURL?: (url: string) => void;
}

/**
 * Plays audio through ONE owned `<audio>` element (spec §2.6), so the
 * browser's echo canceller sees the output and `stop()` can actually stop it.
 * `play()` takes a buffer; `playStream()` appends chunks to a MediaSource as
 * they arrive (phase 4) and falls back to buffering into a Blob where
 * MediaSource cannot play the type (Safari).
 */
export class AudioElementPlayer {
  private el: AudioElementLike | null = null;
  private currentUrl: string | null = null;
  private currentReject: ((err: Error) => void) | null = null;
  private readonly opts: AudioElementPlayerOptions;

  constructor(options: AudioElementPlayerOptions = {}) {
    this.opts = options;
  }

  /** The owned element, created lazily. */
  get element(): AudioElementLike {
    if (this.el) return this.el;
    let el: AudioElementLike;
    if (this.opts.createElement) {
      el = this.opts.createElement();
    } else {
      if (typeof Audio === 'undefined') {
        throw new Error('AudioElementPlayer requires a browser with HTMLAudioElement');
      }
      el = new Audio();
    }
    el.preload = 'auto';
    this.el = el;
    return el;
  }

  get isPlaying(): boolean {
    return Boolean(this.el && !this.el.paused && !this.el.ended && this.el.currentSrc);
  }

  private get mediaSourceCtor(): MediaSourceCtorLike | null {
    if (this.opts.mediaSource !== undefined) return this.opts.mediaSource;
    const ctor = (globalThis as unknown as { MediaSource?: MediaSourceCtorLike }).MediaSource;
    return ctor ?? null;
  }

  private createObjectURL(obj: unknown): string {
    if (this.opts.createObjectURL) return this.opts.createObjectURL(obj);
    return URL.createObjectURL(obj as Blob);
  }

  private revokeObjectURL(url: string): void {
    if (this.opts.revokeObjectURL) this.opts.revokeObjectURL(url);
    else URL.revokeObjectURL(url);
  }

  /** Play a complete buffer. A clip already playing is superseded. */
  play(audio: PlayableAudio, opts: { signal?: AbortSignal } = {}): Promise<void> {
    const blob = audio instanceof Blob
      ? audio
      : new Blob([audio.audio as BlobPart], { type: audio.contentType || 'audio/mpeg' });
    const el = this.element;
    this.stop();
    const url = this.createObjectURL(blob);
    this.currentUrl = url;

    return new Promise<void>((resolve, reject) => {
      if (opts.signal?.aborted) {
        this.cleanup();
        reject(abortError());
        return;
      }
      const finish = () => {
        el.onended = null;
        el.onerror = null;
        opts.signal?.removeEventListener('abort', onAbort);
        this.currentReject = null;
        this.cleanup();
      };
      const onAbort = () => {
        el.pause();
        finish();
        reject(abortError());
      };
      this.currentReject = (err) => {
        finish();
        reject(err);
      };
      el.onended = () => {
        finish();
        resolve();
      };
      el.onerror = () => {
        finish();
        reject(new Error('Audio playback failed'));
      };
      opts.signal?.addEventListener('abort', onAbort, { once: true });
      el.src = url;
      Promise.resolve(el.play()).catch((err) => {
        finish();
        reject(err instanceof Error ? err : new Error(String(err)));
      });
    });
  }

  /**
   * Play a chunked response as it arrives. MediaSource + SourceBuffer when
   * `MediaSource.isTypeSupported(contentType)`; otherwise the whole stream is
   * buffered into a Blob and handed to `play()`. Resolves on `ended`.
   */
  playStream(stream: ReadableStream<Uint8Array>, contentType: string, opts: { signal?: AbortSignal } = {}): Promise<void> {
    const type = (contentType.split(';')[0] || '').trim() || 'audio/mpeg';
    const MS = this.mediaSourceCtor;
    if (!MS || typeof MS.isTypeSupported !== 'function' || !MS.isTypeSupported(type)) {
      return this.playBuffered(stream, type, opts);
    }

    const el = this.element;
    this.stop();
    const mediaSource = new MS();
    const url = this.createObjectURL(mediaSource);
    this.currentUrl = url;
    const reader = stream.getReader();

    return new Promise<void>((resolve, reject) => {
      let finished = false;
      const finish = () => {
        finished = true;
        el.onended = null;
        el.onerror = null;
        opts.signal?.removeEventListener('abort', onAbort);
        this.currentReject = null;
        this.cleanup();
      };
      const fail = (err: unknown) => {
        if (finished) return;
        reader.cancel().catch(() => undefined);
        finish();
        reject(err instanceof Error ? err : new Error(String(err)));
      };
      const done = () => {
        if (finished) return;
        finish();
        resolve();
      };
      const onAbort = () => {
        el.pause();
        fail(abortError());
      };
      if (opts.signal?.aborted) {
        fail(abortError());
        return;
      }
      opts.signal?.addEventListener('abort', onAbort, { once: true });
      this.currentReject = (err) => {
        el.pause();
        fail(err);
      };
      el.onended = done;
      el.onerror = () => fail(new Error('Audio playback failed'));

      mediaSource.addEventListener('sourceopen', () => {
        void this.pump(mediaSource, type, reader, el, () => finished).then(
          (playedAnything) => {
            if (!playedAnything) done();
          },
          fail,
        );
      }, { once: true });
      el.src = url;
    });
  }

  /** Append chunks as they arrive; returns whether playback was started. */
  private async pump(
    mediaSource: MediaSourceLike,
    type: string,
    reader: ReadableStreamDefaultReader<Uint8Array>,
    el: AudioElementLike,
    isFinished: () => boolean,
  ): Promise<boolean> {
    const sourceBuffer = mediaSource.addSourceBuffer(type);
    const whenIdle = () => new Promise<void>((resolve) => {
      if (!sourceBuffer.updating) resolve();
      else sourceBuffer.addEventListener('updateend', () => resolve(), { once: true });
    });
    let started = false;
    for (;;) {
      const { value, done } = await reader.read();
      if (isFinished()) return started;
      if (done) break;
      if (!value || value.byteLength === 0) continue;
      await whenIdle();
      if (isFinished()) return started;
      sourceBuffer.appendBuffer(value);
      if (!started) {
        started = true;
        await Promise.resolve(el.play());
      }
    }
    await whenIdle();
    if (isFinished()) return started;
    if (mediaSource.readyState === 'open') mediaSource.endOfStream();
    return started;
  }

  private async playBuffered(stream: ReadableStream<Uint8Array>, type: string, opts: { signal?: AbortSignal }): Promise<void> {
    const reader = stream.getReader();
    const chunks: Uint8Array[] = [];
    for (;;) {
      if (opts.signal?.aborted) {
        reader.cancel().catch(() => undefined);
        throw abortError();
      }
      const { value, done } = await reader.read();
      if (done) break;
      if (value) chunks.push(value);
    }
    return this.play(new Blob(chunks as BlobPart[], { type }), opts);
  }

  /** Stop the current clip (rejects its pending `play()`/`playStream()` with an AbortError). */
  stop(): void {
    if (this.el) {
      try {
        this.el.pause();
      } catch {
        // ignore
      }
    }
    const reject = this.currentReject;
    this.currentReject = null;
    if (reject) reject(abortError());
    else this.cleanup();
  }

  dispose(): void {
    this.stop();
    if (this.el) {
      this.el.removeAttribute('src');
      this.el = null;
    }
  }

  private cleanup(): void {
    if (this.currentUrl) {
      this.revokeObjectURL(this.currentUrl);
      this.currentUrl = null;
    }
    if (this.el) {
      this.el.removeAttribute('src');
    }
  }
}

function abortError(): Error {
  const err = new Error('Playback aborted');
  err.name = 'AbortError';
  return err;
}
