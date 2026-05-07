// WorkspacePage — unified Agents/Skills/Templates editor.
// Mounted at /workspace/:type/:id?. The single-route layout keeps the
// component mounted across selections so navigation feels instant
// (no remount, no scroll loss).
//
// Tree is file-explorer style:
//   agents/<name>.md             ← agent leaf
//   skills/<name>/SKILL.md       ← skill folder + skill-md leaf
//   templates/<name>.hbs         ← template leaf
//
// Discover was removed — public skill discovery is a CLI-only feature
// (`distri search`, `distri install`).

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { LeftPanel } from '../components/workspace/LeftPanel'
import { SplitEditor } from '../components/workspace/SplitEditor'
import {
  EditorMode,
  ItemType,
  Scope,
  TreeFolder,
  TreeNode,
  WorkspaceItem,
} from '../components/workspace/types'
import { useWorkspace } from '../providers/WorkspaceProvider'
import { getAgent, getSkill, listAgents, listPromptTemplates, listSkills } from '../lib/api'
import { useDraftProposal } from '../context/DraftProposalContext'
import { synthesiseDraftItem } from './workspace-draft-synthesis'

const URL_TYPE_TO_ITEM: Record<string, ItemType> = {
  agents: 'agent',
  skills: 'skill',
  templates: 'template',
}

function isFolder(n: TreeNode): n is TreeFolder {
  return (n as TreeFolder).type === 'folder'
}

function findLeaf(nodes: TreeNode[], id: string): WorkspaceItem | null {
  for (const n of nodes) {
    if (isFolder(n)) {
      const r = findLeaf(n.children, id)
      if (r) return r
    } else if (n.id === id) return n
  }
  return null
}

/// Find a folder anywhere in the tree by id.
function findFolder(nodes: TreeNode[], id: string): TreeFolder | null {
  for (const n of nodes) {
    if (isFolder(n)) {
      if (n.id === id) return n
      const r = findFolder(n.children, id)
      if (r) return r
    }
  }
  return null
}

/// First selectable leaf for a given type. For skills the leaves are
/// `skill-file` nodes living one level inside each skill folder, not
/// `skill`-typed leaves directly.
function firstLeafFor(nodes: TreeNode[], type: ItemType): WorkspaceItem | null {
  const root = nodes.find((n) => isFolder(n) && n.id === type + 's') as TreeFolder | undefined
  if (!root) return null
  if (type === 'skill') {
    for (const child of root.children) {
      if (isFolder(child)) {
        const file = child.children.find((c) => !isFolder(c)) as WorkspaceItem | undefined
        if (file) return file
      }
    }
    return null
  }
  return (root.children.find((c) => !isFolder(c) && (c as WorkspaceItem).type === type) ??
    null) as WorkspaceItem | null
}

/// Resolve the URL's :id to a selectable leaf. The `:id` may refer to:
///   - a leaf id directly (agents/templates always; skill-file ids of the
///     form "<skill-uuid>::SKILL.md")
///   - a skill folder id (resolves to that folder's SKILL.md child)
///   - a name (agents always; skill folder name)
function resolveSelected(
  tree: TreeNode[],
  type: ItemType,
  urlId?: string,
): WorkspaceItem | null {
  if (!tree.length) return null
  if (urlId) {
    const decoded = decodeURIComponent(urlId)

    // 1. Direct leaf hit.
    const leaf = findLeaf(tree, decoded)
    if (leaf) return leaf

    // 2. Skill folder id → its first child file.
    const folder = findFolder(tree, decoded)
    if (folder) {
      const file = folder.children.find((c) => !isFolder(c)) as WorkspaceItem | undefined
      if (file) return file
    }

    // 3. Lookup by name within the active type's root folder.
    const typeRoot = tree.find(
      (n) => isFolder(n) && n.id === type + 's',
    ) as TreeFolder | undefined
    if (typeRoot) {
      for (const child of typeRoot.children) {
        if (isFolder(child)) {
          if (child.name === decoded) {
            const file = child.children.find((c) => !isFolder(c)) as WorkspaceItem | undefined
            if (file) return file
          }
        } else if (child.title === decoded || child.id === decoded) {
          return child
        }
      }
    }
  }

  return firstLeafFor(tree, type)
}

