import type { Meta, StoryObj } from '@storybook/react';
import { useEffect, useState } from 'react';
import { ContextUsagePanel, type CompactionLogItem } from './ContextUsagePanel';
import { ContextIndicator } from './ContextIndicator';
import type { ContextBudget, ContextHealth } from '@distri/core';

/**
 * Interactive stories that walk through the compaction lifecycle:
 *
 *   idle  →  compaction_requested  →  context_compaction  →  idle
 *
 * The store-driven UI flips `isCompacting: true` on the request event,
 * holds the shimmer for the round-trip, then flips back as the compaction
 * event lands carrying the post-compact budget snapshot.
 */
const meta: Meta = {
  title: 'Compaction/Lifecycle',
  parameters: { layout: 'padded' },
};
export default meta;

function makeBudget(overrides: Partial<ContextBudget> = {}): ContextBudget {
  return {
    system_prompt_static_tokens: 4_100,
    system_prompt_dynamic_tokens: 1_200,
    tool_schema_tokens: 5_400,
    deferred_tool_tokens: 800,
    skill_listing_tokens: 600,
    conversation_tokens: 1_500,
    tool_result_tokens: 320,
    context_window_size: 200_000,
    static_prefix_cache_hit: true,
    ...overrides,
  };
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

/**
 * Looped lifecycle: holds each phase for ~2s so the visual is easy to follow.
 * Useful as a screenshot target — each frame stays still long enough for
 * Playwright to capture it cleanly.
 */
function LifecyclePanel({ paused }: { paused?: boolean }) {
  const heavy = makeBudget({
    conversation_tokens: 152_000,
    tool_result_tokens: 6_800,
  });
  const light = makeBudget({
    conversation_tokens: 38_400,
    tool_result_tokens: 2_100,
  });

  type Phase = 'idle-heavy' | 'requested' | 'completed';
  const [phase, setPhase] = useState<Phase>('idle-heavy');
  const [log, setLog] = useState<CompactionLogItem[]>([]);

  useEffect(() => {
    if (paused) return;
    const sequence: Array<[Phase, number]> = [
      ['idle-heavy', 2200],
      ['requested', 2200],
      ['completed', 2600],
    ];
    let idx = 0;
    const next = () => {
      const [p, delay] = sequence[idx % sequence.length];
      setPhase(p);
      if (p === 'completed') {
        setLog((prev) =>
          [
            ...prev,
            {
              ts: Date.now(),
              before: totalTokens(heavy),
              after: totalTokens(light),
              tier: 'summarize' as const,
              source: 'auto' as const,
            },
          ].slice(-5),
        );
      }
      idx += 1;
      return delay;
    };
    let timer = window.setTimeout(function tick() {
      const d = next();
      timer = window.setTimeout(tick, d);
    }, next());
    return () => window.clearTimeout(timer);
  }, [paused]);

  const budget = phase === 'completed' ? light : heavy;
  const isCompacting = phase === 'requested';

  return (
    <div style={{ maxWidth: 420, display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ fontSize: 11, color: '#6b7280' }}>
        Phase:&nbsp;
        <code style={{ background: '#f3f4f6', padding: '1px 6px', borderRadius: 4 }}>
          {phase}
        </code>
      </div>
      <ContextUsagePanel
        budget={budget}
        compactions={log}
        isCompacting={isCompacting}
        onCompact={() => {}}
      />
    </div>
  );
}

/**
 * Side-by-side: the thin `<ContextIndicator />` (chat header) and the rich
 * `<ContextUsagePanel />` (settings panel) flipping in sync.
 */
function LifecycleBoth() {
  const heavy = makeBudget({
    conversation_tokens: 168_000,
    tool_result_tokens: 8_200,
    static_prefix_cache_hit: false,
  });
  const light = makeBudget({ conversation_tokens: 22_400, tool_result_tokens: 1_800 });

  type Phase = 'idle-heavy' | 'requested' | 'completed';
  const [phase, setPhase] = useState<Phase>('idle-heavy');

  useEffect(() => {
    const seq: Array<[Phase, number]> = [
      ['idle-heavy', 2000],
      ['requested', 2200],
      ['completed', 2400],
    ];
    let idx = 0;
    const tick = () => {
      const [p, d] = seq[idx % seq.length];
      setPhase(p);
      idx += 1;
      timer = window.setTimeout(tick, d);
    };
    let timer = window.setTimeout(tick, seq[0][1]);
    return () => window.clearTimeout(timer);
  }, []);

  const budget = phase === 'completed' ? light : heavy;
  const isCompacting = phase === 'requested';
  const total = totalTokens(budget);
  const health: ContextHealth = {
    usage_ratio: total / budget.context_window_size,
    tokens_used: total,
    tokens_limit: budget.context_window_size,
    last_compaction: phase === 'completed'
      ? {
          type: 'context_compaction',
          tier: 'summarize',
          tokens_before: totalTokens(heavy),
          tokens_after: total,
          entries_affected: 124,
          context_limit: budget.context_window_size,
          usage_ratio: total / budget.context_window_size,
          source: 'auto',
        }
      : undefined,
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 460 }}>
      <div>
        <div style={miniLabel}>Chat header bar (thin indicator)</div>
        <div style={{ background: '#f9fafb', padding: 10, borderRadius: 6 }}>
          <ContextIndicator contextHealth={health} isCompacting={isCompacting} />
        </div>
      </div>
      <div>
        <div style={miniLabel}>Settings / sidebar (full panel)</div>
        <ContextUsagePanel
          budget={budget}
          compactions={[]}
          isCompacting={isCompacting}
          onCompact={() => {}}
        />
      </div>
    </div>
  );
}

const miniLabel: React.CSSProperties = {
  fontSize: 10,
  color: '#6b7280',
  textTransform: 'uppercase',
  letterSpacing: 0.4,
  marginBottom: 4,
};

export const AnimatedLifecycle: StoryObj = {
  name: 'Animated lifecycle (panel)',
  render: () => <LifecyclePanel />,
};

export const PausedDuringCompaction: StoryObj = {
  name: 'Paused mid-compaction (shimmer + spinner)',
  render: () => {
    // Render the requested phase statically so screenshots capture the
    // shimmer + spinner in the bar without timing-dependent flake.
    const heavy = makeBudget({
      conversation_tokens: 152_000,
      tool_result_tokens: 6_800,
    });
    return (
      <div style={{ maxWidth: 420 }}>
        <ContextUsagePanel budget={heavy} isCompacting onCompact={() => {}} />
      </div>
    );
  },
};

export const BothSurfaces: StoryObj = {
  name: 'Both surfaces in sync',
  render: () => <LifecycleBoth />,
};

export const ChatHeaderCompacting: StoryObj = {
  name: 'Chat header (thin indicator) compacting',
  render: () => {
    const heavy = makeBudget({
      conversation_tokens: 152_000,
      tool_result_tokens: 6_800,
    });
    const total = totalTokens(heavy);
    const health: ContextHealth = {
      usage_ratio: total / heavy.context_window_size,
      tokens_used: total,
      tokens_limit: heavy.context_window_size,
    };
    return (
      <div style={{ maxWidth: 360, background: '#f9fafb', padding: 12, borderRadius: 8 }}>
        <ContextIndicator contextHealth={health} isCompacting />
      </div>
    );
  },
};
