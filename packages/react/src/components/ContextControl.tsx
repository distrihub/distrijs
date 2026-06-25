import { useState } from 'react';
import type { ContextBudget } from '@distri/core';
import { useChatStateStore } from '../stores/chatStateStore';
import { ContextUsagePanel } from './ContextUsagePanel';
import { contextUsageColor } from './contextColors';

// Animation keyframes shared with the indicator/panel — registered once.
if (typeof document !== 'undefined' && !document.getElementById('distri-ctx-control-anim')) {
  const style = document.createElement('style');
  style.id = 'distri-ctx-control-anim';
  style.textContent = `
    @keyframes distri-ctx-control-shimmer {
      0%   { background-position: -60% 0; }
      100% { background-position: 160% 0; }
    }
    @keyframes distri-ctx-control-spin {
      to { transform: rotate(360deg); }
    }
  `;
  document.head.appendChild(style);
}

export interface ContextControlProps {
  /**
   * Override the store-driven `compact()` (testing / custom flows).
   * The default reads `useChat().compact()` semantics off the store.
   */
  onCompact?: () => void | Promise<void>;
  /**
   * Don't render until utilization crosses this fraction (0–1). Defaults to
   * 0.25 — most consumers don't care about context until the conversation
   * is non-trivial, so we don't add chrome to short chats.
   */
  minUtilization?: number;
  className?: string;
}

/**
 * Opt-in chat control that surfaces context usage + compaction in the
 * chat composer toolbar. Reads `chatStateStore` directly — drop it next
 * to your composer (or wherever) and it lights up when the agent loop
 * starts emitting `context_budget_update` events.
 *
 * - **Idle:** thin pill showing `78%` with a color-coded mini-bar.
 * - **Mid-compaction:** same pill, with a horizontal shimmer + spinner;
 *   the modal is suppressed (clicking is a no-op while in flight).
 * - **Click:** opens `<ContextUsageModal />` with the per-component
 *   breakdown, compaction history, and a "Compact now" button.
 *
 * Hides itself entirely when there's no budget yet, or when utilization
 * is below `minUtilization` (default 25%).
 *
 * ```tsx
 * <Chat threadId={tid} agent={agent} />
 * <ContextControl />            // appears wherever you mount it
 * ```
 */
export function ContextControl({
  onCompact,
  minUtilization = 0.25,
  className = '',
}: ContextControlProps) {
  const budget = useChatStateStore((s) => s.contextBudget);
  const isCompacting = useChatStateStore((s) => s.isCompacting);
  const compactions = useChatStateStore((s) => s.compactionEvents);
  const [open, setOpen] = useState(false);

  if (!budget) return null;
  const total = totalTokens(budget);
  const window = budget.context_window_size || 0;
  if (window === 0) return null;
  const ratio = total / window;
  if (ratio < minUtilization && !isCompacting && compactions.length === 0) {
    return null;
  }
  const pct = Math.round(ratio * 100);
  const color = contextUsageColor(ratio);

  return (
    <>
      <button
        type="button"
        className={`distri-ctx-control ${className}`}
        onClick={() => {
          if (!isCompacting) setOpen(true);
        }}
        title={isCompacting ? 'Compaction in progress' : `Context: ${pct}% used — click for breakdown`}
        style={{
          ...pillStyle,
          cursor: isCompacting ? 'wait' : 'pointer',
          borderColor: isCompacting ? '#bfdbfe' : '#e5e7eb',
          background: isCompacting ? '#eff6ff' : '#fff',
        }}
      >
        {isCompacting ? (
          <>
            <span style={spinner} aria-hidden />
            <span style={{ color: '#1d4ed8', fontWeight: 500 }}>Compacting…</span>
          </>
        ) : (
          <>
            <span style={{ ...miniBarBg }}>
              <span
                style={{
                  ...miniBarFill,
                  width: `${Math.min(pct, 100)}%`,
                  background: color,
                }}
              />
              <span aria-hidden style={{
                position: 'absolute',
                inset: 0,
                background:
                  'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.55) 50%, transparent 100%)',
                backgroundSize: '60% 100%',
                backgroundRepeat: 'no-repeat',
                animation: isCompacting ? 'distri-ctx-control-shimmer 1.2s linear infinite' : undefined,
                opacity: isCompacting ? 1 : 0,
              }} />
            </span>
            <span style={pillLabel}>{pct}%</span>
          </>
        )}
      </button>

      {open && (
        <ContextUsageModal
          onClose={() => setOpen(false)}
          onCompact={onCompact}
        />
      )}
    </>
  );
}

interface ContextUsageModalProps {
  onClose: () => void;
  onCompact?: () => void | Promise<void>;
}

/**
 * Modal wrapper around `<ContextUsagePanel />`. Reads the same store the
 * `<ContextControl />` button does, so the modal stays in sync with
 * incoming events while it's open.
 */
export function ContextUsageModal({ onClose, onCompact }: ContextUsageModalProps) {
  const budget = useChatStateStore((s) => s.contextBudget);
  const isCompacting = useChatStateStore((s) => s.isCompacting);
  const compactions = useChatStateStore((s) => s.compactionEvents);

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      style={overlayStyle}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={dialogStyle}
      >
        <div style={dialogHeader}>
          <div style={dialogTitle}>Context window</div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            style={closeButton}
          >
            ✕
          </button>
        </div>
        <ContextUsagePanel
          budget={budget}
          compactions={compactions}
          isCompacting={isCompacting}
          onCompact={onCompact}
        />
      </div>
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

const pillStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  padding: '4px 10px',
  borderRadius: 999,
  border: '1px solid #e5e7eb',
  background: '#fff',
  fontSize: 11,
  fontFamily: 'system-ui, -apple-system, sans-serif',
  color: '#374151',
  height: 26,
};

const pillLabel: React.CSSProperties = {
  fontVariantNumeric: 'tabular-nums',
  fontWeight: 500,
};

const miniBarBg: React.CSSProperties = {
  position: 'relative',
  display: 'inline-block',
  width: 60,
  height: 6,
  background: '#f1f5f9',
  borderRadius: 3,
  overflow: 'hidden',
};

const miniBarFill: React.CSSProperties = {
  display: 'block',
  height: '100%',
  borderRadius: 3,
  transition: 'width 0.4s ease, background 0.3s ease',
};

const spinner: React.CSSProperties = {
  display: 'inline-block',
  width: 10,
  height: 10,
  borderRadius: '50%',
  border: '2px solid #93c5fd',
  borderTopColor: '#1d4ed8',
  animation: 'distri-ctx-control-spin 0.8s linear infinite',
};

const overlayStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(15, 23, 42, 0.45)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000,
  padding: 16,
};

const dialogStyle: React.CSSProperties = {
  width: 'min(460px, 100%)',
  background: '#fff',
  borderRadius: 12,
  boxShadow: '0 25px 50px rgba(15, 23, 42, 0.25)',
  padding: 16,
  maxHeight: '90vh',
  overflowY: 'auto',
};

const dialogHeader: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: 12,
};

const dialogTitle: React.CSSProperties = {
  fontSize: 14,
  fontWeight: 600,
  color: '#111827',
  fontFamily: 'system-ui, -apple-system, sans-serif',
};

const closeButton: React.CSSProperties = {
  background: 'transparent',
  border: 'none',
  fontSize: 16,
  color: '#6b7280',
  cursor: 'pointer',
  padding: 4,
  lineHeight: 1,
};
