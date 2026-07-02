import React, { useState, useEffect, useMemo } from 'react';
import {
  ChevronRight,
  ChevronDown,
  Loader2,
  CheckCircle2,
  XCircle,
  GitBranch,
} from 'lucide-react';
import { isDistriEvent, isDistriMessage, DistriChatMessage } from '@distri/core';
import { useChatStateStore, TaskState } from '@/stores/chatStateStore';
import { MessageRenderer } from './MessageRenderer';
import { ToolRendererMap, RenderingMode, SummaryFn } from '@/types';

export interface SubTaskCardProps {
  task: TaskState;
  depth: number;
  toolRenderers?: ToolRendererMap;
  rendering?: RenderingMode;
  toolSummaryOverrides?: Record<string, SummaryFn>;
  threadId?: string;
  onShowTrace?: (threadId: string) => void;
  verbose?: boolean;
  debug?: boolean;
}

function StatusIcon({ status }: { status: TaskState['status'] }) {
  switch (status) {
    case 'running':
      return <Loader2 className="h-3 w-3 text-primary animate-spin flex-shrink-0" />;
    case 'completed':
      return <CheckCircle2 className="h-3 w-3 text-primary flex-shrink-0" />;
    case 'failed':
      return <XCircle className="h-3 w-3 text-destructive flex-shrink-0" />;
    default:
      return <GitBranch className="h-3 w-3 text-muted-foreground flex-shrink-0" />;
  }
}

/**
 * Total number of tasks nested under `task` (children, grandchildren, …).
 * Walks the live tree from the store map so the count stays correct as
 * descendants stream in. Guards against cycles defensively.
 */
export function countDescendants(
  task: TaskState,
  tasks: Map<string, TaskState>,
  seen: Set<string> = new Set(),
): number {
  let total = 0;
  for (const id of task.childTaskIds) {
    if (seen.has(id)) continue;
    seen.add(id);
    const child = tasks.get(id);
    if (!child) continue;
    total += 1 + countDescendants(child, tasks, seen);
  }
  return total;
}

/**
 * One-line gist for the collapsed header: the child's final assistant text,
 * so the parent thread shows the *result* without expanding the internal
 * steps (the "one gist out" contract). Falls back to empty when the task has
 * produced no text yet.
 */
export function deriveGist(ownMessages: DistriChatMessage[]): string {
  for (let i = ownMessages.length - 1; i >= 0; i--) {
    const m = ownMessages[i];
    if (!isDistriMessage(m)) continue;
    const text = m.parts
      ?.filter((p) => p.part_type === 'text')
      .map((p) => (p as { data: string }).data)
      .join('')
      .trim();
    if (text) return text.replace(/\s+/g, ' ').slice(0, 120);
  }
  return '';
}

/**
 * Best-effort title derivation: agent name from event envelope, else the
 * first piece of streamed text, else the task id tail.
 */
function deriveTitle(messages: DistriChatMessage[], task: TaskState): string {
  if (task.title && task.title !== 'Agent Run') return task.title;
  for (const m of messages) {
    if (isDistriEvent(m) && m.taskId === task.id) {
      const e = m as { type: string; data?: { agentId?: string } };
      if (e.type === 'run_started' && e.data?.agentId) return e.data.agentId;
    }
  }
  for (const m of messages) {
    if (isDistriMessage(m) && (m as { taskId?: string }).taskId === task.id) {
      const text = m.parts
        ?.filter((p) => p.part_type === 'text')
        .map((p) => (p as { data: string }).data)
        .join('')
        .trim();
      if (text) return text.slice(0, 80);
    }
  }
  return `subtask ${task.id.slice(0, 8)}`;
}

