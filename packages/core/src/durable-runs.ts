/**
 * Durable runs: the client side of the server's pending-calls contract.
 *
 * A run that waits on something outside the worker (a client tool, an
 * approval, a process, a sub-agent) *parks*: the server saves its state, emits
 * `run_parked`, and keeps the SSE stream open. The waits are stored as
 * pending calls; a client that reloads lists them, claims the ones it can
 * answer, runs each tool once and posts the result to `complete-tool`.
 *
 * Every wire shape of that contract lives in this module so the client and
 * the server stay in one place to compare.
 * Spec: distri-cloud docs/specs/2026-11-20-durable-runs-and-nodes.md §2.7, S3–S6.
 */
import { ApiError } from './types';

/**
 * A2A extension URI advertising durable runs on the agent card
 * (`capabilities.extensions[].uri`) — the only place a client learns that the
 * server runs an agent durably. The client activates it (`A2A-Extensions`)
 * together with `client-tools`.
 */
export const DURABLE_RUNS_EXTENSION_URI = 'https://distri.dev/a2a/extensions/durable-runs/v1';

export type PendingCallKind = 'client_tool' | 'approval' | 'process' | 'sub_agent';

export type PendingCallStatus = 'pending' | 'completed' | 'expired' | 'canceled' | 'interrupted';

/**
 * One wait of a parked run, as returned by
 * `GET /threads/{id}/pending-calls` and `GET /tasks/{id}/pending-calls`.
 */
export interface PendingCall {
  /** The tool call id for client tools; generated for other kinds. */
  id: string;
  task_id: string;
  thread_id: string;
  kind: PendingCallKind;
  tool_name?: string | null;
  request: {
    tool_call_id: string;
    tool_name: string;
    input: unknown;
  };
  status: PendingCallStatus;
  /** RFC 3339. Past it the server delivers a timed-out result. */
  deadline?: string | null;
  /** Instance id of the client holding the claim, if any. */
  claimed_by?: string | null;
  /** RFC 3339 end of the current claim lease. */
  claim_until?: string | null;
}

/** `POST /pending-calls/{id}/claim`: 200 `{claimed:true, until}` or 409 `{claimed_by, until}`. */
export type ClaimPendingCallResult =
  | { claimed: true; until?: string }
  | { claimed: false; claimed_by?: string; until?: string };

/** Successful outcome of `complete-tool`. A duplicate of the stored answer is a success. */
export interface CompleteToolOutcome {
  status: 'completed' | 'duplicate';
}

/**
 * `complete-tool` answered 409: the call expired (its deadline passed and the
 * agent already got a timed-out result) or a different answer won.
 */
export class ToolCallClosedError extends ApiError {
  constructor(
    public readonly toolCallId: string,
    public readonly reason: 'expired' | 'conflict',
    details?: unknown,
  ) {
    super(
      reason === 'expired'
        ? `Tool call ${toolCallId} expired: the agent stopped waiting for it`
        : `Tool call ${toolCallId} was already answered with a different result`,
      409,
      details,
    );
    this.name = 'ToolCallClosedError';
  }
}

/** Retry policy for `complete-tool` (network errors and 5xx). */
export interface CompleteToolRetryOptions {
  /** Attempts in total, including the first (default 5). */
  attempts?: number;
  /** First backoff in ms; doubles each retry (default 300). */
  baseDelayMs?: number;
  /** Backoff cap in ms (default 5000). */
  maxDelayMs?: number;
}

/**
 * `run_parked`: the run is waiting on `pending` calls. NOT terminal — the
 * stream stays open and later segments continue on it. `run_finished` /
 * `run_error` remain the only terminal events.
 */
export interface RunParkedEvent {
  type: 'run_parked';
  data: {
    taskId?: string;
    pending: string[];
    deadline?: string;
  };
}

/**
 * Whether an agent card advertises durable runs: an entry in
 * `capabilities.extensions` with uri {@link DURABLE_RUNS_EXTENSION_URI}.
 */
export function cardHasDurableRuns(card: unknown): boolean {
  if (!card || typeof card !== 'object') return false;
  const caps = (card as Record<string, unknown>).capabilities as Record<string, unknown> | undefined;
  const extensions = caps && typeof caps === 'object' ? caps.extensions : undefined;
  if (!Array.isArray(extensions)) return false;
  return extensions.some(
    (e) => !!e && typeof e === 'object' && (e as Record<string, unknown>).uri === DURABLE_RUNS_EXTENSION_URI,
  );
}
