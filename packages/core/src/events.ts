import { ToolResult } from "./types";

export type Role = 'user' | 'system' | 'assistant';

// Each event is a concrete type
export interface RunStartedEvent {
  type: 'run_started';
  data: {
    runId?: string;
    taskId?: string;
    agentId?: string;
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

export interface BrowserSessionStartedEvent {
  type: 'browser_session_started';
  data: {
    session_id: string;
    viewer_url?: string;
    stream_url?: string;
  };
}

export interface InlineHookRequestedEvent {
  type: 'inline_hook_requested';
  data: {
    hook_id: string;
    hook: string;
    context: {
      agent_id: string;
      thread_id: string;
      task_id: string;
      run_id: string;
    };
    timeout_ms?: number;
    fire_and_forget?: boolean;
    message?: any;
    plan?: any;
    result?: any;
  };
}

// Todo types matching backend
export type TodoStatus = 'open' | 'in_progress' | 'done';

export interface TodoItem {
  id: string;
  content: string;
  status: TodoStatus;
}

/**
 * One mutation in a `write_todos` call. Mirrors `distri_types::todos::TodoChange`.
 *
 * Lets renderers show only the items that actually changed in the
 * latest `write_todos` invocation instead of re-rendering the full
 * list every time the LLM ticks something off.
 */
export type TodoChangeKind = 'added' | 'status_changed' | 'removed';

export interface TodoChange {
  kind: TodoChangeKind;
  content: string;
  status: TodoStatus;
  /** Status the item had before this call. Set only for `status_changed`. */
  prev_status?: TodoStatus;
}

export interface TodosUpdatedEvent {
  type: 'todos_updated';
  data: {
    formatted_todos: string;
    action: string;
    todo_count: number;
    /** Parsed todo items for rendering */
    todos?: TodoItem[];
    /**
     * Per-call diff: which items got added, had their status
     * changed, or were removed. Empty when the renderer can't
     * compute it (first `write_todos` call has no prior list to
     * diff against — every item is treated as `Added`). Renderers
     * should prefer this list when surfacing "what just changed"
     * UI; the full list is still in `todos`.
     */
    changes?: TodoChange[];
  };
}

export interface LiveViewEvent {
  type: 'live_view';
  data: {
    view_id: string;
    url: string;
    title?: string;
    display_mode?: 'inline' | 'fullscreen' | 'pip';
    width?: number;
    height?: number;
  };
}

/**
 * Per-turn snapshot of the planner's context budget. Mirrors the server's
 * `ContextBudgetUpdate` event.
 */
export interface ContextBudgetUpdateEvent {
  type: 'context_budget_update';
  data: {
    budget: import('./types').ContextBudget;
    is_warning: boolean;
    is_critical: boolean;
  };
}

/**
 * Fired when the agent compacts conversation history. Mirrors the server's
 * `ContextCompaction` event.
 */
export interface ContextCompactionStreamEvent {
  type: 'context_compaction';
  data: {
    tier: 'trim' | 'summarize' | 'reset';
    tokens_before: number;
    tokens_after: number;
    entries_affected: number;
    context_limit: number;
    usage_ratio: number;
    summary?: string;
    reinjected_skills?: string[];
    context_budget?: import('./types').ContextBudget;
    source?: 'auto' | 'manual';
    duration_ms?: number;
  };
}

/**
 * Routing envelope present on every decoded DistriEvent.
 *
 * Every consumer (chatStateStore reducer, useChat handlers, custom UIs) MUST
 * route by `taskId` and `parentTaskId`, NOT by the wire subscription's task.
 * This is what lets sub-agent events (forks dispatched via `run_skill`,
 * `call_agent`) reach the FE attributed to the right task in the tree —
 * a fork's `tool_calls` arrives with `taskId = forkTaskId` and
 * `parentTaskId = parentTaskId`, even though the SSE connection is
 * subscribed to the parent.
 *
 * `parentTaskId` is `undefined` for events from the root run.
 */
export interface DistriEventEnvelope {
  taskId?: string;
  parentTaskId?: string;
}

// Each concrete event interface gets the envelope merged in via
// intersection so the discriminated `type` field still narrows correctly.
type WithEnvelope<E> = E & DistriEventEnvelope;

// Union of all event types — every variant carries `taskId` + `parentTaskId`.
export type DistriEvent =
  | WithEnvelope<RunStartedEvent>
  | WithEnvelope<RunFinishedEvent>
  | WithEnvelope<RunErrorEvent>
  | WithEnvelope<PlanStartedEvent>
  | WithEnvelope<PlanFinishedEvent>
  | WithEnvelope<PlanPrunedEvent>
  | WithEnvelope<TextMessageStartEvent>
  | WithEnvelope<TextMessageContentEvent>
  | WithEnvelope<TextMessageEndEvent>
  | WithEnvelope<ToolExecutionStartEvent>
  | WithEnvelope<ToolExecutionEndEvent>
  | WithEnvelope<ToolRejectedEvent>
  | WithEnvelope<StepStartedEvent>
  | WithEnvelope<StepCompletedEvent>
  | WithEnvelope<AgentHandoverEvent>
  | WithEnvelope<FeedbackReceivedEvent>
  | WithEnvelope<ToolCallsEvent>
  | WithEnvelope<ToolResultsEvent>
  | WithEnvelope<BrowserSessionStartedEvent>
  | WithEnvelope<InlineHookRequestedEvent>
  | WithEnvelope<TodosUpdatedEvent>
  | WithEnvelope<LiveViewEvent>
  | WithEnvelope<ContextBudgetUpdateEvent>
  | WithEnvelope<ContextCompactionStreamEvent>;
