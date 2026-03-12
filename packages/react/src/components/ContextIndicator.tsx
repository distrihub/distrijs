import type { ContextHealth } from '@distri/core';

interface ContextIndicatorProps {
  contextHealth: ContextHealth | null;
  isCompacting?: boolean;
  className?: string;
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
  const color = getColor(contextHealth.usage_ratio);
  const tierLabel = contextHealth.last_compaction?.tier;

  return (
    <div className={`distri-context-indicator ${className}`} title={`Context: ${percentage}% used`}>
      <div className="distri-context-bar-bg" style={{ width: '100%', height: 4, background: '#e5e7eb', borderRadius: 2, overflow: 'hidden' }}>
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
      </div>
      <div className="distri-context-label" style={{ fontSize: 11, color: '#6b7280', marginTop: 2, display: 'flex', justifyContent: 'space-between' }}>
        <span>
          {isCompacting ? 'Compacting...' : `${percentage}% context used`}
        </span>
        {tierLabel && (
          <span style={{ opacity: 0.7 }}>
            Last: {tierLabel}
          </span>
        )}
      </div>
    </div>
  );
}

function getColor(ratio: number): string {
  if (ratio < 0.5) return '#22c55e';  // green
  if (ratio < 0.7) return '#eab308';  // yellow
  if (ratio < 0.85) return '#f97316'; // orange
  return '#ef4444';                    // red
}
