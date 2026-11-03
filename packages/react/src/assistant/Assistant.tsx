import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { SquarePen, X } from 'lucide-react'
import type { Agent, DistriMessage } from '@distri/core'
import { Chat, type ChatInstance, type ChatProps } from '../components/Chat'
import type { ChatEmptyStateController } from '../components/Chat'
import type { DistriAnyTool, ToolRendererMap } from '../types'
import { AssistantRuntimeContext } from './context'
import {
  experienceSections,
  resolveExperience,
  type ExperienceConfig,
  type ResolvedExperience,
} from './experience'
import { UserTurn, ToolSteps } from './ToolSteps'
import { Launcher } from './Launcher'

export interface AssistantProps {
  /** Which agent to talk to (fetched through the nearest DistriProvider). */
  agentId?: string
  /** Or pass a loaded agent. */
  agent?: Agent | null
  /** Tools your app provides to the agent. */
  externalTools?: DistriAnyTool[]
  /** How it looks and talks. Every field is optional. */
  experience?: ExperienceConfig
  /** Continue an existing conversation. Omit to start a fresh one. */
  threadId?: string
  /** Launcher layout: start open. */
  defaultOpen?: boolean
  /** Launcher layout: controlled open state. */
  open?: boolean
  onOpenChange?: (open: boolean) => void
  /** Extra metadata merged under the experience's prompt section. */
  getMetadata?: () => Promise<Record<string, unknown>>
  toolRenderers?: ToolRendererMap
  onError?: (error: Error) => void
  onMessage?: ChatProps['onMessage']
  className?: string
  style?: React.CSSProperties
}

type Metadata = Record<string, unknown> & { dynamic_sections?: Array<{ key: string; content: string }> }

/**
 * Adds the experience's free-text guidance as a dynamic prompt section next to whatever the host already sends.
 * The agent's own instructions are never touched.
 */
export async function buildAssistantMetadata(
  exp: Pick<ResolvedExperience, 'instructions'>,
  base?: () => Promise<Record<string, unknown>>,
): Promise<Metadata> {
  const given = ((await base?.()) ?? {}) as Metadata
  const own = experienceSections(exp)
  if (own.length === 0) return given
  const kept = (given.dynamic_sections ?? []).filter((s) => !own.some((o) => o.key === s.key))
  return { ...given, dynamic_sections: [...kept, ...own] }
}

/** Black or white text for a hex accent; undefined for other colour syntaxes (the theme's default applies). */
export function readableOn(color: string): string | undefined {
  const m = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(color.trim())
  if (!m) return undefined
  const hex = m[1].length === 3 ? m[1].split('').map((c) => c + c).join('') : m[1]
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
  const lin = (c: number) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)
  const lum = 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)
  return lum > 0.18 ? '#16130f' : '#ffffff'
}

function usePrefersDark(enabled: boolean): boolean {
  const [dark, setDark] = useState(false)
  useEffect(() => {
    if (!enabled || typeof window === 'undefined' || !window.matchMedia) return
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const update = () => setDark(mq.matches)
    update()
    mq.addEventListener?.('change', update)
    return () => mq.removeEventListener?.('change', update)
  }, [enabled])
  return dark
}

