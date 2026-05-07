// WorkflowAgentPreviewCard — OSS stub.
//
// Cloud renders a DAG graph plus per-step inspector for workflow agents.
// OSS server doesn't surface workflow agents (no `agent_type ===
// 'workflow_agent'` rows ever ship through), so this code path is
// effectively dead in OSS. We keep the prop signature identical to
// cloud's so SplitEditor can be byte-identical.

import { Workflow } from 'lucide-react'

export function WorkflowAgentPreviewCard({ agentId }: { agentId: string }) {
  return (
    <div className="rounded-lg border border-dashed border-border/70 bg-card p-4">
      <div className="flex items-start gap-3">
        <Workflow className="mt-0.5 h-5 w-5 shrink-0 text-fuchsia-400" />
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-semibold text-foreground">{agentId}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Workflow agents are not supported in this build.
          </p>
        </div>
      </div>
    </div>
  )
}
