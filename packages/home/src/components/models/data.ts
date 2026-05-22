/**
 * Shared metadata for the redesigned models settings UI.
 *
 * - Capability colors / labels (the colored pills + chips).
 * - Per-provider monograms (the two-letter chips used across the
 *   catalog, providers split-pane, drawer header, and playgrounds).
 *
 * Provider extras (monogram, accent, docs) live here rather than in
 * the catalog so we can decorate any provider id without depending
 * on backend changes. Unknown providers fall back to a derived
 * monogram (first two letters of the id, uppercased).
 */

import type { ModelCapability } from '../../DistriHomeClient';

export interface CapabilityMeta {
  label: string;
  short: string;
}

export const CAPABILITY_META: Record<ModelCapability, CapabilityMeta> = {
  completion: { label: 'Completion', short: 'Completion' },
  tts: { label: 'Text to speech', short: 'TTS' },
  stt: { label: 'Speech to text', short: 'STT' },
  image: { label: 'Image', short: 'Image' },
};

export const ALL_CAPABILITIES: ModelCapability[] = ['completion', 'tts', 'stt', 'image'];

interface ProviderExtras {
  monogram: string;
  accent: string;
  docs?: string;
}

const PROVIDER_EXTRAS: Record<string, ProviderExtras> = {
  openai: { monogram: 'OA', accent: '#10A37F', docs: 'https://platform.openai.com/docs' },
  anthropic: { monogram: 'AN', accent: '#D97757', docs: 'https://docs.anthropic.com' },
  gemini: { monogram: 'GG', accent: '#4285F4', docs: 'https://ai.google.dev' },
  google_gemini: { monogram: 'GG', accent: '#4285F4', docs: 'https://ai.google.dev' },
  azure_ai_foundry: { monogram: 'AZ', accent: '#0078D4', docs: 'https://learn.microsoft.com/azure/ai-foundry' },
  alibaba_cloud: { monogram: 'AC', accent: '#FF6A00', docs: 'https://www.alibabacloud.com/help/en/model-studio' },
  aws_bedrock: { monogram: 'AW', accent: '#FF9900', docs: 'https://docs.aws.amazon.com/bedrock' },
  google_vertex: { monogram: 'GV', accent: '#4285F4', docs: 'https://cloud.google.com/vertex-ai' },
  elevenlabs: { monogram: 'EL', accent: '#000000', docs: 'https://elevenlabs.io/docs' },
  fal_ai: { monogram: 'FA', accent: '#5D3DFD', docs: 'https://fal.ai/docs' },
  xai: { monogram: 'XA', accent: '#1DA1F2' },
  mistral: { monogram: 'MI', accent: '#FF7000' },
  deepseek: { monogram: 'DS', accent: '#4D6BFE' },
  fireworks: { monogram: 'FW', accent: '#5D3DFD' },
  replicate: { monogram: 'RP', accent: '#EA580C' },
};

export function providerMonogram(providerId: string): string {
  return PROVIDER_EXTRAS[providerId]?.monogram ?? providerId.slice(0, 2).toUpperCase();
}

export function providerAccent(providerId: string): string {
  return PROVIDER_EXTRAS[providerId]?.accent ?? '#4FB5C3';
}

export function providerDocs(providerId: string): string | undefined {
  return PROVIDER_EXTRAS[providerId]?.docs;
}

export function formatContext(tokens?: number): string {
  if (!tokens) return '—';
  if (tokens >= 1_000_000) {
    const v = tokens / 1_000_000;
    return (v % 1 === 0 ? v : v.toFixed(1)) + 'M';
  }
  if (tokens >= 1_000) {
    const v = tokens / 1_000;
    return (v % 1 === 0 ? v : v.toFixed(1)) + 'K';
  }
  return String(tokens);
}
