/**
 * Workflow engine types — mirrors distri-workflow Rust crate.
 */

export type WorkflowStatus = 'pending' | 'running' | 'paused' | 'completed' | 'failed' | 'blocked'
export type StepStatus = 'pending' | 'blocked' | 'running' | 'done' | 'failed' | 'skipped' | 'waiting_for_input'
export type StepExecution = 'sequential' | 'parallel'

export interface WorkflowDefinition {
  id: string
  workflow_type: string
  /** JSON Schema for required inputs. */
  input_schema?: Record<string, unknown>
  steps: WorkflowStep[]
  /** Named entry points for multi-entry workflows. */
  entry_points?: EntryPoint[]
  // Runtime state (defaults applied by runner, not required in templates)
  status?: WorkflowStatus
  current_step?: number
  context?: Record<string, unknown>
  notes?: WorkflowNote[]
  created_at?: string
  updated_at?: string
}

/** A named entry point into a workflow — allows starting at different steps. */
export interface EntryPoint {
  /** Unique identifier (e.g., "import_from_docs", "grade_only"). */
  id: string
  /** Human-readable label. */
  label: string
  /** Optional description of when to use this entry point. */
  description?: string
  /** The step ID where execution begins. */
  starts_at: string
  /** Pre-populated step results for skipped steps. Maps step_id → result value. */
  preset_results?: Record<string, unknown>
  /** Required input fields for this entry point (for UI/validation). */
  required_inputs?: string[]
}

export interface WorkflowStep {
  id: string
  label: string
  kind: StepKind
  depends_on?: string[]
  execution?: StepExecution
  requires?: StepRequirement[]
  /** Explicit input mapping with {input.X}, {steps.X.Y}, {env.X} references. */
  input?: Record<string, unknown>
  /**
   * Skip this step if the expression evaluates to true against the workflow context.
   * Supports: `{input.field}` (truthy), `!{input.field}` (falsy),
   * `{input.field} == "value"` (equality), `{input.field} != "value"` (inequality).
   */
  skip_if?: string
  // Runtime state (not in templates)
  status?: StepStatus
  result?: unknown
  error?: string | null
  started_at?: string | null
  completed_at?: string | null
}

export interface StepRequirement {
  skill: string
  permissions?: string[]
  config?: unknown
}

export type StepKind =
  | { type: 'tool_call'; tool_name: string; input?: unknown; agent_id?: string }
  | { type: 'api_call'; method: string; url: string; body?: unknown; headers?: Record<string, string> }
  | { type: 'script'; command: string; args?: string[]; cwd?: string; timeout_secs?: number }
  | { type: 'agent_run'; agent_id: string; prompt: string; tools?: string[]; skills?: string[]; model?: string }
  | { type: 'condition'; expression: string; if_true: StepKind; if_false?: StepKind }
  | { type: 'checkpoint'; message: string }
  | { type: 'wait_for_input'; message: string; schema?: Record<string, unknown> }

export interface StepResult {
  status: StepStatus
  result?: unknown
  error?: string | null
  context_updates?: Record<string, unknown>
}

export interface WorkflowNote {
  step_id: string
  message: string
  at: string
}

/** Helper: count steps by status */
export function countSteps(workflow: WorkflowDefinition) {
  const counts = { pending: 0, blocked: 0, running: 0, done: 0, failed: 0, skipped: 0, waiting_for_input: 0 }
  for (const step of workflow.steps) {
    const status = step.status || 'pending'
    if (status in counts) counts[status as keyof typeof counts]++
  }
  return counts
}

/** Helper: get progress percentage */
export function workflowProgress(workflow: WorkflowDefinition): number {
  if (workflow.steps.length === 0) return 100
  const done = workflow.steps.filter(s => s.status === 'done' || s.status === 'skipped').length
  return Math.round((done / workflow.steps.length) * 100)
}

/** Helper: get the step icon for display */
export function stepIcon(status: StepStatus): string {
  switch (status) {
    case 'done': return '✅'
    case 'failed': return '❌'
    case 'running': return '⏳'
    case 'skipped': return '⏭'
    case 'blocked': return '🚫'
    case 'pending': return '⬜'
    case 'waiting_for_input': return '✋'
  }
}

/** Get an entry point by ID from a workflow definition. */
export function getEntryPoint(workflow: WorkflowDefinition, entryPointId: string): EntryPoint | undefined {
  return workflow.entry_points?.find(ep => ep.id === entryPointId)
}

/**
 * Apply an entry point to a workflow: mark steps before starts_at as skipped,
 * pre-populate results from preset_results, and return the modified workflow.
 */
