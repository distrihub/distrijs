import clsx from 'clsx'

type StepperItem = {
  id: string
  label: string
}

type StepperProps = {
  steps: StepperItem[]
  activeId: string
  completedIds: string[]
}

export function Stepper({ steps, activeId, completedIds }: StepperProps) {
  return (
    <div className="flex flex-wrap items-center gap-4 rounded-lg border border-muted-foreground/20 bg-card/50 p-4 text-sm">
      {steps.map((step, index) => {
        const isCompleted = completedIds.includes(step.id)
        const isActive = step.id === activeId
        return (
          <div key={step.id} className="flex items-center gap-2">
            <div
              className={clsx(
                'flex h-8 w-8 items-center justify-center rounded-full border text-xs font-semibold transition',
                isCompleted
                  ? 'border-green-400 bg-green-400/10 text-green-200'
                  : isActive
                    ? 'border-primary text-primary'
                    : 'border-muted-foreground/30 text-muted-foreground',
              )}
            >
              {index + 1}
            </div>
            <div className="min-w-[80px]">
              <p
                className={clsx(
                  'text-sm font-medium',
                  isCompleted ? 'text-foreground' : isActive ? 'text-primary' : 'text-muted-foreground',
                )}
              >
                {step.label}
              </p>
              <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
                {isCompleted ? 'Done' : isActive ? 'In progress' : 'Upcoming'}
              </div>
            </div>
            {index < steps.length - 1 && (
              <div className="h-px w-10 bg-muted-foreground/40" aria-hidden="true" />
            )}
          </div>
        )
      })}
    </div>
  )
}
