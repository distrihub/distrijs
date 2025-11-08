import { useCallback, useEffect, useMemo, useState } from 'react'
import { BotFleetAPI } from '@/api/client'
import type { FeedAction, FeedStatus } from '@/types'
import { toast } from 'sonner'
import { Check, X, PauseCircle, Loader2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export function FeedPage() {
  const [actions, setActions] = useState<FeedAction[]>([])
  const [statusFilter, setStatusFilter] = useState<FeedStatus | 'all'>('pending')
  const [loading, setLoading] = useState(true)

  const loadFeed = useCallback(async () => {
    try {
      setLoading(true)
      const response = await BotFleetAPI.getFeed({ status: statusFilter })
      setActions(response)
    } catch (error) {
      toast.error('Unable to load feed', {
        description: error instanceof Error ? error.message : 'Unknown error',
      })
    } finally {
      setLoading(false)
    }
  }, [statusFilter])

  useEffect(() => {
    loadFeed()
  }, [loadFeed])

  const filteredActions = useMemo(() => actions, [actions])

  const decide = async (id: string, decision: FeedStatus) => {
    try {
      await BotFleetAPI.decideFeedAction(id, { status: decision })
      await loadFeed()
    } catch (error) {
      toast.error('Unable to update action', {
        description: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }

  return (
    <section className="p-10 space-y-8 text-slate-900 dark:text-slate-100 transition-colors">
      <header className="flex items-center justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.35em] text-slate-500">Navigation</p>
          <h1 className="text-4xl font-semibold text-slate-900 dark:text-white mt-1">Live Feed</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2">Review and manage pending bot actions.</p>
        </div>
        <button
          type="button"
          className="flex items-center gap-2 px-5 h-11 rounded-xl bg-rose-100 text-rose-700 border border-rose-200 dark:bg-rose-600/20 dark:text-rose-200 dark:border-rose-700/40 transition-colors"
        >
          <PauseCircle className="h-5 w-5" />
          Pause All Bots
        </button>
      </header>

      <div className="flex gap-3">
        {['pending', 'approved', 'rejected', 'all'].map((status) => (
          <button
            key={status}
            type="button"
            onClick={() => setStatusFilter(status as FeedStatus | 'all')}
            className={`px-4 py-2 rounded-full border text-sm capitalize transition-colors ${
              statusFilter === status
                ? 'bg-indigo-100 border-indigo-200 text-indigo-700 dark:bg-indigo-500/20 dark:border-indigo-400 dark:text-white'
                : 'border-slate-300 text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:border-slate-800 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-900'
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading feed…
        </div>
      ) : (
        <div className="space-y-5">
          {filteredActions.map((action) => (
            <FeedActionCard key={action.id} action={action} onDecide={decide} />
          ))}
          {!filteredActions.length && (
            <EmptyFeed state={statusFilter} />
          )}
        </div>
      )}
    </section>
  )
}

function EmptyFeed({ state }: { state: FeedStatus | 'all' }) {
  const navigate = useNavigate()
  const isEmptyState = state === 'pending' || state === 'all'
  return (
    <div className="border border-dashed border-slate-300 rounded-3xl py-16 px-6 text-center space-y-4 dark:border-slate-800">
      <p className="text-2xl font-semibold text-slate-900 dark:text-white">No actions yet</p>
      <p className="text-slate-600 dark:text-slate-400">
        {isEmptyState
          ? 'Kick off your first bot to start reviewing actions.'
          : 'No actions match this filter.'}
      </p>
      {isEmptyState && (
        <button
          type="button"
          onClick={() => navigate('/bots/new')}
          className="mt-4 px-6 h-11 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-500 transition-colors"
        >
          Create a Bot
        </button>
      )}
    </div>
  )
}

function FeedActionCard({
  action,
  onDecide,
}: {
  action: FeedAction
  onDecide(id: string, status: FeedStatus): void
}) {
  const payloadPreview =
    typeof action.payload?.preview === 'string'
      ? action.payload.preview
      : action.summary
  return (
    <article className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-sm shadow-slate-200/60 dark:bg-slate-900/50 dark:border-slate-800 dark:shadow-black/20 transition-colors">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-500 uppercase tracking-[0.3em] dark:text-slate-400">{action.action_type}</p>
          <h3 className="text-xl font-semibold text-slate-900 dark:text-white">
            {action.bot_name ?? 'Unknown Bot'}{' '}
            <span className="text-sm text-slate-500 font-normal dark:text-slate-400">
              ({action.bot_platform ?? action.bot_id})
            </span>
          </h3>
        </div>
        <div className="text-xs px-3 py-1 rounded-full border border-slate-200 text-slate-600 capitalize dark:border-slate-800 dark:text-slate-400">
          {action.status}
        </div>
      </div>
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-slate-700 whitespace-pre-wrap dark:bg-slate-950/60 dark:border-slate-800 dark:text-slate-300">
        {payloadPreview}
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => onDecide(action.id, 'rejected')}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-300 text-slate-600 hover:bg-slate-100 transition-colors dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-900"
        >
          <X className="h-4 w-4" /> Reject
        </button>
        <button
          type="button"
          onClick={() => onDecide(action.id, 'approved')}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-100 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/30 transition-colors"
        >
          <Check className="h-4 w-4" /> Approve
        </button>
      </div>
    </article>
  )
}
