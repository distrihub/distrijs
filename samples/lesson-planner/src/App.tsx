import { useCallback, useState, useSyncExternalStore, type ReactNode } from 'react';
import { Chat } from '@distri/react';
import type { DistriMessage } from '@distri/core';
import { DistriTokenProvider } from './DistriTokenProvider';
import { PlanCanvas } from './components/PlanCanvas';
import { SchemeRail } from './components/SchemeRail';
import { planStore, type PlanStatus } from './planStore';
import { listScheme, resetScheme } from './scheme';
import { runMockPlanning } from './mockRun';
import { lessonPlannerTools } from './tools';

const AGENT_ID = import.meta.env.VITE_DISTRI_AGENT_ID ?? 'lesson_planner_agent';

const STATUS_LABEL: Record<PlanStatus, string> = {
  empty: 'No plan',
  awaiting_approval: 'Waiting on you',
  drafting: 'Drafting',
  ready: 'Plan ready',
  scheduled: 'In the scheme',
};

const STARTERS = [
  {
    id: 'fractions',
    label: 'Adding fractions',
    description: '50-minute Year 7 lesson, three questions',
    prompt:
      'A 50-minute Year 7 lesson on adding fractions with unlike denominators, with three practice questions. Put it in the fractions unit.',
  },
  {
    id: 'equations',
    label: 'Two-step equations',
    description: 'Year 8, building on one-step',
    prompt:
      'A 60-minute Year 8 lesson on solving two-step linear equations, following on from the one-step lesson already in the scheme. Two multiple-choice questions and one open response.',
  },
  {
    id: 'gap',
    label: 'Fill a gap',
    description: 'Let the agent read the scheme and decide',
    prompt: 'Look at my scheme of work and plan the lesson that is most obviously missing from the fractions unit.',
  },
];

/**
 * The planner shell: scheme rail, plan canvas, action tape, and whatever chat
 * surface is available. It owns the plan state and the mocked run, so it works
 * identically with a live agent or with no API key at all.
 */
function Planner({ subtitle, renderChat }: { subtitle: string; renderChat: (threadId: string) => ReactNode }) {
  const plan = useSyncExternalStore(planStore.subscribe, planStore.getSnapshot);
  const [threadId, setThreadId] = useState(() => `lesson-planner-${Date.now()}`);
  const [narration, setNarration] = useState<string | null>(null);
  const [mockRunning, setMockRunning] = useState(false);

  const runMock = useCallback(async () => {
    setMockRunning(true);
    try {
      await runMockPlanning(setNarration);
    } finally {
      setMockRunning(false);
    }
  }, []);

  const startOver = useCallback(() => {
    planStore.reset();
    resetScheme();
    setNarration(null);
    setThreadId(`lesson-planner-${Date.now()}`);
  }, []);

  return (
    <div className="planner">
      <SchemeRail />

      <main className="canvas">
        <header className="canvas__head">
          <div>
            <span className="canvas__title">Lesson Planner</span>
            <span className="canvas__sub">{subtitle}</span>
          </div>
          <div className="canvas__right">
            <span className={`pill pill--${plan.status}`}>{STATUS_LABEL[plan.status]}</span>
            <button className="btn btn--ghost btn--sm" onClick={startOver}>
              Start over
            </button>
          </div>
        </header>

        <div className="canvas__scroll">
          <PlanCanvas plan={plan} onRunMock={runMock} mockRunning={mockRunning} />
        </div>

        {/* Every tool call lands here — the "what is it doing right now" strip. */}
        <footer className="tape">
          <span className="tape__label">Agent actions</span>
          <div className="tape__items">
            {plan.log.length === 0 && <span className="tape__idle">nothing yet</span>}
            {plan.log.slice(-6).map((entry) => (
              <span key={entry.id} className={`tape__item${entry.ok ? '' : ' tape__item--err'}`}>
                <code>{entry.tool}</code>
                {entry.detail}
              </span>
            ))}
          </div>
          {narration && <span className="tape__narration">{narration}</span>}
        </footer>
      </main>

      {renderChat(threadId)}
    </div>
  );
}

/**
 * Context injection: the current scheme of work and plan state are prepended to
 * every message, so the agent never has to guess what already exists or how far
 * it got. Cheaper and more reliable than making it call `list_scheme` each turn.
 */
async function beforeSendMessage(message: DistriMessage): Promise<DistriMessage> {
  const { status, outline, segments, questions } = planStore.getSnapshot();
  const context = {
    scheme: listScheme(),
    plan: {
      status,
      title: outline?.title ?? null,
      segments_written: segments.map((s) => s.name),
      questions_written: questions.length,
      questions_planned: outline?.questionCount ?? null,
    },
  };

  return {
    ...message,
    parts: [
      { part_type: 'text' as const, data: `[Planner state]\n${JSON.stringify(context, null, 2)}` },
      ...(message.parts || []),
    ],
  };
}

/** Shown instead of the chat when there is no API key — the rest still works. */
function ChatUnavailable({ error }: { error: string }) {
  return (
    <section className="chat chat--offline">
      <h3>Chat is offline</h3>
      <p className="chat--offline__err">{error}</p>
      <p>
        Copy <code>.env.example</code> to <code>.env</code>, set <code>DISTRI_API_KEY</code> — sign up at{' '}
        <a href="https://app.distri.dev/">app.distri.dev</a> — and restart the dev server.
      </p>
      <p className="chat--offline__note">
        Everything else on this page still works. Hit <strong>Run the mocked planning</strong> to watch the same
        six tools drive the whole flow from a script.
      </p>
    </section>
  );
}

export function App() {
  return (
    <DistriTokenProvider
      fallback={(error) => (
        <Planner subtitle="mocked run — no agent connected" renderChat={() => <ChatUnavailable error={error} />} />
      )}
    >
      <Planner
        subtitle="a Distri generation flow, end to end"
        renderChat={(threadId) => (
          <section className="chat">
            <Chat
              agentId={AGENT_ID}
              threadId={threadId}
              externalTools={lessonPlannerTools}
              beforeSendMessage={beforeSendMessage}
              starterCommands={STARTERS}
              theme="dark"
            />
          </section>
        )}
      />
    </DistriTokenProvider>
  );
}
