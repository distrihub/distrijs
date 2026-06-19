import type { ContextHealth } from '@distri/core';
import { contextUsageColor } from './contextColors';

interface ContextIndicatorProps {
  contextHealth: ContextHealth | null;
  isCompacting?: boolean;
  className?: string;
}

// Animation keyframes shared with ContextUsagePanel — registered once.
if (typeof document !== 'undefined' && !document.getElementById('distri-ctx-anim-indicator')) {
  const style = document.createElement('style');
  style.id = 'distri-ctx-anim-indicator';
  style.textContent = `
    @keyframes distri-ctx-indicator-shimmer {
      0%   { background-position: -60% 0; }
      100% { background-position: 160% 0; }
    }
    @keyframes distri-ctx-indicator-dots {
      0%   { opacity: 0.3; }
      50%  { opacity: 1; }
      100% { opacity: 0.3; }
    }
  `;
  document.head.appendChild(style);
}

/**
 * Visual indicator for context window health.
 *
 * Shows a progress bar representing context usage and compaction status.
 * Can be placed in a chat header, sidebar, or status bar.
 *
 * Usage:
 * ```tsx
 * const { contextHealth, isCompacting } = useContextHealth();
 * <ContextIndicator contextHealth={contextHealth} isCompacting={isCompacting} />
 * ```
 */
export function ContextIndicator({
  contextHealth,
  isCompacting = false,
  className = '',
}: ContextIndicatorProps) {
  if (!contextHealth) return null;

  const percentage = Math.round(contextHealth.usage_ratio * 100);
  const color = contextUsageColor(contextHealth.usage_ratio);
  const tierLabel = contextHealth.last_compaction?.tier;

  return (
    <div className={`distri-context-indicator ${className}`} title={`Context: ${percentage}% used`}>
      <div
        className="distri-context-bar-bg"
        style={{
          width: '100%',
          height: 4,
          background: '#e5e7eb',
          borderRadius: 2,
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        <div
          className="distri-context-bar-fill"
          style={{
            width: `${Math.min(percentage, 100)}%`,
            height: '100%',
            background: color,
            borderRadius: 2,
            transition: 'width 0.5s ease, background 0.3s ease',
          }}
        />
        {isCompacting && (
          <div
            aria-hidden
            style={{
              position: 'absolute',
              inset: 0,
              background:
                'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.7) 50%, transparent 100%)',
              backgroundSize: '60% 100%',
              backgroundRepeat: 'no-repeat',
              animation: 'distri-ctx-indicator-shimmer 1.2s linear infinite',
            }}
          />
        )}
      </div>
      <div
        className="distri-context-label"
        style={{
          fontSize: 11,
          color: '#6b7280',
          marginTop: 2,
          display: 'flex',
          justifyContent: 'space-between',
        }}
      >
        <span style={isCompacting ? { color: '#1d4ed8', fontWeight: 500 } : undefined}>
          {isCompacting ? (
            <>
              Compacting
              <span style={{ animation: 'distri-ctx-indicator-dots 1.4s ease-in-out infinite' }}>.</span>
              <span style={{ animation: 'distri-ctx-indicator-dots 1.4s ease-in-out 0.2s infinite' }}>.</span>
              <span style={{ animation: 'distri-ctx-indicator-dots 1.4s ease-in-out 0.4s infinite' }}>.</span>
            </>
          ) : (
            `${percentage}% context used`
          )}
        </span>
        {tierLabel && <span style={{ opacity: 0.7 }}>Last: {tierLabel}</span>}
      </div>
    </div>
  );
}
