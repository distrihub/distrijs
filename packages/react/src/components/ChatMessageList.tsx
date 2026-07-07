import React, { useCallback, useEffect, useState } from 'react';
import { DistriChatMessage } from '@distri/core';
import { MessageRenderer } from './renderers/MessageRenderer';
import { SubTaskTree } from './renderers/SubTaskTree';
import { childTaskIdSet, isChildTaskMessage } from './renderers/taskGrouping';
import { useChatStateStore, useChatStoreApi } from '../stores/chatStateStore';
import { ToolRendererMap, RenderingMode } from '@/types';

export interface ChatMessageListProps {
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

/**
 * Renders a Distri message transcript: the flat message column with per-turn
 * fork trees anchored inline and a trailing catch-all tree for any un-anchored
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
}) => {
  const store = useChatStoreApi();
  const toolCalls = useChatStateStore((s) => s.toolCalls);
  const [expandedTools, setExpandedTools] = useState<Set<string>>(new Set());

  const toggleToolExpansion = useCallback((toolId: string) => {
    setExpandedTools((prev) => {
      const next = new Set(prev);
      if (next.has(toolId)) next.delete(toolId);
      else next.add(toolId);
      return next;
    });
  }, []);

  // Auto-expand tools that are running, errored, or awaiting user action.
  useEffect(() => {
    const next = new Set(expandedTools);
    let changed = false;
    toolCalls.forEach((toolCall) => {
      if (toolCall.status === 'running' || toolCall.status === 'error' || toolCall.status === 'user_action_required') {
        if (!next.has(toolCall.tool_call_id)) {
          next.add(toolCall.tool_call_id);
          changed = true;
        }
      }
    });
    if (changed) setExpandedTools(next);
  }, [toolCalls, expandedTools]);

  const elements: React.ReactNode[] = [];

  // Child-task messages (forked sub-agents) render inside their SubTaskCard, not
  // in the flat column — otherwise every fork's relayed activity interleaves
  // with the parent's own and the run reads as one giant thread.
  const tasksSnapshot = store.getState().tasks;
  const childIds = childTaskIdSet(tasksSnapshot);

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
  const treesAtIndex = new Map<number, string[]>();
  const anchoredRoots = new Set<string>();
  for (const r of rootsWithChildren) {
    const idx = lastIndexByRoot.get(r.id);
    if (idx !== undefined) {
      treesAtIndex.set(idx, [...(treesAtIndex.get(idx) ?? []), r.id]);
      anchoredRoots.add(r.id);
    }
  }

  const appendTrees = (index: number) => {
    for (const rootId of treesAtIndex.get(index) ?? []) {
      elements.push(
        <SubTaskTree
          key={`tree-${rootId}`}
          rootTaskId={rootId}
          messages={messages}
          toolRenderers={toolRenderers}
          rendering={rendering}
          threadId={threadId}
          onShowTrace={onShowTrace}
          verbose={verbose}
          debug={debug}
        />,
      );
    }
  };

  messages.forEach((message, index) => {
    if (isChildTaskMessage(message, childIds)) {
      appendTrees(index);
      return;
    }
    const rendered = (
      <MessageRenderer
        key={`message-${index}`}
        message={message}
        index={index}
        toolRenderers={toolRenderers}
        isExpanded={expandedTools.has((message as { id?: string }).id || `message-${index}`)}
        onToggle={() => toggleToolExpansion((message as { id?: string }).id || `message-${index}`)}
        debug={debug}
        verbose={verbose}
        rendering={rendering}
        threadId={threadId}
        enableFeedback={enableFeedback}
        onShowTrace={onShowTrace}
      />
    );
    if (rendered !== null) elements.push(rendered);
    appendTrees(index);
  });

  return (
    <>
      {elements}
      {/* Catch-all for roots that never got anchored inline (no message carried
          their taskId this render). */}
      <SubTaskTree
        excludeRootIds={anchoredRoots}
        messages={messages}
        toolRenderers={toolRenderers}
        rendering={rendering}
        threadId={threadId}
        onShowTrace={onShowTrace}
        verbose={verbose}
        debug={debug}
      />
    </>
  );
};
