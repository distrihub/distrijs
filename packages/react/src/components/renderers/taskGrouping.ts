/**
 * Task-aware message grouping for the chat column.
 *
 * The parent's SSE stream relays every child task's events/messages, and the
 * chat used to render ALL of them flat in arrival order — a forked drafter's
 * tool calls interleaved with the parent's own, so "everything looked like
 * one thread" while running. Child-task messages already render inside their
 * `SubTaskCard` (which filters by `m.taskId`), so the flat list must skip
 * them: the parent's narrative stays inline, each fork's activity lives in
 * its card.
 */
import type { DistriChatMessage } from '@distri/core';
import type { TaskState } from '../../stores/chatStateStore';

/** Ids of tasks that are children in the dispatch tree (parentTaskId set). */
export function childTaskIdSet(tasks: Map<string, TaskState>): Set<string> {
  const ids = new Set<string>();
  tasks.forEach((t) => {
    if (t.parentTaskId) ids.add(t.id);
  });
  return ids;
}

/**
 * Whether a message belongs to a CHILD task and therefore renders inside its
 * SubTaskCard rather than in the flat chat column. Messages without a taskId
 * (user input, pre-task text, hydrated history) always render inline.
 */
export function isChildTaskMessage(message: DistriChatMessage, childIds: Set<string>): boolean {
  const taskId = (message as { taskId?: string }).taskId;
  return Boolean(taskId && childIds.has(taskId));
}
