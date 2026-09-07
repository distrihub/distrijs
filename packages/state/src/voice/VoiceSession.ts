import type {
  DistriChatMessage,
  SttAdapter,
  SttTokenRequest,
  SttTokenResponse,
  SttUsageReport,
  VoiceSessionOptions,
  VoiceSnapshot,
  VoiceSpeaker,
  VoiceState,
  VoiceTurnMode,
  VoiceTurnOptions,
} from '@distri/core';
import { SentenceChunker } from './SentenceChunker';
import { SpeechQueue } from './SpeechQueue';
import type { MicCaptureLike } from './MicCapture';
import { createSttAdapter, type SttAdapterFactory } from './adapters';

/** The slice of `ChatInstance` the session drives. */
export interface VoiceChatLike {
  sendMessage: (text: string) => Promise<void>;
  stopStreaming: () => void;
  subscribe: (listener: (event: DistriChatMessage) => void) => () => void;
}

/** The slice of `DistriClient` the session needs. */
export interface VoiceSttClient {
  sttToken: (request: SttTokenRequest) => Promise<SttTokenResponse>;
  sttUsage: (report: SttUsageReport) => Promise<void>;
}

/** Timing knobs that are policy constants in the spec; exposed for tests. */
export interface VoiceTiming {
  /** Deepgram keep-alive cadence while idle. Default 5000. */
  keepAliveMs?: number;
  /** Mint a fresh token this long after the last mint. Default 8 min. */
  tokenRefreshMs?: number;
  /** Usage report cadence. Default 60000. */
  usageIntervalMs?: number;
}

export interface VoiceSessionDeps {
  client: VoiceSttClient;
  chat: VoiceChatLike | null;
  mic: MicCaptureLike;
  /** `null` → STT only. */
  speaker: VoiceSpeaker | null;
  /** Chooses an adapter from the token's `provider`. Default `createSttAdapter`. */
  adapterFactory?: SttAdapterFactory;
  now?: () => number;
  setTimeout?: (fn: () => void, ms: number) => unknown;
  clearTimeout?: (handle: unknown) => void;
  timing?: VoiceTiming;
}

export type VoiceListener = (snapshot: VoiceSnapshot) => void;

const DEFAULT_TURN: Required<Omit<VoiceTurnOptions, 'pushToTalkKey'>> = {
  mode: 'hold',
  silenceMs: 900,
  maxSilenceMs: 2500,
  tapMs: 250,
  finalizeTimeoutMs: 1500,
  idleCloseMs: 20_000,
};

const CONJUNCTION_END = /\b(and|so|because|but|or|then|if|when|which|that)\s*[,.!?]*$/i;

/**
 * The voice state machine of spec §2.3–§2.6. Framework-agnostic: every
 * environment-dependent piece (mic, STT socket, speaker, clock, timers) is
 * injected, so the whole machine runs under fake timers in tests.
 *
 * Hold mode:
 * ```
 * idle ─prepare()/press()─▶ ready ─press()─▶ listening ─release()─▶ finalizing ─final─▶ thinking ─first sentence─▶ speaking ─drained─▶ ready
 * ```
 */
export class VoiceSession {
  private readonly listeners = new Set<VoiceListener>();
  private snap: VoiceSnapshot;

  private turn: Required<Omit<VoiceTurnOptions, 'pushToTalkKey'>> & { pushToTalkKey?: string };
  private tapListening = false;
  private continuousListening = false;

  private interim = '';
  private finals: string[] = [];

  private micOpen = false;
  private micStarting: Promise<void> | null = null;
  private adapter: SttAdapter | null = null;
  private adapterConnected = false;
  private connecting: Promise<void> | null = null;

  private token: SttTokenResponse | null = null;
  private tokenMintedAt = 0;
  private capturedMs = 0;
  private lastReportedMs = 0;

  private forwarding = false;
  private pressAt: number | null = null;
  private pendingRelease: { isTap: boolean } | null = null;

  private finalizeTimer: unknown = null;
  private idleTimer: unknown = null;
  private keepAliveTimer: unknown = null;
  private usageTimer: unknown = null;
  private tokenRefreshTimer: unknown = null;
  private autoCommitTimer: unknown = null;

