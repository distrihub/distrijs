/**
 * WorkflowProgress — renders workflow step progress.
 */

import React from 'react'
import type { WorkflowDefinition } from '@distri/core'
import { stepIcon, workflowProgress } from '@distri/core'

export interface WorkflowProgressProps {
  workflow: WorkflowDefinition
  className?: string
  /** Show step details (kind, result preview) */
  detailed?: boolean
}

export function WorkflowProgress({ workflow, className, detailed }: WorkflowProgressProps) {
  const progress = workflowProgress(workflow)
  const done = workflow.steps.filter(s => s.status === 'done' || s.status === 'skipped').length
  const total = workflow.steps.length

  return (
    <div className={className}>
      {/* Progress bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <div style={{
          flex: 1, height: 6, borderRadius: 3,
          backgroundColor: 'var(--muted, #e5e7eb)',
          overflow: 'hidden',
        }}>
          <div style={{
            width: `${progress}%`,
            height: '100%',
            borderRadius: 3,
            backgroundColor: workflow.status === 'failed'
              ? 'var(--destructive, #ef4444)'
              : 'var(--primary, #6366f1)',
            transition: 'width 0.3s ease',
          }} />
        </div>
        <span style={{ fontSize: 12, color: 'var(--muted-foreground, #6b7280)', whiteSpace: 'nowrap' }}>
          {done}/{total}
        </span>
      </div>

      {/* Steps */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {workflow.steps.map((step) => (
          <div
            key={step.id}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 8,
              padding: '6px 0',
              opacity: step.status === 'skipped' ? 0.5 : 1,
            }}
          >
            <span style={{ fontSize: 14, lineHeight: '20px' }}>{stepIcon(step.status)}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontSize: 13,
                fontWeight: step.status === 'running' ? 600 : 400,
                color: step.status === 'failed'
                  ? 'var(--destructive, #ef4444)'
                  : 'inherit',
              }}>
                {step.label}
              </div>
              {step.error && (
                <div style={{ fontSize: 11, color: 'var(--destructive, #ef4444)', marginTop: 2 }}>
                  {step.error}
                </div>
              )}
              {detailed && step.result && step.status === 'done' && (
                <div style={{ fontSize: 11, color: 'var(--muted-foreground, #6b7280)', marginTop: 2 }}>
                  {typeof step.result === 'string' ? step.result : JSON.stringify(step.result).slice(0, 100)}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