export function applyEntryPoint(workflow: WorkflowDefinition, entryPointId: string): WorkflowDefinition {
  const ep = getEntryPoint(workflow, entryPointId)
  if (!ep) throw new Error(`Entry point '${entryPointId}' not found`)

  if (!workflow.steps.some(s => s.id === ep.starts_at)) {
    throw new Error(`Entry point '${entryPointId}' references step '${ep.starts_at}' which does not exist`)
  }

  // Find all steps reachable from starts_at (inclusive, forward through dependents)
  const reachable = reachableFrom(workflow.steps, ep.starts_at)

  const steps = workflow.steps.map(step => {
    if (reachable.has(step.id)) return { ...step }
    return {
      ...step,
      status: 'skipped' as StepStatus,
      result: ep.preset_results?.[step.id] ?? undefined,
    }
  })

  // Pre-populate context with preset results
  const context = { ...workflow.context }
  if (ep.preset_results) {
    const stepsCtx = (context as Record<string, unknown>).steps as Record<string, unknown> ?? {}
    for (const [stepId, result] of Object.entries(ep.preset_results)) {
      stepsCtx[stepId] = result
    }
    ;(context as Record<string, unknown>).steps = stepsCtx
  }

  return { ...workflow, steps, context }
}

/** Find all step IDs reachable from the given step (inclusive, following dependents forward). */
function reachableFrom(steps: WorkflowStep[], startStepId: string): Set<string> {
  const reachable = new Set<string>()
  const queue = [startStepId]

  while (queue.length > 0) {
    const current = queue.shift()!
    if (reachable.has(current)) continue
    reachable.add(current)

    // Find steps that depend on current (downstream)
    for (const step of steps) {
      if (step.depends_on?.includes(current) && !reachable.has(step.id)) {
        queue.push(step.id)
      }
    }
  }

  return reachable
}

/** Check if any step in the workflow is waiting for input. */
export function isWaitingForInput(workflow: WorkflowDefinition): boolean {
  return workflow.steps.some(s => s.status === 'waiting_for_input')
}

/** Get the step that is waiting for input, if any. */
export function getWaitingStep(workflow: WorkflowDefinition): WorkflowStep | undefined {
  return workflow.steps.find(s => s.status === 'waiting_for_input')
}

/**
 * Resume a paused workflow by providing input for the waiting step.
 * Returns a new workflow with the step marked done and its result stored in context.
 */
export function resumeStep(
  workflow: WorkflowDefinition,
  stepId: string,
  result: unknown,
): WorkflowDefinition {
  const idx = workflow.steps.findIndex(s => s.id === stepId && s.status === 'waiting_for_input')
  if (idx === -1) throw new Error(`Step '${stepId}' not found or not in waiting_for_input state`)

  const steps = workflow.steps.map((s, i) => {
    if (i !== idx) return { ...s }
    return {
      ...s,
      status: 'done' as StepStatus,
      result,
      completed_at: new Date().toISOString(),
    }
  })

  // Store result in context for downstream steps
  const context = { ...workflow.context } as Record<string, unknown>
  const stepsCtx = (context.steps as Record<string, unknown>) ?? {}
  stepsCtx[stepId] = result
  context.steps = stepsCtx

  return { ...workflow, steps, context, status: 'running' }
}

/** Evaluate a skip_if expression against a structured execution context. */
export function evaluateSkipCondition(expression: string, ctx: Record<string, unknown>): boolean {
  const expr = expression.trim()

  // Negation
  if (expr.startsWith('!')) {
    return !evaluateSkipCondition(expr.slice(1).trim(), ctx)
  }

  // Equality: {ref} == "value"
  const eqMatch = expr.match(/^(.+?)\s*==\s*"([^"]*)"$/)
  if (eqMatch) {
    const resolved = resolveSingleRef(eqMatch[1].trim(), ctx)
    return String(resolved ?? '') === eqMatch[2]
  }

  // Inequality: {ref} != "value"
  const neqMatch = expr.match(/^(.+?)\s*!=\s*"([^"]*)"$/)
  if (neqMatch) {
    const resolved = resolveSingleRef(neqMatch[1].trim(), ctx)
    if (resolved === undefined || resolved === null) return true
    return String(resolved) !== neqMatch[2]
  }

  // Simple truthy check
  const resolved = resolveSingleRef(expr, ctx)
  return isTruthy(resolved)
}

function resolveSingleRef(expr: string, ctx: Record<string, unknown>): unknown {
  const trimmed = expr.trim()
  const ref = trimmed.startsWith('{') && trimmed.endsWith('}')
    ? trimmed.slice(1, -1)
    : trimmed

  const dotIdx = ref.indexOf('.')
  if (dotIdx === -1) return undefined

  const namespace = ref.substring(0, dotIdx)
  const path = ref.substring(dotIdx + 1)

  const nsValue = (ctx as Record<string, unknown>)[namespace]
  if (nsValue == null) return undefined

  let current: unknown = nsValue
  for (const segment of path.split('.')) {
    if (current == null || typeof current !== 'object') return undefined
    current = (current as Record<string, unknown>)[segment]
  }
  return current
}

function isTruthy(value: unknown): boolean {
  if (value === null || value === undefined) return false
  if (typeof value === 'boolean') return value
  if (typeof value === 'string') return value.length > 0
  if (typeof value === 'number') return value !== 0
  if (Array.isArray(value)) return value.length > 0
  if (typeof value === 'object') return Object.keys(value as object).length > 0
  return Boolean(value)
}