  private readonly chunker = new SentenceChunker();
  private queue: SpeechQueue | null = null;
  private chatUnsub: (() => void) | null = null;
  private assistantMessageIds = new Set<string>();
  private turnActive = false;
  private runFinished = false;

  private pagehideHandler: (() => void) | null = null;
  private disposed = false;

  constructor(private deps: VoiceSessionDeps, private options: VoiceSessionOptions = {}) {
    this.turn = { ...DEFAULT_TURN, ...stripUndefined(options.turn ?? {}) };
    this.snap = {
      state: 'idle',
      transcript: { interim: '', finals: [] },
      playback: { spokenSentences: 0, totalSentences: 0 },
      error: null,
      mode: this.turn.mode,
    };
    this.setSpeaker(deps.speaker);
    this.setChat(deps.chat);
  }

  // ── public surface ─────────────────────────────────────────────────────

  get snapshot(): VoiceSnapshot {
    return this.snap;
  }

  get state(): VoiceState {
    return this.snap.state;
  }

  subscribe(listener: VoiceListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /** Re-bind to a different chat (the React hook calls this when `ChatInstance` identity changes). */
  setChat(chat: VoiceChatLike | null): void {
    if (this.chatUnsub) {
      this.chatUnsub();
      this.chatUnsub = null;
    }
    this.deps = { ...this.deps, chat };
    if (chat) {
      this.chatUnsub = chat.subscribe((event) => this.handleChatEvent(event));
    }
  }

  setSpeaker(speaker: VoiceSpeaker | null): void {
    this.deps = { ...this.deps, speaker };
    if (!speaker) {
      this.queue?.abortAll();
      this.queue = null;
      return;
    }
    if (this.queue) {
      this.queue.setSpeaker(speaker);
      return;
    }
    this.queue = new SpeechQueue(speaker, {
      onSentenceStart: () => {
        if (this.snap.state === 'thinking') this.setState('speaking');
        else this.publish();
      },
      onSentenceEnd: () => this.publish(),
      onDrained: () => {
        if (!this.turnActive) {
          this.publish();
          return;
        }
        if (this.runFinished) this.finishTurn();
        else if (this.snap.state === 'speaking') this.setState('thinking');
        else this.publish();
      },
      onError: (error) => this.options.onError?.(error),
    });
  }

  setOptions(options: VoiceSessionOptions): void {
    this.options = options;
    this.setTurn(options.turn ?? {});
  }

  setTurn(turn: Partial<VoiceTurnOptions>): void {
    const prevMode = this.turn.mode;
    this.turn = { ...this.turn, ...stripUndefined(turn) };
    if (this.turn.mode !== prevMode) {
      this.tapListening = false;
      this.publish();
    }
  }

  /** getUserMedia + mint + connect without listening (pre-warm on mount). */
  async prepare(): Promise<void> {
    try {
      await this.ensureMic();
      await this.ensureConnected();
      if (this.snap.state === 'idle' || this.snap.state === 'error') {
        this.clearError();
        this.setState('ready');
      }
      this.scheduleIdleClose();
    } catch (err) {
      this.fail(err);
    }
  }

  /** Hold mode: start a turn. Barges in when the assistant is thinking or speaking. */
  press(): void {
    if (this.disposed) return;
    if (this.snap.state === 'speaking' || this.snap.state === 'thinking') this.interrupt();
    if (this.snap.state === 'finalizing') return;
    if (this.snap.state === 'error') this.clearError();

    this.pressAt = this.now();
    this.pendingRelease = null;
    this.clearIdleTimers();
    if (this.forwarding) return; // tap mode: already listening, this press ends it on release
    this.setState('listening');
    void this.beginListening();
  }

  /** Hold mode: end the turn and send. A press shorter than `tapMs` toggles manual listening instead. */
  release(): void {
    if (this.pressAt === null) return;
    const duration = this.now() - this.pressAt;
    this.pressAt = null;
    const isTap = duration < this.turn.tapMs;
    if (!this.forwarding) {
      // Released before the mic/socket were ready: apply once they are.
      if (this.snap.state === 'listening') this.pendingRelease = { isTap };
      return;
    }
    this.applyRelease(isTap);
  }

  /** Drop the current turn without sending (slide-off-to-cancel). */
  cancel(): void {
    this.pressAt = null;
    this.pendingRelease = null;
    this.tapListening = false;
    this.forwarding = false;
    this.clearTimer('finalizeTimer');
    this.clearTimer('autoCommitTimer');
    this.finals = [];
    this.interim = '';
    if (this.snap.state === 'listening' || this.snap.state === 'finalizing') {
      this.setState('ready');
    } else {
      this.publish();
    }
    this.scheduleIdleClose();
  }

  /** Auto/manual: open the mic and listen continuously. */
  async start(): Promise<void> {
    if (this.disposed) return;
    if (this.snap.state === 'speaking' || this.snap.state === 'thinking') this.interrupt();
    this.continuousListening = true;
    this.clearIdleTimers();
    this.setState('listening');
    await this.beginListening();
  }

  /** Manual (and tap-to-talk): send what has been heard. */
  commitTurn(): void {
    if (this.snap.state !== 'listening') return;
    this.tapListening = false;
    this.beginFinalize();
  }

  /** Stop playback and the run. The shown message is never truncated. */
  interrupt(): void {
    this.queue?.abortAll();
    this.turnActive = false;
    this.runFinished = false;
    this.clearTimer('autoCommitTimer');
    this.deps.chat?.stopStreaming();
    if (this.snap.state === 'speaking' || this.snap.state === 'thinking') {
      this.setState('ready');
    } else {
      this.publish();
    }
  }

  /** Tear down mic, socket and playback; report usage. */
  stop(): void {
    this.continuousListening = false;
    this.forwarding = false;
    this.pressAt = null;
    this.pendingRelease = null;
    this.tapListening = false;
    this.turnActive = false;
    this.clearAllTimers();
    this.queue?.abortAll();
    this.closeSocket();
    if (this.micOpen) {
      this.micOpen = false;
      this.deps.mic.stop();
    }
    this.reportUsage();
    this.finals = [];
    this.interim = '';
    this.removePagehide();
    if (this.snap.state !== 'error') this.setState('idle');
    else this.publish();
  }

  /** `stop()` plus listener cleanup. */
  dispose(): void {
    this.stop();
    this.setChat(null);
    this.listeners.clear();
    this.disposed = true;
  }

  // ── listening ──────────────────────────────────────────────────────────

  private async beginListening(): Promise<void> {
    try {
      await this.ensureMic();
      await this.ensureConnected();
    } catch (err) {
      this.fail(err);
      return;
    }
    if (this.snap.state !== 'listening') return; // cancelled/stopped while connecting
    this.forwarding = true;
    this.publish();
    if (this.pendingRelease) {
      const { isTap } = this.pendingRelease;
      this.pendingRelease = null;
      this.applyRelease(isTap);
    }
  }

  private applyRelease(isTap: boolean): void {
    if (isTap && !this.tapListening) {
      this.tapListening = true;
      this.publish();
      return;
    }
    this.tapListening = false;
    this.beginFinalize();
  }

  private beginFinalize(): void {
    this.forwarding = false;
    this.clearTimer('autoCommitTimer');
    this.setState('finalizing');
    if (this.adapter && this.adapterConnected) {
      this.adapter.finalize();
      this.finalizeTimer = this.setTimeout(() => this.commit(), this.turn.finalizeTimeoutMs);
    } else {
      this.commit();
    }
  }

  private commit(): void {
    this.clearTimer('finalizeTimer');
    if (this.snap.state !== 'finalizing') return;
    const text = [...this.finals, this.interim].map((s) => s.trim()).filter(Boolean).join(' ');
    this.finals = [];
    this.interim = '';

    if (!text) {
      this.afterTurnWithoutReply();
      return;
    }
    if (this.options.review) {
      this.options.onReview?.(text);
      this.afterTurnWithoutReply();
      return;
    }
    const chat = this.deps.chat;
    if (!chat) {
      this.fail(new Error('VoiceSession has no chat bound; cannot send the transcript'));
      return;
    }
    this.beginTurn();
    this.setState('thinking');
    this.scheduleIdleClose();
    chat.sendMessage(text).then(
      () => this.endRun(),
      (err) => this.fail(err),
    );
  }

  private afterTurnWithoutReply(): void {
    if (this.continuousListening) {
      this.forwarding = true;
      this.setState('listening');
      return;
    }
    this.setState('ready');
    this.scheduleIdleClose();
  }

  private handleFrame(frame: Int16Array): void {
    if (!this.forwarding || !this.adapter || !this.adapterConnected) return;
    if ((this.options.duplex ?? 'half') === 'half' && this.snap.state === 'speaking') return;
    this.adapter.pushFrame(frame);
    const sampleRate = this.token?.connect?.sample_rate ?? 16000;
    this.capturedMs += (frame.length * 1000) / sampleRate;
  }

  private scheduleAutoCommit(): void {
    if (this.turn.mode !== 'auto' || !this.continuousListening || this.tapListening) return;
    this.clearTimer('autoCommitTimer');
    const text = [...this.finals, this.interim].join(' ').trim();
    const wait = CONJUNCTION_END.test(text) ? this.turn.maxSilenceMs : this.turn.silenceMs;
    this.autoCommitTimer = this.setTimeout(() => {
      if (this.snap.state === 'listening' && this.finals.length > 0) this.beginFinalize();
    }, wait);
  }

  // ── mic / socket / token ───────────────────────────────────────────────

  private async ensureMic(): Promise<void> {
    if (this.micOpen) return;
    if (!this.micStarting) {
      this.micStarting = this.deps.mic.start((frame) => this.handleFrame(frame)).then(
        () => {
          this.micOpen = true;
          this.micStarting = null;
          this.installPagehide();
        },
        (err) => {
          this.micStarting = null;
          throw err instanceof Error ? err : new Error(String(err));
        },
      );
    }
    await this.micStarting;
  }

  private async ensureConnected(): Promise<void> {
    if (this.adapter && this.adapterConnected) return;
    if (!this.connecting) {
      this.connecting = this.connect().finally(() => {
        this.connecting = null;
      });
    }
    await this.connecting;
  }

  private async connect(): Promise<void> {
    const token = await this.getToken();
    const adapter = this.options.stt?.adapter ?? (this.deps.adapterFactory ?? createSttAdapter)(token.provider);
    this.bindAdapter(adapter);
    this.adapter = adapter;
    await adapter.connect(token);
    if (this.adapter !== adapter) {
      // stop() ran while connecting
      adapter.close();
      return;
    }
    this.adapterConnected = true;
    this.scheduleTokenRefresh();
    this.startUsageTimer();
  }

  private async getToken(): Promise<SttTokenResponse> {
    const refreshMs = this.deps.timing?.tokenRefreshMs ?? 8 * 60_000;
    const current = this.token;
    if (current && !current.single_use && this.now() - this.tokenMintedAt < refreshMs && !this.isExpired(current)) {
      return current;
    }
    return this.mintToken();
  }

  private async mintToken(): Promise<SttTokenResponse> {
    // Land the previous token's minutes before switching.
    this.reportUsage();
    const request: SttTokenRequest = {};
    if (this.options.stt?.model) request.model = this.options.stt.model;
    if (this.options.stt?.language) request.language = this.options.stt.language;
    const token = await this.deps.client.sttToken(request);
    this.token = token;
    this.tokenMintedAt = this.now();
    this.capturedMs = 0;
    this.lastReportedMs = 0;
    return token;
  }

  private isExpired(token: SttTokenResponse): boolean {
    const expires = Date.parse(token.expires_at);
    if (Number.isNaN(expires)) return false;
    return this.now() >= expires - 5_000;
  }

  private bindAdapter(adapter: SttAdapter): void {
    adapter.onInterim = (text) => {
      if (this.adapter !== adapter) return;
      this.interim = text;
      this.clearTimer('autoCommitTimer');
      this.publish();
    };
    adapter.onFinal = (text) => {
      if (this.adapter !== adapter) return;
      if (text.trim()) this.finals = [...this.finals, text.trim()];
      this.interim = '';
      this.publish();
      if (this.snap.state === 'listening') this.scheduleAutoCommit();
    };
    adapter.onFinalized = () => {
      if (this.adapter !== adapter) return;
      if (this.snap.state === 'finalizing') this.commit();
    };
    adapter.onError = (error) => {
      if (this.adapter !== adapter) return;
      this.fail(error);
    };
    adapter.onClose = () => {
      if (this.adapter !== adapter) return;
      this.adapterConnected = false;
      this.clearIdleTimers();
      if (this.snap.state === 'finalizing') this.commit();
    };
  }

  private closeSocket(): void {
    const adapter = this.adapter;
    this.adapter = null;
    this.adapterConnected = false;
    this.clearIdleTimers();
    this.clearTimer('tokenRefreshTimer');
    if (adapter) {
      adapter.onClose = undefined;
      adapter.close();
    }
  }

  private scheduleIdleClose(): void {
    this.clearIdleTimers();
    if (!this.adapter || !this.adapterConnected || this.forwarding) return;
    this.idleTimer = this.setTimeout(() => {
      this.idleTimer = null;
      if (!this.forwarding && this.snap.state !== 'listening' && this.snap.state !== 'finalizing') {
        this.closeSocket();
      }
    }, this.turn.idleCloseMs);
    this.scheduleKeepAlive();
  }

  private scheduleKeepAlive(): void {
    const keepAliveMs = this.deps.timing?.keepAliveMs ?? 5_000;
    this.keepAliveTimer = this.setTimeout(() => {
      this.keepAliveTimer = null;
      if (!this.adapter || !this.adapterConnected || this.forwarding) return;
      this.adapter.keepAlive?.();
      this.scheduleKeepAlive();
    }, keepAliveMs);
  }

  private clearIdleTimers(): void {
    this.clearTimer('idleTimer');
    this.clearTimer('keepAliveTimer');
  }

  private scheduleTokenRefresh(): void {
    this.clearTimer('tokenRefreshTimer');
    if (!this.token || this.token.single_use) return;
    const refreshMs = this.deps.timing?.tokenRefreshMs ?? 8 * 60_000;
    const due = Math.max(0, refreshMs - (this.now() - this.tokenMintedAt));
    this.tokenRefreshTimer = this.setTimeout(() => {
      this.tokenRefreshTimer = null;
      void this.refreshToken();
    }, due);
  }

  private async refreshToken(): Promise<void> {
    if (!this.adapter || !this.adapterConnected) return;
    const adapter = this.adapter;
    try {
      const token = await this.mintToken();
      if (this.adapter === adapter && this.adapterConnected) {
        adapter.refreshToken?.(token);
        this.scheduleTokenRefresh();
      }
    } catch (err) {
      this.options.onError?.(err instanceof Error ? err : new Error(String(err)));
    }
  }

  // ── usage ──────────────────────────────────────────────────────────────

  private startUsageTimer(): void {
    if (this.usageTimer) return;
    const interval = this.deps.timing?.usageIntervalMs ?? 60_000;
    const tick = () => {
      this.usageTimer = null;
      this.reportUsage();
      if (this.micOpen || this.adapterConnected) this.usageTimer = this.setTimeout(tick, interval);
    };
    this.usageTimer = this.setTimeout(tick, interval);
  }

  /** Report cumulative captured audio for the current token if it grew since the last report. */
  reportUsage(): void {
    const token = this.token;
    if (!token) return;
    const audioMs = Math.round(this.capturedMs);
    if (audioMs <= this.lastReportedMs) return;
    this.lastReportedMs = audioMs;
    this.deps.client.sttUsage({ token_id: token.token_id, audio_ms: audioMs }).catch(() => undefined);
  }

  private installPagehide(): void {
    if (this.pagehideHandler) return;
    const w = globalThis as unknown as { addEventListener?: (t: string, h: () => void) => void; document?: unknown };
    if (typeof w.addEventListener !== 'function' || typeof w.document === 'undefined') return;
    this.pagehideHandler = () => this.reportUsage();
    w.addEventListener('pagehide', this.pagehideHandler);
  }

  private removePagehide(): void {
    if (!this.pagehideHandler) return;
    const w = globalThis as unknown as { removeEventListener?: (t: string, h: () => void) => void };
    w.removeEventListener?.('pagehide', this.pagehideHandler);
    this.pagehideHandler = null;
  }

  // ── reply / speaking ───────────────────────────────────────────────────

  private beginTurn(): void {
    this.chunker.reset();
    this.queue?.reset();
    this.assistantMessageIds = new Set();
    this.turnActive = true;
    this.runFinished = false;
  }

  private handleChatEvent(event: DistriChatMessage): void {
    if (!this.turnActive || !('type' in event)) return;
    switch (event.type) {
      case 'text_message_start':
        if (event.data.role === 'assistant') this.assistantMessageIds.add(event.data.message_id);
        break;
      case 'text_message_content':
        if (this.assistantMessageIds.has(event.data.message_id)) this.speakAll(this.chunker.push(event.data.delta));
        break;
      case 'text_message_end':
        if (this.assistantMessageIds.has(event.data.message_id)) this.speakAll(this.chunker.flush());
        break;
      case 'run_finished':
      case 'run_error':
        this.endRun();
        break;
      default:
        break;
    }
  }

  private speakAll(sentences: string[]): void {
    if (!this.queue || sentences.length === 0) return;
    sentences.forEach((s) => void this.queue!.enqueue(s));
    this.publish();
  }

  /** The run ended (event or promise). Speak the remainder; finish once the queue drains. */
  private endRun(): void {
    if (!this.turnActive) return;
    this.speakAll(this.chunker.flush());
    this.runFinished = true;
    if (!this.queue || (!this.queue.isSpeaking && this.queue.size === 0)) this.finishTurn();
  }

  private finishTurn(): void {
    this.turnActive = false;
    this.runFinished = false;
    if (this.snap.state !== 'thinking' && this.snap.state !== 'speaking') {
      this.publish();
      return;
    }
    if (this.continuousListening) {
      this.forwarding = true;
      this.setState('listening');
      return;
    }
    this.setState('ready');
    this.scheduleIdleClose();
  }

  // ── state / errors / timers ────────────────────────────────────────────

  private fail(err: unknown): void {
    const error = err instanceof Error ? err : new Error(String(err));
    this.forwarding = false;
    this.pressAt = null;
    this.pendingRelease = null;
    this.clearTimer('finalizeTimer');
    this.clearTimer('autoCommitTimer');
    this.snap = { ...this.snap, error, state: 'error' };
    this.publish();
    this.options.onError?.(error);
  }

  private clearError(): void {
    if (this.snap.error) this.snap = { ...this.snap, error: null };
  }

  private setState(state: VoiceState): void {
    this.snap = { ...this.snap, state };
    this.publish();
  }

  private publish(): void {
    this.snap = {
      state: this.snap.state,
      transcript: { interim: this.interim, finals: [...this.finals] },
      playback: {
        spokenSentences: this.queue?.spokenSentences ?? 0,
        totalSentences: this.queue?.totalSentences ?? 0,
      },
      error: this.snap.error,
      mode: this.tapListening ? 'manual' : this.turn.mode,
    };
    this.listeners.forEach((l) => l(this.snap));
  }

  private now(): number {
    return this.deps.now ? this.deps.now() : Date.now();
  }

  private setTimeout(fn: () => void, ms: number): unknown {
    return this.deps.setTimeout ? this.deps.setTimeout(fn, ms) : globalThis.setTimeout(fn, ms);
  }

  private clearTimer(
    key: 'finalizeTimer' | 'idleTimer' | 'keepAliveTimer' | 'usageTimer' | 'tokenRefreshTimer' | 'autoCommitTimer',
  ): void {
    const handle = this[key];
    if (handle === null || handle === undefined) return;
    this[key] = null;
    if (this.deps.clearTimeout) this.deps.clearTimeout(handle);
    else globalThis.clearTimeout(handle as ReturnType<typeof globalThis.setTimeout>);
  }

  private clearAllTimers(): void {
    this.clearTimer('finalizeTimer');
    this.clearTimer('idleTimer');
    this.clearTimer('keepAliveTimer');
    this.clearTimer('usageTimer');
    this.clearTimer('tokenRefreshTimer');
    this.clearTimer('autoCommitTimer');
  }
}

/** The effective turn mode for a snapshot; exported for hosts that render mode-specific controls. */
export function effectiveTurnMode(snapshot: VoiceSnapshot): VoiceTurnMode {
  return snapshot.mode;
}

function stripUndefined<T extends object>(obj: T): Partial<T> {
  const out: Partial<T> = {};
  (Object.keys(obj) as Array<keyof T>).forEach((k) => {
    if (obj[k] !== undefined) out[k] = obj[k];
  });
  return out;
}
