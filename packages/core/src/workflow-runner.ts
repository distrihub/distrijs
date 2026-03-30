/**
 * WorkflowRunner — client-side workflow execution engine.
 *
 * Mirrors the Rust DistriStepExecutor + WorkflowRunner.
 * Runs workflow steps in dependency order, resolves namespace references,
 * emits WorkflowEvent callbacks, and executes steps via DistriClient or custom handlers.
 *
 * Usage:
 *   const runner = new WorkflowRunner(client, {
 *     buildRequest: (step, init) => ({ ...init, headers: { ...init.headers, 'X-Custom': 'value' } })
 *   })
 *   const events = runner.run(workflowDef, { doc_id: 'abc' })
 *   for await (const event of events) { console.log(event) }
 */

import type { DistriClient } from './distri-client'
import type {
  WorkflowDefinition,
  WorkflowStep,
  StepResult,
  StepKind,
  WorkflowStatus,
  StepStatus,
} from './workflow'
import { applyEntryPoint, evaluateSkipCondition, resumeStep } from './workflow'

// ── Event types ────────────────────────────────────────────────────────────

export type WorkflowEvent =
  | { event: 'workflow_started'; workflow_id: string; workflow_type: string; total_steps: number }
  | { event: 'step_started'; workflow_id: string; step_id: string; step_label: string }
  | { event: 'step_completed'; workflow_id: string; step_id: string; step_label: string; result?: unknown }
  | { event: 'step_failed'; workflow_id: string; step_id: string; step_label: string; error: string }
  | { event: 'step_waiting'; workflow_id: string; step_id: string; step_label: string; message: string; schema?: unknown }
  | { event: 'workflow_completed'; workflow_id: string; status: WorkflowStatus; steps_done: number; steps_failed: number }
  | { event: 'workflow_paused'; workflow_id: string; step_id: string; message: string }

export type WorkflowEventCallback = (event: WorkflowEvent) => void

// ── Runner options ─────────────────────────────────────────────────────────

export interface WorkflowRunnerOptions {
  /** Hook to customize fetch RequestInit before HTTP calls (add auth, base URL, etc.) */
  buildRequest?: (step: WorkflowStep, init: RequestInit, url: string) => { url: string; init: RequestInit }
  /** Environment variables injected into {env.X} namespace */
  env?: Record<string, unknown>
  /** Custom step executor — override default behavior for any step kind */
  executeStep?: (step: WorkflowStep, resolvedInput: unknown, context: ExecutionContext) => Promise<StepResult>
}

// ── Execution context (three namespaces) ───────────────────────────────────

export interface ExecutionContext {
  input: Record<string, unknown>
  steps: Record<string, unknown>
  env: Record<string, unknown>
}

// ── Namespace resolution ───────────────────────────────────────────────────

function resolvePath(obj: unknown, path: string): unknown | undefined {
  let current: unknown = obj
  for (const segment of path.split('.')) {
    if (current == null || typeof current !== 'object') return undefined
    current = (current as Record<string, unknown>)[segment]
  }
  return current
}

function resolveReference(ref: string, ctx: ExecutionContext): unknown | undefined {
  const dotIdx = ref.indexOf('.')
  if (dotIdx === -1) return undefined

  const namespace = ref.substring(0, dotIdx)
  const path = ref.substring(dotIdx + 1)

  switch (namespace) {
    case 'input': return resolvePath(ctx.input, path)
    case 'steps': return resolvePath(ctx.steps, path)
    case 'env': return resolvePath(ctx.env, path)
    case 'context':
      // Backward compat: check input → steps → env
      return resolvePath(ctx.input, path)
        ?? resolvePath(ctx.steps, path)
        ?? resolvePath(ctx.env, path)
    default: return undefined
  }
}

/** Resolve {namespace.path} in a string template. */
export function resolveTemplate(template: string, ctx: ExecutionContext): string {
  return template.replace(/\{([^}]+)\}/g, (match, ref) => {
    const resolved = resolveReference(ref, ctx)
    if (resolved === undefined) return match
    return typeof resolved === 'string' ? resolved : JSON.stringify(resolved)
  })
}

