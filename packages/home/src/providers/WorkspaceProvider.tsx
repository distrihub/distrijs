// OSS shim for cloud's WorkspaceProvider. The OSS server is single-tenant
// — there's no workspace switcher and no per-workspace persistence — so
// every consumer sees a single "default" workspace. Match cloud's hook
// surface so workspace files copied from cloud can use it verbatim.

import type { ReactNode } from 'react'

export type Workspace = {
  id: string
  name: string
}

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  return <>{children}</>
}

export function useWorkspace(): { currentWorkspace: Workspace | null } {
  return { currentWorkspace: { id: 'default', name: 'workspace' } }
}
