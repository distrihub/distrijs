/**
 * Small visual primitives reused across the redesigned models pages:
 * capability pills, provider monogram chips, and the pricing-cell
 * formatter that handles all four `ModelPricing` variants.
 */

import type { ModelCapability, ModelPricing } from '../../DistriHomeClient';
import { CAPABILITY_META, providerMonogram } from './data';

export function CapPill({ type, withDot = false }: { type: ModelCapability; withDot?: boolean }) {
  const meta = CAPABILITY_META[type];
  if (!meta) return null;
  return (
    <span className={`cap-pill ${type}`}>
      {withDot && <span className="dot" />}
      {meta.short}
    </span>
  );
}

export function MonoChip({ providerId, large = false }: { providerId: string; large?: boolean }) {
  return (
    <span className={large ? 'mono lg' : 'mono'} title={providerId}>
      {providerMonogram(providerId)}
    </span>
  );
}

/** Inline pricing cell. `kind="cached"` renders the cached-input column
 *  for completion pricing (and a dash otherwise). */
export function PricingCell({
  pricing,
  kind,
}: {
  pricing?: ModelPricing;
  kind?: 'cached';
}) {
  if (!pricing) return <span className="num em">—</span>;
  if (pricing.type === 'completion') {
    if (kind === 'cached') {
      return pricing.cached_input != null ? (
        <span className="num">
          <strong>${pricing.cached_input.toFixed(2)}</strong>
        </span>
      ) : (
        <span className="num em">—</span>
      );
    }
    return (
      <span className="num">
        <strong>${pricing.input.toFixed(2)}</strong>
        <span className="em" style={{ margin: '0 6px' }}>
          /
        </span>
        <strong>${pricing.output.toFixed(2)}</strong>
      </span>
    );
  }
  if (pricing.type === 'tts') {
    return (
      <span className="num">
        <strong>${pricing.per_1m_chars.toFixed(2)}</strong>{' '}
        <span className="em">/ 1M chars</span>
      </span>
    );
  }
  if (pricing.type === 'stt') {
    return (
      <span className="num">
        <strong>${pricing.per_minute.toFixed(3)}</strong> <span className="em">/ min</span>
      </span>
    );
  }
  if (pricing.type === 'image') {
    return (
      <span className="num">
        <strong>${pricing.per_image.toFixed(3)}</strong>
        <span className="em" style={{ marginLeft: 4 }}>
          / image
        </span>
      </span>
    );
  }
  return <span className="num em">—</span>;
}
