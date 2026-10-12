import React, { useCallback, useMemo } from 'react';
import { DistriChatMessage, DistriEvent, DistriMessage } from '@distri/core';
import type { TranscriptBlock } from '@distri/state';
import { MessageRenderer, MessageRow } from './renderers/MessageRenderer';
import { RendererContext } from './renderers/RendererContext';
import { SubTaskTree } from './renderers/SubTaskTree';
import { ToolStepsRenderer } from './renderers/ToolStepsRenderer';
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
}

/** Events the web transcript renders as their own row; everything else is bookkeeping. */
const RENDERED_EVENT_TYPES = new Set(['agent_handover', 'run_error', 'live_view']);
const isRenderedEvent = (event: DistriEvent) => RENDERED_EVENT_TYPES.has(event.type);

function textOf(message: DistriMessage): string {
  return message.parts
    .filter(part => part.part_type === 'text')
    .map(part => (part as { data: string }).data)
    .join('')
    .trim();
}

/** First source index a block covers (steps blocks span several events). */
function blockStart(block: TranscriptBlock): number {
  return block.kind === 'steps' ? block.startIndex : block.index;
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
  const rootsWithChildren = Array.from(tasksSnapshot.values()).filter(
    (t) => !t.parentTaskId && t.childTaskIds.length > 0,
  );
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

  const renderBlock = (block: TranscriptBlock): React.ReactNode => {
    switch (block.kind) {
      case 'steps':
        return (
          <MessageRow key={block.key} className="distri-tool-execution-start">
            <ToolStepsRenderer
              block={block}
              toolCallStates={toolCalls}
              toolRenderers={toolRenderers}
              rendering={rendering}
              debug={debug}
              verbose={verbose}
              grouped={groupToolCalls === 'run'}
              toolLabels={toolLabels}
              ToolSteps={components?.ToolSteps}
            />
          </MessageRow>
        );
      case 'user': {
        const UserMessage = components?.UserMessage;
        if (UserMessage) {
          return (
            <MessageRow key={block.key} className="distri-user-message" isUserMessage>
              <UserMessage message={block.message} />
            </MessageRow>
          );
        }
        break;
      }
      case 'assistant': {
        const AssistantText = components?.AssistantText;
        if (AssistantText) {
          const stepId = block.message.step_id;
          return (
            <MessageRow key={block.key} className="distri-assistant-message">
              <AssistantText
                message={block.message}
                text={textOf(block.message)}
                isFinal={block.isFinal}
                isStreaming={stepId ? steps.get(stepId)?.status === 'running' : false}
              />
            </MessageRow>
          );
        }
        break;
      }
      default:
        break;
    }
    return (
      <MessageRenderer
        key={block.key}
        message={block.message}
        index={block.index}
        toolRenderers={toolRenderers}
        debug={debug}
        verbose={verbose}
        rendering={rendering}
        toolSummaryOverrides={toolSummaryOverrides}
        threadId={threadId}
        enableFeedback={enableFeedback}
        onShowTrace={onShowTrace}
      />
    );
  };

  for (const block of blocks) {
    flushTrees(blockStart(block) - 1);
    elements.push(renderBlock(block));
    flushTrees(block.index);
  }
  flushTrees(Number.POSITIVE_INFINITY);

  return (
    <RendererContext.Provider value={rendererContextValue}>
      {elements}
      {/* Catch-all for roots that never got anchored inline (no message carried
          their taskId this render). */}
      <SubTaskTree
        excludeRootIds={anchoredRoots}
        messages={messages}
        toolRenderers={toolRenderers}
        rendering={rendering}
        toolSummaryOverrides={toolSummaryOverrides}
        threadId={threadId}
        onShowTrace={onShowTrace}
        verbose={verbose}
        debug={debug}
      />
    </RendererContext.Provider>
  );
};
