import React, { useMemo } from 'react';
import { useChatStateStore, TaskState } from '@/stores/chatStateStore';
import { SubTaskCard } from './SubTaskCard';
import { ToolRendererMap, RenderingMode, SummaryFn } from '@/types';

export interface SubTaskTreeProps {
  /** Message source override — pass the DISPLAYED array (history + live) so
   *  cards can render history-only children. Defaults to the store's live messages. */
  messages?: import('@distri/core').DistriChatMessage[];
  /**
   * Optional explicit root. When omitted, picks every task in the store
   * that has no parent — typically just one per turn.
   */
  rootTaskId?: string;
  toolRenderers?: ToolRendererMap;
  rendering?: RenderingMode;
  toolSummaryOverrides?: Record<string, SummaryFn>;
  threadId?: string;
  onShowTrace?: (threadId: string) => void;
  verbose?: boolean;
  debug?: boolean;
  /**
   * Hide the root task and only show its descendants. Default true —
   * the root task's events render inline in the main message list, so
   * the tree only needs to surface sub-agents.
   */
  hideRoot?: boolean;
}

/**
 * Walks the task dispatch tree from chat state and renders every
 * sub-task as a collapsible card. Intended to be mounted alongside the
 * main message list so sub-agent activity is grouped under one
 * accordion per task instead of streaming inline with the parent.
 */
export const SubTaskTree: React.FC<SubTaskTreeProps> = ({
  rootTaskId,
  hideRoot = true,
  ...rest
}) => {
  const tasks = useChatStateStore((s) => s.tasks);

  const roots = useMemo(() => {
    if (rootTaskId) {
      const t = tasks.get(rootTaskId);
      return t ? [t] : [];
    }
    return Array.from(tasks.values()).filter((t) => !t.parentTaskId);
  }, [tasks, rootTaskId]);

  const cards = useMemo(() => {
    const out: { task: TaskState; depth: number }[] = [];
    for (const root of roots) {
      if (!hideRoot) out.push({ task: root, depth: 0 });
      for (const childId of root.childTaskIds) {
        const child = tasks.get(childId);
        if (child) out.push({ task: child, depth: hideRoot ? 0 : 1 });
      }
    }
    return out;
  }, [roots, tasks, hideRoot]);

  if (cards.length === 0) return null;

  return (
    <div className="w-full px-4 my-2 space-y-1">
      <div className="max-w-4xl mx-auto space-y-1">
        {cards.map(({ task, depth }) => (
          <SubTaskCard key={task.id} task={task} depth={depth} {...rest} />
        ))}
      </div>
    </div>
  );
};