export default function WorkspacePage() {
  const navigate = useNavigate()
  const { type: urlType, id: urlId } = useParams<{ type?: string; id?: string }>()
  const { currentWorkspace } = useWorkspace()
  const { proposal } = useDraftProposal()

  const activeType: ItemType = urlType ? URL_TYPE_TO_ITEM[urlType] ?? 'agent' : 'agent'

  const [scope, setScope] = useState<Scope>('workspace')
  const [tree, setTree] = useState<TreeNode[]>([])
  const [mode, setMode] = useState<EditorMode>('preview')
  const [loading, setLoading] = useState(true)
  /// Lazy-loaded content for selected items.
  const [contentById, setContentById] = useState<Record<string, string>>({})
  /// Lazy-loaded connections (from a skill's `agent_definition.connections`).
  /// Keyed by skill id; populated alongside `contentById` for skill-typed
  /// items so SkillPreviewCard can render clickable chips.
  const [skillConnectionsById, setSkillConnectionsById] = useState<
    Record<string, Array<{ name: string; auth_type?: string }>>
  >({})
  /// Bumped by `refetch()` to force the tree-loading effect to re-run.
  /// Used after Clone/Save so newly-created rows appear without a manual
  /// page reload.
  const [refreshTick, setRefreshTick] = useState(0)
  const refetch = useCallback(() => setRefreshTick((n) => n + 1), [])

  useEffect(() => {
    const onRefresh = () => refetch()
    window.addEventListener('distri:workspace-refresh', onRefresh)
    return () => window.removeEventListener('distri:workspace-refresh', onRefresh)
  }, [refetch])

  // Build the tree once per workspace.
  useEffect(() => {
    let cancelled = false
    setLoading(true)
    Promise.all([
      listAgents().catch(() => []),
      listSkills().catch(() => ({ skills: [] as unknown[] })),
      listPromptTemplates().catch(() => []),
    ]).then(([agents, skillsRes, templates]) => {
      if (cancelled) return
      const agentNodes: WorkspaceItem[] = (agents as Array<Record<string, unknown>>).map((a) => ({
        type: 'agent',
        id: String(a.name ?? a.id),
        name: `${String(a.name ?? a.id)}.md`,
        title: String(a.name ?? a.id),
        description: (a.description as string) ?? undefined,
        version: (a.version as string) ?? undefined,
        model: (a.model as string) ?? undefined,
        updated: (a.updated_at as string) ?? undefined,
        enabled: (a.enabled as boolean | undefined) ?? true,
        agent_type: (a.agent_type as string | undefined) ?? 'standard_agent',
        // is_workspace=false means this is a system-seeded agent.
        // The list endpoint may omit the flag; treat absence as workspace.
        system: (a.is_workspace as boolean | undefined) === false,
      }))

      const skills = (skillsRes as { skills?: Array<Record<string, unknown>> })?.skills ?? []
      const skillFolders: TreeFolder[] = skills.map((s) => {
        const id = String(s.id ?? s.name)
        const name = String(s.name ?? s.id)
        // System skills come from the nil workspace; the list endpoint
        // sets is_workspace=false for them.
        const isSystem = (s.is_workspace as boolean | undefined) === false
        const skillMd: WorkspaceItem = {
          type: 'skill-file',
          id: `${id}::SKILL.md`,
          name: 'SKILL.md',
          title: 'SKILL.md',
          fileKind: 'skill-md',
          parentSkillId: id,
          language: 'markdown',
          system: isSystem,
        }
        return {
          type: 'folder',
          id,
          name,
          count: 1,
          children: [skillMd],
          system: isSystem,
        }
      })

      const templateNodes: WorkspaceItem[] = (templates as Array<Record<string, unknown>>).map(
        (t) => ({
          type: 'template',
          id: String(t.id ?? t.name),
          name: `${String(t.name)}.hbs`,
          title: String(t.name ?? t.id),
          version: (t.version as string) ?? undefined,
          updated: (t.updated_at as string) ?? undefined,
        }),
      )

      const next: TreeNode[] = [
        {
          type: 'folder',
          id: 'agents',
          name: 'agents',
          count: agentNodes.length,
          children: agentNodes,
        },
        {
          type: 'folder',
          id: 'skills',
          name: 'skills',
          count: skillFolders.length,
          children: skillFolders,
        },
        {
          type: 'folder',
          id: 'templates',
          name: 'templates',
          count: templateNodes.length,
          children: templateNodes,
        },
      ]
      setTree(next)
      setLoading(false)
    })
    return () => {
      cancelled = true
    }
  }, [currentWorkspace?.id, refreshTick])

  // Apply the Workspace/System scope filter to what the LeftPanel sees.
  // Workspace: items belonging to the current workspace.
  // System: items seeded into the nil-workspace.
  const filteredTree = useMemo<TreeNode[]>(() => {
    const filterLeaf = (n: WorkspaceItem): boolean =>
      scope === 'system' ? n.system === true : n.system !== true
    return tree
      .map((root) => {
        if (!isFolder(root)) return root
        const filteredChildren: TreeNode[] = []
        for (const child of root.children) {
          if (isFolder(child)) {
            const wantFolder = scope === 'system' ? child.system === true : child.system !== true
            if (!wantFolder) continue
            const subKept = child.children.filter(
              (c) => isFolder(c) || filterLeaf(c as WorkspaceItem),
            )
            filteredChildren.push({ ...child, children: subKept, count: subKept.length })
          } else if (filterLeaf(child)) {
            filteredChildren.push(child)
          }
        }
        return { ...root, children: filteredChildren, count: filteredChildren.length }
      })
  }, [tree, scope])

  // Resolve the URL's :id (or fall back to the first leaf of :type) against
  // the filtered tree, so the editor follows the scope.
  const selectedItem = useMemo<WorkspaceItem | null>(() => {
    if (urlId === '_draft' && proposal && proposal.kind === 'create') {
      return synthesiseDraftItem(activeType, proposal.body)
    }
    return resolveSelected(filteredTree, activeType, urlId)
  }, [filteredTree, activeType, urlId, proposal])

  /// Pull `agent_definition.connections` off a skill payload (the Rust
  /// type carries it; the TS type doesn't model it yet) and stash it.
  const captureSkillConnections = useCallback(
    (skill: unknown, skillId: string) => {
      const def = (skill as Record<string, unknown> | null | undefined)?.agent_definition as
        | Record<string, unknown>
        | undefined
      const conns = (def?.connections as Array<{ name: string; auth_type?: string }> | undefined) ?? []
      setSkillConnectionsById((m) => ({ ...m, [skillId]: conns }))
    },
    [],
  )

  // Lazy-fetch content when selection changes.
  const fetchContent = useCallback(
    async (item: WorkspaceItem) => {
      if (contentById[item.id] !== undefined) return
      try {
        if (item.type === 'agent') {
          const cfg = await getAgent(item.title)
          if (item.agent_type === 'workflow_agent') {
            // Workflow agents don't ship markdown; the editable surface is
            // the JSON DAG at `definition.definition`. Falls back to the
            // outer agent envelope if shape is unexpected.
            const env = cfg as Record<string, unknown>
            const inner =
              (env?.definition as Record<string, unknown> | undefined) ?? env ?? {}
            const json = JSON.stringify(inner, null, 2)
            setContentById((m) => ({ ...m, [item.id]: json }))
          } else {
            const md = (cfg as Record<string, unknown>)?.markdown as string | undefined
            if (md) setContentById((m) => ({ ...m, [item.id]: md }))
          }
        } else if (item.type === 'skill') {
          const skill = await getSkill(item.id)
          if (skill?.content) setContentById((m) => ({ ...m, [item.id]: skill.content }))
          captureSkillConnections(skill, item.id)
        } else if (item.type === 'skill-file' && item.fileKind === 'skill-md') {
          if (!item.parentSkillId) return
          const skill = await getSkill(item.parentSkillId)
          if (skill?.content) {
            const fm =
              `---\nname: ${skill.name}` +
              (skill.description ? `\ndescription: ${skill.description}` : '') +
              `\n---\n\n`
            setContentById((m) => ({ ...m, [item.id]: fm + skill.content }))
          }
          captureSkillConnections(skill, item.parentSkillId)
        } else if (item.type === 'template') {
          // No GET-by-id endpoint for prompt templates; the list response
          // already includes the body, so fetch the list and pick the row.
          const list = await listPromptTemplates()
          const t = list.find(
            (x) => x.id === item.id || x.name === item.title,
          )
          if (t?.template) setContentById((m) => ({ ...m, [item.id]: t.template }))
        }
      } catch (err) {
        console.error('failed to fetch content for', item.id, err)
      }
    },
    [contentById, captureSkillConnections],
  )

  useEffect(() => {
    if (!selectedItem) return
    if (selectedItem.id === '_draft') return  // body comes from the proposal, not the API
    fetchContent(selectedItem)
  }, [selectedItem, fetchContent])

  const itemWithContent = useMemo<WorkspaceItem | null>(() => {
    if (!selectedItem) return null
    const content = contentById[selectedItem.id]
    return content === undefined ? selectedItem : { ...selectedItem, content }
  }, [selectedItem, contentById])

  const onSelect = (id: string) => {
    // The id can be either a leaf id (skill-file/agent/template) or a
    // skill folder id (when the user clicks the skill folder name).
    // Either way we route to a /workspace/:type/:key URL where :key is the
    // skill folder id (so the URL is stable for a given skill regardless
    // of which file inside it is shown), or the leaf id for non-skill
    // types.
    const folder = findFolder(tree, id)
    if (folder) {
      // Only nested skill folders are selectable.
      navigate(`/workspace/skills/${encodeURIComponent(id)}`, { replace: true })
      return
    }
    const node = findLeaf(tree, id)
    if (!node) return
    if (node.type === 'agent') {
      navigate(`/workspace/agents/${encodeURIComponent(id)}`, { replace: true })
    } else if (node.type === 'template') {
      navigate(`/workspace/templates/${encodeURIComponent(id)}`, { replace: true })
    } else if (node.type === 'skill-file') {
      const skillId = node.parentSkillId ?? node.id
      navigate(`/workspace/skills/${encodeURIComponent(skillId)}`, { replace: true })
    } else if (node.type === 'skill') {
      navigate(`/workspace/skills/${encodeURIComponent(id)}`, { replace: true })
    }
  }

  return (
    <div className="flex h-full min-h-0 w-full">
      <LeftPanel
        tree={filteredTree}
        selectedId={selectedItem?.id ?? null}
        onSelect={onSelect}
        scope={scope}
        onScope={setScope}
        workspaceName={currentWorkspace?.name ?? 'workspace'}
      />
      {itemWithContent ? (
        <SplitEditor
          item={itemWithContent}
          mode={mode}
          onMode={setMode}
          workspaceName={currentWorkspace?.name ?? 'workspace'}
          onAfterMutate={refetch}
          skillConnections={
            itemWithContent.type === 'skill'
              ? skillConnectionsById[itemWithContent.id]
              : itemWithContent.type === 'skill-file' && itemWithContent.parentSkillId
                ? skillConnectionsById[itemWithContent.parentSkillId]
                : undefined
          }
        />
      ) : (
        <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
          {loading ? 'Loading workspace…' : 'Select an item from the sidebar to begin.'}
        </div>
      )}
    </div>
  )
}

// Module-scope helper — anything in the app can fire this to ask the
// active WorkspacePage to refetch its tree.
export function fireWorkspaceRefresh() {
  window.dispatchEvent(new CustomEvent('distri:workspace-refresh'))
}
