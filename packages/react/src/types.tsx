import { DistriFnTool, DistriBaseTool, ToolCall, ToolResult } from "@distri/core";


export type ToolCallStatus = 'pending' | 'running' | 'completed' | 'error' | 'user_action_required';

export interface ToolCallState {
  tool_call_id: string;
  status: ToolCallStatus;
  tool_name: string;
  input: any;
  result?: any;
  error?: string;
  startedAt?: Date;
  completedAt?: Date;
  component?: React.ReactNode;
}

export type DistriAnyTool = DistriFnTool | DistriUiTool;

export interface DistriUiTool extends DistriBaseTool {
  type: 'ui';
  component: (props: UiToolProps) => React.ReactNode;
}

export type UiToolProps = {
  toolCall: ToolCall;
  toolCallState?: ToolCallState;
  completeTool: (result: ToolResult) => void;
}