/** Recursively resolve namespace references in a JSON value.
 *  Full-value references like "{steps.fetch.items}" preserve the original type. */
export function resolveValue(value: unknown, ctx: ExecutionContext): unknown {
  if (typeof value === 'string') {
    const trimmed = value.trim()
    // Full-value reference — preserves type (array, object, number)
    if (trimmed.startsWith('{') && trimmed.endsWith('}') && !trimmed.slice(1).includes('{')) {
      const ref = trimmed.slice(1, -1)
      const resolved = resolveReference(ref, ctx)
      if (resolved !== undefined) return resolved
    }
    // String interpolation
    return resolveTemplate(value, ctx)
  }
  if (Array.isArray(value)) {
    return value.map(v => resolveValue(v, ctx))
  }
  if (value != null && typeof value === 'object') {
    const result: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(value)) {
      result[k] = resolveValue(v, ctx)
    }
    return result
  }
  return value
}

/** Resolve a step's input. If step has explicit input mapping, resolve it. Otherwise return full context. */
function resolveStepInput(step: WorkflowStep, ctx: ExecutionContext): unknown {
  const mapping = (step as unknown as { input?: unknown }).input
  if (mapping != null) {
    return resolveValue(mapping, ctx)
  }
  return ctx
}

// ── Cycle detection ────────────────────────────────────────────────────────

function detectCycles(steps: WorkflowStep[]): string | null {
  const adj = new Map<string, string[]>()
  const ids = new Set(steps.map(s => s.id))
  for (const step of steps) {
    const deps = step.depends_on || []
    adj.set(step.id, deps)
    for (const dep of deps) {
      if (!ids.has(dep)) return `Step '${step.id}' depends on '${dep}' which does not exist`
    }
  }

  const visited = new Set<string>()
  const inStack = new Set<string>()

  function dfs(node: string, path: string[]): string | null {
    visited.add(node)
    inStack.add(node)
    path.push(node)

    for (const dep of adj.get(node) || []) {
      if (!visited.has(dep)) {
        const cycle = dfs(dep, path)
        if (cycle) return cycle
      } else if (inStack.has(dep)) {
        const cycleStart = path.indexOf(dep)
        return `Circular dependency: ${path.slice(cycleStart).join(' → ')} → ${dep}`
      }
    }

    inStack.delete(node)
    path.pop()
    return null
  }

  for (const step of steps) {
    if (!visited.has(step.id)) {
      const cycle = dfs(step.id, [])
      if (cycle) return cycle
    }
  }
  return null
}

// ── WorkflowRunner ─────────────────────────────────────────────────────────

export class WorkflowRunner {
  private client: DistriClient
  private options: WorkflowRunnerOptions
  /** Stored when workflow pauses for human input */
  private _pausedWorkflow: WorkflowDefinition | null = null
  private _pausedContext: ExecutionContext | null = null

  constructor(client: DistriClient, options: WorkflowRunnerOptions = {}) {
    this.client = client
    this.options = options
  }

  /** Whether this runner has a paused workflow waiting for input. */
  get isPaused(): boolean {
    return this._pausedWorkflow?.status === 'paused'
  }

  /** Get the paused workflow state (for inspection/UI). */
  get pausedWorkflow(): WorkflowDefinition | null {
    return this._pausedWorkflow
  }

  /**
   * Resume a paused workflow by providing input for the waiting step.
   * Returns an async generator of events (like run()).
   */
  async *resume(
    stepId: string,
    input: unknown,
  ): AsyncGenerator<WorkflowEvent> {
    if (!this._pausedWorkflow || !this._pausedContext) {
      throw new Error('No paused workflow to resume')
    }

    // Apply the resume
    const resumed = resumeStep(this._pausedWorkflow, stepId, input)
    const ctx = this._pausedContext
    ctx.steps[stepId] = input

    // Clear paused state
    this._pausedWorkflow = null
    this._pausedContext = null

    // Continue running from the resumed state
    yield* this._continueRun(resumed, ctx)
  }

