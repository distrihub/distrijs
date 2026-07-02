import { useCallback, useEffect, useRef, useState } from 'react';
import type { TaskSummary, TaskSummaryStatus } from '@distri/core';
import { useDistri } from './DistriProvider';
import { useChatStoreApi, type ChatStore, type TaskState } from './stores/chatStateStore';

/** Wire statuses after which a task can never change again. */
const TERMINAL_STATUSES: ReadonlySet<TaskSummaryStatus> = new Set([
  'completed',
  'failed',
  'canceled',
]);

/**
 * Map a server {@link TaskSummaryStatus} onto the client-side
 * `TaskState.status` union:
 *
 *  - `completed` / `failed`  → identical.
 *  - `canceled`              → `'failed'` (TaskState has no canceled state;
 *                              the raw wire status is preserved in
 *                              `TaskState.metadata.remote_status`).
 *  - `input_required`        → `'running'` (non-terminal, still active).
 *  - `pending` / `running`   → identical.
 */
export function mapTaskSummaryStatus(status: TaskSummaryStatus): TaskState['status'] {
  switch (status) {
    case 'completed':
      return 'completed';
    case 'failed':
    case 'canceled':
      return 'failed';
    case 'running':
    case 'input_required':
      return 'running';
    case 'pending':
    default:
      return 'pending';
  }
}

/**
 * Merge a batch of server {@link TaskSummary} objects into a chat store's
 * `tasks` map so the existing SubTaskTree / SubTaskCard renderers pick them
 * up. The merge is idempotent and mirrors the event path's tree wiring:
 *
 *  - `parentTaskId` is set from `parent_task_id`.
 *  - the child is appended to the parent's `childTaskIds` (dedup'd).
 *  - when the parent isn't in the store yet (e.g. a `parentTaskId`-scoped
 *    query, which excludes the root), a placeholder parent task is hydrated
 *    so `SubTaskTree` can anchor a root at it (`rootTaskId={parentTaskId}`).
 *  - `preview`, `last_event_at`, and the raw wire status (`remote_status`)
 *    are stored in `TaskState.metadata`.
 *  - fields the event path owns (title, childTaskIds, startTime) are
 *    preserved when the task already exists in the store.
 */
export function mergeTaskSummaries(store: ChatStore, summaries: TaskSummary[]): void {
  for (const summary of summaries) {
    const state = store.getState();
    const existing = state.tasks.get(summary.id);
    const isTerminal = TERMINAL_STATUSES.has(summary.status);

    state.updateTask(summary.id, {
      id: summary.id,
      parentTaskId: summary.parent_task_id ?? existing?.parentTaskId,
      childTaskIds: existing?.childTaskIds ?? [],
      title: existing?.title ?? 'Agent Run',
      status: mapTaskSummaryStatus(summary.status),
      startTime: existing?.startTime ?? summary.created_at,
      endTime: isTerminal
        ? existing?.endTime ?? summary.last_event_at ?? summary.updated_at
        : existing?.endTime,
      metadata: {
        ...existing?.metadata,
        preview: summary.preview ?? undefined,
        last_event_at: summary.last_event_at ?? undefined,
        remote_status: summary.status,
      },
    });

    // Wire the child into the parent, exactly like the event path does.
    if (summary.parent_task_id) {
      const parent = store.getState().tasks.get(summary.parent_task_id);
      if (!parent) {
        // Hydrate a placeholder root so SubTaskTree(rootTaskId=parent) works
        // even when the scoped listing excludes the root. Its real status
        // arrives when its own summary is merged (same batch or later poll)
        // or when the caller hydrates it via `client.getTaskById`.
        store.getState().updateTask(summary.parent_task_id, {
          id: summary.parent_task_id,
          childTaskIds: [summary.id],
          title: 'Agent Run',
          status: 'running',
        });
      } else if (!parent.childTaskIds.includes(summary.id)) {
        store.getState().updateTask(summary.parent_task_id, {
          childTaskIds: [...parent.childTaskIds, summary.id],
        });
      }
    }
  }
}

export interface UseBackgroundTasksOptions {
  /**
   * Scope the listing to the sub-tree under this task (the task itself is
   * excluded by the server; a placeholder parent is hydrated client-side).
   */
  parentTaskId?: string;
  /** Poll interval in ms while any listed task is non-terminal. Default 4000. */
  pollMs?: number;
  /** Master switch. When false, nothing is fetched. Default true. */
  enabled?: boolean;
  /**
   * Agent id used by `cancel()`. `DistriClient.cancelTask(agentId, taskId)`
   * routes through the per-agent A2A client, so cancellation is unavailable
   * until this is provided.
   */
  agentId?: string;
}

