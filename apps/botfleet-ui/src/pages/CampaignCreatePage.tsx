import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BotFleetAPI } from '@/api/client'
import { toast } from 'sonner'
import ReactMarkdown from 'react-markdown'
import { Stepper } from '@/components/Stepper'

const steps = ['Define Outcome', 'Approve Summary']

export function CampaignCreatePage() {
  const [step, setStep] = useState(0)
  const [name, setName] = useState('')
  const [outcome, setOutcome] = useState('')
  const [summary, setSummary] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const navigate = useNavigate()

  const next = () => {
    if (!name.trim() || !outcome.trim()) {
      toast.error('Name and outcome are required')
      return
    }
    const generated = `## ${name}\n\n- **Goal**: ${outcome}\n- **Primary Channels**: Twitter, Reddit, Email\n- **Success Signals**: +20% qualified leads, +30% replies\n- **Risks**: Platform policy changes, content saturation.`
    setSummary(summary.trim().length ? summary : generated)
    setStep(1)
  }

  const save = async () => {
    if (!summary.trim()) {
      toast.error('Summary cannot be empty')
      return
    }
    if (startDate && endDate && startDate > endDate) {
      toast.error('Start date must be before end date')
      return
    }
    try {
      await BotFleetAPI.createCampaign({
        name,
        description: outcome,
        status: 'planned',
        targeting: { expected_outcome: outcome },
        schedule: {
          summary_markdown: summary,
          start_date: startDate || undefined,
          end_date: endDate || undefined,
        },
      })
      toast.success('Campaign created')
      navigate('/campaigns')
    } catch (error) {
      toast.error('Unable to save campaign', {
        description: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }

  return (
    <section className="p-10 space-y-8">
      <button
        type="button"
        className="text-sm text-slate-400 hover:text-white"
        onClick={() => navigate('/campaigns')}
      >
        ← Back to Campaigns
      </button>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.35em] text-slate-600">New Campaign</p>
          <h1 className="text-4xl font-semibold text-white mt-1">Design an Experiment</h1>
          <p className="text-slate-400">Capture intent, review the generated plan, then launch.</p>
        </div>
        <Stepper steps={steps} activeIndex={step} />
      </div>

      {step === 0 && (
        <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-8 space-y-6">
          <label className="text-sm text-slate-400 space-y-2 block">
            Campaign Name
            <input
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-white"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </label>
          <label className="text-sm text-slate-400 space-y-2 block">
            Expected Outcome
            <textarea
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-white min-h-[160px]"
              placeholder="Describe what winning looks like..."
              value={outcome}
              onChange={(event) => setOutcome(event.target.value)}
            />
          </label>
          <div className="flex justify-end">
            <button
              type="button"
              className="px-6 py-3 rounded-2xl bg-indigo-500 text-white"
              onClick={next}
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {step === 1 && (
        <div className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <label className="text-sm text-slate-400 space-y-2">
              Summary Markdown
              <textarea
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-white min-h-[320px]"
                value={summary}
                onChange={(event) => setSummary(event.target.value)}
              />
            </label>
            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-4 overflow-y-auto">
              <ReactMarkdown className="text-sm leading-relaxed text-slate-200">{summary}</ReactMarkdown>
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <label className="text-sm text-slate-400 space-y-2">
              Start Date
              <input
                type="date"
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-white"
                value={startDate}
                onChange={(event) => setStartDate(event.target.value)}
              />
            </label>
            <label className="text-sm text-slate-400 space-y-2">
              End Date
              <input
                type="date"
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-white"
                value={endDate}
                onChange={(event) => setEndDate(event.target.value)}
              />
            </label>
          </div>
          <div className="flex justify-between">
            <button
              type="button"
              className="px-6 py-3 rounded-2xl border border-slate-800 text-slate-300"
              onClick={() => setStep(0)}
            >
              Back
            </button>
            <button
              type="button"
              className="px-6 py-3 rounded-2xl bg-emerald-500 text-white"
              onClick={save}
            >
              Approve & Save
            </button>
          </div>
        </div>
      )}
    </section>
  )
}
