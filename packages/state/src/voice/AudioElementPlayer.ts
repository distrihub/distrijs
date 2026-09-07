/** Anything with audio bytes: a `TtsSpeechResponse`, or a Blob. */
export type PlayableAudio = Blob | { audio: ArrayBuffer | Uint8Array; contentType?: string };

/**
 * Plays audio buffers through ONE owned `<audio>` element (spec §2.6), so the
 * browser's echo canceller sees the output and `stop()` can actually stop it.
 * Browser only; `SpeechQueue` accepts anything with the same `play` shape for tests.
 */
export class AudioElementPlayer {
  private el: HTMLAudioElement | null = null;
  private currentUrl: string | null = null;
  private currentReject: ((err: Error) => void) | null = null;

  /** The owned element, created lazily. */
  get element(): HTMLAudioElement {
    if (!this.el) {
      if (typeof Audio === 'undefined') {
        throw new Error('AudioElementPlayer requires a browser with HTMLAudioElement');
      }
      this.el = new Audio();
      this.el.preload = 'auto';
    }
    return this.el;
  }

  get isPlaying(): boolean {
    return Boolean(this.el && !this.el.paused && !this.el.ended && this.el.currentSrc);
  }

  play(audio: PlayableAudio, opts: { signal?: AbortSignal } = {}): Promise<void> {
    const blob = audio instanceof Blob
      ? audio
      : new Blob([audio.audio as BlobPart], { type: audio.contentType || 'audio/mpeg' });
    const el = this.element;
    // A previous clip still playing is superseded.
    this.stop();
    const url = URL.createObjectURL(blob);
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
      el.play().catch((err) => {
        finish();
        reject(err instanceof Error ? err : new Error(String(err)));
      });
    });
  }

  /** Stop the current clip (rejects its pending `play()` with an AbortError). */
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
      URL.revokeObjectURL(this.currentUrl);
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
