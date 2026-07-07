import React from 'react';
import { Agent, DistriChatMessage } from '@distri/core';
import { ChatStore, ChatStoreContext, useChatStateStore } from '../stores/chatStateStore';
import { useTaskStreaming } from '../useTaskStreaming';
import { ChatMessageList } from './ChatMessageList';
import { ContextRow } from './ContextRow';
import { ToolRendererMap, RenderingMode } from '@/types';

export interface TaskViewProps {
  /** The agent that owns the task (needed to open the resubscribe stream). */
  agent: Agent | null;
  /** The task to follow read-only. `null` renders empty. */
  taskId: string | null;
  /** Thread history to seed the transcript (tasks older than the 24h replay window). */
  initialMessages?: DistriChatMessage[];
  /** Hold the subscription closed when `false`. Default `true`. */
  enabled?: boolean;

  // ---- Renderer customization: the same surface as <Chat> ----
  /** Per-tool custom renderers, keyed by tool name. Same `ToolRendererMap` as `<Chat>`. */
  toolRenderers?: ToolRendererMap;
  /** `'minimal'` (compact rows) or `'rich'` (expanded cards). Default `'minimal'`. */
  rendering?: RenderingMode;
  verbose?: boolean;
  debug?: boolean;
  enableFeedback?: boolean;
  onShowTrace?: (threadId: string) => void;

  // ---- Presentation ----
  threadId?: string;
  className?: string;
  maxWidth?: string;
  /** Show the read-only status footer (todos + context dial, no composer). Default `true`. */
  showContextRow?: boolean;
  /** Rendered when there are no messages and nothing is streaming. */
  emptyState?: React.ReactNode;
  onError?: (error: Error) => void;
  /** Optional externally-owned store (advanced). */
  store?: ChatStore;
}

/**
 * Read-only view of a task's activity. Sends nothing — it attaches to `taskId`
 * via A2A `tasks/resubscribe`, replays the server-side event log, follows the
 * live tail, and renders with the exact same renderers `<Chat>` uses (no
 * composer, no tool interaction).
 *
 * Three ways to consume read-only task streaming, from turnkey to fully custom:
 *  1. `<TaskView>` with renderer props (this component).
 *  2. `useTaskStreaming` + `<ChatMessageList>` inside your own shell.
 *  3. `useTaskStreaming` alone → render `messages` / `store` however you like.
 */
export const TaskView: React.FC<TaskViewProps> = ({
  agent,
  taskId,
  initialMessages,
  enabled = true,
  toolRenderers,
  rendering = 'minimal',
  verbose = false,
  debug = false,
  enableFeedback = false,
  onShowTrace,
  threadId,
  className = '',
  maxWidth,
  showContextRow = true,
  emptyState,
  onError,
  store: providedStore,
}) => {
  const { store, messages, isStreaming } = useTaskStreaming({
    agent,
    taskId,
    initialMessages,
    enabled,
    store: providedStore,
    onError,
  });

  const hasContent = messages.length > 0 || isStreaming;

  return (
    <ChatStoreContext.Provider value={store}>
      <div
        className={`flex flex-col h-full bg-background text-foreground font-sans overflow-hidden ${className}`}
        style={{ maxWidth }}
      >
        <div className="flex-1 overflow-y-auto">
          <div
            className="mx-auto w-full px-2 py-4 text-sm space-y-4"
            style={{ maxWidth: maxWidth || '768px', width: '100%', boxSizing: 'border-box' }}
          >
            {!hasContent && emptyState}
            <ChatMessageList
              messages={messages}
              toolRenderers={toolRenderers}
              rendering={rendering}
              verbose={verbose}
              debug={debug}
              threadId={threadId}
              enableFeedback={enableFeedback}
              onShowTrace={onShowTrace}
            />
          </div>
        </div>
        {showContextRow && (
          <footer className="sticky bottom-0 inset-x-0 z-30 border-t border-border bg-background/80 backdrop-blur">
            <div className="mx-auto w-full px-4 py-3" style={{ maxWidth: maxWidth || '768px' }}>
              <ReadOnlyContextRow />
            </div>
          </footer>
        )}
      </div>
    </ChatStoreContext.Provider>
  );
};

/**
 * Read-only `<ContextRow>` bound to the nearest task-stream store. Shows the
 * thinking indicator, todos chip, and context dial — no composer, no actions.
 * Renders nothing when there is nothing to show.
 */
const ReadOnlyContextRow: React.FC = () => {
  const todos = useChatStateStore((s) => s.todos);
  const todoChanges = useChatStateStore((s) => s.lastTodoChanges);
  const isStreaming = useChatStateStore((s) => s.isStreaming);
  const contextBudget = useChatStateStore((s) => s.contextBudget);
  const compactions = useChatStateStore((s) => s.compactionEvents);
  return (
    <ContextRow
      todos={todos}
      todoChanges={todoChanges}
      isStreaming={isStreaming}
      contextBudget={contextBudget ?? undefined}
      compactions={compactions}
    />
  );
};
