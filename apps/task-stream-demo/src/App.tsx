import { useMemo, useState } from 'react';
import {
  DistriProvider,
  ThemeProvider,
  useAgent,
  Chat,
  TaskView,
  type ChatState,
} from '@distri/react';
import { uuidv4 } from '@distri/core';

/**
 * Read-only task streaming demo.
 *
 * Left:  a <Chat> to SEND a message. We capture the resulting task id.
 * Right: a <TaskView> that FOLLOWS that same task read-only — it streams the
 *        identical transcript with no composer. You can also paste any task id
 *        to follow a pre-existing task (replay + tail).
 *
 * Configure via env (`.env.local`):
 *   VITE_DISTRI_BASE_URL   default http://localhost:5184/v1/
 *   VITE_DISTRI_TOKEN      bearer token / DISTRI_API_KEY (default oss-anonymous)
 *   VITE_DISTRI_AGENT_ID   default "coder"
 */

const BASE_URL = import.meta.env.VITE_DISTRI_BASE_URL ?? 'http://localhost:5184/v1/';
const TOKEN = import.meta.env.VITE_DISTRI_TOKEN ?? 'oss-anonymous';
const AGENT_ID = import.meta.env.VITE_DISTRI_AGENT_ID ?? 'coder';

function Demo() {
  const threadId = useMemo(() => uuidv4(), []);
  const { agent, loading, error } = useAgent({ agentIdOrDef: AGENT_ID });

  // Task id captured from the live <Chat> (root task of the current turn).
  const [liveTaskId, setLiveTaskId] = useState<string | null>(null);
  // Manual override: paste any task id to follow it read-only.
  const [pastedTaskId, setPastedTaskId] = useState('');

  const followedTaskId = pastedTaskId.trim() || liveTaskId;

  if (loading) return <div style={{ padding: 24 }}>Loading agent “{AGENT_ID}”…</div>;
  if (error) return <div style={{ padding: 24, color: 'crimson' }}>Failed to load agent: {String(error)}</div>;

  return (
    <div style={{ display: 'flex', height: '100vh', gap: 1, background: 'var(--border, #333)' }}>
      {/* LEFT: interactive chat (sends messages) */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', background: 'var(--background, #fff)' }}>
        <Header title="① Send — <Chat>" subtitle={followedTaskId ? `following task ${followedTaskId.slice(0, 12)}…` : 'send a message to start a task'} />
        <div style={{ flex: 1, minHeight: 0 }}>
          <Chat
            agent={agent}
            threadId={threadId}
            enableHistory={false}
            onChatStateChange={(state: ChatState) => {
              if (state.currentTaskId) setLiveTaskId(state.currentTaskId);
            }}
          />
        </div>
      </div>

      {/* RIGHT: read-only follower (sends nothing) */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', background: 'var(--background, #fff)' }}>
        <Header title="② Follow — <TaskView>" subtitle="read-only · streams the same task · no composer" />
        <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--border, #333)' }}>
          <input
            value={pastedTaskId}
            onChange={(e) => setPastedTaskId(e.target.value)}
            placeholder="…or paste a task id to follow"
            style={{ width: '100%', padding: 6, fontSize: 12, boxSizing: 'border-box' }}
          />
        </div>
        <div style={{ flex: 1, minHeight: 0 }}>
          <TaskView
            agent={agent}
            taskId={followedTaskId}
            threadId={threadId}
            rendering="rich"
            emptyState={<div style={{ padding: 24, opacity: 0.6 }}>No task followed yet. Send a message on the left, or paste a task id above.</div>}
          />
        </div>
      </div>
    </div>
  );
}

function Header({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--border, #333)' }}>
      <div style={{ fontWeight: 600, fontSize: 14 }}>{title}</div>
      <div style={{ fontSize: 12, opacity: 0.65 }}>{subtitle}</div>
    </div>
  );
}

export function App() {
  return (
    <ThemeProvider>
      <DistriProvider
        config={{
          baseUrl: BASE_URL,
          accessToken: TOKEN,
          headers: { Authorization: `Bearer ${TOKEN}` },
        }}
      >
        <Demo />
      </DistriProvider>
    </ThemeProvider>
  );
}
