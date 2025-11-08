import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BotFleetAPI } from '@/api/client'
import type { Campaign } from '@/types'
import { toast } from 'sonner'

export function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  const loadCampaigns = async () => {
    try {
      setLoading(true)
      const data = await BotFleetAPI.getCampaigns()
      setCampaigns(data)
    } catch (err) {
      toast.error('Unable to load campaigns', {
        description: err instanceof Error ? err.message : 'Unknown error',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCampaigns()
  }, [])

  return (
    <section className="p-10 space-y-8 text-slate-900 dark:text-slate-100 transition-colors">
      <header className="flex items-center justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.35em] text-slate-500">Launchpad</p>
          <h1 className="text-4xl font-semibold text-slate-900 dark:text-white mt-1">Campaigns</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2">Bundle bots into orchestrated pushes.</p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/campaigns/new')}
          className="h-11 px-5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-500 transition-colors"
        >
          Add Campaign
        </button>
      </header>

      <div className="space-y-4">
        {loading ? (
          <div className="text-slate-500 dark:text-slate-400">Loading campaigns…</div>
        ) : (
          campaigns.map((campaign) => (
            <article
              key={campaign.id}
              className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3 shadow-sm shadow-slate-200/60 dark:bg-slate-900/40 dark:border-slate-800 dark:shadow-black/20 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-slate-900 dark:text-white font-semibold">{campaign.name}</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">{campaign.description}</p>
                </div>
                <span className="text-xs px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/30">
                  {campaign.status}
                </span>
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                Start: {campaign.schedule?.start_date ?? 'TBD'} · End: {campaign.schedule?.end_date ?? 'TBD'} · Cadence: {campaign.schedule?.cadence ?? '—'}
              </div>
              {campaign.schedule?.summary_markdown && (
                <p className="text-slate-600 dark:text-slate-400 text-sm whitespace-pre-wrap">
                  {campaign.schedule.summary_markdown}
                </p>
              )}
            </article>
          ))
        )}
        {!loading && !campaigns.length && (
          <div className="text-center text-slate-600 py-12 border border-dashed border-slate-300 rounded-2xl dark:text-slate-500 dark:border-slate-800">
            No campaigns yet. Create one to orchestrate multi-bot drops.
          </div>
        )}
      </div>
    </section>
  )
}
