import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useStore } from 'zustand';
import { Agent, DistriChatMessage } from '@distri/core';
import { TaskStreamingController, hydrateFromHistory } from '@distri/state';
import { ChatStore, createChatStore } from './stores/chatStateStore';

export interface UseTaskStreamingOptions {
  /**
   * The agent that owns the task. Required to open the A2A `tasks/resubscribe`
   * stream (A2A clients are per-agent-URL). A read-only follower is always
   * initialized from a call site that already holds the agent — you just sent
   * with it, or resolved it via `useAgent`.
   */
  agent: Agent | null;
  /** The task to follow. `null` disables the subscription. */
  taskId: string | null;
  /**
   * The thread's persisted history, pre-fetched by the caller (e.g. via
   * `useChatMessages`). Render-only: it is concatenated in front of the live
   * store messages and used to rebuild the fork task-tree, so tasks older than
   * the server's 24h replay window still render. Never pumped into the store.
   */
  initialMessages?: DistriChatMessage[];
  /** Set `false` to hold the subscription closed. Default `true`. */
  enabled?: boolean;
  /**
   * Optional externally-owned store. When omitted, this hook creates and owns
   * a per-instance store (fresh, empty state per mount).
   */
  store?: ChatStore;
  onError?: (error: Error) => void;
}

export interface UseTaskStreamingReturn {
  /** The chat-state store backing this hook. Publish via `ChatStoreContext` to
   *  render with Distri renderers, or read reactive slices for a custom view. */
  store: ChatStore;
  messages: DistriChatMessage[];
  /** True while the followed task is running (mirrors the store's streaming flag). */
  isStreaming: boolean;
  /** True once the followed task reached its own terminal state (or the stream
   *  closed cleanly). Reconnection stops once terminal. */
  isTerminal: boolean;
  error: Error | null;
  /** Force a fresh (re)connect: wipes and replays from the server log. */
  reconnect: () => void;
  /** Abort the subscription. Call `reconnect()` to reopen it. */
  stop: () => void;
}

/**
 * Read-only follow of an existing task. The observational twin of `useChat`:
 * it owns a chat-state store and drives it from `agent.resubscribe(taskId)`
 * (A2A `tasks/resubscribe`) instead of from a `sendMessage` turn. Renders with
 * the exact same store the interactive chat uses — attach `<ChatMessageList>`
 * (via `<ChatStoreContext.Provider value={store}>`) or build a custom view from
 * the returned `messages` / `store`.
 *
 * The reconnect loop itself lives in `@distri/state`'s `TaskStreamingController`
 * — this hook owns only React lifecycle (mount/dep-change wiring) and the
 * `isTerminal`/`error` view state.
 */
export function useTaskStreaming({
  agent,
  taskId,
  initialMessages,
  enabled = true,
  store: providedStore,
  onError,
}: UseTaskStreamingOptions): UseTaskStreamingReturn {
  const [fallbackStore] = useState<ChatStore>(() => createChatStore());
  const store = providedStore ?? fallbackStore;
  const [controller] = useState(() => new TaskStreamingController(store));

  const messages = useStore(store, (s) => s.messages);
  const isStreaming = useStore(store, (s) => s.isStreaming);
  const [isTerminal, setIsTerminal] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [reconnectKey, setReconnectKey] = useState(0);

  const onErrorRef = useRef(onError);
  useEffect(() => { onErrorRef.current = onError; }, [onError]);

  // Seed the fork task-tree from history for the not-yet-connected display
  // (the connect loop re-hydrates after each clear).
  useEffect(() => {
    hydrateFromHistory(store, initialMessages);
  }, [initialMessages, store]);

  useEffect(() => {
    if (!enabled || !agent || !taskId) return;

    setError(null);
    controller.start({
      agent,
      taskId,
      initialMessages,
      onError: (e) => {
        setError(e);
        onErrorRef.current?.(e);
      },
      onTerminalChange: setIsTerminal,
    });

    return () => controller.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agent, taskId, enabled, reconnectKey, store, controller]);

  const reconnect = useCallback(() => setReconnectKey((k) => k + 1), []);
  const stop = useCallback(() => controller.stop(), [controller]);

  const displayedMessages = useMemo(
    () => (initialMessages && initialMessages.length > 0 ? [...initialMessages, ...messages] : messages),
    [initialMessages, messages],
  );

  return { store, messages: displayedMessages, isStreaming, isTerminal, error, reconnect, stop };
}
