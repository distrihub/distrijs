import type { TaskState, ToolCallState } from './chatStore';
import { toolStepLabel } from './transcript';
import type { ToolStepLabelOptions } from './transcript';

/**
 * One agent in the dispatch tree, as a list row. The data behind a "who is
 * working on what" panel on web and native: no markup, no framework.
 */
export interface AgentListRow {
  id: string;
  parentTaskId?: string;
  /** Distance from the root task: 0 for the lead, 1 for its helpers. */
  depth: number;
  title: string;
  /** The agent definition running the task, when the server named it. */
  agentId?: string;
  status: TaskState['status'];
  startTime?: number;
  endTime?: number;
  /** `endTime - startTime` once both are known. */
  durationMs?: number;
  /** The failure message of a failed task. */
  error?: string;
  /** What it is doing now: the label of its newest running tool call. */
  activity?: string;
}

export interface AgentListOptions extends Pick<ToolStepLabelOptions, 'toolLabels' | 'summaryOverrides'> {
  /** Only this root's tree. Default: every root. */
  rootTaskId?: string;
  /** Leave the root (the lead) out and list its helpers. Default false. */
  helpersOnly?: boolean;
}

const PLACEHOLDER_TITLES = new Set(['Agent Run', 'Task', '']);
const LIVE_TOOL_STATUSES = new Set(['pending', 'running', 'user_action_required']);

/** A task's name for a list: the title the server gave, else its intent, else the agent id. */
export function agentTitle(task: TaskState): string {
  if (!PLACEHOLDER_TITLES.has(task.title)) return task.title;
  const intent = (task.metadata?.intent as string | undefined)?.trim();
  if (intent) return intent.replace(/\s+/g, ' ').slice(0, 48);
  return task.agentId ?? 'Agent';
}

/**
 * The dispatch tree as rows, each parent followed by its helpers in the order
 * they started. A task whose parent the store has not seen counts as a root.
 */
export function buildAgentList(
  tasks: Map<string, TaskState>,
  toolCalls: Map<string, ToolCallState>,
  options: AgentListOptions = {},
): AgentListRow[] {
  const liveByTask = new Map<string, ToolCallState>();
  toolCalls.forEach(call => {
    if (!call.taskId || !LIVE_TOOL_STATUSES.has(call.status)) return;
    const seen = liveByTask.get(call.taskId);
    if (!seen || (call.startTime ?? 0) >= (seen.startTime ?? 0)) liveByTask.set(call.taskId, call);
  });

  const rows: AgentListRow[] = [];
  const visited = new Set<string>();
  const walk = (task: TaskState, depth: number) => {
    if (visited.has(task.id)) return;
    visited.add(task.id);
    const live = liveByTask.get(task.id);
    if (!(options.helpersOnly && depth === 0)) {
      rows.push({
        id: task.id,
        parentTaskId: task.parentTaskId,
        depth,
        title: agentTitle(task),
        agentId: task.agentId,
        status: task.status,
        startTime: task.startTime,
        endTime: task.endTime,
        ...(task.startTime !== undefined && task.endTime !== undefined ? { durationMs: task.endTime - task.startTime } : {}),
        ...(task.error ? { error: task.error } : {}),
        ...(live && task.status === 'running'
          ? { activity: toolStepLabel(live, { toolLabels: options.toolLabels, summaryOverrides: options.summaryOverrides }) }
          : {}),
      });
    }
    const children = task.childTaskIds
      .map(id => tasks.get(id))
      .filter((t): t is TaskState => Boolean(t))
      .sort((a, b) => (a.startTime ?? Infinity) - (b.startTime ?? Infinity));
    for (const child of children) walk(child, depth + 1);
  };

  const roots = options.rootTaskId
    ? [tasks.get(options.rootTaskId)].filter((t): t is TaskState => Boolean(t))
    : Array.from(tasks.values()).filter(t => !t.parentTaskId || !tasks.has(t.parentTaskId));
  for (const root of roots) walk(root, 0);
  return rows;
}

export interface AgentListSummary {
  running: number;
  failed: number;
  done: number;
  /** Not started yet. */
  queued: number;
  total: number;
}

/** Counts the helpers (rows with a parent) by state: "3 running · 1 failed · 4 done". */
export function summarizeAgentList(rows: AgentListRow[]): AgentListSummary {
  const out: AgentListSummary = { running: 0, failed: 0, done: 0, queued: 0, total: 0 };
  for (const row of rows) {
    if (!row.parentTaskId) continue;
    out.total += 1;
    if (row.status === 'running') out.running += 1;
    else if (row.status === 'failed') out.failed += 1;
    else if (row.status === 'completed') out.done += 1;
    else out.queued += 1;
  }
  return out;
}
