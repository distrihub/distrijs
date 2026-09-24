import type { ReactNode } from 'react';
import type { DistriBaseTool, ToolCall, ToolResult } from '@distri/core';
import type { ToolCallState } from '@distri/state';

export type RenderingMode = 'minimal' | 'rich';

export interface NativeToolRendererProps {
  toolCall: ToolCall;
  state?: ToolCallState;
  completeTool: (result: ToolResult) => void;
}

export type NativeToolRendererMap = Record<string, (props: NativeToolRendererProps) => ReactNode>;

export interface NativeUiToolProps {
  toolCall: ToolCall;
  toolCallState?: ToolCallState;
  completeTool: (result: ToolResult) => void;
  tool: DistriBaseTool;
}

export interface NativeUiTool extends DistriBaseTool {
  type: 'ui';
  component: (props: NativeUiToolProps) => ReactNode;
}
