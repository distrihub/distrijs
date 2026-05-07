// SkillPreviewCard — workspace-editor preview header for skills.
//
// Reads basic metadata (name/description/tags/path/version/system) from
// the WorkspaceItem the LeftPanel/WorkspacePage already hydrated, plus
// the optional `connections` list (the skill's
// `agent_definition.connections`) which WorkspacePage fetches alongside
// the body. The matching markdown body is rendered separately by
// SplitEditor below this card.

import { Lock } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { WorkspaceItem } from './types'

type Connection = { name: string; auth_type?: string }

export function SkillPreviewCard({
  item,
  connections,
}: {
  item: WorkspaceItem
  connections?: Connection[]
}) {
  const path = item.path ?? `skills/${item.title}/SKILL.md`
  const tags = item.tags ?? []
  const version = item.version
  const system = item.system === true
  const conns = connections ?? []

  return (
    <div className="rounded-lg border border-border/70 bg-card p-4">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h2 className="text-base font-semibold text-foreground">{item.title}</h2>
        {version ? (
          <span className="font-mono text-xs text-muted-foreground">v{version}</span>
        ) : null}
        {system ? (
          <span className="inline-flex items-center gap-1 rounded bg-muted px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
            <Lock className="h-2.5 w-2.5" />
            System
          </span>
        ) : null}
      </div>

      {item.description ? (
        <p className="mt-2 text-sm text-foreground/90">{item.description}</p>
      ) : (
        <p className="mt-2 text-sm italic text-muted-foreground">No description.</p>
      )}

      {tags.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-1">
          {tags.map((t) => (
            <span
              key={t}
              className="rounded bg-muted px-1.5 py-0.5 text-[11px] text-muted-foreground"
            >
              {t}
            </span>
          ))}
        </div>
      ) : null}

      <dl className="mt-4 grid grid-cols-[max-content_1fr] gap-x-4 gap-y-2 text-sm">
        <dt className="text-xs uppercase tracking-wide text-muted-foreground">Path</dt>
        <dd className="font-mono text-[0.875em] text-foreground/90">{path}</dd>

        <dt className="text-xs uppercase tracking-wide text-muted-foreground">Connections</dt>
        <dd>
          {conns.length === 0 ? (
            <span className="italic text-muted-foreground">None</span>
          ) : (
            <div className="flex flex-wrap gap-1">
              {conns.map((c) => (
                <Link
                  key={c.name}
                  to={`/connections?focus=${encodeURIComponent(c.name)}`}
                  className="rounded border border-border bg-muted/40 px-1.5 py-0.5 font-mono text-[11px] text-foreground/90 hover:border-primary/60 hover:text-primary"
                  title={c.auth_type ? `auth_type: ${c.auth_type}` : c.name}
                >
                  {c.name}
                </Link>
              ))}
            </div>
          )}
        </dd>
      </dl>
    </div>
  )
}
