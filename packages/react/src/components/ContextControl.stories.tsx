import type { Meta, StoryObj } from '@storybook/react';
import { useEffect, useState } from 'react';
import { ContextControl, ContextUsageModal } from './ContextControl';
import { useChatStateStore } from '../stores/chatStateStore';
import type { ContextBudget } from '@distri/core';

/**
 * `<ContextControl />` is the recommended integration point for the
 * compaction surface. It does NOT alter the default `<Chat>` view —
 * instead, consumers drop it next to their composer and it lights up
 * once the agent starts emitting `context_budget_update` events.
 *
 * Behaviour:
 * - Renders nothing until utilization crosses `minUtilization` (default
 *   25%) so short conversations stay clean.
 * - Click → opens a modal with the full `<ContextUsagePanel />`.
 * - During compaction → shimmer + spinner; clicking is a no-op.
 *
 * Stories below seed `chatStateStore` directly so they render without
 * a live agent.
 */
const meta: Meta = {
  title: 'Compaction/ContextControl',
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

/** Seed the chat-state store with a given snapshot, then render children. */
function StoreFixture({
  budget,
  isCompacting = false,
  compactions = [],
  children,
}: {
  budget?: ContextBudget;
  isCompacting?: boolean;
  compactions?: ReturnType<typeof useChatStateStore.getState>['compactionEvents'];
  children: React.ReactNode;
}) {
  useEffect(() => {
    useChatStateStore.setState({ contextBudget: budget, isCompacting, compactionEvents: compactions });
    return () => {
      useChatStateStore.setState({
        contextBudget: undefined,
        isCompacting: false,
        compactionEvents: [],
      });
    };
  }, [budget, isCompacting, compactions]);
  return <>{children}</>;
}

/** Minimal chat shell mock — the default `<Chat>` view, untouched. The
 *  `<ContextControl />` slot sits next to the composer's tool row. */
function MockChat({ control }: { control?: React.ReactNode }) {
  return (
    <div style={shellOuter}>
      <div style={chatCol}>
        <div style={chatHeader}>
          <div>
            <div style={headerTitle}>coder · gpt-5.1</div>
            <div style={headerSubtitle}>Thread bb84-…-9c1f</div>
          </div>
        </div>

        <div style={messagesScroll}>
          {[
            { role: 'user', text: 'Read the auth README and tell me how refresh tokens are rotated.' },
            { role: 'assistant', text: "I'll start by reading the README, then trace the refresh flow." },
            { role: 'tool', text: "Read('server/auth/README.md')" },
            { role: 'assistant', text: 'The README points at `RefreshSession::rotate` in `session.rs`. Let me read that next.' },
            { role: 'tool', text: "Read('server/auth/session.rs', offset=120, limit=80)" },
            {
              role: 'assistant',
              text:
                'Rotation issues a new refresh token, marks the old one revoked in the same transaction, and ties them to the same `family_id`.',
            },
            { role: 'user', text: 'Walk through the postgres queries it runs and the order.' },
            { role: 'assistant', text: "I'll trace through the function step by step:" },
            { role: 'tool', text: "Grep('rotate', glob='server/auth/*.rs')" },
          ].map((m, i) => (
            <div key={i} style={msgRow}>
              <div style={msgRoleLabel}>{m.role}</div>
              <div style={{ ...msgBubble, ...bubbleColor(m.role) }}>{m.text}</div>
            </div>
          ))}
        </div>

        <div style={composer}>
          <div style={composerToolbar}>
            <button style={toolbarBtn} disabled>📎</button>
            <button style={toolbarBtn} disabled>🎤</button>
            <div style={{ flex: 1 }} />
            {control}
          </div>
          <div style={composerRow}>
            <div style={composerInput}>type a message…</div>
            <button style={composerSend}>Send</button>
          </div>
        </div>
      </div>
    </div>
  );
}

const heavyBudget = makeBudget({
  conversation_tokens: 138_000,
  tool_result_tokens: 5_400,
});

const lightBudget = makeBudget({
  conversation_tokens: 38_400,
  tool_result_tokens: 2_100,
});

export const HiddenWhenLow: StoryObj = {
  name: '① Below threshold (control hidden)',
  render: () => (
    <StoreFixture budget={makeBudget()}>
      <MockChat control={<ContextControl />} />
    </StoreFixture>
  ),
};

export const Idle: StoryObj = {
  name: '② Idle at 73% (collapsed pill)',
  render: () => (
    <StoreFixture budget={heavyBudget}>
      <MockChat control={<ContextControl />} />
    </StoreFixture>
  ),
};

export const Compacting: StoryObj = {
  name: '③ Compacting (shimmer pill, modal suppressed)',
  render: () => (
    <StoreFixture budget={heavyBudget} isCompacting>
      <MockChat control={<ContextControl />} />
    </StoreFixture>
  ),
};

export const ModalOpen: StoryObj = {
  name: '④ Modal open (breakdown + Compact now)',
  render: () => {
    const Content = () => {
      const [open, setOpen] = useState(true);
      return (
        <>
          <MockChat
            control={
              <button
                onClick={() => setOpen(true)}
                style={{
                  border: '1px solid #e5e7eb',
                  borderRadius: 999,
                  padding: '4px 10px',
                  fontSize: 11,
                  background: '#fff',
                  cursor: 'pointer',
                }}
              >
                ▰▰▰▰▰▱ 73%
              </button>
            }
          />
          {open && (
            <ContextUsageModal onClose={() => setOpen(false)} onCompact={() => {}} />
          )}
        </>
      );
    };
    return (
      <StoreFixture budget={heavyBudget}>
        <Content />
      </StoreFixture>
    );
  },
};

export const ModalDuringCompaction: StoryObj = {
  name: '⑤ Modal open during compaction',
  render: () => {
    const Content = () => {
      const [open] = useState(true);
      return (
        <>
          <MockChat control={<ContextControl />} />
          {open && <ContextUsageModal onClose={() => {}} onCompact={() => {}} />}
        </>
      );
    };
    return (
      <StoreFixture budget={heavyBudget} isCompacting>
        <Content />
      </StoreFixture>
    );
  },
};

// ────────────────────────────────────────────────────────────────────
// Layout styles
// ────────────────────────────────────────────────────────────────────

const shellOuter: React.CSSProperties = {
  height: '100vh',
  background: '#f3f4f6',
  fontFamily: 'system-ui, -apple-system, sans-serif',
  padding: 12,
};

const chatCol: React.CSSProperties = {
  background: '#fff',
  borderRadius: 10,
  border: '1px solid #e5e7eb',
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
  overflow: 'hidden',
  maxWidth: 720,
  margin: '0 auto',
};

const chatHeader: React.CSSProperties = {
  padding: '12px 16px',
  borderBottom: '1px solid #e5e7eb',
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

const messagesScroll: React.CSSProperties = {
  flex: 1,
  overflowY: 'auto',
  padding: '12px 16px',
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
};

const msgRow: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 4 };
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

function bubbleColor(role: string): React.CSSProperties {
  if (role === 'user') return { background: '#eff6ff', border: '1px solid #dbeafe', color: '#1e3a8a', alignSelf: 'flex-end', maxWidth: '85%' };
  if (role === 'tool') return { background: '#f9fafb', border: '1px solid #e5e7eb', color: '#374151', fontFamily: 'ui-monospace, monospace', fontSize: 11, maxWidth: '90%' };
  return { background: '#fff', border: '1px solid #e5e7eb', color: '#111827', maxWidth: '90%' };
}

const composer: React.CSSProperties = {
  borderTop: '1px solid #e5e7eb',
  padding: 10,
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
};

const composerToolbar: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 6,
};

const toolbarBtn: React.CSSProperties = {
  background: '#f9fafb',
  border: '1px solid #e5e7eb',
  borderRadius: 6,
  padding: '4px 8px',
  fontSize: 11,
  cursor: 'pointer',
  height: 26,
};

const composerRow: React.CSSProperties = { display: 'flex', gap: 8 };

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
