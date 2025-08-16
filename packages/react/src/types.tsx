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
