import { Rocket, Workflow } from 'lucide-react'
import type { BotRecord } from '@/types'

interface Props {
  bot: BotRecord
  onKickoff(id: string): void
  onTrain(id: string): void
}

const platformBadges: Record<string, string> = {
  twitter: 'bg-sky-500/15 text-sky-300 border border-sky-500/30',
  reddit: 'bg-orange-500/10 text-orange-300 border border-orange-500/30',
}

export function BotCard({ bot, onKickoff, onTrain }: Props) {
  const CampaignBadge = () => (
    <div className="flex flex-wrap gap-2 mt-4">
      {bot.campaigns.length === 0 ? (
        <span className="text-xs text-slate-500">Not assigned to a campaign yet</span>
      ) : (
        bot.campaigns.slice(0, 3).map((campaign) => (
          <span
            key={campaign.id}
            className="px-2 py-1 text-xs rounded-full bg-slate-900 border border-slate-800 text-slate-400"
          >
            {campaign.name}
          </span>
        ))
      )}
    </div>
  )

  return (
    <article className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 shadow-lg shadow-black/20 flex flex-col gap-4">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-2xl bg-slate-800 flex items-center justify-center text-lg">
              {bot.name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <h3 className="font-semibold text-lg text-white">{bot.name}</h3>
              <p className="text-sm text-slate-400">{bot.description}</p>
            </div>
          </div>
          <CampaignBadge />
        </div>
        <span
          className={`text-xs px-3 py-1 rounded-full capitalize ${
            platformBadges[bot.platform] ?? 'bg-slate-800 text-slate-400'
          }`}
        >
          {bot.platform}
        </span>
      </div>
        <div className="flex items-center justify-between pt-2">
          <div className="text-xs text-slate-500">
            Updated {new Date(bot.updated_at).toLocaleDateString()}
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              className="flex items-center gap-2 text-sm px-4 py-2 rounded-xl border border-slate-700 text-slate-200 hover:bg-slate-800"
              onClick={() => onTrain(bot.id)}
            >
              <Rocket className="h-4 w-4 rotate-45" />
              Train
            </button>
            <button
              type="button"
              onClick={() => onKickoff(bot.id)}
              className="flex items-center gap-2 text-sm px-4 py-2 rounded-xl bg-indigo-500 text-white hover:bg-indigo-400"
            >
              <Workflow className="h-4 w-4" />
              Kickoff
            </button>
          </div>
        </div>
    </article>
  )
}
