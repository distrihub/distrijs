import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useStore } from 'zustand';
import { Agent, DistriBaseTool, DistriChatMessage, ToolExecutionOptions, DistriMessage, CompactTaskResult } from '@distri/core';
import { DistriPart } from '@distri/core';
import { ChatController, SendMessageOptions } from '@distri/state';
import { ChatStore, createChatStore } from './stores/chatStateStore';
import { DistriAnyTool } from './types';

export type { SendMessageOptions } from '@distri/state';

export interface UseChatOptions {
  threadId: string;
  agent: Agent | null;
  onMessage?: (message: DistriChatMessage) => void;
  onError?: (error: Error) => void;
  // Ability to override metadata for the stream
  getMetadata?: () => Promise<Record<string, unknown>>;
  externalTools?: DistriBaseTool[];
  executionOptions?: ToolExecutionOptions;
  initialMessages?: (DistriChatMessage)[];
  beforeSendMessage?: (msg: DistriMessage) => Promise<DistriMessage>;
  /**
   * Optional externally-owned store. `<Chat>` creates the store itself (it
   * needs `browser_session_id` from store state to build request metadata
   * before this hook runs) and passes it in. When omitted, `useChat` creates
   * and owns its own per-instance store.
   */
  store?: ChatStore;
}

export interface UseChatReturn {
  /**
   * The per-instance chat-state store backing this hook. `<Chat>` publishes it
   * through `ChatStoreContext` so renderer descendants can read reactive
   * slices. Standalone consumers can wrap their own UI with
   * `<ChatStoreContext.Provider value={store}>` if they use Distri renderers.
   */
  store: ChatStore;
  messages: (DistriChatMessage)[];
  isStreaming: boolean;
  sendMessage: (content: string | DistriPart[], options?: SendMessageOptions) => Promise<void>;
  sendMessageStream: (content: string | DistriPart[], role?: 'user' | 'tool') => Promise<void>;
  isLoading: boolean;
  error: Error | null;
  hasPendingToolCalls: () => boolean;
  stopStreaming: () => void;
  addMessage: (message: DistriChatMessage) => void;
  /**
   * Manually run compaction on the current task. Resolves with the typed
   * `CompactTaskResult` body the server returned — token counts are
   * available synchronously here, while the streaming
   * `context_compaction` event still arrives over the stream and updates
   * `useChatStateStore.compactionEvents` for observers that prefer the
   * event-driven path. Resolves with `undefined` when there is no
   * active task to compact.
   */
  compact: () => Promise<CompactTaskResult | undefined>;
}

