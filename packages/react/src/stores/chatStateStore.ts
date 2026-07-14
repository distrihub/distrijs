// The chat-state reducer/store lives in @distri/state (framework-agnostic).
// This file re-exports it and adds the one React-specific seam: a
// `renderTool` implementation (React.createElement for UI tools /
// confirm-required function tools), plus the React context/hook wiring
// around the vanilla store. Every existing `@distri/react` import path
// (`createChatStore`, `ChatStore`, `TaskState`, `useChatStateStore`, …) is
// unchanged.
import React, { createContext, useContext } from 'react';
import { useStore } from 'zustand';
import {
  createChatStore as createChatStoreBase,
  ChatStore,
  ChatStateStore,
  ToolRenderContext,
} from '@distri/state';
import { DistriFnTool } from '@distri/core';
import { DistriUiTool } from '../types';
import { DefaultToolActions } from '../components/renderers/tools/DefaultToolActions';

export type {
  ChatState,
  TaskState,
  PlanState,
  StepState,
  ToolCallState,
  ChatStateStore,
  ChatStore,
  CompactionLogEntry,
  ToolRenderContext,
  RenderToolFn,
  CreateChatStoreOptions,
} from '@distri/state';

function reactRenderTool(ctx: ToolRenderContext): React.ReactNode {
  if (ctx.kind === 'ui' && ctx.tool && ctx.toolCall && ctx.completeTool) {
    const uiTool = ctx.tool as DistriUiTool;
    // Use React.createElement to properly render the component within React's
    // context — direct function calls (component({...})) break React hooks.
    return React.createElement(uiTool.component, {
      toolCall: ctx.toolCall,
      toolCallState: ctx.toolCallState,
      completeTool: ctx.completeTool,
      tool: ctx.tool,
    });
  }
  if (ctx.kind === 'confirm' && ctx.tool && ctx.toolCall && ctx.completeTool) {
    // Confirm-required fn tool — show the actions UI. DefaultToolActions
    // handles its own pending → running → completed lifecycle and remount
    // semantics.
    return React.createElement(DefaultToolActions, {
      toolCall: ctx.toolCall,
      toolCallState: ctx.toolCallState,
      completeTool: ctx.completeTool,
      tool: ctx.tool as DistriFnTool,
    });
  }
  if (ctx.kind === 'error') {
    return React.createElement('div', {
      className: 'text-red-500 p-2 border border-red-200 rounded bg-red-50',
    }, ctx.message);
  }
  return undefined;
}

/**
 * Factory for a fresh, isolated chat-state store. Replaces the old
 * module-level singleton: state (messages, streaming flags, tasks, todos,
 * browser session, …) now lives for exactly as long as the owning chat
 * instance. Remounting `<Chat key={threadId}>` constructs a new store, so the
 * previous thread's messages and `isStreaming`/`isLoading` flags are gone by
 * construction — no manual `clearAllStates()` required by consumers.
 */
export function createChatStore(): ChatStore {
  return createChatStoreBase({ renderTool: reactRenderTool });
}

// ---------------------------------------------------------------------------
// Per-instance store wiring (React context)
//
// The store is no longer a module singleton. `useChat` creates one via
// `createChatStore()` and publishes it through this context; `<Chat>` wraps its
// renderer subtree in the provider. Components read reactive slices through the
// `useChatStateStore(selector)` hook below — same call signature as before, so
// every existing `useChatStateStore(s => s.x)` call site is unchanged; only the
// source (module global → nearest provider) differs.
// ---------------------------------------------------------------------------

export const ChatStoreContext = createContext<ChatStore | null>(null);

/**
 * Returns the raw vanilla store for the nearest `<Chat>` / `useChat`. Use for
 * imperative access (`getState()`, `setState()`, `subscribe()`). Throws when
 * called outside a chat subtree — there is no global fallback by design.
 */
export function useChatStoreApi(): ChatStore {
  const store = useContext(ChatStoreContext);
  if (!store) {
    throw new Error('useChatStoreApi must be used within a <Chat> / useChat subtree (ChatStoreContext is missing).');
  }
  return store;
}

/**
 * Reactive selector hook bound to the nearest chat store. Drop-in replacement
 * for the former global `useChatStateStore` — identical `(selector) => slice`
 * signature.
 */
export function useChatStateStore<T>(selector: (state: ChatStateStore) => T): T {
  const store = useChatStoreApi();
  return useStore(store, selector);
}
