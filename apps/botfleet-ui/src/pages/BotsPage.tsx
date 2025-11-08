import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, RefreshCw } from 'lucide-react'
import { FilterChips } from '@/components/FilterChips'
import { BotCard } from '@/components/BotCard'
import { BotFleetAPI } from '@/api/client'
import type { BotFilters, BotRecord } from '@/types'
import { toast } from 'sonner'

export function BotsPage() {
  const navigate = useNavigate()
  const [bots, setBots] = useState<BotRecord[]>([])
  const [filters, setFilters] = useState<BotFilters>({ scope: 'all' })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadBots = async () => {
    try {
      setIsLoading(true)
      const data = await BotFleetAPI.getBots()
      setBots(data)
      setError(null)
    } catch (err) {
      console.error(err)
      setError(err instanceof Error ? err.message : 'Failed to load bots')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadBots()
  }, [])

  const filteredBots = useMemo(() => {
    if (filters.scope === 'all') return bots
    return bots.filter((bot) => bot.platform.toLowerCase().includes(filters.scope))
  }, [bots, filters])

  const handleKickoff = async (botId: string) => {
    try {
      await BotFleetAPI.kickoffBot(botId)
      toast.success('Kickoff queued', {
        description: 'We will notify you when the simulation is ready.',
      })
    } catch (err) {
      toast.error('Unable to kickoff bot', {
        description: err instanceof Error ? err.message : 'Unknown error',
      })
    }
  }

  return (
    <section className="p-10 space-y-8 text-slate-900 dark:text-slate-100 transition-colors">
      <header className="flex items-center justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.35em] text-slate-500">Navigation</p>
          <h1 className="text-4xl font-semibold text-slate-900 dark:text-white mt-1">Filtered Overview</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2">
            Coordinate your bot fleet and manage multi-channel campaigns.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            className="h-11 px-4 rounded-xl border border-slate-300 text-slate-700 text-sm flex items-center gap-2 hover:bg-slate-100 transition-colors dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
            onClick={loadBots}
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
          <button
            type="button"
            onClick={() => navigate('/bots/new')}
            className="h-11 px-5 rounded-xl bg-indigo-600 text-white text-sm font-semibold flex items-center gap-2 hover:bg-indigo-500 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add New Bot
          </button>
        </div>
      </header>

      <FilterChips value={filters.scope} onChange={(scope) => setFilters({ scope })} />

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl p-4 dark:bg-red-500/10 dark:border-red-500/40 dark:text-red-200">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="text-slate-500 dark:text-slate-400">Loading bots…</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredBots.map((bot) => (
            <BotCard
              key={bot.id}
              bot={bot}
              onKickoff={handleKickoff}
              onTrain={(id) => navigate(`/bots/${id}/training`)}
            />
          ))}
          {!filteredBots.length && (
            <div className="col-span-full text-center text-slate-600 py-16 border border-dashed border-slate-300 rounded-2xl dark:text-slate-500 dark:border-slate-800">
              No bots match the selected filter.
            </div>
          )}
        </div>
      )}
    </section>
  )
}
