import React from "react";
import type { Components as ReactMarkdownComponents } from "react-markdown";
import { DistriFnTool, DistriBaseTool, DistriMessage, ToolCall, ToolResult } from "@distri/core";
import type { ToolSummary, SummaryFn, HidePartFn, PartVisibilityContext, ToolCallGrouping } from "@distri/state";
import { ToolCallState } from "./stores/chatStateStore";

export type { ToolSummary, SummaryFn, HidePartFn, PartVisibilityContext, ToolCallGrouping };


export type ToolCallStatus = 'pending' | 'running' | 'completed' | 'error' | 'user_action_required';

export type DistriAnyTool = DistriFnTool | DistriUiTool;

export interface DistriUiTool extends DistriBaseTool {
  type: 'ui';
  component: (props: UiToolProps) => React.ReactNode;
}

export type UiToolProps = {
  toolCall: ToolCall;
  toolCallState?: ToolCallState;
  completeTool: (result: ToolResult) => void;
  tool: DistriBaseTool;
}

export type ToolRendererProps = {
  toolCall: ToolCall;
  state?: ToolCallState;
};

export type ToolRendererMap = Record<string, (props: ToolRendererProps) => React.ReactNode>;

export type ChatCustomRenderers = never;

// --- Tool renderer types ---

export type RenderingMode = 'minimal' | 'rich';

export interface RendererConfig {
  rendering?: RenderingMode;
  toolSummaryOverrides?: Record<string, SummaryFn>;
}

// --- Transcript slots ---

/** react-markdown `components` overrides, merged over Distri's defaults. */
export type MarkdownComponentMap = ReactMarkdownComponents;

export interface UserMessageSlotProps {
  /** The user message with hidden parts already removed. */
  message: DistriMessage;
}

export interface AssistantTextSlotProps {
  /** The assistant message with hidden parts and superseded draft text already removed. */
  message: DistriMessage;
  /** Visible text of the message (text parts joined). */
  text: string;
  /** True for the server-marked final answer of the turn. */
  isFinal: boolean;
  /** True while the message's step is still streaming. */
  isStreaming: boolean;
}

export interface ToolStepsSlotProps {
  /** Tool calls in this block, in order (`final` excluded). */
  toolCalls: ToolCall[];
  /** Live state per tool call id. */
  toolCallStates: Map<string, ToolCallState>;
  /** One label per tool call (`toolLabels`, else the tool summary). */
  labels: string[];
  /** "N steps · label, label…" */
  summary: string;
  /** True when `groupToolCalls="run"` folded these calls together. */
  grouped: boolean;
  /** Distri's default rendering of the calls (rows or cards), for hosts that wrap rather than replace. */
  children: React.ReactNode;
}

/** Replace any transcript block, or override markdown elements in message text. */
export interface ChatMessageComponents {
  UserMessage?: React.ComponentType<UserMessageSlotProps>;
  AssistantText?: React.ComponentType<AssistantTextSlotProps>;
  ToolSteps?: React.ComponentType<ToolStepsSlotProps>;
  /** react-markdown overrides, e.g. `{ a: MyLink }` to turn `[x](stop:id)` into an in-app action. */
  markdown?: MarkdownComponentMap;
}

/** Transcript presentation props shared by `<ChatMessageList>`, `<Chat>` and `<TaskView>`. */
export interface TranscriptRenderingProps {
  /** Per-tool summary overrides for tool rows and step labels. */
  toolSummaryOverrides?: Record<string, SummaryFn>;
  /** `'none'` (default): a row per tool call. `'run'`: fold consecutive tool calls into one expandable "N steps" row. */
  groupToolCalls?: ToolCallGrouping;
  /** Host labels per tool name, used in folded step summaries. */
  toolLabels?: Record<string, string>;
  /** Block and markdown overrides. */
  components?: ChatMessageComponents;
  /** Hide individual message parts. Defaults to parts flagged `developer: true` in `metadata.parts`. */
  hideParts?: HidePartFn;
}

// --- Developer mode ---

export interface DeveloperTraceConfig {
  /** Host app callback used by the built-in traces controls to open a trace surface. */
  open: (threadId: string) => void;
}

export interface DeveloperDiagnoseConfig {
  /** Agent to receive diagnose requests. Defaults to `distri`. */
  agentId?: string;
  /** Optional fixed diagnose thread id or thread id builder. */
  threadId?: string | ((threadId: string) => string);
  /** Builds the diagnose prompt. Defaults to a prompt that targets the current thread. */
  promptBuilder?: (threadId: string) => string;
  /** Optional label shown on locally injected diagnose user messages. */
  label?: string;
}

export interface DeveloperMode {
  /** Enable built-in traces controls and route them through the configured trace opener. */
  traces?: boolean | DeveloperTraceConfig;
  /** @deprecated Use `traces={{ open }}` instead. */
  onShowTrace?: (threadId: string) => void;
  /** Show verbose toggle button in developer toolbar */
  verbosity?: boolean;
  /** Show tools panel listing all agent tools */
  tools?: boolean;
  /** Enable diagnose mode, which sends a parallel diagnose request on a separate thread. */
  diagnose?: boolean | DeveloperDiagnoseConfig;
}

// --- Session settings ---

export interface ChatSessionSettings {
  verbose: boolean;
  rendering: RenderingMode;   // always mirrors verbose unless overridden by prop
  audioEnabled: boolean;
}

// --- Slash commands ---

export type ChatCommandId = 'verbose' | 'audio' | 'reset';

export interface ChatCommand {
  id: ChatCommandId;
  label: string;
  description: string;
  /** Emoji or display character for the command, e.g. '📊' */
  icon: string;
  type: 'toggle' | 'action';
  currentValue?: boolean;
}

export interface ChatCommandEvent {
  command: ChatCommandId;
  value?: boolean;          // new value for toggles
  timestamp: number;
}