export const SubTaskCard: React.FC<SubTaskCardProps> = ({
  task,
  depth,
  toolRenderers,
  rendering,
  toolSummaryOverrides,
  threadId,
  onShowTrace,
  verbose,
  debug,
}) => {
  const messages = useChatStateStore((s) => s.messages);
  const tasks = useChatStateStore((s) => s.tasks);

  const childTasks = useMemo(
    () =>
      task.childTaskIds
        .map((id) => tasks.get(id))
        .filter((t): t is TaskState => !!t),
    [task.childTaskIds, tasks],
  );

  const ownMessages = useMemo(
    () =>
      messages.filter((m) => {
        const taskId = (m as { taskId?: string }).taskId;
        return taskId === task.id;
      }),
    [messages, task.id],
  );

  // Default: expand while running, collapse when completed, and re-expand on
  // failure so the error surfaces without a manual click.
  const [expanded, setExpanded] = useState(
    task.status === 'running' || task.status === 'failed',
  );
  const [userToggled, setUserToggled] = useState(false);
  useEffect(() => {
    if (userToggled) return;
    if (task.status === 'running' || task.status === 'failed') setExpanded(true);
    if (task.status === 'completed') setExpanded(false);
  }, [task.status, userToggled]);

  const title = deriveTitle(messages, task);
  const descendantCount = useMemo(
    () => countDescendants(task, tasks),
    [task, tasks],
  );
  // Streamed text wins; fall back to the polled monitor's latest-update
  // preview (useBackgroundTasks stores it in metadata) so hydrated background
  // tasks show what they last did even without a live stream.
  const gist = useMemo(
    () => deriveGist(ownMessages) || ((task.metadata?.preview as string | undefined) ?? ''),
    [ownMessages, task.metadata],
  );
  const indent = depth * 12;

  return (
    <div
      className="rounded-md border border-border bg-muted/20 overflow-hidden text-xs"
      style={{ marginLeft: indent }}
    >
      <button
        type="button"
        className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-muted/40 cursor-pointer select-none"
        onClick={() => {
          setExpanded((e) => !e);
          setUserToggled(true);
        }}
      >
        {expanded ? (
          <ChevronDown className="h-3 w-3 text-muted-foreground flex-shrink-0" />
        ) : (
          <ChevronRight className="h-3 w-3 text-muted-foreground flex-shrink-0" />
        )}
        <StatusIcon status={task.status} />
        <span className="font-medium text-foreground truncate flex-shrink-0 text-left max-w-[40%]">{title}</span>
        {/* Gist preview when collapsed — the "one gist out" of the subtask. */}
        {!expanded && gist && (
          <span className="text-[10px] text-muted-foreground truncate flex-1 text-left italic">
            {gist}
          </span>
        )}
        {expanded && <span className="flex-1" />}
        {descendantCount > 0 && (
          <span className="text-[10px] text-muted-foreground flex-shrink-0">
            {descendantCount} subtask{descendantCount === 1 ? '' : 's'}
          </span>
        )}
        {task.status === 'running' && (
          <span className="text-[10px] text-muted-foreground flex-shrink-0">running…</span>
        )}
        {task.status === 'completed' && task.startTime && task.endTime && (
          <span className="text-[10px] text-muted-foreground flex-shrink-0">
            {((task.endTime - task.startTime) / 1000).toFixed(1)}s
          </span>
        )}
      </button>

      {expanded && (
        <div className="border-t border-border bg-background/40 px-2 py-2 space-y-1">
          {ownMessages.map((message, index) => (
            <MessageRenderer
              key={`${task.id}-${index}`}
              message={message}
              index={index}
              toolRenderers={toolRenderers}
              rendering={rendering}
              toolSummaryOverrides={toolSummaryOverrides}
              threadId={threadId}
              onShowTrace={onShowTrace}
              verbose={verbose}
              debug={debug}
            />
          ))}
          {childTasks.map((child) => (
            <SubTaskCard
              key={child.id}
              task={child}
              depth={depth + 1}
              toolRenderers={toolRenderers}
              rendering={rendering}
              toolSummaryOverrides={toolSummaryOverrides}
              threadId={threadId}
              onShowTrace={onShowTrace}
              verbose={verbose}
              debug={debug}
            />
          ))}
          {task.error && (
            <div className="px-2 py-1 text-destructive text-xs rounded bg-destructive/10">
              {task.error}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
