// ========== Streaming voice types ==========
//
// Wire contract for `POST /v1/audio/stt/token` / `POST /v1/audio/stt/usage`
// and the framework-agnostic interfaces `@distri/state`'s `VoiceSession`
// is built on. See `distri-cloud/docs/specs/2026-09-06-voice-sessions-cloud.md`
// §1.1 (wire format) and §2 (client design).

/** Streaming STT providers the token endpoint can mint for (`azure_speech`, `deepgram`, `assemblyai`; open for new ones). */
export type SttProvider = string;

/** Body of `POST /v1/audio/stt/token`. Both fields optional. */
export interface SttTokenRequest {
  /** `provider/model`, e.g. `azure_speech/realtime`. Omit for the workspace's first configured streaming STT model. */
  model?: string;
  /** BCP-47 language tag, e.g. `en-US`. */
  language?: string;
}

/** Provider-specific connect hints returned with a token. Never contains a key. */
export interface SttConnectHints {
  /** Provider WebSocket URL (Deepgram, AssemblyAI). */
  url?: string;
  /** Azure Speech region. */
  region?: string;
  language?: string;
  /** Audio encoding the provider expects. Always `pcm16` today. */
  encoding?: string;
  /** Sample rate the provider expects. Always 16000 today. */
  sample_rate?: number;
}

/** `201` body of `POST /v1/audio/stt/token`. */
export interface SttTokenResponse {
  /** distri-issued id; key for the usage report. */
  token_id: string;
  provider: SttProvider;
  model: string;
  /** Short-lived provider credential the browser hands to the provider socket. */
  token: string;
  /** ISO timestamp. */
  expires_at: string;
  /** `true` → mint again for every connection (AssemblyAI). */
  single_use: boolean;
  connect: SttConnectHints;
}

/** Body of `POST /v1/audio/stt/usage` → `204`. */
export interface SttUsageReport {
  token_id: string;
  /** Cumulative captured audio for this token, in milliseconds. Idempotent (server keeps the max). */
  audio_ms: number;
}

export type VoiceState = 'idle' | 'ready' | 'listening' | 'finalizing' | 'thinking' | 'speaking' | 'error';

export type VoiceTurnMode = 'hold' | 'auto' | 'manual';

export type VoiceDuplex = 'half' | 'full';

/**
 * A streaming speech-to-text connection. One instance per provider socket.
 * The session assigns the `on*` callbacks before `connect()`.
 */
export interface SttAdapter {
  readonly provider: SttProvider;
  /** Open the provider socket with a freshly minted token. Resolves once audio can be sent. */
  connect(token: SttTokenResponse): Promise<void>;
  /** Send one PCM16 mono frame at the provider's sample rate. Dropped when not connected. */
  pushFrame(pcm16: Int16Array): void;
  /** Ask the provider to flush pending audio into a final transcript. Must eventually call `onFinalized`. */
  finalize(): void;
  /** Provider keep-alive for an idle socket (Deepgram). Optional. */
  keepAlive?(): void;
  /** Swap the credential on a live connection (Azure). Optional; when absent the session reconnects. */
  refreshToken?(token: SttTokenResponse): void;
  /** Close the socket. Safe to call twice. */
  close(): void;

  onInterim?: (text: string) => void;
  onFinal?: (text: string) => void;
  /** The provider has finished flushing after `finalize()`. */
  onFinalized?: () => void;
  onError?: (error: Error) => void;
  onClose?: () => void;
}

/**
 * Voice activity detection fed with the session's own PCM16 16 kHz frames
 * (`processFrame`). `SileroVad` in `@distri/state` is the default; `FakeVad`
 * is for tests. Used by auto mode and full duplex only.
 */
export interface Vad {
  start(onSpeechStart: () => void, onSpeechEnd: () => void): Promise<void>;
  /** Feed one mic frame. Optional for VADs that own their own capture. */
  processFrame?(pcm16: Int16Array): void;
  stop(): void;
}

