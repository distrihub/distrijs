import { useEffect, useMemo } from 'react';
import { createChatStore, ChatStoreContext } from '../stores/chatStateStore';
import { mergeTaskSummaries } from '../useBackgroundTasks';
import { SubTaskTree } from '../components/renderers/SubTaskTree';
import type { TaskSummary } from '@distri/core';

export interface ReplaySubTaskTreeProps {
  taskSummaries: TaskSummary[];
  /** Root task id to render from. Omit to auto-pick every parent-less task, per `SubTaskTree`'s own default. */
  rootTaskId?: string;
  /**
   * Show the root task itself alongside its descendants. Only meaningful
   * when `rootTaskId` refers to a real task in `taskSummaries` — for a
   * synthetic/virtual root (a cassette id that's never itself emitted as a
   * `task_summary`, just referenced as every child's `parent_task_id`),
   * leave this `false` (the default): `SubTaskTree` still separately
   * surfaces every parent-less task as a top-level root, so a virtual
   * `rootTaskId` combined with `hideRoot: true` renders the descendants
   * exactly once instead of duplicating them.
   */
  hideRoot?: boolean;
  className?: string;
}

/**
 * Renders a cassette's `task_summary` events through the real `SubTaskTree` /
 * `mergeTaskSummaries` — the same primitives `useBackgroundTasks` drives off a
 * live poll — so a "multi-agent research" style demo is deterministic and
 * scrubbable instead of re-generating fake rows off a `setInterval`.
 */
export function ReplaySubTaskTree({ taskSummaries, rootTaskId, hideRoot = true, className }: ReplaySubTaskTreeProps) {
  const store = useMemo(() => createChatStore(), []);

  useEffect(() => {
    if (taskSummaries.length) mergeTaskSummaries(store, taskSummaries);
  }, [store, taskSummaries]);

  return (
    <div className={className}>
      <ChatStoreContext.Provider value={store}>
        <SubTaskTree rootTaskId={rootTaskId} hideRoot={hideRoot} />
      </ChatStoreContext.Provider>
    </div>
  );
}
