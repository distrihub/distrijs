import type { Meta, StoryObj } from '@storybook/react';
import { useEffect, useState } from 'react';
import { ContextUsagePanel, type CompactionLogItem } from './ContextUsagePanel';
import { ContextIndicator } from './ContextIndicator';
import type { ContextBudget, ContextHealth } from '@distri/core';

/**
 * Compaction surfaces in the context of a real chat layout:
 *
 *   ┌──────────────────────────────────────────┬──────────────┐
 *   │ Coder agent · gpt-5.1                    │              │
 *   │ ▰▰▰▰▰▰▰▰▰▰▰▰▰▰▱▱  86% context used      │   Context    │
 *   ├──────────────────────────────────────────┤   usage      │
 *   │ user:      Read the auth README          │   panel      │
 *   │ assistant: ...                           │              │
 *   │   tool:    Read('auth/README.md')        │              │
 *   │ ...                                      │              │
 *   ├──────────────────────────────────────────┤              │
 *   │  > type a message...                     │              │
 *   └──────────────────────────────────────────┴──────────────┘
 *
 * The thin `<ContextIndicator />` lives just under the chat header — it's
 * the at-a-glance signal. The rich `<ContextUsagePanel />` lives in the
 * sidebar; users open it to see the breakdown or hit "Compact now".
 *
 * Both flip to the compacting state from the SAME `isCompacting` flag in
 * `chatStateStore`, so a `compaction_requested` event lights up both
 * surfaces in lockstep — and a `context_compaction` arrival drops them
 * back to idle at the same instant.
 */
