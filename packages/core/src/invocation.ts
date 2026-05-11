/**
 * Typed mirror of `distri_types::invocation::Invocation` (Rust).
 *
 * This is the SDK surface for the unified sub-agent dispatch model.
 * Mirrors the Rust shape exactly so JSON sent over the wire round-trips
 * through serde without translation. The on-the-wire shape is what the
 * server's `AgentOrchestrator::invoke()` consumes.
 *
 * Axis matrix:
 *   - `targets` (1..N): one leaf per sub-agent dispatch.
 *   - `context`: what the child task sees on its first turn.
 *   - `join`: how the parent waits.
 *   - `executor`: which orchestrator runs the loop (auto / forced).
 *   - `tools`: how the child inherits external tools from the parent.
 *
 * The HTTP route that consumes this is intentionally not committed in
 * this SDK release — it requires API design (auth, workspace
 * scoping, route shape) that should land deliberately. The types are
 * complete and validated by the Rust serde layer when wired. Use
 * `validateInvocation` for client-side preflight.
 */

import type { DistriMessage } from './types';

// ── Top-level invocation ───────────────────────────────────────────

export interface Invocation {
  /** 1..N targets. `Single` requires exactly 1; the others accept any positive count. */
  targets: Target[];
  /** What the child task sees on first turn. Default: `independent`. */
  context?: ContextScope;
  /** How the parent waits. Default: `single`. */
  join?: Join;
  /** Which orchestrator runs the loop. Default: `{ kind: 'auto' }`. */
  executor?: ExecutorHint;
  /** Tool inheritance policy for the child. Default: `{ kind: 'inherit' }`. */
  tools?: ToolPolicy;
}

/** One leaf of a (possibly fan-out) invocation. */
export interface Target {
  agent: AgentRef;
  /** The user-facing message handed to the child as its first turn. */
  message: DistriMessage;
  /** Per-target executor override; falls back to invocation.executor when absent. */
  executor?: ExecutorHint;
}

// ── How to identify the agent ─────────────────────────────────────

export type AgentRef =
  | { type: 'named'; agent_id: string }
  | {
      type: 'ad_hoc';
      system_prompt: string;
      /** Replaces the seeded ToolsConfig when present. Mirrors today's
       *  `call_agent({system_prompt, tools})`. */
      tools?: unknown;
    };

// ── Axis 1: ContextScope ──────────────────────────────────────────

export type ContextScope = 'independent' | 'inherited' | 'shared';

// ── Axis 2: Join ──────────────────────────────────────────────────

export type Join = 'single' | 'all' | 'detached';

// ── Axis 3: Executor ──────────────────────────────────────────────

/** Hint to the orchestrator. `auto` = let the orchestrator pick;
 *  `force` = override with a specific Executor. */
export type ExecutorHint =
  | { kind: 'auto' }
  | { kind: 'force'; type: 'local' }
  | { kind: 'force'; type: 'remote'; runner: RunnerConfig };

/** Open-set runner config — schema is agnostic to runner kinds. The
 *  `kind` field is the registry key the orchestrator looks up; `config`
 *  is the runner-specific JSON the registered initializer parses. */
export interface RunnerConfig {
  kind: string;
  config?: Record<string, unknown>;
}

/** Internal-only. The `Executor` enum is exposed indirectly via
 *  `ExecutorHint`; SDK callers should not construct this directly. */
export type Executor =
  | { type: 'local' }
  | { type: 'remote'; runner: RunnerConfig };

// ── Tool policy ───────────────────────────────────────────────────

export type ToolPolicy =
  | { kind: 'inherit' }
  | { kind: 'exact'; tools: string[] }
  | { kind: 'none' };

// ── Result shape ──────────────────────────────────────────────────

/** One agent's final result. */
export interface AgentResult {
  /** The final text or structured payload produced via the `final` tool. */
  content: unknown;
  /** Child's task_id. */
  task_id: string;
  /** Status at completion. Mirrors Rust `core::TaskStatus`. Named
   *  `AgentTaskStatus` here to avoid a clash with the A2A protocol
   *  `TaskStatus` (an object with a `state` field) re-exported from
   *  `@a2a-js/sdk/client`. */
  status: AgentTaskStatus;
}

export type AgentTaskStatus =
  | 'pending'
  | 'running'
  | 'input_required'
  | 'completed'
  | 'failed'
  | 'canceled';

/** Discriminated union — shape matches `Join`. */
export type InvocationResult =
  | { kind: 'scalar'; result: AgentResult }
  | { kind: 'vector'; results: AgentResult[] }
  | { kind: 'task_ids'; task_ids: string[] };

// ── Validation ────────────────────────────────────────────────────

export interface InvocationValidationError {
  code:
    | 'no_targets'
    | 'single_needs_one_target'
    | 'adhoc_empty_prompt'
    | 'named_empty_agent_id';
  message: string;
}

/** Client-side preflight matching `Invocation::validate` on the Rust
 *  side. Returns the first error encountered, or `null` if valid.
 *  The server re-validates regardless. */
export function validateInvocation(
  inv: Invocation
): InvocationValidationError | null {
  if (inv.targets.length === 0) {
    return { code: 'no_targets', message: 'invocation requires at least one target' };
  }
  const join: Join = inv.join ?? 'single';
  if (join === 'single' && inv.targets.length !== 1) {
    return {
      code: 'single_needs_one_target',
      message: `Join::Single requires exactly 1 target, got ${inv.targets.length}`,
    };
  }
  for (const t of inv.targets) {
    if (t.agent.type === 'ad_hoc' && t.agent.system_prompt.trim() === '') {
      return { code: 'adhoc_empty_prompt', message: 'AdHoc target with empty system_prompt' };
    }
    if (t.agent.type === 'named' && t.agent.agent_id.trim() === '') {
      return { code: 'named_empty_agent_id', message: 'Named target with empty agent_id' };
    }
  }
  return null;
}

// ── Builders (parity with Rust `Invocation::single`/`all`/`detached`) ──

export const Invocations = {
  single(target: Target): Invocation {
    return { targets: [target], join: 'single' };
  },
  all(targets: Target[]): Invocation {
    return { targets, join: 'all' };
  },
  detached(targets: Target[]): Invocation {
    return { targets, join: 'detached' };
  },
};

/** Convenience constructor for a Named-agent target with a plain text
 *  user message. */
export function targetNamed(agent_id: string, text: string): Target {
  return {
    agent: { type: 'named', agent_id },
    message: {
      id: cryptoRandomUUID(),
      role: 'user',
      parts: [{ part_type: 'text', data: text }],
      created_at: Date.now(),
    } as DistriMessage,
  };
}

/** Convenience constructor for an AdHoc target. */
export function targetAdHoc(system_prompt: string, text: string, tools?: unknown): Target {
  return {
    agent: { type: 'ad_hoc', system_prompt, tools },
    message: {
      id: cryptoRandomUUID(),
      role: 'user',
      parts: [{ part_type: 'text', data: text }],
      created_at: Date.now(),
    } as DistriMessage,
  };
}

function cryptoRandomUUID(): string {
  // Browsers + recent Node have crypto.randomUUID; fall back to a manual
  // RFC4122 v4 if not (e.g. older Node test runners).
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return (crypto as Crypto).randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
