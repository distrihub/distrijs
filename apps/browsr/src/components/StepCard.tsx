import { X, ArrowDown, ArrowUp } from 'lucide-react'
import type { Step } from '../types'

type StepCardProps = {
  step: Step
  index: number
  isActive: boolean
  onFocus: (id: string) => void
  onChange: (id: string, patch: Partial<Step>) => void
  onDelete: (id: string) => void
  onMove: (id: string, direction: 'up' | 'down') => void
}

export function StepCard({ step, index, isActive, onFocus, onChange, onDelete, onMove }: StepCardProps) {
  return (
    <div
      className={`rounded-lg border p-4 transition ${
        isActive ? 'border-primary shadow-sm' : 'border-border'
      }`}
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Step {index + 1}</span>
          <input
            value={step.title}
            onFocus={() => onFocus(step.id)}
            onChange={(event) => onChange(step.id, { title: event.target.value })}
            placeholder="Name this step"
            className="w-56 rounded-md border bg-background px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onMove(step.id, 'up')}
            className="rounded-md border px-2 py-1 text-xs"
            aria-label="Move step up"
          >
            <ArrowUp size={14} />
          </button>
          <button
            type="button"
            onClick={() => onMove(step.id, 'down')}
            className="rounded-md border px-2 py-1 text-xs"
            aria-label="Move step down"
          >
            <ArrowDown size={14} />
          </button>
          <button
            type="button"
            onClick={() => onDelete(step.id)}
            className="rounded-md border border-destructive px-2 py-1 text-xs text-destructive"
            aria-label="Delete step"
          >
            <X size={14} />
          </button>
        </div>
      </div>
      <textarea
        value={step.instruction}
        onFocus={() => onFocus(step.id)}
        onChange={(event) => onChange(step.id, { instruction: event.target.value })}
        placeholder="Describe the action the browser should take…"
        className="min-h-[120px] w-full rounded-md border bg-background p-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
      />
    </div>
  )
}
