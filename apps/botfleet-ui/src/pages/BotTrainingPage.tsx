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
      <section className="p-10 text-slate-500 dark:text-slate-400">
        Loading bot…
      </section>
    )
  }

  return (
    <section className="p-10 space-y-8 text-slate-900 dark:text-slate-100 transition-colors">
      <header className="flex items-center justify-between">
        <div>
          <button
            type="button"
            className="text-sm text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors"
            onClick={() => navigate('/bots')}
          >
            ← Back to Bots
          </button>
          <h1 className="text-4xl font-semibold text-slate-900 dark:text-white mt-2">Train {bot.name}</h1>
          <p className="text-slate-600 dark:text-slate-400">Simulate behaviors and capture learnings.</p>
        </div>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2 space-y-5">
          {feed.map((action) => (
            <article
              key={action.id}
              className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3 shadow-sm shadow-slate-200/70 dark:bg-slate-900/40 dark:border-slate-800 dark:shadow-black/20 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500 uppercase tracking-[0.3em] dark:text-slate-400">
                    {action.action_type}
                  </p>
                  <h3 className="text-slate-900 dark:text-white font-semibold">{action.summary}</h3>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    className="px-3 py-2 rounded-xl border border-slate-300 text-slate-600 hover:bg-slate-100 transition-colors dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-900"
                    onClick={() => approve(action.id, 'rejected')}
                  >
                    <X className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    className="px-3 py-2 rounded-xl bg-emerald-100 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/30 transition-colors"
                    onClick={() => approve(action.id, 'approved')}
                  >
                    <Check className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-slate-700 whitespace-pre-wrap text-sm dark:bg-slate-950 dark:border-slate-800 dark:text-slate-300">
                {typeof action.payload?.preview === 'string' ? action.payload.preview : action.summary}
              </div>
              <button
                type="button"
                className="text-xs text-slate-600 underline dark:text-slate-400"
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
            <div className="text-slate-600 border border-dashed border-slate-300 rounded-2xl p-8 text-center dark:text-slate-500 dark:border-slate-800">
              No pending actions right now.
            </div>
          )}
        </div>

        <aside className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3 shadow-sm shadow-slate-200/70 dark:bg-slate-900/40 dark:border-slate-800 dark:shadow-black/20 transition-colors">
            <h3 className="text-slate-900 dark:text-white font-semibold">Log Insight</h3>
            <input
              className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 text-sm dark:bg-slate-950 dark:border-slate-800 dark:text-white transition-colors"
              placeholder="Title"
              value={note.title}
              onChange={(event) => setNote({ ...note, title: event.target.value })}
            />
            <textarea
              className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 text-sm min-h-[160px] dark:bg-slate-950 dark:border-slate-800 dark:text-white transition-colors"
              placeholder="Markdown note"
              value={note.content}
              onChange={(event) => setNote({ ...note, content: event.target.value })}
            />
            <button
              type="button"
              className="w-full h-10 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-500 transition-colors"
              onClick={logMemory}
            >
              Save to Memories
            </button>
          </div>

          <div className="space-y-3">
            {memories.map((memory) => (
              <article
                key={memory.id}
                className="bg-white border border-slate-200 rounded-2xl p-4 space-y-2 text-sm shadow-sm shadow-slate-200/70 dark:bg-slate-900/40 dark:border-slate-800 dark:shadow-black/20 transition-colors"
              >
                <p className="text-xs uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">Memory</p>
                <h4 className="text-slate-900 dark:text-white font-semibold">{memory.title}</h4>
                <div className="text-slate-700 dark:text-slate-300">
                  <ReactMarkdown>{memory.content}</ReactMarkdown>
                </div>
              </article>
            ))}
            {!memories.length && (
              <div className="text-center text-slate-600 border border-dashed border-slate-300 rounded-2xl p-6 text-sm dark:text-slate-500 dark:border-slate-800">
                No memories yet.
              </div>
            )}
          </div>
        </aside>
      </div>
    </section>
  )
}