const meta: Meta = {
  title: 'Compaction/Chat layout',
  parameters: { layout: 'fullscreen' },
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

function budgetToHealth(b: ContextBudget): ContextHealth {
  const total = totalTokens(b);
  return {
    usage_ratio: total / b.context_window_size,
    tokens_used: total,
    tokens_limit: b.context_window_size,
  };
}

type Phase = 'idle-heavy' | 'requested' | 'completed';

/** Sample assistant/user/tool transcript that fills the message column. */
const FAKE_MESSAGES = [
  { role: 'user', text: 'Read the auth README and tell me how refresh tokens are rotated.' },
  {
    role: 'assistant',
    text: "I'll start by reading the README, then trace the refresh flow.",
  },
  { role: 'tool', text: "Read('server/auth/README.md')" },
  {
    role: 'assistant',
    text: 'The README points at `RefreshSession::rotate` in `session.rs`. Let me read that next.',
  },
  { role: 'tool', text: "Read('server/auth/session.rs', offset=120, limit=80)" },
  {
    role: 'assistant',
    text:
      'Rotation issues a new refresh token, marks the old one revoked in the same transaction, and ties them to the same `family_id`. ' +
      'Reuse of a revoked token in a family voids the whole family — a standard rotation-with-detection pattern.',
  },
  { role: 'user', text: 'Walk through the postgres queries it runs and the order.' },
  {
    role: 'assistant',
    text: "I'll trace through the function step by step:",
  },
  { role: 'tool', text: "Grep('rotate', glob='server/auth/*.rs')" },
  { role: 'tool', text: "Read('server/auth/session.rs', offset=200, limit=120)" },
  {
    role: 'assistant',
    text:
      '1. `SELECT … WHERE token = $1 FOR UPDATE` (lock the row)\n' +
      '2. Validate `expires_at > now()` and `revoked_at IS NULL`\n' +
      '3. `INSERT INTO refresh_tokens (family_id, parent_id, ...)` for the new token\n' +
      '4. `UPDATE refresh_tokens SET revoked_at = now() WHERE id = $old`\n' +
      'All inside a single transaction so a crash mid-flight leaves the family intact.',
  },
];

function ChatShell({
  phase,
  budget,
  compactions,
}: {
  phase: Phase;
  budget: ContextBudget;
  compactions: CompactionLogItem[];
}) {
  const isCompacting = phase === 'requested';

  return (
    <div style={shellOuter}>
      <div style={shellMain}>
        {/* Chat column */}
        <div style={chatCol}>
          {/* Header */}
          <div style={chatHeader}>
            <div>
              <div style={headerTitle}>coder · gpt-5.1</div>
              <div style={headerSubtitle}>Thread bb84-…-9c1f</div>
            </div>
            <div style={headerRight}>
              <span style={phaseBadge(phase)}>{phaseLabel(phase)}</span>
            </div>
          </div>

          {/* Thin indicator strip — directly under the header */}
          <div style={indicatorStrip}>
            <ContextIndicator
              contextHealth={budgetToHealth(budget)}
              isCompacting={isCompacting}
            />
          </div>

          {/* Messages */}
          <div style={messagesScroll}>
            {FAKE_MESSAGES.map((m, i) => (
              <MessageRow key={i} role={m.role} text={m.text} />
            ))}
            {phase === 'completed' && (
              <div style={inlineCompactionNotice}>
                ─── compacted 124 entries · 171k → 53k tokens (69% reduction) ───
              </div>
            )}
            {isCompacting && (
              <div style={inlineCompactingNotice}>
                <span style={spinner} aria-hidden />
                <span>Summarizing earlier turns…</span>
              </div>
            )}
          </div>

          {/* Composer */}
          <div style={composer}>
            <div style={composerInput}>type a message…</div>
            <button style={composerSend} disabled={isCompacting}>
              Send
            </button>
          </div>
        </div>

        {/* Sidebar — Context usage panel lives here */}
        <div style={sidebar}>
          <div style={sidebarLabel}>Context</div>
          <ContextUsagePanel
            budget={budget}
            compactions={compactions}
            isCompacting={isCompacting}
            onCompact={() => {}}
          />
        </div>
      </div>
    </div>
  );
}

function MessageRow({ role, text }: { role: string; text: string }) {
  const style =
    role === 'user'
      ? userBubble
      : role === 'tool'
      ? toolBubble
      : assistantBubble;
  return (
    <div style={msgRow}>
      <div style={msgRoleLabel}>{role}</div>
      <div style={{ ...msgBubble, ...style }}>{text}</div>
    </div>
  );
}

const phaseLabel = (p: Phase) =>
  p === 'idle-heavy' ? 'idle' : p === 'requested' ? 'compacting' : 'idle (post-compact)';

function phaseBadge(p: Phase): React.CSSProperties {
  const palette =
    p === 'requested'
      ? { bg: '#dbeafe', fg: '#1d4ed8' }
      : p === 'completed'
      ? { bg: '#dcfce7', fg: '#15803d' }
      : { bg: '#f3f4f6', fg: '#6b7280' };
  return {
    background: palette.bg,
    color: palette.fg,
    padding: '3px 8px',
    borderRadius: 999,
    fontSize: 10,
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  };
}

// ────────────────────────────────────────────────────────────────────
// Stories
// ────────────────────────────────────────────────────────────────────

const heavyBudget = makeBudget({
  conversation_tokens: 152_000,
  tool_result_tokens: 6_800,
});
const lightBudget = makeBudget({
  conversation_tokens: 38_400,
  tool_result_tokens: 2_100,
});

export const Idle: StoryObj = {
  name: '① Idle (78% — pre-compaction)',
  render: () => (
    <ChatShell phase="idle-heavy" budget={heavyBudget} compactions={[]} />
  ),
};

export const Compacting: StoryObj = {
  name: '② Compacting (in flight)',
  render: () => (
    <ChatShell phase="requested" budget={heavyBudget} compactions={[]} />
  ),
};

export const AfterCompaction: StoryObj = {
  name: '③ After compaction (26% + log entry)',
  render: () => (
    <ChatShell
      phase="completed"
      budget={lightBudget}
      compactions={[
        {
          ts: Date.now(),
          before: totalTokens(heavyBudget),
          after: totalTokens(lightBudget),
          tier: 'summarize',
          source: 'auto',
        },
      ]}
    />
  ),
};

export const FullLifecycleLoop: StoryObj = {
  name: 'Full lifecycle (auto-cycles)',
  render: () => {
    const [phase, setPhase] = useState<Phase>('idle-heavy');
    const [log, setLog] = useState<CompactionLogItem[]>([]);
    useEffect(() => {
      const seq: Array<[Phase, number]> = [
        ['idle-heavy', 2500],
        ['requested', 2500],
        ['completed', 3000],
      ];
      let idx = 0;
      const tick = () => {
        const [p, d] = seq[idx % seq.length];
        setPhase(p);
        if (p === 'completed') {
          setLog((prev) =>
            [
              ...prev,
              {
                ts: Date.now(),
                before: totalTokens(heavyBudget),
                after: totalTokens(lightBudget),
                tier: 'summarize' as const,
                source: 'auto' as const,
              },
            ].slice(-3),
          );
        }
        idx += 1;
        timer = window.setTimeout(tick, d);
      };
      let timer = window.setTimeout(tick, seq[0][1]);
      return () => window.clearTimeout(timer);
    }, []);
    const budget = phase === 'completed' ? lightBudget : heavyBudget;
    return <ChatShell phase={phase} budget={budget} compactions={log} />;
  },
};

// ────────────────────────────────────────────────────────────────────
// Layout styles — a minimal "chat shell" so the indicator + panel land
// where they would in a real Distri chat layout. Not meant to be a
// pixel-perfect Chat.tsx replica — just enough so the position +
// proportions match.
// ────────────────────────────────────────────────────────────────────

const shellOuter: React.CSSProperties = {
  height: '100vh',
  background: '#f3f4f6',
  fontFamily: 'system-ui, -apple-system, sans-serif',
  display: 'flex',
  flexDirection: 'column',
};

const shellMain: React.CSSProperties = {
  flex: 1,
  display: 'grid',
  gridTemplateColumns: '1fr 360px',
  gap: 12,
  padding: 12,
  minHeight: 0,
};

const chatCol: React.CSSProperties = {
  background: '#fff',
  borderRadius: 10,
  border: '1px solid #e5e7eb',
  display: 'flex',
  flexDirection: 'column',
  minHeight: 0,
  overflow: 'hidden',
};

const chatHeader: React.CSSProperties = {
  padding: '12px 16px',
  borderBottom: '1px solid #e5e7eb',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
};

const headerTitle: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 600,
  color: '#111827',
};

