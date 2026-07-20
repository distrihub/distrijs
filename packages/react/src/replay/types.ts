import type { DistriChatMessage, TaskSummary, WorkflowStep } from '@distri/core';
import type { ToolCallState } from '../stores/chatStateStore';

/**
 * One recorded moment of an agent run. `t` is milliseconds from run start.
 *
 * This is the same shape a real thread is exported into (see distri-cloud's
 * `GET /threads/{id}/cassette` / `GET /v1/public/threads/{id}/cassette`), so a
 * hand-authored demo and a real persisted thread are interchangeable inputs
 * to the same player — there is no separate "live thread" format.
 */
export type CassetteEvent =
  | { kind: 'user_message'; t: number; text: string }
  | { kind: 'text_delta'; t: number; text: string }
  | { kind: 'reasoning_delta'; t: number; text: string }
  | { kind: 'tool_call'; t: number; id: string; name: string; args: Record<string, unknown> }
  | { kind: 'tool_result'; t: number; id: string; result: string; error?: string }
  /**
   * A human resolved an interactive card (approve/submit/answer), as opposed
   * to `tool_result` which represents an agent/backend producing a result.
   * Resolves the matching `tool_call`'s state to `completed`, same mechanism
   * as `tool_result`, so `InteractiveToolCard`'s `isAnswered` gate flips and
   * the card visibly resolves at this event's `t`. `response` is a
   * human-readable label of what the user did (e.g. "Approved",
   * "Submitted: {...}"), carried into the synthesized `ToolResult`'s text part.
   *
   * Also marks this `tool_call` as an "interactive checkpoint" — see
   * `useReplay`'s `autoAccept` option, which by default pauses playback right
   * as this tool_call appears, instead of sailing through to this event.
   */
  | { kind: 'user_tool_input'; t: number; id: string; response: string }
  | { kind: 'ui_mutation'; t: number; method: string; args: unknown[]; target?: string | string[] }
  /**
   * A snapshot of one task in a (possibly multi-agent) task tree, e.g. a
   * parent fanning out to child agents via `invoke_agent`. Folded into
   * `ReplayState.taskSummaries` the same way `useBackgroundTasks` merges
   * polled `TaskSummary` rows into the chat store — deterministic and
   * scrubbable, unlike re-generating rows off a live timer.
   */
  | { kind: 'task_summary'; t: number; task: Partial<TaskSummary> & { id: string } }
  /**
   * A snapshot of one step in a deterministic `WorkflowProgress` run.
   * Folded into `ReplayState.workflow.steps`, keyed by `step.id`, in
   * first-seen order.
   */
  | { kind: 'workflow_step'; t: number; step: Partial<WorkflowStep> & { id: string } }
  | { kind: 'done'; t: number };

export const CASSETTE_EVENT_KINDS = [
  'user_message',
  'text_delta',
  'reasoning_delta',
  'tool_call',
  'tool_result',
  'user_tool_input',
  'ui_mutation',
  'task_summary',
  'workflow_step',
  'done',
] as const;

/** A recorded agent run. Deterministic input to the replay reducer. */
export interface Cassette {
  version: 1;
  id: string;
  /** The agent that produced the run, display/provenance only, never called. */
  agentId: string;
  /** Total run length in ms. Must be >= the largest event `t`. */
  durationMs: number;
  /** Ordered by `t`, ascending. */
  events: CassetteEvent[];
}

/** A product-UI method call recorded during the run, replayed via the ref bridge. */
export interface UiMutation {
  method: string;
  args: unknown[];
  /**
   * Optional `data-replay-id` value(s) this mutation visibly writes to. The Stage's
   * seam pulses these nodes when the mutation lands. Purely presentational, an
   * unresolvable target is skipped, never thrown.
   */
  target?: string | string[];
}

/**
 * A synthetic `WorkflowDefinition`-shaped view of the `workflow_step` events
 * seen so far. Deliberately looser than `@distri/core`'s `WorkflowDefinition`
 * (only the fields `WorkflowProgress` actually renders), the same relaxed
 * pattern already used for `TaskSummary` mocking — cast at the render call
 * site, since these are synthetic replay rows, never sent to a runner.
 */
export interface ReplayWorkflow {
  id: string;
  workflow_type: string;
  status?: 'running' | 'completed' | 'failed' | 'waiting_for_input';
  steps: (Partial<WorkflowStep> & { id: string; label: string })[];
}

/** Fully-derived state of a run at a point in time. Pure function of (cassette, t). */
export interface ReplayState {
  messages: DistriChatMessage[];
  toolCalls: Map<string, ToolCallState>;
  /** Every ui_mutation with `t` <= now, in recorded order. */
  uiMutations: UiMutation[];
  /** Latest snapshot of every task seen so far, in first-seen order. */
  taskSummaries: TaskSummary[];
  /** `null` until the first `workflow_step` event is reached. */
  workflow: ReplayWorkflow | null;
  isStreaming: boolean;
}