export function useChat({
  threadId,
  onError,
  getMetadata,
  agent,
  externalTools,
  beforeSendMessage,
  initialMessages,
  store: providedStore,
}: UseChatOptions): UseChatReturn {
  // Per-instance store: created once and owned by this hook (unless the caller
  // supplies one). Conversation state lives exactly as long as this hook
  // instance, so a `<Chat>` remount (e.g. `key={threadId}`) starts from an
  // empty store — no leaked messages or stuck `isStreaming` flags across threads.
  const [fallbackStore] = useState<ChatStore>(() => createChatStore());
  const store = providedStore ?? fallbackStore;

  // Send/stream/stop/compact orchestration lives in @distri/state's
  // ChatController (framework-agnostic). This hook owns only the
  // mutable-context sync (agent/threadId/tools/callbacks can change across
  // renders) and React lifecycle.
  const [controller] = useState(() => new ChatController(store, threadId));

  useEffect(() => {
    controller.setThreadId(threadId);
  }, [controller, threadId]);

  useEffect(() => {
    controller.setAgent(agent);
  }, [controller, agent]);

  useEffect(() => {
    controller.setExternalTools(externalTools);
  }, [controller, externalTools]);

  useEffect(() => {
    controller.setCallbacks({ onError, getMetadata, beforeSendMessage });
  }, [controller, onError, getMetadata, beforeSendMessage]);

  const processMessage = useStore(store, state => state.processMessage);
  const clearAllStates = useStore(store, state => state.clearAllStates);
  const setError = useStore(store, state => state.setError);
  const setLoading = useStore(store, state => state.setLoading);
  const setStreaming = useStore(store, state => state.setStreaming);
  const setAgent = useStore(store, state => state.setAgent);
  const setResumeWithToolResult = useStore(store, state => state.setResumeWithToolResult);
  const hasPendingToolCalls = useStore(store, state => state.hasPendingToolCalls);
  const setStreamingIndicator = useStore(store, state => state.setStreamingIndicator);
  const setExternalTools = useStore(store, state => state.setExternalTools);
  const errorState = useStore(store, state => state.error);
  const messages = useStore(store, state => state.messages);

  useEffect(() => {
    if (externalTools && externalTools.length > 0) {
      setExternalTools(externalTools as DistriAnyTool[]);
    }
  }, [externalTools, setExternalTools]);

  const isLoading = useStore(store, state => state.isLoading);
  const isStreaming = useStore(store, state => state.isStreaming);

  // `initialMessages` is the thread's persisted history (fetched by the
  // parent via `useChatMessages`). It is **render-only** — we never pump
  // it into the live zustand store, because:
  //   * the server already loads thread history from its own DB when
  //     building the planner's context (so we don't need to ship it
  //     anywhere), and
  //   * a returning history fetch arriving mid-turn must not be allowed
  //     to clobber an in-flight optimistic user message or streaming
  //     response.
  // The display array is composed at return time as
  // `[...initialMessages, ...store.messages]`.

  // Rebuild the task tree from persisted history so reloaded threads still
  // group fork activity into SubTaskCards (messages carry taskId/parentTaskId).
  useEffect(() => {
    if (!initialMessages || initialMessages.length === 0) return;
    const links = initialMessages
      .map((m) => ({
        taskId: (m as { taskId?: string }).taskId as string,
        parentTaskId: (m as { parentTaskId?: string }).parentTaskId,
      }))
      .filter((l) => Boolean(l.taskId));
    if (links.length > 0) store.getState().hydrateTaskTree(links);
  }, [initialMessages, store]);

  // Direct message processing
  const addMessage = useCallback((message: DistriChatMessage) => {
    // When manually adding messages, treat as non-stream by default
    processMessage(message, false);
  }, [processMessage]);

  // Set up the agent and tools in the store
  useEffect(() => {
    if (agent) {
      setAgent(agent);
    }
  }, [agent, setAgent]);

  // Store cleanup functions in refs to avoid dependency changes
  const cleanupRef = useRef<(() => void) | undefined>(undefined);
  cleanupRef.current = () => {
    setStreamingIndicator(undefined);
    setStreaming(false);
    setLoading(false);
  };

  // Cleanup abort controller on unmount
  useEffect(() => {
    return () => {
      controller.dispose();
      // Clear any lingering streaming states on unmount
      if (cleanupRef.current) {
        setTimeout(cleanupRef.current, 0);
      }
    };
  }, [controller]); // controller is stable for the lifetime of this hook instance

  // Reset state when agent changes
  const agentNameRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    const prev = agentNameRef.current;
    const curr = agent?.name;
    if (prev === curr) return;

    // Only wipe on a true agent-to-agent transition. The first non-null
    // assignment (undefined → "agent_a") and any null reset are NOT
    // user-initiated agent switches; they're just async resolution from
    // `useAgent` arriving after the store has already been populated.
    // Wiping there clobbers in-flight optimistic / streaming state.
    if (prev !== undefined && curr !== undefined) {
      clearAllStates();
      setError(null);
    }
    agentNameRef.current = curr;
  }, [agent?.name, clearAllStates, setError]);

  // Reset state when threadId changes IN PLACE (consumer swaps threadId on a
  // persistent <Chat> without a remount). The first-mount case needs no reset:
  // this hook's store was just created empty by `createChatStore()`. The remount
  // case (`<Chat key={threadId}>`) is handled for free — a new key builds a new
  // hook instance with a fresh store, so the prior thread's state is already gone.
  const threadIdRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (threadIdRef.current !== undefined && threadIdRef.current !== threadId) {
      clearAllStates();
      setError(null);
      controller.dispose();
    }
    threadIdRef.current = threadId;
  }, [threadId, clearAllStates, setError, controller]);

  const sendMessage = useCallback((content: string | DistriPart[], options?: SendMessageOptions) => {
    return controller.sendMessage(content, options);
  }, [controller]);

  const sendMessageStream = useCallback((content: string | DistriPart[], role: 'user' | 'tool' = 'user') => {
    return controller.sendMessageStream(content, role);
  }, [controller]);

  // Register the tool-result resume path with the store: when a human-in-the-loop
  // checkpoint tool is answered AFTER its pending call timed out (agent turn
  // ended), the store delivers the answer as a fresh `role:'tool'` message via
  // this instead of failing on `/complete-tool`.
  useEffect(() => {
    setResumeWithToolResult((parts) => sendMessageStream(parts, 'tool'));
    return () => setResumeWithToolResult(undefined);
  }, [setResumeWithToolResult, sendMessageStream]);

  const stopStreaming = useCallback(() => {
    controller.stopStreaming();
  }, [controller]);

  const compact = useCallback((): Promise<CompactTaskResult | undefined> => {
    return controller.compact();
  }, [controller]);

  // Combined display array: persisted history (from parent) first, live
  // optimistic + streamed messages from the store after. Memoised so
  // downstream effects keyed on `messages` don't fire on every render.
  const displayedMessages = useMemo(
    () => (initialMessages && initialMessages.length > 0
      ? [...initialMessages, ...messages]
      : messages),
    [initialMessages, messages],
  );

  return {
    store,
    isStreaming,
    messages: displayedMessages,
    sendMessage,
    sendMessageStream,
    isLoading,
    error: errorState,
    hasPendingToolCalls,
    stopStreaming,
    addMessage,
    compact,
  };
}
