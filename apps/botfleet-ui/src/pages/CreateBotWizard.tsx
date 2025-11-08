import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, CheckCircle2 } from 'lucide-react'
import { BotFleetAPI } from '@/api/client'
import { Stepper } from '@/components/Stepper'
import type { Campaign, PlatformKind } from '@/types'
import { toast } from 'sonner'

const steps = ['Connect Account', 'Define Interests', 'Bot Behavior', 'Simulate & Train']

export type AuthType = 'oauth' | 'credentials';
export type Postingtype = 'proactive' | 'respond';
const defaultState = {
  name: '',
  description: 'Analyzes trends and engages with curated audiences.',
  account: {
    handle: '',
    password: '',
    platform: 'twitter' as PlatformKind,
    connectType: 'oauth' as AuthType,
  },
  interests: {
    tags: ['Technology', 'AI', 'Startups'],
    instructions: 'Prioritize thoughtful, insight-heavy replies that cite recent news.',
  },
  behavior: {
    frequency: 12,
    postingStyle: 'proactive' as Postingtype,
    followNewAccounts: true,
    sendDMs: false,
  },
  campaignIds: [] as string[],
}

type WizardState = typeof defaultState

const fieldLabelClass = 'text-sm text-slate-600 dark:text-slate-400 space-y-2'
const controlClass =
  'w-full bg-white border border-slate-300 rounded-2xl px-4 py-3 text-slate-900 transition-colors dark:bg-slate-950 dark:border-slate-800 dark:text-white'

