import React from "react";
import { DistriFnTool, DistriBaseTool, ToolCall, ToolResult } from "@distri/core";
import type { ToolSummary, SummaryFn } from "@distri/state";
import { ToolCallState } from "./stores/chatStateStore";

export type { ToolSummary, SummaryFn };


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
