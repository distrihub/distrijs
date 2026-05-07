// AgentPreviewCard — OSS stub.
//
// Cloud's AgentPreviewCard renders a four-tab metadata card (Details ·
// Tools · Integrate · Embed) backed by useAgent + EmbedIntegrator. OSS
// doesn't ship EmbedIntegrator and the workspace editor is intended to
// stay minimal here, so we render a compact "metadata pending" card with
// the same prop signature that SplitEditor passes.
//
// Keep the prop signature identical to cloud — SplitEditor must not have
// to change. If/when OSS gets a tab-card equivalent, replace this file
// only and SplitEditor stays byte-identical to cloud.

import { useAgent } from '@distri/react'

export function AgentPreviewCard({ agentId }: { agentId: string }) {
  const { agent, loading } = useAgent({ agentIdOrDef: agentId })

  if (loading || !agent) {
    return (
      <div className="rounded-lg border border-border/70 bg-card p-4 text-sm text-muted-foreground">
        Loading agent…
      </div>
    )
  }

  const def = (agent.getDefinition?.() as unknown as Record<string, unknown> | undefined) ?? undefined
  const description = (def?.description as string | undefined) ?? ''
  const version = (def?.version as string | undefined) ?? '—'
  const modelSettings = def?.model_settings as Record<string, unknown> | undefined
  const model = (modelSettings?.model as string | undefined) ?? '—'

  return (
    <div className="rounded-lg border border-border/70 bg-card p-4">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h2 className="text-base font-semibold text-foreground">{agentId}</h2>
        <span className="font-mono text-xs text-muted-foreground">v{version}</span>
      </div>
      {description ? (
        <p className="mt-2 text-sm text-foreground/90">{description}</p>
      ) : (
        <p className="mt-2 text-sm italic text-muted-foreground">No description.</p>
      )}
      <dl className="mt-3 grid grid-cols-[max-content_1fr] gap-x-4 gap-y-1 text-sm">
        <dt className="text-xs uppercase tracking-wide text-muted-foreground">Model</dt>
        <dd className="font-mono text-[0.875em] text-foreground">{model}</dd>
      </dl>
    </div>
  )
}
