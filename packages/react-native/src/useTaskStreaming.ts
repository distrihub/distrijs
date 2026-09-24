import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useStore } from 'zustand';
import { Agent, DistriChatMessage } from '@distri/core';
import { TaskStreamingController, createChatStore } from '@distri/state';
import type { ChatStore } from '@distri/state';

export interface UseTaskStreamingOptions {
  agent: Agent | null;
  taskId: string | null;
  initialMessages?: DistriChatMessage[];
  enabled?: boolean;
  store?: ChatStore;
  onError?: (error: Error) => void;
}

export interface UseTaskStreamingReturn {
  store: ChatStore;
  messages: DistriChatMessage[];
  isStreaming: boolean;
  isTerminal: boolean;
  error: Error | null;
  reconnect: () => void;
  stop: () => void;
}

/** Native lifecycle adapter over the shared, framework-neutral task controller. */
export function useTaskStreaming({
  agent,
  taskId,
  initialMessages,
  enabled = true,
  store: providedStore,
  onError,
}: UseTaskStreamingOptions): UseTaskStreamingReturn {
  const [ownedStore] = useState<ChatStore>(() => createChatStore());
  const store = providedStore ?? ownedStore;
  const [controller] = useState(() => new TaskStreamingController(store));
  const messages = useStore(store, state => state.messages);
  const isStreaming = useStore(store, state => state.isStreaming);
  const [isTerminal, setIsTerminal] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [reconnectKey, setReconnectKey] = useState(0);
  const onErrorRef = useRef(onError);

  useEffect(() => { onErrorRef.current = onError; }, [onError]);

  useEffect(() => {
    if (!enabled || !agent || !taskId) return;
    setError(null);
    controller.start({
      agent,
      taskId,
      initialMessages,
      onError: caught => {
        setError(caught);
        onErrorRef.current?.(caught);
      },
      onTerminalChange: setIsTerminal,
    });
    return () => controller.stop();
  }, [agent, taskId, enabled, reconnectKey, initialMessages, store, controller]);

  useEffect(() => () => controller.stop(), [controller]);

  const reconnect = useCallback(() => setReconnectKey(key => key + 1), []);
  const stop = useCallback(() => controller.stop(), [controller]);
  const visibleMessages = useMemo(
    () => initialMessages?.length ? [...initialMessages, ...messages] : messages,
    [initialMessages, messages],
  );

  return { store, messages: visibleMessages, isStreaming, isTerminal, error, reconnect, stop };
}