export type SpeakFn = (sentence: string, opts: { signal: AbortSignal }) => Promise<void>;

/**
 * Something that can speak one sentence. `speak` is the minimal contract. A
 * speaker that also implements `synthesize` + `play` lets the queue synthesize
 * sentence N+1 while N plays (the latency win of §2.6).
 */
export interface VoiceSpeaker {
  speak: SpeakFn;
  synthesize?: (sentence: string, opts: { signal: AbortSignal }) => Promise<unknown>;
  play?: (item: unknown, opts: { signal: AbortSignal }) => Promise<void>;
}

/** TTS defaults used when the session speaks through the server (`useTts`). */
export interface TtsConfig {
  /** Use Distri server-side TTS ('distri') or browser SpeechSynthesis ('browser'). Defaults to 'distri'. */
  mode?: 'distri' | 'browser';
  /** Default voice to use when not specified per-request. */
  defaultVoice?: string;
  /** Default speed multiplier (0.25–4.0 for Distri, 0.1–10 for browser). */
  defaultSpeed?: number;
  /** Default provider (only used in 'distri' mode). */
  defaultProvider?: string;
  /** Default model (only used in 'distri' mode). */
  defaultModel?: string;
}

export interface VoiceSttOptions {
  /** `provider/model`, e.g. `azure_speech/realtime`. */
  model?: string;
  language?: string;
  /** Host-supplied adapter (or a test fake). When set the provider factory is bypassed. */
  adapter?: SttAdapter;
}

export interface VoiceTtsOptions {
  /** Host-supplied synthesizer; awaited per sentence and aborted on interrupt. */
  speak?: SpeakFn;
  config?: TtsConfig;
  /**
   * Use `POST /audio/speech` with `stream: true` and play through MediaSource
   * as chunks arrive, falling back to the buffered response on error or where
   * MediaSource is unsupported. Default `true`. Ignored when `speak` is given.
   */
  stream?: boolean;
}

export interface VoiceTurnOptions {
  /** Default `hold`. */
  mode?: VoiceTurnMode;
  /** auto: commit this long after the last final transcript. Default 900. */
  silenceMs?: number;
  /** auto: wait this long instead when the transcript ends in a conjunction. Default 2500. */
  maxSilenceMs?: number;
  /** hold: a press shorter than this is a tap and toggles manual listening. Default 250. */
  tapMs?: number;
  /** hold: commit even if the provider has not confirmed the flush after this long. Default 1500. */
  finalizeTimeoutMs?: number;
  /** Keyboard key (KeyboardEvent.code) that acts as the push-to-talk button. */
  pushToTalkKey?: string;
  /** Close an idle STT socket after this long. Default 20000. */
  idleCloseMs?: number;
}

export interface VoiceSessionOptions {
  stt?: VoiceSttOptions;
  /** `false` → STT-only voice input. */
  tts?: false | VoiceTtsOptions;
  turn?: VoiceTurnOptions;
  /** `half` (default): mic frames are dropped while speaking. */
  duplex?: VoiceDuplex;
  /** `true`: hand the committed transcript to `onReview` instead of sending it. */
  review?: boolean;
  /** Receives the committed transcript when `review` is set. */
  onReview?: (text: string) => void;
  /**
   * Auto mode and full duplex only. `assetsBaseUrl` is where the host serves
   * the Silero model (`silero_vad_legacy.onnx`) and the onnxruntime `.wasm`
   * files; `onnxWASMBasePath` overrides the latter.
   */
  vad?: { assetsBaseUrl?: string; onnxWASMBasePath?: string };
  onError?: (error: Error) => void;
}

export interface VoiceTranscript {
  interim: string;
  finals: string[];
}

export interface VoicePlayback {
  spokenSentences: number;
  totalSentences: number;
}

export interface VoiceSnapshot {
  state: VoiceState;
  transcript: VoiceTranscript;
  playback: VoicePlayback;
  error: Error | null;
  /** The effective turn mode — `manual` after a tap in hold mode. */
  mode: VoiceTurnMode;
}
