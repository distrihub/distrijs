import type { Vad } from '@distri/core';

/**
 * Loaded lazily: `@ricky0123/vad-web` (and its `onnxruntime-web` dependency)
 * are OPTIONAL peer dependencies of `@distri/state`, pulled in by auto mode
 * and full duplex only. The specifier is kept in a variable so bundlers leave
 * the import alone.
 */
const VAD_SPECIFIER = '@ricky0123/vad-web';

// Structural typing for the slice of vad-web 0.0.x we use (see its
// `index.d.ts`: `NonRealTimeVAD`, `Message`, `baseAssetPath`). We build a
// `NonRealTimeVAD` for its model + `FrameProcessor` and feed it our own 16 kHz
// frames, so auto mode never opens a second microphone.
interface VadWebModule {
  baseAssetPath: string;
  Message: { SpeechStart: string; SpeechRealStart: string; SpeechEnd: string; VADMisfire: string; FrameProcessed: string };
  /** `NonRealTimeVAD.new(options)` is a static factory, hence the property form. */
  NonRealTimeVAD: {
    new: (options?: Record<string, unknown>) => Promise<NonRealTimeVadLike>;
  };
}
interface FrameProcessorLike {
  resume: () => void;
  pause?: (handleEvent: (event: { msg: string }) => void) => void;
  process: (frame: Float32Array, handleEvent: (event: { msg: string }) => void) => Promise<void>;
}
interface NonRealTimeVadLike {
  frameProcessor: FrameProcessorLike;
  frameSamples: number;
}

let modulePromise: Promise<VadWebModule> | null = null;

export function loadVadWeb(): Promise<VadWebModule> {
  if (!modulePromise) {
    modulePromise = import(/* @vite-ignore */ /* webpackIgnore: true */ VAD_SPECIFIER)
      .then((mod: unknown) => (mod as { default?: VadWebModule }).default ?? (mod as VadWebModule))
      .catch((err: unknown) => {
        modulePromise = null;
        throw new Error(
          `Auto mode needs the optional peer dependencies "${VAD_SPECIFIER}" and "onnxruntime-web" (${err instanceof Error ? err.message : String(err)})`,
        );
      });
  }
  return modulePromise;
}

export interface SileroVadOptions {
  /** Where `silero_vad_legacy.onnx` and the onnxruntime `.wasm` files are served from (with or without a trailing slash). */
  assetsBaseUrl?: string;
  /** Override for the onnxruntime WASM directory when it differs from `assetsBaseUrl`. */
  onnxWASMBasePath?: string;
  /** Override for the model file URL. */
  modelURL?: string;
  positiveSpeechThreshold?: number;
  negativeSpeechThreshold?: number;
  /** Silence after speech before `onSpeechEnd`. Default 600 (vad-web default is 1400, too slow for turn-taking). */
  redemptionMs?: number;
  minSpeechMs?: number;
}

/**
 * Silero voice activity detection over the session's own PCM16 16 kHz frames.
 *
 * Uses `NonRealTimeVAD.new()` for the model and `FrameProcessor` (the only
 * public exports that let us feed audio ourselves), re-buffering our 100 ms
 * frames into the processor's frame size (1536 samples for the legacy model).
 * `options.vad.assetsBaseUrl` maps to `modelURL` / `ort.env.wasm.wasmPaths`.
 */
export class SileroVad implements Vad {
  private vad: NonRealTimeVadLike | null = null;
  private buffer = new Float32Array(0);
  private filled = 0;
  private chain: Promise<void> = Promise.resolve();
  private onSpeechStart: (() => void) | null = null;
  private onSpeechEnd: (() => void) | null = null;
  private speaking = false;
  private messages: VadWebModule['Message'] | null = null;

  constructor(private readonly options: SileroVadOptions = {}) {}

  async start(onSpeechStart: () => void, onSpeechEnd: () => void): Promise<void> {
    this.onSpeechStart = onSpeechStart;
    this.onSpeechEnd = onSpeechEnd;
    if (this.vad) return;
    const mod = await loadVadWeb();
    const base = withSlash(this.options.assetsBaseUrl ?? mod.baseAssetPath);
    const wasmBase = withSlash(this.options.onnxWASMBasePath ?? base);
    const vad = await mod.NonRealTimeVAD.new({
      modelURL: this.options.modelURL ?? `${base}silero_vad_legacy.onnx`,
      ortConfig: (ort: { env: { wasm: { wasmPaths: string } } }) => {
        ort.env.wasm.wasmPaths = wasmBase;
      },
      ...(this.options.positiveSpeechThreshold !== undefined && { positiveSpeechThreshold: this.options.positiveSpeechThreshold }),
      ...(this.options.negativeSpeechThreshold !== undefined && { negativeSpeechThreshold: this.options.negativeSpeechThreshold }),
      redemptionMs: this.options.redemptionMs ?? 600,
      ...(this.options.minSpeechMs !== undefined && { minSpeechMs: this.options.minSpeechMs }),
    });
    this.messages = mod.Message;
    this.buffer = new Float32Array(vad.frameSamples);
    this.filled = 0;
    vad.frameProcessor.resume();
    this.vad = vad;
  }

  processFrame(pcm16: Int16Array): void {
    const vad = this.vad;
    if (!vad) return;
    for (let i = 0; i < pcm16.length; i += 1) {
      this.buffer[this.filled++] = pcm16[i] / 32768;
      if (this.filled >= this.buffer.length) {
        const frame = this.buffer;
        this.buffer = new Float32Array(frame.length);
        this.filled = 0;
        this.chain = this.chain
          .then(() => (this.vad === vad ? vad.frameProcessor.process(frame, (e) => this.handleEvent(e)) : undefined))
          .catch(() => undefined);
      }
    }
  }

  private handleEvent(event: { msg: string }): void {
    const m = this.messages;
    if (!m) return;
    if (event.msg === m.SpeechStart) {
      if (!this.speaking) {
        this.speaking = true;
        this.onSpeechStart?.();
      }
    } else if (event.msg === m.SpeechEnd || event.msg === m.VADMisfire) {
      if (this.speaking) {
        this.speaking = false;
        this.onSpeechEnd?.();
      }
    }
  }

  stop(): void {
    const vad = this.vad;
    this.vad = null;
    this.filled = 0;
    if (vad?.frameProcessor.pause) {
      try {
        vad.frameProcessor.pause(() => undefined);
      } catch {
        // ignore
      }
    }
    if (this.speaking) {
      this.speaking = false;
      this.onSpeechEnd?.();
    }
    this.onSpeechStart = null;
    this.onSpeechEnd = null;
  }
}

function withSlash(path: string): string {
  return path.endsWith('/') ? path : `${path}/`;
}
