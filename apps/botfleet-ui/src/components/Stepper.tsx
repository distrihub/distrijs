import clsx from 'clsx'

interface StepperProps {
  steps: string[]
  activeIndex: number
}

export function Stepper({ steps, activeIndex }: StepperProps) {
  return (
    <div className="flex items-center gap-4 text-sm font-medium text-slate-400">
      {steps.map((step, index) => (
        <div key={step} className="flex items-center gap-3">
          <div
            className={clsx(
              'size-8 rounded-full border flex items-center justify-center',
              index <= activeIndex
                ? 'bg-indigo-500/20 border-indigo-400 text-white'
                : 'border-slate-700 text-slate-500',
            )}
          >
            {index + 1}
          </div>
          <span className={index <= activeIndex ? 'text-white' : ''}>{step}</span>
          {index !== steps.length - 1 && <div className="w-12 h-px bg-slate-800" />}
        </div>
      ))}
    </div>
  )
}
