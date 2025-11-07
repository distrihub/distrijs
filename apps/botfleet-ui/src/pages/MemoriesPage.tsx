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
    <section className="p-10 space-y-8">
      <header className="flex items-center justify-between gap-6">
        <div>
          <p className="text-sm uppercase tracking-[0.35em] text-slate-600">Workspace</p>
          <h1 className="text-4xl font-semibold text-white mt-1">Memories</h1>
          <p className="text-slate-400 mt-2">Pin long-lived insights per bot.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setShowComposer(true)}
            className="px-5 h-11 rounded-xl bg-indigo-500 text-white text-sm font-semibold"
          >
            Capture Insight
          </button>
          <select
            className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-white"
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
        <div className="bg-slate-900/70 border border-slate-800 rounded-3xl p-8 space-y-6 shadow-2xl shadow-black/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.35em] text-slate-500">New Memory</p>
              <h2 className="text-2xl font-semibold text-white">Capture Insight</h2>
            </div>
            <button
              type="button"
              className="text-slate-400 hover:text-white"
              onClick={() => setShowComposer(false)}
            >
              Close
            </button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="text-sm text-slate-400 space-y-2 block">
              Attach to bot
              <select
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-white"
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
            <label className="text-sm text-slate-400 space-y-2 block">
              Title
              <input
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-white"
                value={form.title}
                onChange={(event) => setForm({ ...form, title: event.target.value })}
                required
              />
            </label>
            <label className="text-sm text-slate-400 space-y-2 block">
              Markdown note
              <textarea
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-white min-h-[180px]"
                value={form.content}
                onChange={(event) => setForm({ ...form, content: event.target.value })}
                required
              />
            </label>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                className="px-5 h-11 rounded-xl border border-slate-800 text-slate-300"
                onClick={() => {
                  setForm(emptyForm)
                  setShowComposer(false)
                }}
              >
                Cancel
              </button>
              <button type="submit" className="px-6 h-11 rounded-xl bg-indigo-500 text-white font-semibold">
                Save Memory
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="space-y-5">
        {loading ? (
          <div className="text-slate-500">Loading memories…</div>
        ) : (
          memories.map((memory) => (
            <article
              key={memory.id}
              className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5 space-y-3"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-slate-500">
                    {memory.bot_name ?? 'Global Memory'}
                  </p>
                  <h3 className="text-white font-semibold">{memory.title}</h3>
                </div>
                <button
                  type="button"
                  className="text-xs text-rose-300 hover:text-rose-200"
                  onClick={() => removeMemory(memory.id)}
                >
                  Remove
                </button>
              </div>
              <div className="text-slate-300 text-sm leading-relaxed">
                <ReactMarkdown>{memory.content}</ReactMarkdown>
              </div>
              <p className="text-xs text-slate-500">
                Logged {new Date(memory.created_at).toLocaleString()}
              </p>
            </article>
          ))
        )}
        {!loading && !memories.length && (
          <div className="text-center text-slate-500 py-12 border border-dashed border-slate-800 rounded-2xl">
            No memories yet.
          </div>
        )}
      </div>
    </section>
  )
}
