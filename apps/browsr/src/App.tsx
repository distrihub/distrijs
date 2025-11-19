import { useEffect, useMemo, useRef, useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { v4 as uuidv4 } from 'uuid'
import { Chat, ChatInput, type ChatInstance, useAgent } from '@distri/react'
import type { DistriPart } from '@distri/core'
import { StepCard } from './components/StepCard'
import type { ChatMessage, Step } from './types'
import { DraftStorage, type BotDraft } from './lib/draft-storage'

const THREAD_KEY = 'browsr.chatThreadId'

const extractText = (content: string | DistriPart[]): string => {
  if (typeof content === 'string') {
    return content
  }
  return content
    .map((part) => (part.part_type === 'text' ? String(part.data ?? '') : ''))
    .join('\n')
}

export default function App() {
  const initialDraft = useMemo(() => DraftStorage.load(), [])
  const [draft, setDraft] = useState<BotDraft>(initialDraft)
  const [selectedStepId, setSelectedStepId] = useState<string | null>(
    initialDraft.steps[0]?.id ?? null,
  )
  const [heroInput, setHeroInput] = useState('')
  const [runLog, setRunLog] = useState<string[]>([])
  const [isRunPanelCollapsed, setIsRunPanelCollapsed] = useState(false)
  const [pendingInitialMessage, setPendingInitialMessage] = useState<string | null>(null)
  const chatInstanceRef = useRef<ChatInstance | null>(null)

  const threadId = useMemo(() => {
    if (typeof window === 'undefined') {
      return uuidv4()
    }
    const stored = window.localStorage.getItem(THREAD_KEY)
    if (stored) {
      return stored
    }
    const id = uuidv4()
    window.localStorage.setItem(THREAD_KEY, id)
    return id
  }, [])

  const { agent: browsrAgent, loading: agentLoading } = useAgent({ agentIdOrDef: 'scripter' })

  useEffect(() => {
    if (typeof document === 'undefined') {
      return
    }
    const root = document.documentElement
    root.classList.add('dark')
    return () => {
      root.classList.remove('dark')
    }
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }
    DraftStorage.save(draft)
  }, [draft])

  useEffect(() => {
    if (!selectedStepId && draft.steps.length > 0) {
      setSelectedStepId(draft.steps[0].id)
    }
  }, [draft.steps, selectedStepId])

  const updateStep = (id: string, patch: Partial<Step>) => {
    setDraft((prev) => ({
      ...prev,
      steps: prev.steps.map((step) => (step.id === id ? { ...step, ...patch } : step)),
    }))
  }

  const addStep = () => {
    const id = uuidv4()

    setDraft((prev) => ({
      ...prev,
      steps: [
        ...prev.steps,
        {
          id,
          title: `New step ${prev.steps.length + 1}`,
          instruction: '',
        },
      ],
    }))
    setSelectedStepId(id)
  }

  const deleteStep = (id: string) => {
    setDraft((prev) => ({
      ...prev,
      steps: prev.steps.filter((step) => step.id !== id),
    }))

    if (selectedStepId === id) {
      setSelectedStepId(null)
    }
  }

  const moveStep = (id: string, direction: 'up' | 'down') => {
    setDraft((prev) => {
      const index = prev.steps.findIndex((step) => step.id === id)
      if (index === -1) {
        return prev
      }

      const delta = direction === 'up' ? -1 : 1
      const nextIndex = index + delta
      if (nextIndex < 0 || nextIndex >= prev.steps.length) {
        return prev
      }

      const steps = [...prev.steps]
      const temp = steps[index]
      steps[index] = steps[nextIndex]
      steps[nextIndex] = temp

      return {
        ...prev,
        steps,
      }
    })
  }

  const appendBrainstormMessage = (text: string, context?: string) => {
    const timestamp = new Date().toISOString()
    const userMessage: ChatMessage = {
      id: uuidv4(),
      role: 'user',
      text,
      timestamp,
      context,
    }
    const agentMessage: ChatMessage = {
      id: uuidv4(),
      role: 'agent',
      text: `Pending AgentChat integration… will iterate on "${context ?? 'full bot blueprint'}" soon.`,
      timestamp: new Date().toISOString(),
      context,
    }

    setDraft((prev) => ({
      ...prev,
      brainstorm: [userMessage, agentMessage, ...prev.brainstorm],
    }))
  }

  const reopenIntro = () => {
    setDraft((prev) => ({
      ...prev,
      introComplete: false,
    }))
    setSelectedStepId(null)
    setHeroInput(draft.goal)
  }

  const runTest = () => {
    const payload = {
      goal: draft.goal,
      steps: draft.steps,
      brainstorm: draft.brainstorm,
      runtime: 'distri-browser',
    }
    const timestamp = new Date().toISOString()
    setRunLog((prev) => [
      `[${timestamp}] Dispatching plan to distri-browser…`,
      JSON.stringify(payload, null, 2),
      ...prev,
    ])
  }
  const handleHeroSend = (content: string | DistriPart[]) => {
    const text = extractText(content).trim()
    if (!text) {
      return
    }
    appendBrainstormMessage(text, 'Initial brief')
    setDraft((prev) => ({
      ...prev,
      goal: text,
      introComplete: true,
    }))
    setHeroInput('')
    setPendingInitialMessage(text)
  }

  const handleChatReady = (instance: ChatInstance) => {
    chatInstanceRef.current = instance
  }

  useEffect(() => {
    if (!pendingInitialMessage) {
      return
    }
    if (!draft.introComplete) {
      return
    }
    if (!chatInstanceRef.current) {
      return
    }
    void chatInstanceRef.current.sendMessage(pendingInitialMessage)
    setPendingInitialMessage(null)
  }, [pendingInitialMessage, draft.introComplete])

  if (!draft.introComplete) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-8 py-16 text-foreground">
        <div className="w-full max-w-3xl space-y-6 text-center">
          <div>
            <p className="text-sm uppercase tracking-[0.35em] text-muted-foreground">Browsr</p>
            <h1 className="mt-2 text-3xl font-semibold">Describe the browser bot you need</h1>
            <p className="text-muted-foreground">
              Start with natural language. We will translate it into structured steps you can iterate on.
            </p>
          </div>
          <ChatInput
            value={heroInput}
            onChange={setHeroInput}
            onSend={handleHeroSend}
            placeholder="Example: Visit competitor sites weekly and send a Slack summary with screenshots."
            variant="hero"
            className="bg-card/70"
          />
        </div>
      </div>
    )
  }

  const testRunDisabled = draft.steps.length === 0

  const runPanelVisible = runLog.length > 0

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b bg-card/80 px-8 py-4 backdrop-blur">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Browsr</p>
            <h1 className="text-2xl font-semibold">Browser bot studio</h1>
          </div>
          <button
            type="button"
            onClick={runTest}
            disabled={testRunDisabled}
            className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow disabled:cursor-not-allowed disabled:opacity-40"
          >
            Test Run
          </button>
        </div>
      </header>

      <main className="grid gap-6 px-8 py-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between rounded-lg border bg-card/70 px-4 py-2 text-xs text-muted-foreground">
            <span>{draft.goal ? draft.goal.slice(0, 80) : 'No description captured yet'}</span>
            <button
              type="button"
              onClick={reopenIntro}
              className="inline-flex items-center gap-1 text-primary"
            >
              Edit brief
              <ChevronDown size={14} className="-rotate-90" />
            </button>
          </div>

          <section className="flex-1 rounded-lg border bg-card p-6">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Steps</p>
                <h2 className="text-xl font-semibold">Outline the browser run</h2>
                <p className="text-sm text-muted-foreground">
                  Add, edit, delete, or reorder actions. These convert into distri-browser commands.
                </p>
              </div>
              <button
                type="button"
                onClick={addStep}
                className="rounded-md border px-3 py-2 text-sm font-medium"
              >
                Add Step
              </button>
            </div>
            <div className="max-h-[65vh] space-y-4 overflow-y-auto pr-2">
              {draft.steps.length === 0 && (
                <div className="rounded-md border border-dashed p-6 text-sm text-muted-foreground">
                  No steps yet. Start by describing navigation or scraping actions.
                </div>
              )}
              {draft.steps.map((step, index) => (
                <StepCard
                  key={step.id}
                  step={step}
                  index={index}
                  isActive={selectedStepId === step.id}
                  onFocus={setSelectedStepId}
                  onChange={updateStep}
                  onDelete={deleteStep}
                  onMove={moveStep}
                />
              ))}
            </div>
          </section>

          {runPanelVisible && (
            <section className="rounded-lg border bg-card p-4">
              <div className="mb-2 flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Execution</p>
                  <h2 className="text-lg font-semibold">Run history</h2>
                </div>
                <button
                  type="button"
                  onClick={() => setIsRunPanelCollapsed((prev) => !prev)}
                  className="flex items-center gap-1 text-xs text-muted-foreground"
                >
                  {isRunPanelCollapsed ? 'Expand' : 'Collapse'}
                  {isRunPanelCollapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
                </button>
              </div>
              {!isRunPanelCollapsed && (
                <div className="h-56 overflow-y-auto rounded-md border bg-background/60 p-4 font-mono text-xs">
                  {runLog.map((line, index) => (
                    <pre key={`${line}-${index}`} className="whitespace-pre-wrap">{line}</pre>
                  ))}
                </div>
              )}
            </section>
          )}
        </div>

        <aside className="rounded-lg border bg-card p-4">
          <div className="mb-4 rounded-lg border border-dashed bg-card/40 p-3 text-sm text-muted-foreground">
            Browser preview placeholder — embed distri-browser viewport here.
          </div>
          <div className="h-[60vh] overflow-hidden rounded-lg border bg-card">
            {browsrAgent ? (
              <Chat
                agent={browsrAgent}
                threadId={threadId}
                theme="dark"
                onChatInstanceReady={handleChatReady}
              />
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                {agentLoading ? 'Loading chat…' : 'Agent unavailable'}
              </div>
            )}
          </div>
        </aside>
      </main>
    </div>
  )
}
