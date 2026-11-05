import type { TranscriptBlock } from '@distri/state';
import type { TaskState } from '@/stores/chatStateStore';

/** Every tool call id the blocks show. */
export function visibleCallIds(blocks: TranscriptBlock[]): Set<string> {
  const ids = new Set<string>();
  for (const b of blocks) {
    if (b.kind === 'steps') for (const c of b.toolCalls) ids.add(c.tool_call_id);
  }
  return ids;
}

/**
 * The child tasks of `parents` that can sit under the call that started them:
 * the server named the call (`parentToolCallId`) and the transcript shows it.
 * A child whose call is not shown stays with the caller's catch-all tree, so
 * no card is lost.
 */
export function childrenByCall(
  parents: TaskState[],
  tasks: Map<string, TaskState>,
  shownCalls: Set<string>,
): Map<string, TaskState[]> {
  const out = new Map<string, TaskState[]>();
  for (const parent of parents) {
    for (const id of parent.childTaskIds) {
      const child = tasks.get(id);
      const call = child?.parentToolCallId;
      if (!child || !call || !shownCalls.has(call)) continue;
      out.set(call, [...(out.get(call) ?? []), child]);
    }
  }
  return out;
}
