import type { SttAdapter, SttTokenResponse } from '@distri/core';

interface DeepgramResults {
  type: 'Results';
  is_final?: boolean;
  speech_final?: boolean;
  from_finalize?: boolean;
  channel?: { alternatives?: Array<{ transcript?: string }> };
}

interface DeepgramOther {
  type: string;
  description?: string;
  message?: string;
}

type DeepgramMessage = DeepgramResults | DeepgramOther;

/**
 * Deepgram streaming STT over a raw browser WebSocket (no SDK).
 *
 * Auth: `new WebSocket(connect.url, ['bearer', token])`. Control messages:
 * `KeepAlive` while idle, `Finalize` on release, `CloseStream` on close.
 * Results arrive as JSON `Results` frames; `from_finalize: true` marks the
 * flush requested by `Finalize`.
 */
export class DeepgramAdapter implements SttAdapter {
  readonly provider = 'deepgram';
  private ws: WebSocket | null = null;
  private open = false;

  onInterim?: (text: string) => void;
  onFinal?: (text: string) => void;
  onFinalized?: () => void;
  onError?: (error: Error) => void;
  onClose?: () => void;

  constructor(private readonly WebSocketCtor: typeof WebSocket = globalThis.WebSocket) {}

  connect(token: SttTokenResponse): Promise<void> {
    const url = token.connect?.url;
    if (!url) return Promise.reject(new Error('Deepgram token response has no connect.url'));
    if (!this.WebSocketCtor) return Promise.reject(new Error('WebSocket is not available in this environment'));
    this.close();

    return new Promise<void>((resolve, reject) => {
      let settled = false;
      const ws = new this.WebSocketCtor(url, ['bearer', token.token]);
      ws.binaryType = 'arraybuffer';
      this.ws = ws;

      ws.onopen = () => {
        this.open = true;
        settled = true;
        resolve();
      };
      ws.onmessage = (event: MessageEvent) => {
        if (typeof event.data !== 'string') return;
        let msg: DeepgramMessage;
        try {
          msg = JSON.parse(event.data) as DeepgramMessage;
        } catch {
          return;
        }
        this.handleMessage(msg);
      };
      ws.onerror = () => {
        const err = new Error('Deepgram socket error');
        if (!settled) {
          settled = true;
          reject(err);
        }
        this.onError?.(err);
      };
      ws.onclose = (event: CloseEvent) => {
        const wasOpen = this.open;
        this.open = false;
        if (this.ws === ws) this.ws = null;
        if (!settled) {
          settled = true;
          reject(new Error(`Deepgram socket closed before open (${event.code})`));
        }
        if (wasOpen) this.onClose?.();
      };
    });
  }

  private handleMessage(msg: DeepgramMessage): void {
    if (msg.type === 'Results') {
      const r = msg as DeepgramResults;
      const transcript = r.channel?.alternatives?.[0]?.transcript ?? '';
      if (r.from_finalize) {
        if (transcript.trim()) this.onFinal?.(transcript);
        this.onFinalized?.();
        return;
      }
      if (r.is_final) {
        if (transcript.trim()) this.onFinal?.(transcript);
      } else if (transcript.trim()) {
        this.onInterim?.(transcript);
      }
      return;
    }
    if (msg.type === 'Error') {
      const o = msg as DeepgramOther;
      this.onError?.(new Error(o.description || o.message || 'Deepgram error'));
    }
  }

  pushFrame(pcm16: Int16Array): void {
    if (!this.ws || !this.open || this.ws.readyState !== 1) return;
    const bytes = pcm16.byteOffset === 0 && pcm16.byteLength === pcm16.buffer.byteLength
      ? pcm16.buffer
      : pcm16.buffer.slice(pcm16.byteOffset, pcm16.byteOffset + pcm16.byteLength);
    this.ws.send(bytes);
  }

  finalize(): void {
    this.sendControl({ type: 'Finalize' });
  }

  keepAlive(): void {
    this.sendControl({ type: 'KeepAlive' });
  }

  close(): void {
    const ws = this.ws;
    if (!ws) return;
    this.ws = null;
    if (this.open) {
      try {
        ws.send(JSON.stringify({ type: 'CloseStream' }));
      } catch {
        // ignore
      }
    }
    this.open = false;
    try {
      ws.close();
    } catch {
      // ignore
    }
  }

  private sendControl(message: { type: string }): void {
    if (!this.ws || !this.open || this.ws.readyState !== 1) return;
    this.ws.send(JSON.stringify(message));
  }
}