  /** Internal: continue running a workflow from its current state. */
  private async *_continueRun(
    workflow: WorkflowDefinition,
    ctx: ExecutionContext,
  ): AsyncGenerator<WorkflowEvent> {
    // Ensure all steps have defaults
    for (const step of workflow.steps) {
      step.status = step.status || 'pending'
      step.depends_on = step.depends_on || []
      step.execution = step.execution || 'sequential'
    }

    // Run remaining steps (same loop as run())
    while (true) {
      // Evaluate skip_if conditions on pending steps
      for (const step of workflow.steps) {
        if (step.status === 'pending' && step.skip_if) {
          if (evaluateSkipCondition(step.skip_if, ctx as unknown as Record<string, unknown>)) {
            step.status = 'skipped' as StepStatus
            step.completed_at = new Date().toISOString()
          }
        }
      }

      const runnableIndices = this.findRunnable(workflow)
      if (runnableIndices.length === 0) break

      let paused = false
      for (const idx of runnableIndices) {
        const step = workflow.steps[idx]

        if (step.kind.type === 'wait_for_input') {
          step.status = 'waiting_for_input' as StepStatus
          step.started_at = new Date().toISOString()
          workflow.status = 'paused'

          yield {
            event: 'step_waiting',
            workflow_id: workflow.id,
            step_id: step.id,
            step_label: step.label,
            message: step.kind.message,
            schema: step.kind.schema,
          }

          yield {
            event: 'workflow_paused',
            workflow_id: workflow.id,
            step_id: step.id,
            message: step.kind.message,
          }

          this._pausedWorkflow = workflow
          this._pausedContext = ctx
          paused = true
          break
        }

        yield {
          event: 'step_started',
          workflow_id: workflow.id,
          step_id: step.id,
          step_label: step.label,
        }

        step.status = 'running' as StepStatus
        step.started_at = new Date().toISOString()

        try {
          const resolvedInput = resolveStepInput(step, ctx)
          const result = this.options.executeStep
            ? await this.options.executeStep(step, resolvedInput, ctx)
            : await this.executeStep(step, resolvedInput, ctx)

          step.status = result.status
          step.result = result.result
          step.error = result.error ?? null
          step.completed_at = new Date().toISOString()

          if (result.result != null) {
            ctx.steps[step.id] = result.result
          }

          if (result.status === 'failed') {
            yield { event: 'step_failed', workflow_id: workflow.id, step_id: step.id, step_label: step.label, error: result.error || 'Unknown error' }
            workflow.status = 'failed'
            break
          } else {
            yield { event: 'step_completed', workflow_id: workflow.id, step_id: step.id, step_label: step.label, result: result.result }
          }
        } catch (err) {
          const errMsg = err instanceof Error ? err.message : String(err)
          step.status = 'failed' as StepStatus
          step.error = errMsg
          step.completed_at = new Date().toISOString()
          yield { event: 'step_failed', workflow_id: workflow.id, step_id: step.id, step_label: step.label, error: errMsg }
          workflow.status = 'failed'
          break
        }
      }

      if (paused) break
      if (workflow.status === 'failed') break
    }

    if (workflow.status !== 'failed' && workflow.status !== 'paused') {
      const allDone = workflow.steps.every(s => s.status === 'done' || s.status === 'skipped')
      workflow.status = allDone ? 'completed' : 'failed'
    }

    if (workflow.status !== 'paused') {
      const stepsDone = workflow.steps.filter(s => s.status === 'done').length
      const stepsFailed = workflow.steps.filter(s => s.status === 'failed').length
      yield { event: 'workflow_completed', workflow_id: workflow.id, status: workflow.status, steps_done: stepsDone, steps_failed: stepsFailed }
    }
  }

