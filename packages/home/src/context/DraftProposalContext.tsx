// OSS shim for cloud's DraftProposalContext. Cloud's DistriChat agent
// can intercept tool calls and surface a "draft proposal" the user has to
// confirm/discard before the call lands. OSS has no equivalent flow yet —
// the hook returns a permanently-null proposal so the conditional banner
// branches inside SplitEditor naturally disable themselves.
//
// The shape mirrors cloud's so workspace files can be copied verbatim.

import type { ReactNode } from 'react'

export type ProposalEntity = 'agent' | 'skill' | 'skill-file' | 'template'

export type DraftProposal =
  | {
      kind: 'edit'
      entity: ProposalEntity
      targetId: string
      body: unknown
      path: string
      method: 'PUT'
      confirm: (finalBody?: unknown) => void
      discard: () => void
    }
  | {
      kind: 'create'
      entity: 'agent' | 'skill' | 'template'
      body: unknown
      path: string
      method: 'POST'
      confirm: (finalBody?: unknown) => void
      discard: () => void
    }
  | {
      kind: 'delete'
      entity: ProposalEntity
      targetId: string
      path: string
      method: 'DELETE'
      confirm: () => void
      discard: () => void
    }

type Ctx = {
  proposal: DraftProposal | null
  setProposal: (p: DraftProposal) => void
  clearProposal: () => void
}

export function DraftProposalProvider({ children }: { children: ReactNode }) {
  return <>{children}</>
}

export function useDraftProposal(): Ctx {
  return {
    proposal: null,
    setProposal: () => {},
    clearProposal: () => {},
  }
}
