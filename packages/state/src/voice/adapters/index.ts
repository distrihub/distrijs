import type { SttAdapter, SttProvider } from '@distri/core';
import { DeepgramAdapter } from './DeepgramAdapter';
import { AzureSpeechAdapter } from './AzureSpeechAdapter';

export { DeepgramAdapter } from './DeepgramAdapter';
export { AzureSpeechAdapter, loadAzureSpeechSdk } from './AzureSpeechAdapter';
export { FakeSttAdapter } from './FakeSttAdapter';
export type { FakeSttAdapterOptions } from './FakeSttAdapter';

export type SttAdapterFactory = (provider: SttProvider) => SttAdapter;

/** Default factory: picks the adapter by the `provider` field of the token response. */
export const createSttAdapter: SttAdapterFactory = (provider) => {
  switch (provider) {
    case 'deepgram':
      return new DeepgramAdapter();
    case 'azure_speech':
    case 'azure':
      return new AzureSpeechAdapter();
    default:
      throw new Error(`No streaming STT adapter for provider "${provider}"`);
  }
};
