import { ToolResult } from "./types";

export type Role = 'user' | 'system' | 'assistant';

// Each event is a concrete type
export interface RunStartedEvent {
  type: 'run_started';
  data: {
    runId?: string;
    taskId?: string;
  }
}

export interface RunFinishedEvent {
  type: 'run_finished';
  data: {
    runId?: string;
    taskId?: string;
  }
}

export interface RunErrorEvent {
  type: 'run_error';
  data: {
    message: string;
    code?: string;
  };
}

export interface PlanStartedEvent {
  type: 'plan_started';
  data: {
    initial_plan?: boolean;
  };
}

export interface PlanFinishedEvent {
  type: 'plan_finished';
  data: {
    total_steps?: number;
  };
}

export interface PlanPrunedEvent {
  type: 'plan_pruned';
  data: {
    removed_steps?: any;
  };
}

export interface TextMessageStartEvent {
  type: 'text_message_start';
  data: {
    message_id: string;
    step_id: string;
    role: Role;
    is_final?: boolean;
  };
}

export interface TextMessageContentEvent {
  type: 'text_message_content';
  data: {
    message_id: string;
    step_id: string;
    delta: string;
  };
}

export interface TextMessageEndEvent {
  type: 'text_message_end';
  data: {
    message_id: string;
    step_id: string;
  };
}

export interface ToolExecutionStartEvent {
  type: 'tool_execution_start';
  data: {
    tool_call_id: string;
    tool_call_name: string;
    parent_message_id?: string;
    input?: any;
  };
}

export interface ToolExecutionEndEvent {
  type: 'tool_execution_end';
  data: {
    tool_call_id: string;
  };
}

export interface ToolRejectedEvent {
  type: 'tool_rejected';
  data: {
    reason?: string;
    tool_call_id?: string;
  };
}

export interface AgentHandoverEvent {
  type: 'agent_handover';
  data: {
    from_agent: string;
    to_agent: string;
    reason?: string;
  };
}

export interface StepStartedEvent {
  type: 'step_started';
  data: {
    step_id: string;
    step_title: string;
    step_index: number;
  };
}

export interface StepCompletedEvent {
  type: 'step_completed';
  data: {
    step_id: string;
    step_title: string;
    step_index: number;
  };
}

export interface FeedbackReceivedEvent {
  type: 'feedback_received';
  data: {
    feedback: string;
  };
}

export interface ToolCallsEvent {
  type: 'tool_calls';
  data: {
    tool_calls: Array<{
      tool_call_id: string;
      tool_name: string;
      input: any;
    }>;
  };
}

export interface ToolResultsEvent {
  type: 'tool_results';
  data: {
    results: Array<ToolResult>;
  };
}

export interface BrowserScreenshotEvent {
  type: 'browser_screenshot';
  data: {
    image: string;
    format?: string;
    filename?: string;
    size?: number;
    timestamp_ms?: number;
  };
}

// Union of all event types
export type DistriEvent =
  | RunStartedEvent
  | RunFinishedEvent
  | RunErrorEvent
  | PlanStartedEvent
  | PlanFinishedEvent
  | PlanPrunedEvent
  | TextMessageStartEvent
  | TextMessageContentEvent
  | TextMessageEndEvent
  | ToolExecutionStartEvent
  | ToolExecutionEndEvent
  | ToolRejectedEvent
  | StepStartedEvent
  | StepCompletedEvent
  | AgentHandoverEvent
  | FeedbackReceivedEvent
  | ToolCallsEvent
  | ToolResultsEvent
  | BrowserScreenshotEvent;
