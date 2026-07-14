import { Signal } from '@angular/core';
import { Agent, CompactTaskResult, DistriBaseTool, DistriChatMessage, DistriPart } from '@distri/core';
import {
  ChatController,
  ChatStore,
  DistriAnyTool,
  SendMessageOptions,
  ToolCallState,
  createChatStore,
} from '@distri/state';
import { toSignal } from './adapter';

export interface ChatServiceOptions {
  agent: Agent;
  threadId: string;
  externalTools?: DistriBaseTool[];
  onError?: (error: Error) => void;
  getMetadata?: () => Promise<Record<string, unknown>>;
}

export interface ChatService {
  /** The underlying vanilla store, for advanced/imperative access. */
  store: ChatStore;
  messages: Signal<DistriChatMessage[]>;
  isStreaming: Signal<boolean>;
  isLoading: Signal<boolean>;
  error: Signal<Error | null>;
  toolCalls: Signal<Map<string, ToolCallState>>;
  sendMessage: (content: string | DistriPart[], options?: SendMessageOptions) => Promise<void>;
  sendMessageStream: (content: string | DistriPart[], role?: 'user' | 'tool') => Promise<void>;
  stopStreaming: () => void;
  compact: () => Promise<CompactTaskResult | undefined>;
  /** Abort any in-flight stream. Call when the owning component is destroyed. */
  dispose: () => void;
}

/**
 * Angular's chat service — a Signal-based adapter over `@distri/state`'s
 * `ChatController`/chat store, the same framework-agnostic layer
 * `@distri/react`'s `useChat` wraps. No `renderTool` is supplied here: v1
 * has no UI-type tool rendering in Angular, so `ToolCallState.component`
 * stays `undefined` — function tools still auto-execute/confirm via data
 * either way, so chat behavior itself is unaffected.
 */
export function createChatService(options: ChatServiceOptions): ChatService {
  const store = createChatStore();
  const controller = new ChatController(store, options.threadId);

  controller.setAgent(options.agent);
  controller.setExternalTools(options.externalTools);
  controller.setCallbacks({ onError: options.onError, getMetadata: options.getMetadata });

  store.getState().setAgent(options.agent);
  if (options.externalTools && options.externalTools.length > 0) {
    store.getState().setExternalTools(options.externalTools as DistriAnyTool[]);
  }

  return {
    store,
    messages: toSignal(store, (s) => s.messages),
    isStreaming: toSignal(store, (s) => s.isStreaming),
    isLoading: toSignal(store, (s) => s.isLoading),
    error: toSignal(store, (s) => s.error),
    toolCalls: toSignal(store, (s) => s.toolCalls),
    sendMessage: (content, sendOptions) => controller.sendMessage(content, sendOptions),
    sendMessageStream: (content, role) => controller.sendMessageStream(content, role),
    stopStreaming: () => controller.stopStreaming(),
    compact: () => controller.compact(),
    dispose: () => controller.dispose(),
  };
}
