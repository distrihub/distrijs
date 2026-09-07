// Streaming voice (spec §2): the framework-agnostic session core.
export { VoiceSession, effectiveTurnMode } from './VoiceSession';
export type { VoiceSessionDeps, VoiceChatLike, VoiceSttClient, VoiceTiming, VoiceListener } from './VoiceSession';
export { SentenceChunker, cleanMarkdown } from './SentenceChunker';
export type { SentenceChunkerOptions } from './SentenceChunker';
export { SpeechQueue } from './SpeechQueue';
export type { SpeechQueueCallbacks } from './SpeechQueue';
export { AudioElementPlayer } from './AudioElementPlayer';
export type { PlayableAudio } from './AudioElementPlayer';
export { MicCapture, Pcm16Downsampler } from './MicCapture';
export type { MicCaptureLike, MicCaptureOptions } from './MicCapture';
export * from './adapters';
