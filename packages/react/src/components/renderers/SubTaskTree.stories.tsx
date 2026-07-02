/**
 * Background sub-task scenarios — the client side of `invoke_agent
 * { mode: "background" }`. Each story seeds a chat store with the same
 * TaskSummary rows the server returns from `GET /tasks?parent_task_id=…`
 * (via `mergeTaskSummaries`, exactly what `useBackgroundTasks` does on each
 * poll) and renders `SubTaskTree` against it — no server needed.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import type { TaskSummary } from '@distri/core';
import { ChatStoreContext, createChatStore, mergeTaskSummaries, SubTaskTree } from '@distri/react';

const ROOT = 'root-task-1';

function summary(partial: Partial<TaskSummary> & { id: string }): TaskSummary {
  const now = Date.now();
  return {
    thread_id: 'thread-1',
    parent_task_id: ROOT,
    status: 'running',
    created_at: now - 45_000,
    updated_at: now - 1_000,
    preview: null,
    last_event_at: now - 1_000,
    ...partial,
  };
}

/** Seed a store once and render the tree from it. */
function SeededTree({ rows, rootTaskId, hideRoot }: { rows: TaskSummary[]; rootTaskId?: string; hideRoot?: boolean }) {
  const store = useMemo(() => {
    const s = createChatStore();
    mergeTaskSummaries(s, rows);
    return s;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <ChatStoreContext.Provider value={store}>
      <SubTaskTree rootTaskId={rootTaskId} hideRoot={hideRoot} />
    </ChatStoreContext.Provider>
  );
}

const meta: Meta<typeof SeededTree> = {
  title: 'Tasks/SubTaskTree',
  component: SeededTree,
  parameters: { layout: 'padded' },
};
export default meta;
type Story = StoryObj<typeof SeededTree>;

/** A parent forked 3 scene drafters; one is still running, one succeeded,
 * one failed. What the monitor shows mid-flight. */
export const RunningForest: Story = {
  render: () => (
    <SeededTree
      rootTaskId={ROOT}
      rows={[
        summary({ id: 'scene-s1', status: 'completed', preview: 'Wrote scenes/s1.tsx — papers avalanche, 90 frames' }),
        summary({ id: 'scene-s2', status: 'running', preview: 'Researching motion treatment for the dashboard reveal…' }),
        summary({ id: 'scene-s3', status: 'failed', preview: 'esbuild: Unterminated regular expression (line 41)' }),
      ]}
    />
  ),
};

/** Everything terminal — cards collapse to their gist lines. */
export const AllSettled: Story = {
  render: () => (
    <SeededTree
      rootTaskId={ROOT}
      rows={[
        summary({ id: 'scene-s1', status: 'completed', preview: 'Wrote scenes/s1.tsx' }),
        summary({ id: 'scene-s2', status: 'completed', preview: 'Wrote scenes/s2.tsx' }),
        summary({ id: 'scene-s3', status: 'completed', preview: 'Wrote scenes/s3.tsx' }),
      ]}
    />
  ),
};

/** Nested fan-out: a drafter forked its own researcher grandchild. */
export const NestedChildren: Story = {
  render: () => (
    <SeededTree
      rootTaskId={ROOT}
      rows={[
        summary({ id: 'scene-s1', status: 'running', preview: 'Drafting scene s1…' }),
        summary({ id: 'research-1', parent_task_id: 'scene-s1', status: 'completed', preview: 'Found 3 reference treatments' }),
      ]}
    />
  ),
};

/** The cron-style monitor loop: rows re-merge every "poll" and children
 * finish one by one — exactly what useBackgroundTasks does against
 * GET /tasks?parent_task_id=… (statuses advance; preview updates live). */
export const LivePollingSimulation: Story = {
  render: () => {
    const store = useMemo(() => createChatStore(), []);
    const tick = useRef(0);
    const [, force] = useState(0);
    useEffect(() => {
      const iv = setInterval(() => {
        tick.current += 1;
        const t = tick.current;
        const st = (doneAt: number): TaskSummary['status'] => (t >= doneAt ? 'completed' : 'running');
        mergeTaskSummaries(store, [
          summary({ id: 'scene-s1', status: st(2), preview: t >= 2 ? 'Wrote scenes/s1.tsx' : `Drafting s1… (poll ${t})` }),
          summary({ id: 'scene-s2', status: st(4), preview: t >= 4 ? 'Wrote scenes/s2.tsx' : `Drafting s2… (poll ${t})` }),
          summary({ id: 'scene-s3', status: st(6), preview: t >= 6 ? 'Wrote scenes/s3.tsx' : `Drafting s3… (poll ${t})` }),
        ]);
        force((n) => n + 1);
        if (t > 7) clearInterval(iv);
      }, 1200);
      return () => clearInterval(iv);
    }, [store]);
    return (
      <ChatStoreContext.Provider value={store}>
        <SubTaskTree rootTaskId={ROOT} />
      </ChatStoreContext.Provider>
    );
  },
};
