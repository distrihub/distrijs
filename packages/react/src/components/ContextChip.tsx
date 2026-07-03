/**
 * ContextChip — a tiny donut gauge for context usage. A capacity dial, not a
 * bar: horizontal fill bars next to run/progress UI read as "task progress",
 * which context usage is not. Used above the composer (with a % label) and in
 * SubTaskCard headers (dial only) for per-child context.
 */

import type { ContextBudget } from '@distri/core';
import { contextUsageColor } from './contextColors';

/** Total used tokens across a ContextBudget's components. */
export function budgetUsedTokens(b: ContextBudget): number {
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

/** Usage ratio 0..1, or null when the budget/window is unusable. */
export function budgetRatio(b?: ContextBudget): number | null {
  if (!b || !b.context_window_size) return null;
  return budgetUsedTokens(b) / b.context_window_size;
}

// Pulse keyframes for the compacting state — registered once.
if (typeof document !== 'undefined' && !document.getElementById('distri-ctx-chip-anim')) {
  const style = document.createElement('style');
  style.id = 'distri-ctx-chip-anim';
  style.textContent = `
    @keyframes distri-ctx-chip-pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.35; }
    }
  `;
  document.head.appendChild(style);
}

export interface ContextChipProps {
  /** Usage ratio 0..1. */
  ratio: number;
  isCompacting?: boolean;
  /** Show the numeric % next to the dial (composer placement). */
  showLabel?: boolean;
  size?: number;
  onClick?: () => void;
  title?: string;
  className?: string;
}

export function ContextChip({
  ratio,
  isCompacting = false,
  showLabel = false,
  size = 14,
  onClick,
  title,
  className = '',
}: ContextChipProps) {
  const pct = Math.max(0, Math.min(100, Math.round(ratio * 100)));
  const color = contextUsageColor(ratio);
  const r = size / 2 - 2;
  const c = 2 * Math.PI * r;
  const dial = (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      style={isCompacting ? { animation: 'distri-ctx-chip-pulse 1.2s ease-in-out infinite' } : undefined}
      aria-hidden
    >
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" strokeOpacity={0.18} strokeWidth={2.4} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={2.4}
        strokeDasharray={`${(pct / 100) * c} ${c}`}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
    </svg>
  );
  const label = title ?? (isCompacting ? 'Compacting context…' : `Context ${pct}% used — click for the breakdown`);
  const body = (
    <>
      {dial}
      {showLabel && (
        <span className="text-[10px] tabular-nums text-muted-foreground">{isCompacting ? 'compacting…' : `${pct}%`}</span>
      )}
    </>
  );
  if (!onClick) {
    return (
      <span className={`inline-flex items-center gap-1 ${className}`} title={label}>
        {body}
      </span>
    );
  }
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={`inline-flex items-center gap-1 cursor-pointer ${className}`}
      title={label}
    >
      {body}
    </button>
  );
}
