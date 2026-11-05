import React, { useCallback, useMemo } from 'react';
import { DistriChatMessage } from '@distri/core';
import { RendererContext } from './renderers/RendererContext';
import { SubTaskTree } from './renderers/SubTaskTree';
import { SubTaskCard } from './renderers/SubTaskCard';
import { blockStart, isRenderedEvent, renderTranscriptBlock } from './renderers/TranscriptBlocks';
import { childrenByCall, visibleCallIds } from './renderers/childrenByCall';
import { childTaskIdSet, isChildTaskMessage } from './renderers/taskGrouping';
import { useTranscript } from '../hooks/useTranscript';
import { useChatStateStore, useChatStoreApi } from '../stores/chatStateStore';
import { ToolRendererMap, RenderingMode, TranscriptRenderingProps } from '@/types';

export interface ChatMessageListProps extends TranscriptRenderingProps {
  /**
   * Messages to render. The caller supplies this (rather than reading it from
   * the store) because `<Chat>` concatenates persisted history in front of the
   * live store messages. Child-task (forked sub-agent) messages are grouped
   * into their `SubTaskCard` automatically — do not pre-filter them out.
   */
  messages: DistriChatMessage[];
  toolRenderers?: ToolRendererMap;
  rendering?: RenderingMode;
  verbose?: boolean;
  debug?: boolean;
  threadId?: string;
  enableFeedback?: boolean;
  onShowTrace?: (threadId: string) => void;
  /** Render forked sub-agent cards. Default true. */
  showSubTasks?: boolean;
}

/**
 * Renders a Distri message transcript: the block list from `useTranscript`
 * (developer parts hidden, superseded drafts resolved against the turn's
 * final answer, tool calls optionally folded into runs) with per-turn fork
 * trees anchored inline and a trailing catch-all tree for any un-anchored
 * roots. Reads task/tool state from the nearest `ChatStoreContext`, so it must
 * render inside a `<Chat>` / `useChat` / `useTaskStreaming` subtree.
 *
 * Extracted from `<Chat>` so the interactive chat and the read-only
 * `<TaskView>` share one implementation of the (non-trivial) fork-anchoring
 * logic instead of maintaining two copies.
 */
