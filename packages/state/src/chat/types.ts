import { DistriBaseTool, DistriFnTool } from '@distri/core';

export type ToolCallStatus = 'pending' | 'running' | 'completed' | 'error' | 'user_action_required';

export type RenderingMode = 'minimal' | 'rich';

export type StreamingIndicator = 'typing' | 'thinking' | 'generating';

export interface ChatSessionSettings {
  verbose: boolean;
  rendering: RenderingMode;   // always mirrors verbose unless overridden by prop
  audioEnabled: boolean;
}

/**
 * Framework-agnostic shape of a UI-rendering tool. `component` is opaque here
 * (`unknown`) — @distri/state never constructs it. Framework packages (e.g.
 * @distri/react) define their own narrower type with a concrete renderer
 * signature (e.g. `(props) => React.ReactNode`), which is structurally
 * assignable to this type wherever a `DistriAnyTool` is expected.
 */
export interface DistriUiToolLike extends DistriBaseTool {
  type: 'ui';
  component: unknown;
}

export type DistriAnyTool = DistriFnTool | DistriUiToolLike;