  /**
   * Run a workflow to completion. Returns an async generator of WorkflowEvents.
   * @param definition - The workflow definition to run
   * @param input - Input data for the workflow
   * @param entryPointId - Optional entry point ID to start from (skips earlier steps)
   */
  async *run(
    definition: WorkflowDefinition,
    input: Record<string, unknown> = {},
    entryPointId?: string,
  ): AsyncGenerator<WorkflowEvent> {
    // Apply entry point if specified (skips earlier steps, pre-populates results)
    let def = JSON.parse(JSON.stringify(definition)) as WorkflowDefinition
    if (entryPointId) {
      def = applyEntryPoint(def, entryPointId)
    }

    // Validate DAG
    const cycle = detectCycles(def.steps)
    if (cycle) throw new Error(cycle)

    // Build execution context
    const ctx: ExecutionContext = {
      input,
      steps: {},
      env: this.options.env || {},
    }

    // Merge preset results from entry point into execution context
    if (entryPointId && def.context) {
      const presetSteps = (def.context as Record<string, unknown>).steps as Record<string, unknown> | undefined
      if (presetSteps) {
        Object.assign(ctx.steps, presetSteps)
      }
    }

    // Clone workflow for mutation, apply defaults
    const workflow: WorkflowDefinition = def
    workflow.status = 'running'
    workflow.context = ctx as unknown as Record<string, unknown>
    // Ensure all steps have defaults
    for (const step of workflow.steps) {
      step.status = step.status || 'pending'
      step.depends_on = step.depends_on || []
      step.execution = step.execution || 'sequential'
    }

    yield {
      event: 'workflow_started',
      workflow_id: workflow.id,
      workflow_type: workflow.workflow_type,
      total_steps: workflow.steps.length,
    }

    // Run steps in dependency order
    while (true) {
      // Evaluate skip_if conditions on pending steps
      for (const step of workflow.steps) {
        if (step.status === 'pending' && step.skip_if) {
          if (evaluateSkipCondition(step.skip_if, ctx as unknown as Record<string, unknown>)) {
            step.status = 'skipped' as StepStatus
            step.completed_at = new Date().toISOString()
          }
        }
      }

      const runnableIndices = this.findRunnable(workflow)
      if (runnableIndices.length === 0) break

      // Check if any runnable step is a WaitForInput — pause on it
      let paused = false
      for (const idx of runnableIndices) {
        const step = workflow.steps[idx]

        // WaitForInput: pause workflow and yield waiting event
        if (step.kind.type === 'wait_for_input') {
          step.status = 'waiting_for_input' as StepStatus
          step.started_at = new Date().toISOString()
          workflow.status = 'paused'

          yield {
            event: 'step_waiting',
            workflow_id: workflow.id,
            step_id: step.id,
            step_label: step.label,
            message: step.kind.message,
            schema: step.kind.schema,
          }

          yield {
            event: 'workflow_paused',
            workflow_id: workflow.id,
            step_id: step.id,
            message: step.kind.message,
          }

          // Store the paused workflow state so resume can use it
          this._pausedWorkflow = workflow
          this._pausedContext = ctx
          paused = true
          break
        }

        yield {
          event: 'step_started',
          workflow_id: workflow.id,
          step_id: step.id,
          step_label: step.label,
        }

        step.status = 'running' as StepStatus
        step.started_at = new Date().toISOString()

        try {
          const resolvedInput = resolveStepInput(step, ctx)
          const result = this.options.executeStep
            ? await this.options.executeStep(step, resolvedInput, ctx)
            : await this.executeStep(step, resolvedInput, ctx)

          step.status = result.status
          step.result = result.result
          step.error = result.error ?? null
          step.completed_at = new Date().toISOString()

          // Auto-store result at steps.<step_id>
          if (result.result != null) {
            ctx.steps[step.id] = result.result
          }

          if (result.status === 'failed') {
            yield {
              event: 'step_failed',
              workflow_id: workflow.id,
              step_id: step.id,
              step_label: step.label,
              error: result.error || 'Unknown error',
            }
            workflow.status = 'failed'
            break
          } else {
            yield {
              event: 'step_completed',
              workflow_id: workflow.id,
              step_id: step.id,
              step_label: step.label,
              result: result.result,
            }
          }
        } catch (err) {
          const errMsg = err instanceof Error ? err.message : String(err)
          step.status = 'failed' as StepStatus
          step.error = errMsg
          step.completed_at = new Date().toISOString()

          yield {
            event: 'step_failed',
            workflow_id: workflow.id,
            step_id: step.id,
            step_label: step.label,
            error: errMsg,
          }
          workflow.status = 'failed'
          break
        }
      }

      if (paused) break
      if (workflow.status === 'failed') break
    }

    // Final status
    if (workflow.status !== 'failed' && workflow.status !== 'paused') {
      const allDone = workflow.steps.every(s => s.status === 'done' || s.status === 'skipped')
      workflow.status = allDone ? 'completed' : 'failed'
    }

    // Only emit workflow_completed if not paused (paused workflows will resume later)
    if (workflow.status !== 'paused') {
      const stepsDone = workflow.steps.filter(s => s.status === 'done').length
      const stepsFailed = workflow.steps.filter(s => s.status === 'failed').length

      yield {
        event: 'workflow_completed',
        workflow_id: workflow.id,
        status: workflow.status,
        steps_done: stepsDone,
        steps_failed: stepsFailed,
      }
    }
  }

