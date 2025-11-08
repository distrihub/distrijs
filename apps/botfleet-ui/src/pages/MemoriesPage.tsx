import { useCallback, useEffect, useState } from 'react'
import { BotFleetAPI } from '@/api/client'
import type { BotRecord, MemoryEntry } from '@/types'
import { toast } from 'sonner'
import ReactMarkdown from 'react-markdown'

const emptyForm = {
  bot_id: 'all',
  title: '',
  content: '',
}

export function MemoriesPage() {
  const [memories, setMemories] = useState<MemoryEntry[]>([])
  const [bots, setBots] = useState<BotRecord[]>([])
  const [filter, setFilter] = useState('all')
  const [form, setForm] = useState(emptyForm)
  const [loading, setLoading] = useState(true)
  const [showComposer, setShowComposer] = useState(false)

  const loadBots = async () => {
    try {
      const response = await BotFleetAPI.getBots()
      setBots(response)
    } catch (error) {
      console.error(error)
    }
  }

  const loadMemories = useCallback(async () => {
    const botId = filter
    try {
      setLoading(true)
      const response = await BotFleetAPI.getMemories({ bot_id: botId === 'all' ? undefined : botId })
      setMemories(response)
    } catch (error) {
      toast.error('Unable to load memories', {
        description: error instanceof Error ? error.message : 'Unknown error',
      })
    } finally {
      setLoading(false)
    }
  }, [filter])

  useEffect(() => {
    loadBots()
  }, [])

  useEffect(() => {
    loadMemories()
  }, [loadMemories])

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    try {
      await BotFleetAPI.createMemory({
        bot_id: form.bot_id === 'all' ? undefined : form.bot_id,
        title: form.title,
        content: form.content,
      })
      toast.success('Memory saved')
      setForm(emptyForm)
      setShowComposer(false)
      loadMemories()
    } catch (error) {
      toast.error('Unable to save memory', {
        description: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }

  const removeMemory = async (id: number) => {
    try {
      await BotFleetAPI.deleteMemory(id)
      loadMemories()
    } catch (error) {
      toast.error('Unable to delete memory', {
        description: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }

  return (
    <section className="p-10 space-y-8 text-slate-900 dark:text-slate-100 transition-colors">
      <header className="flex items-center justify-between gap-6">
        <div>
          <p className="text-sm uppercase tracking-[0.35em] text-slate-500">Workspace</p>
          <h1 className="text-4xl font-semibold text-slate-900 dark:text-white mt-1">Memories</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2">Pin long-lived insights per bot.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setShowComposer(true)}
            className="px-5 h-11 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-500 transition-colors"
          >
            Capture Insight
          </button>
          <select
            className="bg-white border border-slate-300 rounded-xl px-4 py-2 text-slate-900 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100 transition-colors"
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
          >
            <option value="all">All bots</option>
            {bots.map((bot) => (
              <option key={bot.id} value={bot.id}>
                {bot.name}
              </option>
            ))}
          </select>
        </div>
      </header>

      {showComposer && (
        <div className="bg-white border border-slate-200 rounded-3xl p-8 space-y-6 shadow-xl shadow-slate-200/70 dark:bg-slate-900/70 dark:border-slate-800 dark:shadow-black/50 transition-colors">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.35em] text-slate-500">New Memory</p>
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">Capture Insight</h2>
            </div>
            <button
              type="button"
              className="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors"
              onClick={() => setShowComposer(false)}
            >
              Close
            </button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="text-sm text-slate-600 dark:text-slate-400 space-y-2 block">
              Attach to bot
              <select
                className="w-full bg-white border border-slate-300 rounded-2xl px-4 py-3 text-slate-900 dark:bg-slate-950 dark:border-slate-800 dark:text-white transition-colors"
                value={form.bot_id}
                onChange={(event) => setForm({ ...form, bot_id: event.target.value })}
              >
                <option value="all">None (global)</option>
                {bots.map((bot) => (
                  <option key={bot.id} value={bot.id}>
                    {bot.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm text-slate-600 dark:text-slate-400 space-y-2 block">
              Title
              <input
                className="w-full bg-white border border-slate-300 rounded-2xl px-4 py-3 text-slate-900 dark:bg-slate-950 dark:border-slate-800 dark:text-white transition-colors"
                value={form.title}
                onChange={(event) => setForm({ ...form, title: event.target.value })}
                required
              />
            </label>
            <label className="text-sm text-slate-600 dark:text-slate-400 space-y-2 block">
              Markdown note
              <textarea
                className="w-full bg-white border border-slate-300 rounded-2xl px-4 py-3 text-slate-900 min-h-[180px] dark:bg-slate-950 dark:border-slate-800 dark:text-white transition-colors"
                value={form.content}
                onChange={(event) => setForm({ ...form, content: event.target.value })}
                required
              />
            </label>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                className="px-5 h-11 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 transition-colors dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-900"
                onClick={() => {
                  setForm(emptyForm)
                  setShowComposer(false)
                }}
              >
                Cancel
              </button>
              <button type="submit" className="px-6 h-11 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-500 transition-colors">
                Save Memory
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="space-y-5">
        {loading ? (
          <div className="text-slate-500 dark:text-slate-400">Loading memories…</div>
        ) : (
          memories.map((memory) => (
            <article
              key={memory.id}
              className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3 shadow-sm shadow-slate-200/70 dark:bg-slate-900/50 dark:border-slate-800 dark:shadow-black/20 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-slate-500 dark:text-slate-400">
                    {memory.bot_name ?? 'Global Memory'}
                  </p>
                  <h3 className="text-slate-900 dark:text-white font-semibold">{memory.title}</h3>
                </div>
                <button
                  type="button"
                  className="text-xs text-rose-600 hover:text-rose-500 dark:text-rose-300 dark:hover:text-rose-200 transition-colors"
                  onClick={() => removeMemory(memory.id)}
                >
                  Remove
                </button>
              </div>
              <div className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed">
                <ReactMarkdown>{memory.content}</ReactMarkdown>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Logged {new Date(memory.created_at).toLocaleString()}
              </p>
            </article>
          ))
        )}
        {!loading && !memories.length && (
          <div className="text-center text-slate-600 py-12 border border-dashed border-slate-300 rounded-2xl dark:text-slate-500 dark:border-slate-800">
            No memories yet.
          </div>
        )}
      </div>
    </section>
  )
}
