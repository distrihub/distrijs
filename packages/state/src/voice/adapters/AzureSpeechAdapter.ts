import type { SttAdapter, SttTokenResponse } from '@distri/core';

/**
 * Loaded lazily: `microsoft-cognitiveservices-speech-sdk` is an OPTIONAL peer
 * dependency of `@distri/state`. The specifier is kept in a variable so
 * bundlers leave the import alone and hosts that never use Azure never pay
 * for it.
 */
const AZURE_SDK_SPECIFIER = 'microsoft-cognitiveservices-speech-sdk';

// Minimal structural typing for the parts of the SDK we touch. Avoids a hard
// type dependency on the optional package.
interface AzureSdk {
  SpeechConfig: { fromAuthorizationToken(token: string, region: string): AzureSpeechConfig };
  AudioStreamFormat: { getWaveFormatPCM(sampleRate: number, bits: number, channels: number): unknown };
  AudioInputStream: { createPushStream(format: unknown): AzurePushStream };
  AudioConfig: { fromStreamInput(stream: AzurePushStream): unknown };
  SpeechRecognizer: new (config: AzureSpeechConfig, audio: unknown) => AzureRecognizer;
  Connection: { fromRecognizer(r: AzureRecognizer): { openConnection(): void; close(): void } };
  ResultReason: { RecognizedSpeech: number; NoMatch: number };
}
interface AzureSpeechConfig { speechRecognitionLanguage: string }
interface AzurePushStream { write(buffer: ArrayBuffer): void; close(): void }
interface AzureRecognizer {
  authorizationToken: string;
  recognizing: ((s: unknown, e: { result: { text: string } }) => void) | undefined;
  recognized: ((s: unknown, e: { result: { text: string; reason: number } }) => void) | undefined;
  canceled: ((s: unknown, e: { errorDetails?: string; reason?: number }) => void) | undefined;
  sessionStopped: ((s: unknown, e: unknown) => void) | undefined;
  startContinuousRecognitionAsync(cb?: () => void, err?: (e: string) => void): void;
  stopContinuousRecognitionAsync(cb?: () => void, err?: (e: string) => void): void;
  close(): void;
}

let sdkPromise: Promise<AzureSdk> | null = null;

export function loadAzureSpeechSdk(): Promise<AzureSdk> {
  if (!sdkPromise) {
    sdkPromise = import(/* @vite-ignore */ /* webpackIgnore: true */ AZURE_SDK_SPECIFIER)
      .then((mod: unknown) => (mod as { default?: AzureSdk }).default ?? (mod as AzureSdk))
      .catch((err: unknown) => {
        sdkPromise = null;
        throw new Error(
          `Azure Speech adapter needs the optional peer dependency "${AZURE_SDK_SPECIFIER}" (${err instanceof Error ? err.message : String(err)})`,
        );
      });
  }
  return sdkPromise;
}

/**
 * Azure AI Speech streaming STT through the official SDK (lazy import).
 *
 * `SpeechConfig.fromAuthorizationToken(token, region)`, a PCM16 16 kHz push
 * stream, `recognizing` → interim, `recognized` → final. `finalize()` stops
 * continuous recognition (the SDK flushes) and reports `onFinalized` in the
 * stop callback; the next frame restarts recognition on the same connection.
 */
export class AzureSpeechAdapter implements SttAdapter {
  readonly provider = 'azure_speech';
  private recognizer: AzureRecognizer | null = null;
  private pushStream: AzurePushStream | null = null;
  private connection: { openConnection(): void; close(): void } | null = null;
  private recognizing = false;
  private starting = false;
  private stopping = false;

  onInterim?: (text: string) => void;
  onFinal?: (text: string) => void;
  onFinalized?: () => void;
  onError?: (error: Error) => void;
  onClose?: () => void;

  async connect(token: SttTokenResponse): Promise<void> {
    const region = token.connect?.region;
    if (!region) throw new Error('Azure Speech token response has no connect.region');
    this.close();
    const sdk = await loadAzureSpeechSdk();

    const config = sdk.SpeechConfig.fromAuthorizationToken(token.token, region);
    config.speechRecognitionLanguage = token.connect.language ?? 'en-US';
    const sampleRate = token.connect.sample_rate ?? 16000;
    const pushStream = sdk.AudioInputStream.createPushStream(sdk.AudioStreamFormat.getWaveFormatPCM(sampleRate, 16, 1));
    const audioConfig = sdk.AudioConfig.fromStreamInput(pushStream);
    const recognizer = new sdk.SpeechRecognizer(config, audioConfig);

    recognizer.recognizing = (_s, e) => {
      if (e.result.text) this.onInterim?.(e.result.text);
    };
    recognizer.recognized = (_s, e) => {
      if (e.result.reason === sdk.ResultReason.RecognizedSpeech && e.result.text) {
        this.onFinal?.(e.result.text);
      }
    };
    recognizer.canceled = (_s, e) => {
      if (e.errorDetails) this.onError?.(new Error(`Azure Speech: ${e.errorDetails}`));
    };
    recognizer.sessionStopped = () => {
      this.recognizing = false;
    };

    this.recognizer = recognizer;
    this.pushStream = pushStream;
    // Pre-warm the connection so the first press does not pay the handshake.
    try {
      this.connection = sdk.Connection.fromRecognizer(recognizer);
      this.connection.openConnection();
    } catch {
      this.connection = null;
    }
  }

  pushFrame(pcm16: Int16Array): void {
    if (!this.pushStream || !this.recognizer) return;
    // Copy so the SDK gets a plain, exclusively owned ArrayBuffer.
    const bytes: ArrayBuffer = new Int16Array(pcm16).buffer;
    this.pushStream.write(bytes);
    if (!this.recognizing && !this.starting && !this.stopping) this.startRecognition();
  }

  private startRecognition(): void {
    const recognizer = this.recognizer;
    if (!recognizer) return;
    this.starting = true;
    recognizer.startContinuousRecognitionAsync(
      () => {
        this.starting = false;
        this.recognizing = true;
      },
      (err) => {
        this.starting = false;
        this.onError?.(new Error(`Azure Speech start failed: ${err}`));
      },
    );
  }

  finalize(): void {
    const recognizer = this.recognizer;
    if (!recognizer || (!this.recognizing && !this.starting)) {
      this.onFinalized?.();
      return;
    }
    this.stopping = true;
    recognizer.stopContinuousRecognitionAsync(
      () => {
        this.stopping = false;
        this.recognizing = false;
        this.onFinalized?.();
      },
      (err) => {
        this.stopping = false;
        this.recognizing = false;
        this.onError?.(new Error(`Azure Speech stop failed: ${err}`));
        this.onFinalized?.();
      },
    );
  }

  refreshToken(token: SttTokenResponse): void {
    if (this.recognizer) this.recognizer.authorizationToken = token.token;
  }

  close(): void {
    const recognizer = this.recognizer;
    const pushStream = this.pushStream;
    const connection = this.connection;
    const wasOpen = Boolean(recognizer);
    this.recognizer = null;
    this.pushStream = null;
    this.connection = null;
    this.recognizing = false;
    this.starting = false;
    this.stopping = false;
    try {
      pushStream?.close();
      connection?.close();
      recognizer?.close();
    } catch {
      // ignore
    }
    if (wasOpen) this.onClose?.();
  }
}