  /** Find indices of steps that are pending with all dependencies met.
   *  Dependencies are "met" if the step is done or skipped (entry point skips count). */
  private findRunnable(workflow: WorkflowDefinition): number[] {
    const runnable: number[] = []
    for (let i = 0; i < workflow.steps.length; i++) {
      const step = workflow.steps[i]
      if (step.status !== 'pending') continue
      const depsMet = (step.depends_on || []).every(depId =>
        workflow.steps.some(s => s.id === depId && (s.status === 'done' || s.status === 'skipped'))
      )
      if (depsMet) runnable.push(i)
    }
    return runnable
  }

  /** Default step executor — handles tool_call, api_call, checkpoint, etc. */
  private async executeStep(
    step: WorkflowStep,
    resolvedInput: unknown,
    ctx: ExecutionContext,
  ): Promise<StepResult> {
    switch (step.kind.type) {
      case 'tool_call':
        return this.executeToolCall(step.kind, resolvedInput)

      case 'api_call':
        return this.executeApiCall(step, step.kind, ctx)

      case 'checkpoint':
        return { status: 'done', result: { message: step.kind.message } }

      case 'agent_run':
        return { status: 'done', result: { deferred: true, agent_id: step.kind.agent_id, prompt: step.kind.prompt } }

      case 'script':
        return { status: 'done', result: { deferred: true, command: step.kind.command } }

      case 'condition':
        return { status: 'done', result: { expression: step.kind.expression, evaluated: true } }

      default:
        return { status: 'failed', error: `Unknown step kind: ${(step.kind as { type: string }).type}` }
    }
  }

  private async executeToolCall(kind: Extract<StepKind, { type: 'tool_call' }>, resolvedInput: unknown): Promise<StepResult> {
    try {
      const result = await this.client.callTool(kind.tool_name, resolvedInput as Record<string, unknown>)
      return { status: 'done', result }
    } catch (err) {
      return { status: 'failed', error: `Tool '${kind.tool_name}' failed: ${err instanceof Error ? err.message : err}` }
    }
  }

  private async executeApiCall(
    step: WorkflowStep,
    kind: Extract<StepKind, { type: 'api_call' }>,
    ctx: ExecutionContext,
  ): Promise<StepResult> {
    let url = resolveTemplate(kind.url, ctx)
    let init: RequestInit = {
      method: kind.method,
      headers: { 'Content-Type': 'application/json', ...(kind.headers || {}) },
    }

    if (kind.body) {
      init.body = JSON.stringify(resolveValue(kind.body, ctx))
    }

    // Apply buildRequest hook
    if (this.options.buildRequest) {
      const customized = this.options.buildRequest(step, init, url)
      url = customized.url
      init = customized.init
    }

    try {
      const resp = await fetch(url, init)
      const body = await resp.json().catch(() => null)

      if (resp.ok) {
        return { status: 'done', result: { status: resp.status, body } }
      } else {
        return { status: 'failed', error: `HTTP ${resp.status} — ${JSON.stringify(body)}` }
      }
    } catch (err) {
      return { status: 'failed', error: `Request failed: ${err instanceof Error ? err.message : err}` }
    }
  }
}
