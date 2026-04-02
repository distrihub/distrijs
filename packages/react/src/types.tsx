import React from "react";
import { DistriFnTool, DistriBaseTool, ToolCall, ToolResult } from "@distri/core";
import { ToolCallState } from "./stores/chatStateStore";


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

export interface ToolSummary {
  verb: string;         // "GET", "Read", "Search", "Run", …
  subject?: string;     // filename, path, query — derived from input
  detail?: string;      // result hint — derived from result
}

export type SummaryFn = (
  input: Record<string, unknown>,
  result?: ToolResult
) => ToolSummary;

export interface RendererConfig {
  rendering?: RenderingMode;
  toolSummaryOverrides?: Record<string, SummaryFn>;
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
