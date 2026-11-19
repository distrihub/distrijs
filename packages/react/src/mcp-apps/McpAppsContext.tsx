/**
 * MCP Apps host configuration for a chat.
 *
 * `<Chat mcpApps={…}>` (or `<McpAppsProvider>` around your own transcript)
 * decides what an MCP App may do in the host and lets an embedding app see
 * and act on everything an app sends: messages, model context, logs and the
 * tool calls it makes. That is how a product builds its own capability on top
 * of an app — log what the user entered, save values, forward them.
 */
import React, { createContext, useContext, useMemo } from 'react';
import type { McpAppCallToolResult } from '@distri/core';
import type { McpAppLogEntry } from './bridge';

/** Which app an event came from. */
export interface McpAppSource {
  /** The tool call that showed the app. */
  toolCallId: string;
  /** Tool name as the agent saw it (e.g. `browser__open`). */
  toolName: string;
  /** MCP connection name the app belongs to. */
  server?: string;
  /** The `ui://` resource. */
  uri: string;
}

/** Context an app gave the model with `ui/update-model-context`. */
export interface McpAppModelContext {
  source: McpAppSource;
  content?: unknown;
  structuredContent?: unknown;
}

/** Every app → host interaction, for `onEvent`. */
export type McpAppEvent =
  | { type: 'message'; source: McpAppSource; role: string; text: string; content: unknown }
  | { type: 'model-context'; source: McpAppSource; context: McpAppModelContext }
  | { type: 'log'; source: McpAppSource; entry: McpAppLogEntry }
  | { type: 'tool-call'; source: McpAppSource; name: string; arguments: Record<string, unknown>; result?: McpAppCallToolResult; error?: string }
  | { type: 'open-link'; source: McpAppSource; url: string }
  | { type: 'display-mode'; source: McpAppSource; mode: string };

export interface McpAppsOptions {
  /** Turn MCP Apps rendering off in this chat (tools still run; their links are not shown). Default true. */
  enabled?: boolean;
  /**
   * An app asked to post a message as the user (`ui/message`). Default (inside
   * `<Chat>`): it is sent into the chat. Return `false` to stop the default.
   */
  onMessage?: (text: string, source: McpAppSource) => void | boolean | Promise<void | boolean>;
  /**
   * An app updated its model context (`ui/update-model-context`). Default
   * (inside `<Chat>`): the latest context of each app is attached to the next
   * message the user sends, as a developer part the model reads and the
   * transcript hides. Return `false` to stop the default.
   */
  onModelContext?: (context: McpAppModelContext) => void | boolean | Promise<void | boolean>;
  /** An app logged something (`notifications/message`). */
  onLog?: (entry: McpAppLogEntry, source: McpAppSource) => void;
  /**
   * An app called a tool on its server (`tools/call`). Called after the call
   * with its result (or error) — the place to save what the user entered.
   */
  onToolCall?: (call: { name: string; arguments: Record<string, unknown>; result?: McpAppCallToolResult; error?: string }, source: McpAppSource) => void;
  /** Every app event, after the specific handler. */
  onEvent?: (event: McpAppEvent) => void;
  /** Max inline height of an app frame in px. Default 720. */
  maxHeight?: number;
}

/** What `<Chat>` adds to the options: its own default sinks. */
export interface McpAppsHostValue extends McpAppsOptions {
  /** Default `ui/message` sink (Chat: send as a user message). */
  defaultSendMessage?: (text: string) => Promise<void> | void;
  /** Default model-context sink (Chat: attach to the next user message). */
  defaultSetModelContext?: (context: McpAppModelContext) => void;
}

const McpAppsContext = createContext<McpAppsHostValue>({});

export interface McpAppsProviderProps extends McpAppsHostValue {
  children: React.ReactNode;
}

export const McpAppsProvider: React.FC<McpAppsProviderProps> = ({ children, ...value }) => {
  const parent = useContext(McpAppsContext);
  const merged = useMemo(() => ({ ...parent, ...value }), [parent, value]);
  return <McpAppsContext.Provider value={merged}>{children}</McpAppsContext.Provider>;
};

export function useMcpAppsHost(): McpAppsHostValue {
  return useContext(McpAppsContext);
}

/** Render a model context for the agent as one text block. */
export function formatModelContext(ctx: McpAppModelContext): string {
  const label = ctx.source.server ? `${ctx.source.server} app` : 'app';
  const parts: string[] = [];
  const content = ctx.content;
  if (Array.isArray(content)) {
    for (const c of content as Array<{ type?: string; text?: string }>) {
      if (c && c.type === 'text' && typeof c.text === 'string') parts.push(c.text);
    }
  } else if (typeof content === 'string') {
    parts.push(content);
  }
  if (ctx.structuredContent !== undefined) {
    parts.push(JSON.stringify(ctx.structuredContent));
  }
  return `[Context from the ${label} (${ctx.source.uri}, tool call ${ctx.source.toolCallId})]\n${parts.join('\n')}`;
}

/** Text of a `ui/message` content (string, a content block, or a list of blocks). */
export function messageText(content: unknown): string {
  if (typeof content === 'string') return content;
  const blocks = Array.isArray(content) ? content : [content];
  return blocks
    .map((b) => (b && typeof b === 'object' && (b as { type?: string }).type === 'text' ? String((b as { text?: unknown }).text ?? '') : ''))
    .filter(Boolean)
    .join('\n');
}
