import { useCallback, useEffect, useRef, useState } from 'react';
import { useStore } from 'zustand';
import {
  Agent,
  CompactTaskResult,
  DistriBaseTool,
  DistriChatMessage,
  DistriMessage,
  DistriPart,
  ToolExecutionOptions,
} from '@distri/core';
import { ChatController, SendMessageOptions, createChatStore } from '@distri/state';
import type { ChatStore, DistriAnyTool } from '@distri/state';

export type { SendMessageOptions } from '@distri/state';

export interface UseChatOptions {
  threadId: string;
  agent: Agent | null;
  onMessage?: (message: DistriChatMessage) => void;
  onError?: (error: Error) => void;
  getMetadata?: () => Promise<Record<string, unknown>>;
  externalTools?: DistriBaseTool[];
  executionOptions?: ToolExecutionOptions;
  initialMessages?: DistriChatMessage[];
  beforeSendMessage?: (message: DistriMessage) => Promise<DistriMessage>;
  store?: ChatStore;
}

export interface UseChatReturn {
  store: ChatStore;
  messages: DistriChatMessage[];
  isStreaming: boolean;
  sendMessage: (content: string | DistriPart[], options?: SendMessageOptions) => Promise<void>;
  sendMessageStream: (content: string | DistriPart[], role?: 'user' | 'tool') => Promise<void>;
  isLoading: boolean;
  error: Error | null;
  hasPendingToolCalls: () => boolean;
  stopStreaming: () => void;
  addMessage: (message: DistriChatMessage) => void;
  compact: () => Promise<CompactTaskResult | undefined>;
}

/** React Native adapter around the same ChatController used by @distri/react. */
export function useChat({
  threadId,
  agent,
  onMessage,
  onError,
  getMetadata,
  externalTools,
  beforeSendMessage,
  initialMessages,
  store: providedStore,
}: UseChatOptions): UseChatReturn {
  const [ownedStore] = useState<ChatStore>(() => createChatStore());
  const store = providedStore ?? ownedStore;
  const [controller] = useState(() => new ChatController(store, threadId));

  useEffect(() => controller.setThreadId(threadId), [controller, threadId]);
  useEffect(() => controller.setAgent(agent), [controller, agent]);
  useEffect(() => controller.setExternalTools(externalTools), [controller, externalTools]);
  useEffect(() => controller.setCallbacks({ onError, getMetadata, beforeSendMessage }), [
    controller,
    onError,
    getMetadata,
    beforeSendMessage,
  ]);

  const processMessage = useStore(store, state => state.processMessage);
  const clearAllStates = useStore(store, state => state.clearAllStates);
  const setError = useStore(store, state => state.setError);
  const setLoading = useStore(store, state => state.setLoading);
  const setStreaming = useStore(store, state => state.setStreaming);
  const setAgent = useStore(store, state => state.setAgent);
  const setExternalTools = useStore(store, state => state.setExternalTools);
  const setResumeWithToolResult = useStore(store, state => state.setResumeWithToolResult);
  const hasPendingToolCalls = useStore(store, state => state.hasPendingToolCalls);
  const messages = useStore(store, state => state.messages);
  const error = useStore(store, state => state.error);
  const isLoading = useStore(store, state => state.isLoading);
  const isStreaming = useStore(store, state => state.isStreaming);

  // The shared controller sends external tool definitions to the server, but
  // the shared store also needs their handlers to execute streamed client tools.
  useEffect(() => setExternalTools((externalTools ?? []) as DistriAnyTool[]), [externalTools, setExternalTools]);

  useEffect(() => {
    if (agent) setAgent(agent);
  }, [agent, setAgent]);

  useEffect(() => {
    if (!initialMessages?.length) return;
    const links = initialMessages
      .map(message => ({
        taskId: (message as { taskId?: string }).taskId,
        parentTaskId: (message as { parentTaskId?: string }).parentTaskId,
      }))
      .filter(link => Boolean(link.taskId)) as { taskId: string; parentTaskId?: string }[];
    if (links.length) store.getState().hydrateTaskTree(links);
  }, [initialMessages, store]);

  useEffect(() => () => {
    controller.dispose();
    setTimeout(() => {
      store.getState().setStreamingIndicator(undefined);
      setStreaming(false);
      setLoading(false);
    }, 0);
  }, [controller, setLoading, setStreaming, store]);

  const previousAgentName = useRef<string | undefined>(undefined);
  useEffect(() => {
    const previous = previousAgentName.current;
    const current = agent?.name;
    if (previous !== undefined && current !== undefined && previous !== current) {
      clearAllStates();
      setError(null);
    }
    previousAgentName.current = current;
  }, [agent?.name, clearAllStates, setError]);

  const previousThreadId = useRef<string | undefined>(undefined);
  useEffect(() => {
    if (previousThreadId.current !== undefined && previousThreadId.current !== threadId) {
      clearAllStates();
      setError(null);
      controller.dispose();
    }
    previousThreadId.current = threadId;
  }, [threadId, clearAllStates, setError, controller]);

  const addMessage = useCallback((message: DistriChatMessage) => processMessage(message, false), [processMessage]);
  const sendMessage = useCallback((content: string | DistriPart[], options?: SendMessageOptions) => (
    controller.sendMessage(content, options)
  ), [controller]);
  const sendMessageStream = useCallback((content: string | DistriPart[], role: 'user' | 'tool' = 'user') => (
    controller.sendMessageStream(content, role)
  ), [controller]);

  useEffect(() => {
    setResumeWithToolResult(parts => sendMessageStream(parts, 'tool'));
    return () => setResumeWithToolResult(undefined);
  }, [sendMessageStream, setResumeWithToolResult]);

  const stopStreaming = useCallback(() => controller.stopStreaming(), [controller]);
  const compact = useCallback(() => controller.compact(), [controller]);
  const visibleMessages = initialMessages?.length ? [...initialMessages, ...messages] : messages;

  useEffect(() => {
    if (!onMessage) return;
    let count = store.getState().messages.length;
    return store.subscribe(state => {
      if (state.messages.length > count) {
        count = state.messages.length;
      onMessage(state.messages[state.messages.length - 1]);
      }
    });
  }, [onMessage, store]);

  return {
    store,
    messages: visibleMessages,
    isStreaming,
    sendMessage,
    sendMessageStream,
    isLoading,
    error,
    hasPendingToolCalls,
    stopStreaming,
    addMessage,
    compact,
  };
}
