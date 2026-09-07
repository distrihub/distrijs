import type { SttAdapter, SttTokenResponse } from '@distri/core';

export interface FakeSttAdapterOptions {
  provider?: string;
  /** Called from `connect()`; reject to simulate a failed handshake. */
  onConnect?: (adapter: FakeSttAdapter, token: SttTokenResponse) => void | Promise<void>;
  /** Called for every forwarded frame — emit interims from here to simulate live recognition. */
  onPushFrame?: (adapter: FakeSttAdapter, frame: Int16Array) => void;
  /** Called from `finalize()`; typically emits a final and then `emitFinalized()`. */
  onFinalize?: (adapter: FakeSttAdapter) => void;
}

/**
 * Scripted STT adapter for tests and stories. Records every call and lets the
 * script emit interim/final results on demand.
 */
export class FakeSttAdapter implements SttAdapter {
  readonly provider: string;
  connected = false;
  connectCount = 0;
  connectedWith: SttTokenResponse[] = [];
  frames: Int16Array[] = [];
  finalizeCount = 0;
  keepAliveCount = 0;
  closeCount = 0;
  refreshedTokens: SttTokenResponse[] = [];

  onInterim?: (text: string) => void;
  onFinal?: (text: string) => void;
  onFinalized?: () => void;
  onError?: (error: Error) => void;
  onClose?: () => void;

  constructor(private readonly options: FakeSttAdapterOptions = {}) {
    this.provider = options.provider ?? 'fake';
  }

  async connect(token: SttTokenResponse): Promise<void> {
    this.connectCount += 1;
    this.connectedWith.push(token);
    await this.options.onConnect?.(this, token);
    this.connected = true;
  }

  pushFrame(pcm16: Int16Array): void {
    if (!this.connected) return;
    this.frames.push(pcm16);
    this.options.onPushFrame?.(this, pcm16);
  }

  finalize(): void {
    this.finalizeCount += 1;
    this.options.onFinalize?.(this);
  }

  keepAlive(): void {
    this.keepAliveCount += 1;
  }

  refreshToken(token: SttTokenResponse): void {
    this.refreshedTokens.push(token);
  }

  close(): void {
    if (!this.connected) return;
    this.connected = false;
    this.closeCount += 1;
    this.onClose?.();
  }

  // ── script helpers ────────────────────────────────────────────────────

  emitInterim(text: string): void {
    this.onInterim?.(text);
  }

  emitFinal(text: string): void {
    this.onFinal?.(text);
  }

  emitFinalized(): void {
    this.onFinalized?.();
  }

  emitError(error: Error): void {
    this.onError?.(error);
  }

  /** Total audio forwarded so far, in ms at 16 kHz. */
  get forwardedMs(): number {
    return this.frames.reduce((ms, f) => ms + f.length / 16, 0);
  }
}
