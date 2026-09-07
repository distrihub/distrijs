import type { VoiceSpeaker } from '@distri/core';

export interface SpeechQueueCallbacks {
  onSentenceStart?: (sentence: string, index: number) => void;
  onSentenceEnd?: (sentence: string, index: number) => void;
  /** The queue ran empty (also fires after `abortAll()` while something was playing). */
  onDrained?: () => void;
  onError?: (error: Error, sentence: string) => void;
}

interface QueueItem {
  sentence: string;
  index: number;
  synth?: Promise<unknown>;
  resolve: () => void;
}

/**
 * Serializes sentence playback (spec §2.6).
 *
 * With a speaker that implements `synthesize` + `play`, sentence N+1 is
 * synthesized while N plays (exactly one in flight ahead). With a plain
 * `speak` speaker the sentences are simply played one after another.
 * `abortAll()` aborts the in-flight synthesis/playback and drops the rest.
 */
export class SpeechQueue {
  private items: QueueItem[] = [];
  private running = false;
  private controller = new AbortController();
  private total = 0;
  private spoken = 0;

  constructor(private speaker: VoiceSpeaker, private callbacks: SpeechQueueCallbacks = {}) {}

  setSpeaker(speaker: VoiceSpeaker): void {
    this.speaker = speaker;
  }

  setCallbacks(callbacks: SpeechQueueCallbacks): void {
    this.callbacks = callbacks;
  }

  get size(): number {
    return this.items.length;
  }

  get isSpeaking(): boolean {
    return this.running;
  }

  get totalSentences(): number {
    return this.total;
  }

  get spokenSentences(): number {
    return this.spoken;
  }

  /** Queue a sentence. Resolves once it has been spoken, skipped on error, or aborted. */
  enqueue(sentence: string): Promise<void> {
    return new Promise<void>((resolve) => {
      this.items.push({ sentence, index: this.total, resolve });
      this.total += 1;
      this.prefetch();
      if (!this.running) void this.run();
    });
  }

  /** Abort in-flight synthesis and playback and drop everything queued. */
  abortAll(): void {
    this.controller.abort();
    const dropped = this.items;
    this.items = [];
    dropped.forEach((item) => item.resolve());
    this.controller = new AbortController();
  }

  /** Abort and reset the counters for a new turn. */
  reset(): void {
    this.abortAll();
    this.total = 0;
    this.spoken = 0;
  }

  private canPrefetch(): boolean {
    return typeof this.speaker.synthesize === 'function' && typeof this.speaker.play === 'function';
  }

  /** Make sure the head item and the one after it have synthesis in flight. */
  private prefetch(): void {
    if (!this.canPrefetch()) return;
    const signal = this.controller.signal;
    for (let i = 0; i < Math.min(2, this.items.length); i += 1) {
      const item = this.items[i];
      if (!item.synth) {
        item.synth = this.speaker.synthesize!(item.sentence, { signal });
        // Attach a no-op catch so an early rejection never becomes unhandled;
        // the real handling happens where the promise is awaited.
        item.synth.catch(() => undefined);
      }
    }
  }

  private async run(): Promise<void> {
    this.running = true;
    try {
      while (this.items.length > 0) {
        const item = this.items[0];
        const signal = this.controller.signal;
        this.prefetch();
        this.callbacks.onSentenceStart?.(item.sentence, item.index);
        try {
          if (this.canPrefetch()) {
            const audio = await item.synth!;
            if (!signal.aborted) await this.speaker.play!(audio, { signal });
          } else {
            await this.speaker.speak(item.sentence, { signal });
          }
          if (!signal.aborted) {
            this.spoken += 1;
            this.callbacks.onSentenceEnd?.(item.sentence, item.index);
          }
        } catch (err) {
          if (!signal.aborted) {
            this.callbacks.onError?.(err instanceof Error ? err : new Error(String(err)), item.sentence);
          }
        }
        if (this.items[0] === item) this.items.shift();
        item.resolve();
      }
    } finally {
      this.running = false;
      this.callbacks.onDrained?.();
    }
  }
}
