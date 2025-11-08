import clsx from 'clsx'
import type { BotFilters } from '@/types'

interface FilterChipsProps {
  value: BotFilters['scope']
  onChange(value: BotFilters['scope']): void
}

const filters: { value: BotFilters['scope']; label: string }[] = [
  { value: 'all', label: 'All Bots' },
  { value: 'twitter', label: 'Twitter Bots' },
  { value: 'reddit', label: 'Reddit Bots' },
]

export function FilterChips({ value, onChange }: FilterChipsProps) {
  return (
    <div className="flex gap-3">
      {filters.map((filter) => (
        <button
          key={filter.value}
          type="button"
          className={clsx(
            'px-5 py-2 rounded-full text-sm font-medium transition-colors border',
            value === filter.value
              ? 'bg-indigo-100 border-indigo-200 text-indigo-700 dark:bg-indigo-500/20 dark:border-indigo-400 dark:text-white'
              : 'bg-slate-100 border-transparent text-slate-600 hover:text-slate-900 dark:bg-slate-900 dark:text-slate-400 dark:hover:text-white',
          )}
          onClick={() => onChange(filter.value)}
        >
          {filter.label}
        </button>
      ))}
    </div>
  )
}