const headerSubtitle: React.CSSProperties = {
  fontSize: 11,
  color: '#6b7280',
  marginTop: 2,
};

const headerRight: React.CSSProperties = {
  display: 'flex',
  gap: 8,
  alignItems: 'center',
};

const indicatorStrip: React.CSSProperties = {
  padding: '8px 16px',
  borderBottom: '1px solid #f3f4f6',
  background: '#fafafa',
};

const messagesScroll: React.CSSProperties = {
  flex: 1,
  overflowY: 'auto',
  padding: '12px 16px',
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
};

const msgRow: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
};

const msgRoleLabel: React.CSSProperties = {
  fontSize: 10,
  color: '#6b7280',
  textTransform: 'uppercase',
  letterSpacing: 0.4,
};

const msgBubble: React.CSSProperties = {
  borderRadius: 8,
  padding: '8px 12px',
  fontSize: 12,
  lineHeight: 1.5,
  whiteSpace: 'pre-wrap',
};

const userBubble: React.CSSProperties = {
  background: '#eff6ff',
  color: '#1e3a8a',
  border: '1px solid #dbeafe',
  alignSelf: 'flex-end',
  maxWidth: '85%',
};

const assistantBubble: React.CSSProperties = {
  background: '#fff',
  color: '#111827',
  border: '1px solid #e5e7eb',
  maxWidth: '90%',
};

const toolBubble: React.CSSProperties = {
  background: '#f9fafb',
  color: '#374151',
  border: '1px solid #e5e7eb',
  fontFamily: 'ui-monospace, monospace',
  fontSize: 11,
  maxWidth: '90%',
};

const inlineCompactingNotice: React.CSSProperties = {
  alignSelf: 'center',
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  background: '#eff6ff',
  color: '#1d4ed8',
  padding: '6px 12px',
  borderRadius: 999,
  fontSize: 11,
  fontWeight: 500,
  border: '1px solid #bfdbfe',
};

const inlineCompactionNotice: React.CSSProperties = {
  alignSelf: 'center',
  background: '#f3f4f6',
  color: '#6b7280',
  padding: '4px 12px',
  borderRadius: 4,
  fontSize: 11,
  fontFamily: 'ui-monospace, monospace',
};

const spinner: React.CSSProperties = {
  display: 'inline-block',
  width: 10,
  height: 10,
  borderRadius: '50%',
  border: '2px solid #93c5fd',
  borderTopColor: '#1d4ed8',
  animation: 'distri-ctx-spin 0.8s linear infinite',
};

const composer: React.CSSProperties = {
  borderTop: '1px solid #e5e7eb',
  padding: 12,
  display: 'flex',
  gap: 8,
};

const composerInput: React.CSSProperties = {
  flex: 1,
  background: '#f9fafb',
  border: '1px solid #e5e7eb',
  borderRadius: 8,
  padding: '8px 12px',
  fontSize: 12,
  color: '#9ca3af',
};

const composerSend: React.CSSProperties = {
  background: '#1d4ed8',
  color: '#fff',
  border: 'none',
  borderRadius: 8,
  padding: '8px 14px',
  fontSize: 12,
  fontWeight: 500,
  cursor: 'pointer',
};

const sidebar: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
};

const sidebarLabel: React.CSSProperties = {
  fontSize: 10,
  color: '#6b7280',
  textTransform: 'uppercase',
  letterSpacing: 0.4,
  paddingLeft: 4,
};