export interface UseBackgroundTasksResult {
  /**
   * The tasks returned by the latest poll, read from the chat store after
   * merging (so event-path enrichments like titles are reflected).
   */
  tasks: TaskState[];
  /** Force an immediate re-fetch; re-arms polling if activity is found. */
  refresh: () => Promise<void>;
  /** Cancel a task via the A2A cancel endpoint. Requires `opts.agentId`. */
  cancel: (taskId: string) => Promise<void>;
}

/**
 * Poll the task-monitor listing (`GET /tasks?thread_id=…`) for a thread and
 * merge results into the surrounding chat store's `tasks` map so
 * SubTaskTree / SubTaskCard render background tasks alongside live ones.
 *
 * Polling model (kept deliberately simple):
 *  - one initial fetch whenever `enabled && threadId && client` holds;
 *  - re-polls every `pollMs` while at least one listed task is non-terminal
 *    (`pending` / `running` / `input_required`);
 *  - STOPS entirely once every listed task is terminal — call `refresh()`
 *    (or change `threadId` / `enabled`) to re-arm;
 *  - a failed poll logs a warning and keeps polling (transient errors).
 *
 * Must be mounted inside a `ChatStoreContext` subtree (i.e. under `<Chat>` /
 * `useChat`, or an explicit `ChatStoreContext.Provider`) and a
 * `DistriProvider`.
 */
export function useBackgroundTasks(
  threadId: string | undefined,
  opts: UseBackgroundTasksOptions = {},
): UseBackgroundTasksResult {
  const { parentTaskId, pollMs = 4000, enabled = true, agentId } = opts;
  const { client } = useDistri();
  const store = useChatStoreApi();
  const [tasks, setTasks] = useState<TaskState[]>([]);
  // The active polling loop publishes its "fetch now (and re-arm)" entry
  // point here; refresh() calls through it so a manual refresh can restart
  // a stopped loop. Null when no loop is mounted (disabled / no thread).
  const tickRef = useRef<(() => Promise<void>) | null>(null);

  /** One fetch+merge pass. Returns true when any listed task is non-terminal. */
  const fetchAndMerge = useCallback(async (): Promise<boolean> => {
    if (!client || !threadId) return false;
    const summaries = await client.listTasks({ threadId, parentTaskId });
    mergeTaskSummaries(store, summaries);
    const state = store.getState();
    setTasks(
      summaries
        .map((s) => state.tasks.get(s.id))
        .filter((t): t is TaskState => Boolean(t)),
    );
    return summaries.some((s) => !TERMINAL_STATUSES.has(s.status));
  }, [client, threadId, parentTaskId, store]);

  useEffect(() => {
    if (!enabled || !client || !threadId) return;

    let disposed = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const tick = async (): Promise<void> => {
      let active = true;
      try {
        active = await fetchAndMerge();
      } catch (err) {
        console.warn('[useBackgroundTasks] poll failed:', err);
        active = true; // transient error — keep polling
      }
      if (disposed) return;
      if (active) {
        timer = setTimeout(tick, pollMs);
      }
      // else: everything terminal — polling stops until refresh()/deps change.
    };

    tickRef.current = () => {
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
      return tick();
    };
    void tick();

    return () => {
      disposed = true;
      tickRef.current = null;
      if (timer) clearTimeout(timer);
    };
  }, [enabled, client, threadId, pollMs, fetchAndMerge]);

  const refresh = useCallback(async () => {
    if (tickRef.current) {
      await tickRef.current();
    } else {
      // No active loop (disabled or unmounted deps) — one-shot fetch.
      await fetchAndMerge();
    }
  }, [fetchAndMerge]);

  const cancel = useCallback(
    async (taskId: string) => {
      if (!client) throw new Error('useBackgroundTasks: client not available');
      if (!agentId) {
        throw new Error(
          'useBackgroundTasks: cancel() requires the `agentId` option — DistriClient.cancelTask(agentId, taskId) routes through the per-agent A2A client.',
        );
      }
      await client.cancelTask(agentId, taskId);
      await refresh();
    },
    [client, agentId, refresh],
  );

  return { tasks, refresh, cancel };
}
