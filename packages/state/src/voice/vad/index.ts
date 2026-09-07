import type { Vad } from '@distri/core';
import { SileroVad, type SileroVadOptions } from './SileroVad';

export { SileroVad, loadVadWeb } from './SileroVad';
export type { SileroVadOptions } from './SileroVad';
export { FakeVad } from './FakeVad';

export type VadFactory = (options: SileroVadOptions) => Vad;

/** Default factory: Silero over vad-web, loaded lazily on first `start()`. */
export const createVad: VadFactory = (options) => new SileroVad(options);
