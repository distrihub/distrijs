// DetailsCard — type-aware metadata card shown above markdown body in Preview.
// Three variants: AgentDetails, SkillDetails, TemplateDetails.
// Strictly metadata + workspace stats. No publish/star/clone surface
// (per design transcript: "remove the entire publishing concept").

import {
  Zap,
  Sparkles,
  BookOpen,
  Wrench,
  GitBranch,
  Clock,
  Lock,
  Building2,
  AlertTriangle,
  Slash,
  Type,
  Copy,
  Play,
  MoreHorizontal,
} from 'lucide-react'
import { WorkspaceItem } from './types'

function MetaItem({
  label,
  children,
  mono,
}: {
  label: string
  children: React.ReactNode
  mono?: boolean
}) {
  return (
    <div className="flex flex-col gap-1">
      <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className={`text-sm ${mono ? 'font-mono' : ''}`}>{children}</div>
    </div>
  )
}

function Pill({
  children,
  tone = 'neutral',
  Icon,
}: {
  children: React.ReactNode
  tone?: 'neutral' | 'workspace' | 'locked' | 'warn' | 'mint' | 'violet' | 'cyan'
  Icon?: React.ComponentType<{ className?: string }>
}) {
  const map: Record<string, string> = {
    neutral: 'bg-muted text-foreground',
    workspace: 'bg-primary/10 text-primary',
    locked: 'bg-muted text-muted-foreground',
    warn: 'bg-amber-500/10 text-amber-500',
    mint: 'bg-emerald-500/10 text-emerald-500',
    violet: 'bg-violet-500/10 text-violet-400',
    cyan: 'bg-cyan-500/10 text-cyan-400',
  }
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-medium ${map[tone]}`}
    >
      {Icon && <Icon className="h-3 w-3" />}
      <span>{children}</span>
    </span>
  )
}

function Toggle({ on }: { on: boolean }) {
  return (
    <span
      className={`relative inline-flex h-4 w-7 items-center rounded-full transition-colors ${
        on ? 'bg-emerald-500' : 'bg-muted'
      }`}
    >
      <span
        className={`inline-block h-3 w-3 transform rounded-full bg-background transition-transform ${
          on ? 'translate-x-3.5' : 'translate-x-0.5'
        }`}
      />
    </span>
  )
}

function AgentDetails({ item }: { item: WorkspaceItem }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-start gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-muted-foreground">
            <Zap className="h-3 w-3 text-amber-500" />
            <span>Agent</span>
            <span>·</span>
            <span className="font-mono">v{item.version ?? '0.0.0'}</span>
          </div>
          <h1 className="mt-1 text-xl font-semibold">{item.title}</h1>
          {item.description && (
            <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Enabled</span>
          <Toggle on={item.enabled !== false} />
          <button className="rounded p-1 hover:bg-accent">
            <MoreHorizontal className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {item.model && <MetaItem label="Model" mono>{item.model}</MetaItem>}
        {item.analysis_model !== undefined && (
          <MetaItem label="Analysis" mono>
            {item.analysis_model || '—'}
          </MetaItem>
        )}
        {item.max_iterations != null && (
          <MetaItem label="Max iterations" mono>
            {item.max_iterations}
          </MetaItem>
        )}
        {item.context_size != null && (
          <MetaItem label="Context" mono>
            {(item.context_size / 1000).toFixed(0)}k
          </MetaItem>
        )}
        {item.tools != null && (
          <MetaItem label="Tools">
            <Pill tone="violet" Icon={Wrench}>
              {item.tools} bound
            </Pill>
          </MetaItem>
        )}
        {!!item.sub_agents?.length && (
          <MetaItem label="Sub-agents">
            <div className="flex flex-wrap gap-1">
              {item.sub_agents.slice(0, 3).map((s) => (
                <span
                  key={s}
                  className="inline-flex items-center gap-1 rounded bg-muted px-1.5 py-0.5 text-[11px]"
                >
                  <Zap className="h-2.5 w-2.5 text-amber-500" />
                  {s}
                </span>
              ))}
              {item.sub_agents.length > 3 && (
                <span className="rounded bg-muted px-1.5 py-0.5 text-[11px]">
                  +{item.sub_agents.length - 3}
                </span>
              )}
            </div>
          </MetaItem>
        )}
      </div>

      {item.stats && (
        <div className="mt-4 flex items-center gap-4 border-t border-border pt-3 text-xs text-muted-foreground">
          <span>
            <span className="font-semibold text-foreground">{item.stats.threads.toLocaleString()}</span> threads
          </span>
          <span className="text-border">·</span>
          <span>
            <span className="font-semibold text-foreground">{item.stats.sub_calls.toLocaleString()}</span> sub-calls
          </span>
          <span className="text-border">·</span>
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3 w-3" /> {item.stats.last_used}
          </span>
          <span className="ml-auto">Updated {item.updated ?? '—'}</span>
        </div>
      )}
    </div>
  )
}

function SkillDetails({ item }: { item: WorkspaceItem }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-start gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-muted-foreground">
            <Sparkles className="h-3 w-3 text-violet-400" />
            <span>Skill</span>
            <span>·</span>
            <span className="font-mono">{item.path ?? `skills/${item.id}/SKILL.md`}</span>
            {item.hil && (
              <Pill tone="warn" Icon={AlertTriangle}>
                HIL-gated
              </Pill>
            )}
          </div>
          <h1 className="mt-1 text-xl font-semibold">{item.title}</h1>
          {item.description && (
            <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Active</span>
          <Toggle on />
          <button className="rounded p-1 hover:bg-accent">
            <MoreHorizontal className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {item.trigger && (
          <MetaItem label="Trigger">
            <Pill tone="cyan" Icon={Slash}>
              {item.trigger}
            </Pill>
          </MetaItem>
        )}
        {item.context && (
          <MetaItem label="Context">
            <Pill tone={item.context === 'inline' ? 'mint' : 'violet'} Icon={item.context === 'inline' ? Type : GitBranch}>
              {item.context}
            </Pill>
          </MetaItem>
        )}
        {!!item.tags?.length && (
          <MetaItem label="Tags">
            <div className="flex flex-wrap gap-1">
              {item.tags.map((t) => (
                <span key={t} className="rounded bg-muted px-1.5 py-0.5 text-[11px]">
                  {t}
                </span>
              ))}
            </div>
          </MetaItem>
        )}
      </div>

      <div className="mt-4 flex items-center gap-3 border-t border-border pt-3 text-xs text-muted-foreground">
        <span>Owner · you</span>
        <span className="text-border">·</span>
        <span>Updated {item.updated ?? '—'}</span>
        <div className="ml-auto flex gap-2">
          <button className="inline-flex items-center gap-1 rounded border border-border px-2 py-1 text-xs hover:bg-accent">
            <GitBranch className="h-3 w-3" /> Fork
          </button>
          <button className="inline-flex items-center gap-1 rounded border border-border px-2 py-1 text-xs hover:bg-accent">
            <Copy className="h-3 w-3" /> Copy id
          </button>
        </div>
      </div>
    </div>
  )
}

function TemplateDetails({ item }: { item: WorkspaceItem }) {
  const hasMissing = (item.missing_secrets ?? []).length > 0
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-start gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-muted-foreground">
            <BookOpen className="h-3 w-3 text-cyan-400" />
            <span>Template</span>
            <span>·</span>
            <span className="font-mono">v{item.version ?? '0.0.0'}</span>
            {item.system ? (
              <Pill tone="locked" Icon={Lock}>
                System
              </Pill>
            ) : (
              <Pill tone="workspace" Icon={Building2}>
                Workspace
              </Pill>
            )}
            {hasMissing && (
              <Pill tone="warn" Icon={AlertTriangle}>
                Missing secret
              </Pill>
            )}
          </div>
          <h1 className="mt-1 text-xl font-semibold">{item.title}</h1>
          {item.description && (
            <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {!item.system && (
            <button className="inline-flex items-center gap-1 rounded bg-primary px-2.5 py-1 text-xs font-medium text-primary-foreground hover:bg-primary/90">
              <Play className="h-3 w-3" /> Use
            </button>
          )}
          <button className="rounded p-1 hover:bg-accent">
            <MoreHorizontal className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <MetaItem label="Variables">
          {item.variables?.length ? (
            <div className="flex flex-wrap gap-1">
              {item.variables.map((v) => (
                <span
                  key={v}
                  className="rounded bg-cyan-500/10 px-1.5 py-0.5 font-mono text-[11px] text-cyan-400"
                >
                  {`{{ ${v} }}`}
                </span>
              ))}
            </div>
          ) : (
            <span className="text-muted-foreground">none</span>
          )}
        </MetaItem>
        <MetaItem label="Secrets">
          {item.secrets?.length ? (
            <div className="flex flex-wrap gap-1">
              {item.secrets.map((s) => {
                const missing = (item.missing_secrets ?? []).includes(s)
                return (
                  <span
                    key={s}
                    className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 font-mono text-[11px] ${
                      missing
                        ? 'bg-amber-500/10 text-amber-500'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {missing ? <AlertTriangle className="h-2.5 w-2.5" /> : <Lock className="h-2.5 w-2.5" />}
                    {s}
                  </span>
                )
              })}
            </div>
          ) : (
            <span className="text-muted-foreground">none</span>
          )}
        </MetaItem>
      </div>

      <div className="mt-4 flex items-center gap-3 border-t border-border pt-3 text-xs text-muted-foreground">
        <span>Owner · {item.system ? 'Distri' : 'you'}</span>
        <span className="text-border">·</span>
        <span>Updated {item.updated ?? '—'}</span>
        <button className="ml-auto inline-flex items-center gap-1 rounded border border-border px-2 py-1 text-xs hover:bg-accent">
          <Copy className="h-3 w-3" /> Duplicate
        </button>
      </div>
    </div>
  )
}

export function DetailsCard({ item }: { item: WorkspaceItem }) {
  if (item.type === 'agent') return <AgentDetails item={item} />
  if (item.type === 'skill') return <SkillDetails item={item} />
  if (item.type === 'template') return <TemplateDetails item={item} />
  return null
}
