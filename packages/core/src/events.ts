export type Role = 'user' | 'system' | 'assistant';

// Each event is a concrete type
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

// New strategy-based events
export interface PlanStartedEvent {
  type: 'plan_started';
  data: {
    plan_id: string;
    description: string;
    run_id: string;
  };
}

export interface PlanFinishedEvent {
  type: 'plan_finished';
  data: {
    plan_id: string;
    steps: Array<{
      id: string;
      number: number;
      description: string;
    }>;
    run_id: string;
  };
}

export interface StepStartedEvent {
  type: 'step_started';
  data: {
    step_id: string;
    step_number: number;
    description: string;
    plan_id: string;
    run_id: string;
  };
}

export interface StepCompletedEvent {
  type: 'step_completed';
  data: {
    step_id: string;
    step_number: number;
    result: string;
    success: boolean;
    plan_id: string;
    run_id: string;
  };
}

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

export interface ToolRejectedEvent {
  type: 'tool_rejected';
  data: {
    tool_call_id: string;
    reason: string;
    step_id?: string;
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

// Union of all event types
export type DistriEvent =
  | RunStartedEvent
  | RunFinishedEvent
  | RunErrorEvent
  | PlanStartedEvent
  | PlanFinishedEvent
  | StepStartedEvent
  | StepCompletedEvent
  | TextMessageStartEvent
  | TextMessageContentEvent
  | TextMessageEndEvent
  | ToolCallStartEvent
  | ToolCallArgsEvent
  | ToolCallEndEvent
  | ToolCallResultEvent
  | ToolRejectedEvent
  | AgentHandoverEvent;