/**
 * Workflow engine types — mirrors distri-workflow Rust crate.
 */

export type WorkflowStatus = 'pending' | 'running' | 'paused' | 'completed' | 'failed' | 'blocked'
export type StepStatus = 'pending' | 'blocked' | 'running' | 'done' | 'failed' | 'skipped'
export type StepExecution = 'sequential' | 'parallel'

export interface WorkflowDefinition {
  id: string
  workflow_type: string
  /** JSON Schema for required inputs. */
  input_schema?: Record<string, unknown>
  steps: WorkflowStep[]
  // Runtime state (defaults applied by runner, not required in templates)
  status?: WorkflowStatus
  current_step?: number
  context?: Record<string, unknown>
  notes?: WorkflowNote[]
  created_at?: string
  updated_at?: string
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
  const counts = { pending: 0, blocked: 0, running: 0, done: 0, failed: 0, skipped: 0 }
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
  }
}
