import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { BotFleetAPI } from '@/api/client'
import type { BotRecord, FeedAction, MemoryEntry } from '@/types'
import { toast } from 'sonner'
import ReactMarkdown from 'react-markdown'
import { Check, X } from 'lucide-react'

export function BotTrainingPage() {
  const { botId } = useParams<{ botId: string }>()
  const navigate = useNavigate()
  const [bot, setBot] = useState<BotRecord | null>(null)
  const [feed, setFeed] = useState<FeedAction[]>([])
  const [memories, setMemories] = useState<MemoryEntry[]>([])
  const [note, setNote] = useState({ title: '', content: '' })

  const loadBot = useCallback(async () => {
    if (!botId) return
    const bots = await BotFleetAPI.getBots()
    const found = bots.find((entry) => entry.id === botId)
    if (!found) {
      toast.error('Bot not found')
      navigate('/bots')
      return
    }
    setBot(found)
  }, [botId, navigate])

  const loadFeed = useCallback(async () => {
    if (!botId) return
    try {
      const actions = await BotFleetAPI.getFeed({ bot_id: botId, status: 'pending' })
      setFeed(actions)
    } catch (error) {
      toast.error('Unable to load training feed', {
        description: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }, [botId])

  const loadMemories = useCallback(async () => {
    if (!botId) return
    try {
      const entries = await BotFleetAPI.getMemories({ bot_id: botId })
      setMemories(entries)
    } catch (error) {
      toast.error('Unable to load memories', {
        description: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }, [botId])

  useEffect(() => {
    loadBot()
  }, [loadBot])

  useEffect(() => {
    loadFeed()
    loadMemories()
  }, [loadFeed, loadMemories])

  const approve = async (id: string, status: 'approved' | 'rejected') => {
    try {
      await BotFleetAPI.decideFeedAction(id, { status })
      loadFeed()
    } catch (error) {
      toast.error('Unable to update action', {
        description: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }

  const logMemory = async () => {
    if (!botId) return
    if (!note.title.trim() || !note.content.trim()) {
      toast.error('Add a title and note first')
      return
    }
    try {
      await BotFleetAPI.createMemory({
        bot_id: botId,
        title: note.title,
        content: note.content,
      })
      toast.success('Memory captured')
      setNote({ title: '', content: '' })
      loadMemories()
    } catch (error) {
      toast.error('Unable to store memory', {
        description: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }

  if (!bot) {
    return (
      <section className="p-10 text-slate-400">
        Loading bot…
      </section>
    )
  }

  return (
    <section className="p-10 space-y-8">
      <header className="flex items-center justify-between">
        <div>
          <button
            type="button"
            className="text-sm text-slate-400 hover:text-white"
            onClick={() => navigate('/bots')}
          >
            ← Back to Bots
          </button>
          <h1 className="text-4xl font-semibold text-white mt-2">Train {bot.name}</h1>
          <p className="text-slate-400">Simulate behaviors and capture learnings.</p>
        </div>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2 space-y-5">
          {feed.map((action) => (
            <article key={action.id} className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500 uppercase tracking-[0.3em]">{action.action_type}</p>
                  <h3 className="text-white font-semibold">{action.summary}</h3>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    className="px-3 py-2 rounded-xl border border-slate-800 text-slate-300"
                    onClick={() => approve(action.id, 'rejected')}
                  >
                    <X className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    className="px-3 py-2 rounded-xl bg-emerald-500/10 text-emerald-300 border border-emerald-500/30"
                    onClick={() => approve(action.id, 'approved')}
                  >
                    <Check className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 text-slate-300 whitespace-pre-wrap text-sm">
                {typeof action.payload?.preview === 'string' ? action.payload.preview : action.summary}
              </div>
              <button
                type="button"
                className="text-xs text-slate-400 underline"
                onClick={() =>
                  setNote((prev) => ({
                    ...prev,
                    content: `${prev.content}\n\n- Noted from ${action.summary}: ${
                      typeof action.payload?.preview === 'string'
                        ? action.payload.preview
                        : action.summary
                    }`.trim(),
                    title: prev.title || action.summary.slice(0, 48),
                  }))
                }
              >
                Add to memory note
              </button>
            </article>
          ))}
          {!feed.length && (
            <div className="text-slate-500 border border-dashed border-slate-800 rounded-2xl p-8 text-center">
              No pending actions right now.
            </div>
          )}
        </div>

        <aside className="space-y-6">
          <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5 space-y-3">
            <h3 className="text-white font-semibold">Log Insight</h3>
            <input
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-sm"
              placeholder="Title"
              value={note.title}
              onChange={(event) => setNote({ ...note, title: event.target.value })}
            />
            <textarea
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-sm min-h-[160px]"
              placeholder="Markdown note"
              value={note.content}
              onChange={(event) => setNote({ ...note, content: event.target.value })}
            />
            <button
              type="button"
              className="w-full h-10 rounded-xl bg-indigo-500 text-white text-sm font-semibold"
              onClick={logMemory}
            >
              Save to Memories
            </button>
          </div>

          <div className="space-y-3">
            {memories.map((memory) => (
              <article key={memory.id} className="bg-slate-900/40 border border-slate-800 rounded-2xl p-4 space-y-2 text-sm">
                <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Memory</p>
                <h4 className="text-white font-semibold">{memory.title}</h4>
                <div className="text-slate-300">
                  <ReactMarkdown>{memory.content}</ReactMarkdown>
                </div>
              </article>
            ))}
            {!memories.length && (
              <div className="text-center text-slate-500 border border-dashed border-slate-800 rounded-2xl p-6 text-sm">
                No memories yet.
              </div>
            )}
          </div>
        </aside>
      </div>
    </section>
  )
}
