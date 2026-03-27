/**
 * useWorkflow — React hook for tracking and running workflows.
 *
 * Provides:
 * - workflow state (steps, status, progress)
 * - runNextStep() to advance the workflow
 * - runAll() to run all remaining steps
 * - isRunning flag
 */

import { useState, useCallback, useMemo } from 'react'
import type {
  WorkflowDefinition,
  StepStatus,
  StepResult,
} from '@distri/core'
import { countSteps, workflowProgress, applyEntryPoint, evaluateSkipCondition } from '@distri/core'

export interface UseWorkflowOptions {
  /** Initial workflow definition */
  workflow: WorkflowDefinition
  /** Optional entry point ID to start from (skips earlier steps) */
  entryPointId?: string
  /** Called when a step needs to be executed. Returns the step result. */
  onExecuteStep: (stepId: string, step: WorkflowDefinition['steps'][0], context: Record<string, unknown>) => Promise<StepResult>
  /** Called when workflow state changes (for persistence) */
  onStateChange?: (workflow: WorkflowDefinition) => void
}

export interface UseWorkflowReturn {
  /** Current workflow state */
  workflow: WorkflowDefinition
  /** Whether any step is currently running */
  isRunning: boolean
  /** Progress percentage (0-100) */
  progress: number
  /** Step counts by status */
  counts: Record<StepStatus, number>
  /** Run the next pending step */
  runNextStep: () => Promise<void>
  /** Run all remaining steps */
  runAll: () => Promise<void>
  /** Update workflow state directly (e.g., from SSE events) */
  updateWorkflow: (workflow: WorkflowDefinition) => void
}

export function useWorkflow({ workflow: initial, entryPointId, onExecuteStep, onStateChange }: UseWorkflowOptions): UseWorkflowReturn {
  const [workflow, setWorkflow] = useState<WorkflowDefinition>(() => {
    if (entryPointId) {
      return applyEntryPoint(initial, entryPointId)
    }
    return initial
  })
  const [isRunning, setIsRunning] = useState(false)

  const progress = useMemo(() => workflowProgress(workflow), [workflow])
  const counts = useMemo(() => countSteps(workflow), [workflow])

  const updateAndNotify = useCallback((w: WorkflowDefinition) => {
    setWorkflow(w)
    onStateChange?.(w)
  }, [onStateChange])

  const findNextRunnable = useCallback((): number | null => {
    for (let i = 0; i < workflow.steps.length; i++) {
      const step = workflow.steps[i]
      if (step.status !== 'pending') continue

      // Evaluate skip_if before considering this step
      if (step.skip_if && evaluateSkipCondition(step.skip_if, workflow.context ?? {})) {
        continue // Will be handled by runNextStep/runAll
      }

      const depsMet = (step.depends_on ?? []).every(depId =>
        workflow.steps.some(s => s.id === depId && (s.status === 'done' || s.status === 'skipped'))
      )
      if (depsMet) return i
    }
    return null
  }, [workflow])

  const runNextStep = useCallback(async () => {
    // First, skip any pending steps that match their skip_if condition
    let current = workflow
    let didSkip = false
    for (let i = 0; i < current.steps.length; i++) {
      const s = current.steps[i]
      if (s.status === 'pending' && s.skip_if && evaluateSkipCondition(s.skip_if, current.context ?? {})) {
        if (!didSkip) {
          current = { ...current, steps: [...current.steps] }
          didSkip = true
        }
        current.steps[i] = { ...s, status: 'skipped' as StepStatus, completed_at: new Date().toISOString() }
      }
    }
    if (didSkip) updateAndNotify(current)

    const idx = findNextRunnable()
    if (idx === null) return

    const step = current.steps[idx]
    const updated = { ...current }
    updated.steps = [...current.steps]
    updated.steps[idx] = { ...step, status: 'running' as StepStatus, started_at: new Date().toISOString() }
    updated.status = 'running'
    updateAndNotify(updated)
    setIsRunning(true)

    try {
      const result = await onExecuteStep(step.id, step, workflow.context ?? {})

      const final_ = { ...updated }
      final_.steps = [...updated.steps]
      final_.steps[idx] = {
        ...final_.steps[idx],
        status: result.status,
        result: result.result,
        error: result.error,
        completed_at: new Date().toISOString(),
      }

      // Merge context updates
      if (result.context_updates) {
        final_.context = { ...final_.context, ...result.context_updates }
      }

      // Check if complete
      const allDone = final_.steps.every(s => s.status === 'done' || s.status === 'skipped')
      const hasFailed = final_.steps.some(s => s.status === 'failed')
      if (allDone) final_.status = 'completed'
      else if (hasFailed) final_.status = 'failed'

      final_.updated_at = new Date().toISOString()
      updateAndNotify(final_)
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err)
      const final_ = { ...updated }
      final_.steps = [...updated.steps]
      final_.steps[idx] = { ...final_.steps[idx], status: 'failed' as StepStatus, error: errMsg, completed_at: new Date().toISOString() }
      final_.status = 'failed'
      updateAndNotify(final_)
    } finally {
      setIsRunning(false)
    }
  }, [workflow, findNextRunnable, onExecuteStep, updateAndNotify])

  const runAll = useCallback(async () => {
    let current = workflow
    setIsRunning(true)

    try {
      while (true) {
        // Skip steps that match skip_if
        let didSkip = false
        for (let i = 0; i < current.steps.length; i++) {
          const s = current.steps[i]
          if (s.status === 'pending' && s.skip_if && evaluateSkipCondition(s.skip_if, current.context ?? {})) {
            if (!didSkip) {
              current = { ...current, steps: [...current.steps] }
              didSkip = true
            }
            current.steps[i] = { ...s, status: 'skipped' as StepStatus, completed_at: new Date().toISOString() }
          }
        }
        if (didSkip) updateAndNotify(current)

        const idx = (() => {
          for (let i = 0; i < current.steps.length; i++) {
            const step = current.steps[i]
            if (step.status !== 'pending') continue
            const depsMet = (step.depends_on ?? []).every(depId =>
              current.steps.some(s => s.id === depId && (s.status === 'done' || s.status === 'skipped'))
            )
            if (depsMet) return i
          }
          return null
        })()

        if (idx === null) break

        const step = current.steps[idx]
        current = { ...current, steps: [...current.steps] }
        current.steps[idx] = { ...step, status: 'running' as StepStatus, started_at: new Date().toISOString() }
        current.status = 'running'
        updateAndNotify(current)

        const result = await onExecuteStep(step.id, step, current.context ?? {})

        current = { ...current, steps: [...current.steps] }
        current.steps[idx] = {
          ...current.steps[idx],
          status: result.status,
          result: result.result,
          error: result.error,
          completed_at: new Date().toISOString(),
        }

        if (result.context_updates) {
          current.context = { ...current.context, ...result.context_updates }
        }

        if (result.status === 'failed') {
          current.status = 'failed'
          updateAndNotify(current)
          break
        }

        const allDone = current.steps.every(s => s.status === 'done' || s.status === 'skipped')
        if (allDone) current.status = 'completed'
        current.updated_at = new Date().toISOString()
        updateAndNotify(current)
      }
    } finally {
      setIsRunning(false)
    }
  }, [workflow, onExecuteStep, updateAndNotify])

  const updateWorkflow = useCallback((w: WorkflowDefinition) => {
    setWorkflow(w)
  }, [])

  return { workflow, isRunning, progress, counts, runNextStep, runAll, updateWorkflow }
}
