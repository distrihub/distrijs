/**
 * Workflow engine types — mirrors distri-workflow Rust crate.
 */

export type WorkflowStatus = 'pending' | 'running' | 'paused' | 'completed' | 'failed'
export type StepStatus = 'pending' | 'running' | 'done' | 'failed' | 'skipped'
export type StepExecution = 'sequential' | 'parallel'

export interface WorkflowDefinition {
  id: string
  workflow_type: string
  status: WorkflowStatus
  current_step: number
  context: Record<string, unknown>
  steps: WorkflowStep[]
  notes: WorkflowNote[]
  created_at: string
  updated_at: string
}

export interface WorkflowStep {
  id: string
  label: string
  kind: StepKind
  status: StepStatus
  result?: unknown
  error?: string | null
  started_at?: string | null
  completed_at?: string | null
  depends_on: string[]
  execution: StepExecution
}

export type StepKind =
  | { type: 'api_call'; method: string; url: string; body?: unknown; headers?: Record<string, string> }
  | { type: 'script'; command: string; args?: string[] }
  | { type: 'agent_run'; agent_id: string; prompt: string; tools?: string[] }
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
  const counts = { pending: 0, running: 0, done: 0, failed: 0, skipped: 0 }
  for (const step of workflow.steps) {
    counts[step.status]++
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
    case 'pending': return '⬜'
  }
}
