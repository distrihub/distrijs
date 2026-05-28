import type { ContextBudget } from '@distri/core';
import { contextUsageColor } from './contextColors';

export interface CompactionLogItem {
  ts: number;
  before: number;
  after: number;
  tier: 'trim' | 'summarize' | 'reset';
  source: 'auto' | 'manual';
}

interface ContextUsagePanelProps {
  budget?: ContextBudget;
  compactions?: CompactionLogItem[];
  isCompacting?: boolean;
  onCompact?: () => void;
  className?: string;
}

/**
 * Detailed context usage breakdown for the compaction spec's
 * `<ContextIndicator />` companion panel. Renders the per-component
 * `ContextBudget` columns the CLI status line surfaces, plus the
 * compaction event log this session.
 *
 * Pairs with `useChatStateStore`:
 *
 * ```tsx
 * const budget = useChatStateStore(s => s.contextBudget);
 * const compactions = useChatStateStore(s => s.compactionEvents);
 * const { compact } = useChat({ agent, threadId });
 * return <ContextUsagePanel budget={budget} compactions={compactions} onCompact={compact} />;
 * ```
 */
export function ContextUsagePanel({
  budget,
  compactions = [],
  isCompacting = false,
  onCompact,
  className = '',
}: ContextUsagePanelProps) {
  if (!budget) {
    return (
      <div className={`distri-ctx-panel ${className}`} style={panelStyle}>
        <div style={{ ...labelStyle, opacity: 0.7 }}>
          Context usage will appear after the first turn.
        </div>
      </div>
    );
  }

  const total = totalTokens(budget);
  const window = budget.context_window_size || 0;
  const pct = window > 0 ? Math.round((total / window) * 100) : 0;
  const color = contextUsageColor(pct / 100);

  const rows: Array<[string, number]> = [
    ['Static prompt', budget.system_prompt_static_tokens],
    ['Dynamic prompt', budget.system_prompt_dynamic_tokens],
    ['Tool schemas', budget.tool_schema_tokens],
    ['Deferred tools', budget.deferred_tool_tokens],
    ['Skill listing', budget.skill_listing_tokens],
    ['Conversation', budget.conversation_tokens],
    ['Tool results', budget.tool_result_tokens],
  ];

  return (
    <div className={`distri-ctx-panel ${className}`} style={panelStyle}>
      <div style={headerRow}>
        <div>
          <div style={titleStyle}>Context usage</div>
          <div style={subtitleStyle}>
            {fmt(total)} / {fmt(window)} tokens ({pct}%)
          </div>
        </div>
        {onCompact && (
          <button
            type="button"
            onClick={onCompact}
            disabled={isCompacting}
            style={{
              ...buttonStyle,
              opacity: isCompacting ? 0.6 : 1,
              cursor: isCompacting ? 'wait' : 'pointer',
            }}
          >
            {isCompacting ? 'Compacting…' : 'Compact now'}
          </button>
        )}
      </div>

      <div style={barBg}>
        <div
          style={{
            ...barFill,
            width: `${Math.min(pct, 100)}%`,
            background: color,
          }}
        />
      </div>

      <div style={breakdownGrid}>
        {rows.map(([label, value]) => (
          <BreakdownRow
            key={label}
            label={label}
            value={value}
            window={window || 1}
            color={color}
          />
        ))}
      </div>

      {budget.static_prefix_cache_hit && (
        <div style={pillStyle}>
          ✓ static prefix cached
        </div>
      )}

      {compactions.length > 0 && (
        <div style={{ marginTop: 12 }}>
          <div style={{ ...labelStyle, marginBottom: 6 }}>
            Compaction events
          </div>
          <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
            {compactions.slice(-5).reverse().map((c, i) => (
              <li key={`${c.ts}-${i}`} style={logRow}>
                <span style={tierBadge(c.tier)}>{c.tier}</span>
                <span style={{ opacity: 0.7, marginLeft: 6 }}>{c.source}</span>
                <span style={{ marginLeft: 'auto', fontVariantNumeric: 'tabular-nums' }}>
                  {fmt(c.before)} → {fmt(c.after)} ({reductionPct(c.before, c.after)}% saved)
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function BreakdownRow({
  label,
  value,
  window,
  color,
}: {
  label: string;
  value: number;
  window: number;
  color: string;
}) {
  const pct = window > 0 ? (value / window) * 100 : 0;
  return (
    <div style={breakdownRow}>
      <span style={{ fontSize: 11, color: '#6b7280', flexShrink: 0, width: 110 }}>
        {label}
      </span>
      <div style={{ flex: 1, marginInline: 8 }}>
        <div style={{ ...barBgSmall }}>
          <div style={{ width: `${Math.min(pct, 100)}%`, height: '100%', background: color, borderRadius: 2 }} />
        </div>
      </div>
      <span
        style={{
          fontSize: 11,
          color: '#374151',
          fontVariantNumeric: 'tabular-nums',
          width: 60,
          textAlign: 'right',
        }}
      >
        {fmt(value)}
      </span>
    </div>
  );
}

function totalTokens(b: ContextBudget): number {
  return (
    b.system_prompt_static_tokens +
    b.system_prompt_dynamic_tokens +
    b.tool_schema_tokens +
    b.deferred_tool_tokens +
    b.skill_listing_tokens +
    b.conversation_tokens +
    b.tool_result_tokens
  );
}

function fmt(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(n >= 10_000 ? 0 : 1)}k`;
  return String(n);
}

function reductionPct(before: number, after: number): number {
  if (before <= 0) return 0;
  return Math.round((1 - after / before) * 100);
}

const panelStyle: React.CSSProperties = {
  border: '1px solid #e5e7eb',
  borderRadius: 8,
  padding: 12,
  background: '#fff',
  fontFamily: 'system-ui, -apple-system, sans-serif',
};

const headerRow: React.CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'space-between',
  marginBottom: 8,
};

const titleStyle: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 600,
  color: '#111827',
};

const subtitleStyle: React.CSSProperties = {
  fontSize: 11,
  color: '#6b7280',
  marginTop: 2,
};

const labelStyle: React.CSSProperties = {
  fontSize: 11,
  color: '#6b7280',
  textTransform: 'uppercase',
  letterSpacing: 0.4,
};

const buttonStyle: React.CSSProperties = {
  border: '1px solid #d1d5db',
  borderRadius: 6,
  background: '#f9fafb',
  padding: '4px 10px',
  fontSize: 11,
  color: '#374151',
};

const barBg: React.CSSProperties = {
  width: '100%',
  height: 6,
  background: '#e5e7eb',
  borderRadius: 3,
  overflow: 'hidden',
  marginBottom: 12,
};

const barBgSmall: React.CSSProperties = {
  width: '100%',
  height: 3,
  background: '#f1f5f9',
  borderRadius: 2,
  overflow: 'hidden',
};

const barFill: React.CSSProperties = {
  height: '100%',
  transition: 'width 0.4s ease, background 0.3s ease',
};

const breakdownGrid: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
};

const breakdownRow: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
};

const pillStyle: React.CSSProperties = {
  marginTop: 10,
  fontSize: 10,
  color: '#15803d',
  background: '#dcfce7',
  borderRadius: 999,
  padding: '2px 8px',
  display: 'inline-block',
};

const logRow: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  padding: '4px 0',
  fontSize: 11,
  color: '#374151',
  borderTop: '1px dashed #e5e7eb',
};

function tierBadge(tier: 'trim' | 'summarize' | 'reset'): React.CSSProperties {
  const colors = {
    trim: { bg: '#dbeafe', fg: '#1d4ed8' },
    summarize: { bg: '#fef3c7', fg: '#a16207' },
    reset: { bg: '#fee2e2', fg: '#b91c1c' },
  } as const;
  const c = colors[tier];
  return {
    fontSize: 10,
    fontWeight: 600,
    background: c.bg,
    color: c.fg,
    borderRadius: 4,
    padding: '1px 6px',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  };
}
