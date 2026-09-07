import type { Vad } from '@distri/core';

/** Scripted VAD for tests and stories: records frames, emits speech start/end on demand. */
export class FakeVad implements Vad {
  started = false;
  startCount = 0;
  stopCount = 0;
  frames: Int16Array[] = [];
  private onSpeechStart: (() => void) | null = null;
  private onSpeechEnd: (() => void) | null = null;

  constructor(private readonly options: { onStart?: () => void | Promise<void> } = {}) {}

  async start(onSpeechStart: () => void, onSpeechEnd: () => void): Promise<void> {
    this.onSpeechStart = onSpeechStart;
    this.onSpeechEnd = onSpeechEnd;
    this.startCount += 1;
    await this.options.onStart?.();
    this.started = true;
  }

  processFrame(pcm16: Int16Array): void {
    if (this.started) this.frames.push(pcm16);
  }

  stop(): void {
    if (!this.started) return;
    this.started = false;
    this.stopCount += 1;
  }

  emitSpeechStart(): void {
    this.onSpeechStart?.();
  }

  emitSpeechEnd(): void {
    this.onSpeechEnd?.();
  }
}
