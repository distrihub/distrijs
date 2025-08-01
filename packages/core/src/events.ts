export type Role = 'user' | 'system' | 'assistant';

// Each event is a concrete type - matching Rust AgentEventType enum exactly
export interface RunStartedEvent {
  type: 'run_started';
  data: {}
}

export interface RunFinishedEvent {
  type: 'run_finished';
  data: {}
}

export interface RunErrorEvent {
  type: 'run_error';
  data: {
    message: string;
    code?: string;
  };
}

// Planning events
export interface PlanStartedEvent {
  type: 'plan_started';
  data: {
    initial_plan: boolean;
  };
}

export interface PlanFinishedEvent {
  type: 'plan_finished';
  data: {}
}

export interface PlanPrunedEvent {
  type: 'plan_pruned';
  data: {
    removed_steps: string[];
  };
}

// Step execution events  
export interface StepStartedEvent {
  type: 'step_started';
  data: {
    step_id: string;
    step_index: number;
  };
}

export interface StepCompletedEvent {
  type: 'step_completed';
  data: {
    step_id: string;
    success: boolean;
  };
}

// Tool execution events
export interface ToolExecutionStartEvent {
  type: 'tool_execution_start';
  data: {
    tool_call_id: string;
    tool_call_name: string;
  };
}

export interface ToolExecutionEndEvent {
  type: 'tool_execution_end';
  data: {
    tool_call_id: string;
    tool_call_name: string;
    success: boolean;
  };
}

export interface ToolRejectedEvent {
  type: 'tool_rejected';
  data: {
    step_id: string;
    reason: string;
  };
}

// Message events for streaming
export interface TextMessageStartEvent {
  type: 'text_message_start';
  data: {
    message_id: string;
    role: Role;
  };
}

export interface TextMessageContentEvent {
  type: 'text_message_content';
  data: {
    message_id: string;
    delta: string;
  };
}

export interface TextMessageEndEvent {
  type: 'text_message_end';
  data: {
    message_id: string;
  };
}

// Rich data events
export interface MessageEvent {
  type: 'message';
  data: {
    message: any; // Will be typed properly when we see the Message structure
  };
}

export interface ExecutionResultEvent {
  type: 'execution_result';
  data: {
    result: any; // Will be typed properly when we see the ExecutionResult structure  
  };
}

// Agent transfer events
export interface AgentHandoverEvent {
  type: 'agent_handover';
  data: {
    from_agent: string;
    to_agent: string;
    reason?: string;
  };
}

// Feedback events
export interface FeedbackReceivedEvent {
  type: 'feedback_received';
  data: {
    feedback: string;
  };
}

// Legacy tool call events (keeping for backward compatibility)
export interface ToolCallStartEvent {
  type: 'tool_call_start';
  data: {
    tool_call_id: string;
    tool_call_name: string;
    parent_message_id?: string;
    step_id?: string;
    is_external?: boolean;
  };
}

export interface ToolCallArgsEvent {
  type: 'tool_call_args';
  data: {
    tool_call_id: string;
    delta: string;
  };
}

export interface ToolCallEndEvent {
  type: 'tool_call_end';
  data: {
    tool_call_id: string;
  };
}

export interface ToolCallResultEvent {
  type: 'tool_call_result';
  data: {
    tool_call_id: string;
    result: string;
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
  | StepStartedEvent
  | StepCompletedEvent
  | ToolExecutionStartEvent
  | ToolExecutionEndEvent
  | ToolRejectedEvent
  | TextMessageStartEvent
  | TextMessageContentEvent
  | TextMessageEndEvent
  | MessageEvent
  | ExecutionResultEvent
  | AgentHandoverEvent
  | FeedbackReceivedEvent
  | ToolCallStartEvent
  | ToolCallArgsEvent
  | ToolCallEndEvent
  | ToolCallResultEvent;