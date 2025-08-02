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
    reason?: string;
    tool_call_id?: string;
  };
}

export interface TaskArtifactEvent {
  type: 'task_artifact';
  data: {
    artifact_id: string;
    artifact_type: string;
    resolution?: any;
    content?: any;
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

export interface FeedbackReceivedEvent {
  type: 'feedback_received';
  data: {
    feedback: string;
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
  | ToolCallStartEvent
  | ToolCallArgsEvent
  | ToolCallEndEvent
  | ToolCallResultEvent
  | ToolRejectedEvent
  | TaskArtifactEvent
  | AgentHandoverEvent
  | FeedbackReceivedEvent;