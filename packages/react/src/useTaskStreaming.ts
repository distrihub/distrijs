import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useStore } from 'zustand';
import { Agent, DistriChatMessage } from '@distri/core';
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

const MAX_RECONNECTS = 3;

function hydrateFromHistory(store: ChatStore, initialMessages?: DistriChatMessage[]): void {
  if (!initialMessages || initialMessages.length === 0) return;
  const links = initialMessages
    .map((m) => ({
      taskId: (m as { taskId?: string }).taskId as string,
      parentTaskId: (m as { parentTaskId?: string }).parentTaskId,
    }))
    .filter((l) => Boolean(l.taskId));
  if (links.length > 0) store.getState().hydrateTaskTree(links);
}

/**
 * Read-only follow of an existing task. The observational twin of `useChat`:
 * it owns a chat-state store and drives it from `agent.resubscribe(taskId)`
 * (A2A `tasks/resubscribe`) instead of from a `sendMessage` turn. Renders with
 * the exact same store the interactive chat uses — attach `<ChatMessageList>`
 * (via `<ChatStoreContext.Provider value={store}>`) or build a custom view from
 * the returned `messages` / `store`.
 *
 * (Re)connect is idempotent: `tasks/resubscribe` always replays the full event
 * log from position 0, so every connect first clears the store and replays —
 * guaranteeing consistent state with no doubled text deltas.
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

  const messages = useStore(store, (s) => s.messages);
  const isStreaming = useStore(store, (s) => s.isStreaming);
  const [isTerminal, setIsTerminal] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [reconnectKey, setReconnectKey] = useState(0);

  const abortRef = useRef<AbortController | null>(null);
  const onErrorRef = useRef(onError);
  useEffect(() => { onErrorRef.current = onError; }, [onError]);

  // Seed the fork task-tree from history for the not-yet-connected display
  // (the connect loop re-hydrates after each clear).
  useEffect(() => {
    hydrateFromHistory(store, initialMessages);
  }, [initialMessages, store]);

  useEffect(() => {
    if (!enabled || !agent || !taskId) return;

    const ac = new AbortController();
    abortRef.current = ac;
    let cancelled = false;
    setIsTerminal(false);
    setError(null);

    const run = async () => {
      let attempt = 0;
      while (!cancelled && !ac.signal.aborted) {
        // Fresh (re)connect: resubscribe replays the full log from position 0,
        // so wipe the store first and rebuild — avoids doubled text deltas.
        store.getState().clearAllStates();
        hydrateFromHistory(store, initialMessages);

        let sawTransientError = false;
        let sawTerminal = false;
        try {
          const stream: AsyncGenerator<DistriChatMessage> = agent.resubscribe(taskId, { signal: ac.signal });
          for await (const evt of stream) {
            if (cancelled || ac.signal.aborted) break;
            store.getState().processMessage(evt, true);
            const type = (evt as { type?: string }).type;
            const evtTaskId = (evt as { taskId?: string }).taskId;
            const code = (evt as { data?: { code?: string } }).data?.code;
            if (type === 'run_error' && code === 'STREAM_ERROR') {
              sawTransientError = true;
              const msg = (evt as { data?: { message?: string } }).data?.message ?? 'Stream error';
              const e = new Error(msg);
              setError(e);
              onErrorRef.current?.(e);
            } else if ((type === 'run_finished' || type === 'run_error') && evtTaskId === taskId) {
              sawTerminal = true;
            }
          }
        } catch (e) {
          sawTransientError = true;
          const err = e instanceof Error ? e : new Error(String(e));
          setError(err);
          onErrorRef.current?.(err);
        }

        if (cancelled || ac.signal.aborted) return;
        if (sawTerminal || !sawTransientError) {
          // Terminal frame seen, or the server closed the stream cleanly
          // (it only closes on the task's own terminal — `until_own_terminal`).
          setIsTerminal(true);
          return;
        }
        // Transient error → reconnect with capped linear backoff.
        attempt += 1;
        if (attempt > MAX_RECONNECTS) {
          setIsTerminal(true);
          return;
        }
        await new Promise((r) => setTimeout(r, 500 * attempt));
      }
    };

    void run();

    return () => {
      cancelled = true;
      ac.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agent, taskId, enabled, reconnectKey, store]);

  const reconnect = useCallback(() => setReconnectKey((k) => k + 1), []);
  const stop = useCallback(() => abortRef.current?.abort(), []);

  const displayedMessages = useMemo(
    () => (initialMessages && initialMessages.length > 0 ? [...initialMessages, ...messages] : messages),
    [initialMessages, messages],
  );

  return { store, messages: displayedMessages, isStreaming, isTerminal, error, reconnect, stop };
}