export const ChatMessageList: React.FC<ChatMessageListProps> = ({
  messages,
  toolRenderers,
  rendering = 'minimal',
  verbose = false,
  debug = false,
  threadId,
  enableFeedback = false,
  onShowTrace,
  toolSummaryOverrides,
  groupToolCalls = 'none',
  toolLabels,
  components,
  hideParts,
  showSubTasks = true,
}) => {
  const store = useChatStoreApi();
  const toolCalls = useChatStateStore((s) => s.toolCalls);
  const steps = useChatStateStore((s) => s.steps);

  // Child-task messages (forked sub-agents) render inside their SubTaskCard, not
  // in the flat column — otherwise every fork's relayed activity interleaves
  // with the parent's own and the run reads as one giant thread.
  const tasksSnapshot = store.getState().tasks;
  const childIds = childTaskIdSet(tasksSnapshot);
  // Keyed by content so the transcript only recomputes when the set changes.
  const childKey = Array.from(childIds).sort().join('|');
  const stableChildIds = useMemo(() => new Set(childKey ? childKey.split('|') : []), [childKey]);
  const excludeMessage = useCallback(
    (message: DistriChatMessage) =>
      isChildTaskMessage(message, stableChildIds)
      // Sub-agent activity always renders under its SubTaskTree, never inline.
      || Boolean((message as { parentTaskId?: string }).parentTaskId),
    [stableChildIds],
  );

  const blocks = useTranscript(messages, {
    hidePart: hideParts,
    groupToolCalls,
    isVisibleEvent: isRenderedEvent,
    excludeMessage,
    includeDeveloperMessages: debug,
  });

  const rendererContextValue = useMemo(() => ({
    rendering,
    toolSummaryOverrides: toolSummaryOverrides ?? {},
    onShowTrace,
    threadId,
    markdownComponents: components?.markdown,
  }), [rendering, toolSummaryOverrides, onShowTrace, threadId, components?.markdown]);

  // Anchor each turn's fork cards right AFTER that turn's last message — one
  // global tree at the bottom mixed every turn's forks into a single pile
  // detached from the conversation.
  const rootsWithChildren = showSubTasks
    ? Array.from(tasksSnapshot.values()).filter(
        (t) => !t.parentTaskId && t.childTaskIds.length > 0,
      )
    : [];
  const lastIndexByRoot = new Map<string, number>();
  messages.forEach((m, i) => {
    const tid = (m as { taskId?: string }).taskId;
    if (tid && rootsWithChildren.some((r) => r.id === tid)) lastIndexByRoot.set(tid, i);
  });
  const anchors: Array<{ index: number; rootId: string }> = [];
  for (const r of rootsWithChildren) {
    const idx = lastIndexByRoot.get(r.id);
    if (idx !== undefined) anchors.push({ index: idx, rootId: r.id });
  }
  anchors.sort((a, b) => a.index - b.index);
  const anchoredRoots = new Set(anchors.map((a) => a.rootId));

  const elements: React.ReactNode[] = [];
  let nextAnchor = 0;
  // Emit every fork tree anchored at or before `index`, in message order.
  const flushTrees = (index: number) => {
    while (nextAnchor < anchors.length && anchors[nextAnchor].index <= index) {
      const rootId = anchors[nextAnchor].rootId;
      elements.push(
        <SubTaskTree
          key={`tree-${rootId}`}
          rootTaskId={rootId}
          excludeTaskIds={placedChildIds}
          messages={messages}
          toolRenderers={toolRenderers}
          rendering={rendering}
          toolSummaryOverrides={toolSummaryOverrides}
          threadId={threadId}
          onShowTrace={onShowTrace}
          verbose={verbose}
          debug={debug}
        />,
      );
      nextAnchor += 1;
    }
  };

  const roots = Array.from(tasksSnapshot.values()).filter((t) => !t.parentTaskId);
  const byCall = showSubTasks
    ? childrenByCall(roots, tasksSnapshot, visibleCallIds(blocks))
    : new Map<string, import('@/stores/chatStateStore').TaskState[]>();
  const placedChildIds = new Set(Array.from(byCall.values()).flat().map((t) => t.id));

  const viewProps = {
    toolCalls,
    stepStatus: (stepId: string) => steps.get(stepId)?.status,
    toolRenderers,
    rendering,
    verbose,
    debug,
    threadId,
    enableFeedback,
    onShowTrace,
    toolSummaryOverrides,
    groupToolCalls,
    toolLabels,
    components,
    hideParts,
  };

  for (const block of blocks) {
    flushTrees(blockStart(block) - 1);
    elements.push(renderTranscriptBlock(block, viewProps));
    // A helper's card sits right under the call that started it.
    if (showSubTasks && block.kind === 'steps') {
      for (const call of block.toolCalls) {
        for (const child of byCall.get(call.tool_call_id) ?? []) {
          elements.push(
            <div key={`sub-${child.id}`} className="w-full px-4 my-1">
              <div className="max-w-4xl mx-auto">
                <SubTaskCard
                  task={child}
                  depth={0}
                  messages={messages}
                  toolRenderers={toolRenderers}
                  rendering={rendering}
                  toolSummaryOverrides={toolSummaryOverrides}
                  groupToolCalls={groupToolCalls}
                  toolLabels={toolLabels}
                  components={components}
                  hideParts={hideParts}
                  threadId={threadId}
                  onShowTrace={onShowTrace}
                  verbose={verbose}
                  debug={debug}
                />
              </div>
            </div>,
          );
        }
      }
    }
    flushTrees(block.index);
  }
  flushTrees(Number.POSITIVE_INFINITY);

  return (
    <RendererContext.Provider value={rendererContextValue}>
      {elements}
      {/* Catch-all for roots that never got anchored inline (no message carried
          their taskId this render). */}
      {showSubTasks && <SubTaskTree
        excludeRootIds={anchoredRoots}
        excludeTaskIds={placedChildIds}
        messages={messages}
        toolRenderers={toolRenderers}
        rendering={rendering}
        toolSummaryOverrides={toolSummaryOverrides}
        threadId={threadId}
        onShowTrace={onShowTrace}
        verbose={verbose}
        debug={debug}
      />}
    </RendererContext.Provider>
  );
};
