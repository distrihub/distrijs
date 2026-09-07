/** What `VoiceSession` needs from a microphone. `MicCapture` is the browser implementation. */
export interface MicCaptureLike {
  /** Open the mic (first call asks for permission) and deliver PCM16 mono frames at 16 kHz. */
  start(onFrame: (pcm16: Int16Array) => void): Promise<void>;
  stop(): void;
}

export interface MicCaptureOptions {
  /** Output sample rate. Default 16000. */
  sampleRate?: number;
  /** Frame length in ms. Default 100. */
  frameMs?: number;
}

/**
 * Source of the AudioWorklet processor. Kept as a string and loaded through a
 * Blob URL so hosts have nothing to serve. It box-filters the input down to
 * the target rate and posts `Int16Array` frames of `frameSamples`.
 */
const WORKLET_SOURCE = `
class DistriPcm16Capture extends AudioWorkletProcessor {
  constructor(options) {
    super();
    const p = (options && options.processorOptions) || {};
    this.targetRate = p.targetRate || 16000;
    this.frameSamples = p.frameSamples || 1600;
    this.ratio = sampleRate / this.targetRate;
    this.nextOut = this.ratio;
    this.acc = 0;
    this.count = 0;
    this.buf = new Int16Array(this.frameSamples);
    this.n = 0;
  }
  process(inputs) {
    const ch = inputs[0] && inputs[0][0];
    if (!ch) return true;
    for (let i = 0; i < ch.length; i++) {
      this.acc += ch[i];
      this.count += 1;
      if (i + 1 >= this.nextOut) {
        const v = this.acc / this.count;
        this.acc = 0;
        this.count = 0;
        this.nextOut += this.ratio;
        const s = Math.max(-1, Math.min(1, v));
        this.buf[this.n++] = s < 0 ? s * 32768 : s * 32767;
        if (this.n >= this.frameSamples) {
          const out = this.buf;
          this.port.postMessage(out.buffer, [out.buffer]);
          this.buf = new Int16Array(this.frameSamples);
          this.n = 0;
        }
      }
    }
    this.nextOut -= ch.length;
    return true;
  }
}
registerProcessor('distri-pcm16-capture', DistriPcm16Capture);
`;

/** Main-thread downsampler used by the ScriptProcessor fallback. Same box filter as the worklet. */
export class Pcm16Downsampler {
  private readonly ratio: number;
  private nextOut: number;
  private acc = 0;
  private count = 0;
  private buf: Int16Array;
  private n = 0;

  constructor(inputRate: number, targetRate: number, private readonly frameSamples: number) {
    this.ratio = inputRate / targetRate;
    this.nextOut = this.ratio;
    this.buf = new Int16Array(frameSamples);
  }

  /** Feed float samples; returns completed frames. */
  push(input: Float32Array): Int16Array[] {
    const frames: Int16Array[] = [];
    for (let i = 0; i < input.length; i += 1) {
      this.acc += input[i];
      this.count += 1;
      if (i + 1 >= this.nextOut) {
        const v = this.acc / this.count;
        this.acc = 0;
        this.count = 0;
        this.nextOut += this.ratio;
        const s = Math.max(-1, Math.min(1, v));
        this.buf[this.n++] = s < 0 ? s * 32768 : s * 32767;
        if (this.n >= this.frameSamples) {
          frames.push(this.buf);
          this.buf = new Int16Array(this.frameSamples);
          this.n = 0;
        }
      }
    }
    this.nextOut -= input.length;
    return frames;
  }
}

/**
 * Browser microphone capture: `getUserMedia` with echo cancellation, an
 * AudioWorklet (inline Blob URL) downsampling to PCM16 mono 16 kHz. Falls back
 * to a ScriptProcessorNode where AudioWorklet is unavailable. `start()` resumes
 * the AudioContext, so call it from the user gesture (the press) on iOS.
 */
export class MicCapture implements MicCaptureLike {
  private readonly sampleRate: number;
  private readonly frameMs: number;
  private ctx: AudioContext | null = null;
  private stream: MediaStream | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private node: AudioNode | null = null;
  private onFrame: ((pcm16: Int16Array) => void) | null = null;
  private starting: Promise<void> | null = null;

  constructor(options: MicCaptureOptions = {}) {
    this.sampleRate = options.sampleRate ?? 16000;
    this.frameMs = options.frameMs ?? 100;
  }

  get isOpen(): boolean {
    return this.stream !== null;
  }

  async start(onFrame: (pcm16: Int16Array) => void): Promise<void> {
    this.onFrame = onFrame;
    if (this.starting) {
      await this.starting;
      return;
    }
    if (this.ctx && this.stream) {
      if (this.ctx.state === 'suspended') await this.ctx.resume();
      return;
    }
    this.starting = this.open();
    try {
      await this.starting;
    } finally {
      this.starting = null;
    }
  }

  private async open(): Promise<void> {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      throw new Error('Microphone capture is not supported in this environment');
    }
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
    });
    const AudioContextCtor: typeof AudioContext | undefined =
      (globalThis as unknown as { AudioContext?: typeof AudioContext }).AudioContext
      ?? (globalThis as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextCtor) {
      stream.getTracks().forEach((t) => t.stop());
      throw new Error('Web Audio is not supported in this environment');
    }
    const ctx = new AudioContextCtor();
    if (ctx.state === 'suspended') await ctx.resume();
    const source = ctx.createMediaStreamSource(stream);
    const frameSamples = Math.round((this.sampleRate * this.frameMs) / 1000);

    let node: AudioNode;
    if (ctx.audioWorklet && typeof AudioWorkletNode !== 'undefined') {
      const blob = new Blob([WORKLET_SOURCE], { type: 'application/javascript' });
      const url = URL.createObjectURL(blob);
      try {
        await ctx.audioWorklet.addModule(url);
      } finally {
        URL.revokeObjectURL(url);
      }
      const worklet = new AudioWorkletNode(ctx, 'distri-pcm16-capture', {
        numberOfInputs: 1,
        numberOfOutputs: 1,
        outputChannelCount: [1],
        processorOptions: { targetRate: this.sampleRate, frameSamples },
      });
      worklet.port.onmessage = (e: MessageEvent<ArrayBuffer>) => {
        this.onFrame?.(new Int16Array(e.data));
      };
      node = worklet;
    } else {
      const downsampler = new Pcm16Downsampler(ctx.sampleRate, this.sampleRate, frameSamples);
      const processor = ctx.createScriptProcessor(4096, 1, 1);
      processor.onaudioprocess = (e) => {
        const frames = downsampler.push(e.inputBuffer.getChannelData(0));
        frames.forEach((f) => this.onFrame?.(f));
      };
      node = processor;
    }

    source.connect(node);
    // The worklet outputs silence; connecting keeps the graph pulling.
    node.connect(ctx.destination);

    this.ctx = ctx;
    this.stream = stream;
    this.source = source;
    this.node = node;
  }

  stop(): void {
    this.onFrame = null;
    try {
      this.source?.disconnect();
      this.node?.disconnect();
    } catch {
      // ignore
    }
    this.stream?.getTracks().forEach((t) => t.stop());
    const ctx = this.ctx;
    this.ctx = null;
    this.stream = null;
    this.source = null;
    this.node = null;
    if (ctx && ctx.state !== 'closed') {
      void ctx.close().catch(() => undefined);
    }
  }
}