const Welcome: React.FC<{ exp: ResolvedExperience; controller: ChatEmptyStateController }> = ({ exp, controller }) => {
  const busy = controller.isLoading || controller.isStreaming
  return (
    <div className="dui-welcome">
      <div className="dui-mark" aria-hidden="true">{exp.name.charAt(0).toUpperCase()}</div>
      <h2 className="dui-welcome-title">{exp.name}</h2>
      <p className="dui-welcome-text">{exp.welcome}</p>
      {exp.suggestions.length > 0 ? (
        <div className="dui-chips">
          {exp.suggestions.map((s) => (
            <button
              key={s}
              type="button"
              className="dui-chip"
              disabled={busy}
              onClick={() => void controller.submit(s)}
            >
              {s}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}

/**
 * A finished-looking assistant for your app: themed, with sensible copy and tool activity shown as plain steps.
 * It wraps `Chat` and never shows developer controls (traces, model picker, token ring, raw tool JSON, sub-task cards).
 *
 *   <Assistant agentId="concierge" externalTools={tools} experience={{ theme: 'ink', accent: '#7c5cff' }} />
 */
export const Assistant: React.FC<AssistantProps> = ({
  agentId,
  agent,
  externalTools,
  experience,
  threadId,
  defaultOpen = false,
  open: openProp,
  onOpenChange,
  getMetadata,
  toolRenderers,
  onError,
  onMessage,
  className,
  style,
}) => {
  const exp = useMemo(() => resolveExperience(experience, agentId ?? agent?.name), [experience, agentId, agent?.name])

  const [openState, setOpenState] = useState(defaultOpen)
  const open = openProp ?? openState
  const setOpen = useCallback(
    (next: boolean) => {
      if (openProp === undefined) setOpenState(next)
      onOpenChange?.(next)
    },
    [openProp, onOpenChange],
  )
  // Keep the conversation alive after the first open, even while the panel is closed.
  const [everOpened, setEverOpened] = useState(open)
  useEffect(() => {
    if (open) setEverOpened(true)
  }, [open])

  const [conversation, setConversation] = useState(0)
  const chatRef = useRef<ChatInstance | null>(null)
  const lastSent = useRef<DistriMessage['parts'] | null>(null)
  const [failed, setFailed] = useState<Error | null>(null)

  const prefersDark = usePrefersDark(exp.theme === 'auto')
  const dark = exp.theme === 'ink' || (exp.theme === 'auto' && prefersDark)

  const runtime = useMemo(() => ({ toolActivity: exp.toolActivity, toolLabels: exp.toolLabels }), [exp.toolActivity, exp.toolLabels])
  const components = useMemo(() => ({ ToolSteps, UserMessage: UserTurn }), [])
  const instructions = exp.instructions
  const metadata = useCallback(() => buildAssistantMetadata({ instructions }, getMetadata), [instructions, getMetadata])

  const toolSummaryOverrides = useMemo(() => {
    const out: Record<string, () => { verb: string }> = {}
    for (const [tool, label] of Object.entries(exp.toolLabels)) {
      const text = label.done ?? label.running
      if (text) out[tool] = () => ({ verb: text })
    }
    return out
  }, [exp.toolLabels])

  const renderEmptyState = useCallback(
    (controller: ChatEmptyStateController) => <Welcome exp={exp} controller={controller} />,
    [exp],
  )

  const retry = useCallback(() => {
    const parts = lastSent.current
    setFailed(null)
    if (parts) void chatRef.current?.sendMessage(parts)
  }, [])

  const renderError = useCallback(
    (_error: Error) => (
      <div className="dui-error" role="alert">
        <span>Something went wrong. Please try again.</span>
        <button type="button" onClick={retry}>Retry</button>
      </div>
    ),
    [retry],
  )

  const style_ = useMemo(
    () =>
      ({
        ...(exp.accent ? { '--dui-accent': exp.accent } : {}),
        ...(exp.accent && readableOn(exp.accent) ? { '--dui-accent-fg': readableOn(exp.accent) } : {}),
        ...style,
      }) as React.CSSProperties,
    [exp.accent, style],
  )

  const visible = exp.layout !== 'launcher' || open

  const body = (
    <AssistantRuntimeContext.Provider value={runtime}>
      <header className="dui-header">
        <div className="dui-mark dui-mark-sm" aria-hidden="true">{exp.name.charAt(0).toUpperCase()}</div>
        <div className="dui-header-title">{exp.name}</div>
        <div className="dui-header-actions">
          <button
            type="button"
            className="dui-icon-btn"
            aria-label="New conversation"
            title="New conversation"
            onClick={() => {
              lastSent.current = null
              setFailed(null)
              setConversation((n) => n + 1)
            }}
          >
            <SquarePen aria-hidden="true" />
          </button>
          {exp.layout === 'launcher' ? (
            <button type="button" className="dui-icon-btn" aria-label="Close" title="Close" onClick={() => setOpen(false)}>
              <X aria-hidden="true" />
            </button>
          ) : null}
        </div>
      </header>
      <div className="dui-body">
        <Chat
          key={conversation}
          agentId={agentId}
          agent={agent}
          threadId={threadId}
          externalTools={externalTools}
          toolRenderers={toolRenderers}
          theme={dark ? 'dark' : 'light'}
          getMetadata={metadata}
          beforeSendMessage={async (message) => {
            lastSent.current = message.parts
            setFailed(null)
            return message
          }}
          onChatInstanceReady={(i) => {
            chatRef.current = i
          }}
          onError={(e) => {
            setFailed(e)
            onError?.(e)
          }}
          onMessage={onMessage}
          groupToolCalls="run"
          toolSummaryOverrides={toolSummaryOverrides as never}
          components={components}
          renderEmptyState={renderEmptyState}
          renderError={failed ? renderError : () => null}
          placeholder={exp.placeholder}
          maxWidth={exp.layout === 'inline' ? '720px' : undefined}
          showContextUsage={false}
          showToolWaitStatus={false}
          showThreadTokens={false}
          showQueueHint={false}
          showAttach={false}
          showSubTasks={false}
          allowBrowserPreview={false}
          allowCommands={false}
          enableFeedback={false}
        />
      </div>
    </AssistantRuntimeContext.Provider>
  )

  return (
    <div
      className={['dui-assistant', 'distri-root', className].filter(Boolean).join(' ')}
      data-theme={exp.theme}
      data-radius={exp.radius}
      data-layout={exp.layout}
      data-side={exp.side}
      data-open={visible}
      style={style_}
    >
      {exp.layout === 'launcher' ? <Launcher open={open} onToggle={() => setOpen(!open)} label={exp.name} /> : null}
      {exp.layout !== 'launcher' || everOpened ? (
        <section
          className="dui-shell"
          role={exp.layout === 'launcher' ? 'dialog' : 'region'}
          aria-label={exp.name}
          hidden={!visible}
        >
          {body}
        </section>
      ) : null}
    </div>
  )
}
