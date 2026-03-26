/**
 * useWorkflowRunner — React hook that runs workflows using DistriClient.
 *
 * Combines WorkflowRunner (from @distri/core) with React state management.
 * Steps execute against distri-cloud APIs. Events update state in real-time.
 *
 * Usage:
 *   const { run, status, events, steps, isRunning } = useWorkflowRunner()
 *   await run(workflowDef, { doc_id: 'abc' })
 */

import { useState, useCallback, useRef } from 'react'
import {
  WorkflowRunner,
  type WorkflowEvent,
  type WorkflowRunnerOptions,
  type ExecutionContext,
} from '@distri/core'
import type {
  WorkflowDefinition,
  WorkflowStatus,
  StepResult,
  WorkflowStep,
} from '@distri/core'
import { useDistri } from './DistriProvider'

export interface UseWorkflowRunnerOptions {
  /** Hook to customize HTTP requests (add auth headers, base URL, etc.) */
  buildRequest?: WorkflowRunnerOptions['buildRequest']
  /** Environment variables for {env.X} namespace */
  env?: Record<string, unknown>
  /** Custom step executor override */
  executeStep?: (step: WorkflowStep, resolvedInput: unknown, context: ExecutionContext) => Promise<StepResult>
  /** Called on each event */
  onEvent?: (event: WorkflowEvent) => void
}

export interface UseWorkflowRunnerReturn {
  /** Run a workflow with the given input. */
  run: (workflow: WorkflowDefinition, input?: Record<string, unknown>) => Promise<WorkflowStatus>
  /** Whether a workflow is currently running. */
  isRunning: boolean
  /** Current status (null if not started). */
  status: WorkflowStatus | null
  /** All events emitted so far. */
  events: WorkflowEvent[]
  /** Stop the running workflow. */
  stop: () => void
}

export function useWorkflowRunner(options: UseWorkflowRunnerOptions = {}): UseWorkflowRunnerReturn {
  const { client } = useDistri()
  const [isRunning, setIsRunning] = useState(false)
  const [status, setStatus] = useState<WorkflowStatus | null>(null)
  const [events, setEvents] = useState<WorkflowEvent[]>([])
  const stoppedRef = useRef(false)

  const run = useCallback(async (
    workflow: WorkflowDefinition,
    input: Record<string, unknown> = {},
  ): Promise<WorkflowStatus> => {
    if (!client) throw new Error('DistriClient not initialized')

    const runner = new WorkflowRunner(client, {
      buildRequest: options.buildRequest,
      env: options.env,
      executeStep: options.executeStep,
    })

    setIsRunning(true)
    setStatus('running')
    setEvents([])
    stoppedRef.current = false

    let finalStatus: WorkflowStatus = 'failed'

    try {
      for await (const event of runner.run(workflow, input)) {
        if (stoppedRef.current) break

        setEvents(prev => [...prev, event])
        options.onEvent?.(event)

        if (event.event === 'workflow_completed') {
          finalStatus = event.status
          setStatus(event.status)
        }
      }
    } catch (err) {
      finalStatus = 'failed'
      setStatus('failed')
    } finally {
      setIsRunning(false)
    }

    return finalStatus
  }, [client, options.buildRequest, options.env, options.executeStep, options.onEvent])

  const stop = useCallback(() => {
    stoppedRef.current = true
  }, [])

  return { run, isRunning, status, events, stop }
}