export function CreateBotWizard() {
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [state, setState] = useState<WizardState>(defaultState)
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [tagInput, setTagInput] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    BotFleetAPI.getCampaigns()
      .then(setCampaigns)
      .catch((err) => console.error(err))
  }, [])

  const next = () => setStep((value) => Math.min(value + 1, steps.length - 1))
  const prev = () => setStep((value) => Math.max(value - 1, 0))

  const addTag = () => {
    if (!tagInput.trim()) return
    setState((prev) => ({
      ...prev,
      interests: {
        ...prev.interests,
        tags: Array.from(new Set([...prev.interests.tags, tagInput.trim()])),
      },
    }))
    setTagInput('')
  }

  const removeTag = (tag: string) => {
    setState((prev) => ({
      ...prev,
      interests: {
        ...prev.interests,
        tags: prev.interests.tags.filter((item) => item !== tag),
      },
    }))
  }

  const toggleCampaign = (id: string) => {
    setState((prev) => ({
      ...prev,
      campaignIds: prev.campaignIds.includes(id)
        ? prev.campaignIds.filter((campaignId) => campaignId !== id)
        : [...prev.campaignIds, id],
    }))
  }

  const handleCreate = async () => {
    setSaving(true)
    try {
      await BotFleetAPI.createBot({
        name: state.name || `${state.account.platform} scout`,
        description: state.description,
        platform: state.account.platform,
        avatar_url: undefined,
        config: {
          account: state.account,
          interests: state.interests,
          behavior: state.behavior,
        },
        metadata: {
          instructions: state.interests.instructions,
          creator: 'botfleet-ui',
        },
        campaign_ids: state.campaignIds,
      })
      toast.success('Bot created successfully')
      navigate('/bots')
    } catch (err) {
      toast.error('Unable to create bot', {
        description: err instanceof Error ? err.message : 'Unknown error',
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="p-10 space-y-8 text-slate-900 dark:text-slate-100 transition-colors">
      <div className="flex items-center gap-4 text-slate-500 dark:text-slate-400">
        <button
          type="button"
          className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors"
          onClick={prev}
          disabled={step === 0}
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
        <span className="text-sm uppercase tracking-[0.35em]">Create a New Bot</span>
      </div>

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-semibold text-slate-900 dark:text-white">Create a New Bot</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2">
            Follow the steps to configure and train your new social automation.
          </p>
        </div>
        <Stepper steps={steps} activeIndex={step} />
      </div>

      <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm shadow-slate-200/70 dark:bg-slate-900/40 dark:border-slate-800 dark:shadow-black/20 transition-colors">
        {step === 0 && (
          <div className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <label className={fieldLabelClass}>
                Bot Name
                <input
                  className={controlClass}
                  placeholder="TrendWatcher"
                  value={state.name}
                  onChange={(event) => setState((prev) => ({ ...prev, name: event.target.value }))}
                />
              </label>
              <label className={fieldLabelClass}>
                Platform
                <select
                  className={`${controlClass} capitalize`}
                  value={state.account.platform}
                  onChange={(event) =>
                    setState((prev) => ({
                      ...prev,
                      account: { ...prev.account, platform: event.target.value as PlatformKind },
                    }))
                  }
                >
                  <option value="twitter">Twitter / X</option>
                  <option value="reddit">Reddit</option>
                  <option value="linkedin">LinkedIn</option>
                </select>
              </label>
            </div>
            <label className={fieldLabelClass}>
              Description
              <textarea
                className={`${controlClass} min-h-[120px]`}
                value={state.description}
                onChange={(event) =>
                  setState((prev) => ({ ...prev, description: event.target.value }))
                }
              />
            </label>
            <div className="grid md:grid-cols-3 gap-6">
              <label className={fieldLabelClass}>
                Username / Handle
                <input
                  className={controlClass}
                  placeholder="@trendwatcher"
                  value={state.account.handle}
                  onChange={(event) =>
                    setState((prev) => ({
                      ...prev,
                      account: { ...prev.account, handle: event.target.value },
                    }))
                  }
                />
              </label>
              <label className={fieldLabelClass}>
                Password
                <input
                  type="password"
                  className={controlClass}
                  value={state.account.password}
                  onChange={(event) =>
                    setState((prev) => ({
                      ...prev,
                      account: { ...prev.account, password: event.target.value },
                    }))
                  }
                />
              </label>
              <label className={fieldLabelClass}>
                Connection Method
                <select
                  className={controlClass}
                  value={state.account.connectType}
                  onChange={(event) =>
                    setState((prev) => ({
                      ...prev,
                      account: { ...prev.account, connectType: event.target.value as 'oauth' | 'credentials' },
                    }))
                  }
                >
                  <option value="oauth">OAuth</option>
                  <option value="credentials">Direct credentials</option>
                </select>
              </label>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-6">
            <div>
              <p className="text-slate-600 dark:text-slate-400 text-sm mb-3">Interest tags</p>
              <div className="flex flex-wrap gap-3 items-center bg-white border border-slate-300 rounded-2xl px-4 py-3 dark:bg-slate-950 dark:border-slate-800 transition-colors">
                {state.interests.tags.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    className="px-3 py-1 rounded-full border text-sm bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-500/15 dark:text-indigo-200 dark:border-indigo-400"
                    onClick={() => removeTag(tag)}
                  >
                    {tag} ×
                  </button>
                ))}
                <input
                  className="flex-1 bg-transparent border-0 focus:outline-none text-slate-900 dark:text-white"
                  placeholder="Add or create a tag…"
                  value={tagInput}
                  onChange={(event) => setTagInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault()
                      addTag()
                    }
                  }}
                />
              </div>
            </div>
            <label className={fieldLabelClass}>
              Advanced instructions (optional)
              <textarea
                className={`${controlClass} min-h-[140px]`}
                value={state.interests.instructions}
                onChange={(event) =>
                  setState((prev) => ({
                    ...prev,
                    interests: { ...prev.interests, instructions: event.target.value },
                  }))
                }
              />
            </label>
            <button
              type="button"
              onClick={addTag}
              className="px-4 py-2 text-sm rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 transition-colors dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-900"
            >
              Add Tag
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">Posting frequency</p>
              <input
                type="range"
                min={1}
                max={24}
                value={state.behavior.frequency}
                onChange={(event) =>
                  setState((prev) => ({
                    ...prev,
                    behavior: { ...prev.behavior, frequency: Number(event.target.value) },
                  }))
                }
                className="w-full"
              />
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                {state.behavior.frequency} posts/day
              </p>
            </div>
            <div className="flex gap-4">
              {['proactive', 'respond'].map((style) => (
                <button
                  key={style}
                  type="button"
                  className={`flex-1 border rounded-2xl px-4 py-3 text-left transition-colors ${
                    state.behavior.postingStyle === style
                      ? 'border-indigo-300 bg-indigo-100 text-slate-900 dark:border-indigo-400 dark:bg-indigo-500/10 dark:text-white'
                      : 'border-slate-300 bg-white text-slate-700 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400'
                    }`}
                  onClick={() =>
                    setState((prev) => ({
                      ...prev,
                      behavior: { ...prev.behavior, postingStyle: style as Postingtype },
                    }))
                  }
                >
                  <p className="text-slate-900 dark:text-white font-semibold capitalize">{style}</p>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                    {style === 'proactive'
                      ? 'Actively publishes and kicks off conversations.'
                      : 'Stays in listening mode and piggybacks on trending threads.'}
                  </p>
                </button>
              ))}
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <ToggleCard
                label="Should follow new accounts"
                value={state.behavior.followNewAccounts}
                onChange={(value) =>
                  setState((prev) => ({
                    ...prev,
                    behavior: { ...prev.behavior, followNewAccounts: value },
                  }))
                }
              />
              <ToggleCard
                label="Should send DMs"
                value={state.behavior.sendDMs}
                onChange={(value) =>
                  setState((prev) => ({
                    ...prev,
                    behavior: { ...prev.behavior, sendDMs: value },
                  }))
                }
              />
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <div className="flex flex-wrap gap-4">
              {campaigns.map((campaign) => (
                <button
                  key={campaign.id}
                  type="button"
                  onClick={() => toggleCampaign(campaign.id)}
                  className={`px-4 py-3 rounded-2xl border text-left transition-colors ${
                    state.campaignIds.includes(campaign.id)
                      ? 'border-indigo-300 bg-indigo-100 text-slate-900 dark:border-indigo-400 dark:bg-indigo-500/10 dark:text-white'
                      : 'border-slate-300 bg-white text-slate-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400'
                    }`}
                >
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">{campaign.name}</p>
                  <p className="text-xs text-slate-600 dark:text-slate-400">{campaign.description}</p>
                </button>
              ))}
              {!campaigns.length && (
                <p className="text-slate-600 dark:text-slate-500 text-sm">No campaigns yet — create one to link this bot.</p>
              )}
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-6 text-sm text-slate-600 space-y-2 shadow-sm shadow-slate-200/70 dark:bg-slate-950 dark:border-slate-800 dark:text-slate-400 dark:shadow-black/20 transition-colors">
              <p className="text-slate-900 dark:text-white font-semibold flex items-center gap-2">
                <CheckCircle2 className="text-emerald-500 dark:text-emerald-400" />
                Launch checklist
              </p>
              <ul className="space-y-2 list-disc list-inside">
                <li>Account connection {state.account.handle ? 'ready' : 'pending'}.</li>
                <li>{state.interests.tags.length} topics configured.</li>
                <li>{state.behavior.frequency} posts per day with {state.behavior.postingStyle} tone.</li>
              </ul>
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-between">
        <button
          type="button"
          onClick={prev}
          disabled={step === 0}
          className="px-5 py-3 rounded-2xl border border-slate-300 text-slate-700 disabled:opacity-40 hover:bg-slate-100 transition-colors dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-900"
        >
          Back
        </button>
        {step < steps.length - 1 ? (
          <button
            type="button"
            onClick={next}
            className="px-6 py-3 rounded-2xl bg-indigo-600 text-white hover:bg-indigo-500 transition-colors"
          >
            Next Step
          </button>
        ) : (
          <button
            type="button"
            onClick={handleCreate}
            disabled={saving}
            className="px-6 py-3 rounded-2xl bg-indigo-600 text-white disabled:opacity-50 hover:bg-indigo-500 transition-colors"
          >
            {saving ? 'Creating…' : 'Create Bot'}
          </button>
        )}
      </div>
    </section>
  )
}

function ToggleCard({
  label,
  value,
  onChange,
}: {
  label: string
  value: boolean
  onChange(value: boolean): void
}) {
  return (
    <div className="border border-slate-300 rounded-2xl px-4 py-3 flex items-center justify-between bg-white dark:border-slate-800 dark:bg-slate-950 transition-colors">
      <div>
        <p className="text-slate-900 dark:text-white font-semibold text-sm">{label}</p>
        <p className="text-xs text-slate-600 dark:text-slate-500">Toggle autonomous actions</p>
      </div>
      <button
        type="button"
        onClick={() => onChange(!value)}
        className={`w-14 h-7 rounded-full transition ${
          value ? 'bg-indigo-500' : 'bg-slate-300 dark:bg-slate-800'
          }`}
      >
        <span
          className={`block h-6 w-6 bg-white rounded-full mt-0.5 transition ${
            value ? 'ml-7 -translate-x-full' : 'ml-1'
            }`}
        />
      </button>
    </div>
  )
}
