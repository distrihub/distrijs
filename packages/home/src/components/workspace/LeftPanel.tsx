// Workspace editor — left panel: scope rail + tree + search + "New" menu.
// Implements proposal B: tree groups by agents/, skills/, templates/ with
// type-tinted leaf glyphs. Skills support nested folders.

import { useEffect, useMemo, useState } from 'react'
import {
  Building2,
  ShieldCheck,
  Search,
  ChevronRight,
  ChevronDown,
  Folder,
  FolderOpen,
  Zap,
  Sparkles,
  BookOpen,
  Lock,
  File,
  FileCode,
  Workflow,
} from 'lucide-react'
import { Scope, TreeFolder, TreeNode, WorkspaceItem, TYPE_GLYPH } from './types'

type Props = {
  tree: TreeNode[]
  selectedId: string | null
  onSelect: (id: string) => void
  scope: Scope
  onScope: (scope: Scope) => void
  workspaceName?: string
}

// Discover lives only in the CLI (`distri search`/`distri install`).
// Workspace UI surfaces only Workspace + System.
const SCOPE_TABS: Array<{ id: Scope; label: string; Icon: typeof Building2 }> = [
  { id: 'workspace', label: 'Workspace', Icon: Building2 },
  { id: 'system', label: 'System', Icon: ShieldCheck },
]

function isFolder(n: TreeNode): n is TreeFolder {
  return (n as TreeFolder).type === 'folder'
}

function flatten(tree: TreeNode[]): Array<WorkspaceItem & { _parent: string }> {
  const out: Array<WorkspaceItem & { _parent: string }> = []
  const walk = (nodes: TreeNode[], parentLabel = '') => {
    for (const n of nodes) {
      if (isFolder(n)) walk(n.children ?? [], n.id)
      else out.push({ ...n, _parent: parentLabel })
    }
  }
  walk(tree)
  return out
}

function NodeRow({
  node,
  depth,
  selectedId,
  isOpen,
  toggle,
  select,
}: {
  node: TreeNode
  depth: number
  selectedId: string | null
  isOpen: (id: string) => boolean
  toggle: (id: string) => void
  select: (id: string) => void
}) {
  const indent = 4 + depth * 14

  if (isFolder(node)) {
    const open = isOpen(node.id)
    const isRoot = depth === 0
    const RootIcon =
      node.id === 'agents' ? Zap : node.id === 'skills' ? Sparkles : node.id === 'templates' ? BookOpen : Folder
    const rootTint =
      node.id === 'agents'
        ? 'text-amber-500'
        : node.id === 'skills'
          ? 'text-violet-400'
          : node.id === 'templates'
            ? 'text-cyan-400'
            : 'text-muted-foreground'
    // Root folders (agents/skills/templates) only toggle on click. Nested
    // folders (skill folders under skills/) ALSO select — the row click
    // selects the folder's first file, while the chevron-only zone toggles
    // expand without selecting.
    const isSel = !isRoot && selectedId != null && selectedId.startsWith(node.id)
    return (
      <div>
        <div
          className={`flex w-full items-center gap-1 rounded-md text-sm hover:bg-sidebar-accent/40 ${isRoot ? 'font-semibold' : ''
            } ${isSel ? 'bg-sidebar-accent text-sidebar-accent-foreground' : ''}`}
          style={{ paddingLeft: indent }}
        >
          <button
            className="flex shrink-0 items-center px-1 py-1.5 text-muted-foreground"
            onClick={(e) => {
              e.stopPropagation()
              toggle(node.id)
            }}
            aria-label={open ? 'Collapse' : 'Expand'}
            title={open ? 'Collapse' : 'Expand'}
          >
            {open ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
          </button>
          <button
            className="flex flex-1 items-center gap-1 truncate py-1.5 text-left"
            onClick={() => {
              if (isRoot) {
                toggle(node.id)
              } else {
                // Skill folder row: select (opens SKILL.md in the editor)
                // AND ensure the folder is expanded so SKILL.md is visible.
                select(node.id)
                if (!open) toggle(node.id)
              }
            }}
          >
            {isRoot ? (
              <span className={rootTint}>
                <RootIcon className="h-3.5 w-3.5" />
              </span>
            ) : (
              <span className="text-muted-foreground">
                {open ? <FolderOpen className="h-3.5 w-3.5" /> : <Folder className="h-3.5 w-3.5" />}
              </span>
            )}
            <span className="truncate">{node.name}</span>
            {node.count != null && (
              <span className="ml-auto pr-2 text-[10px] tabular-nums text-muted-foreground">
                {node.count}
              </span>
            )}
          </button>
        </div>
        {open && (
          <div>
            {node.children?.map((c) => (
              <NodeRow
                key={c.id}
                node={c}
                depth={depth + 1}
                selectedId={selectedId}
                isOpen={isOpen}
                toggle={toggle}
                select={select}
              />
            ))}
          </div>
        )}
      </div>
    )
  }

  // Leaf
  const glyph = TYPE_GLYPH[node.type]
  const isSel = node.id === selectedId
  const isFile = node.type === 'skill-file'
  const isWorkflowAgent = node.type === 'agent' && node.agent_type === 'workflow_agent'
  // skill-file leaves go one level deeper (they hang under the skill folder
  // which itself is one indent under skills/).
  const leafIndent = indent + (isFile ? 14 : 12)
  return (
    <button
      className={`flex w-full items-center gap-2 rounded-md px-2 py-1 text-sm hover:bg-sidebar-accent/40 ${isSel ? 'bg-sidebar-accent text-sidebar-accent-foreground' : ''
        }`}
      style={{ paddingLeft: leafIndent }}
      onClick={() => select(node.id)}
    >
      <span className={isWorkflowAgent ? 'text-fuchsia-400' : glyph.color}>
        {node.type === 'agent' && (isWorkflowAgent
          ? <Workflow className="h-3.5 w-3.5" />
          : <Zap className="h-3.5 w-3.5" />)}
        {node.type === 'skill' && <Sparkles className="h-3.5 w-3.5" />}
        {node.type === 'template' && <BookOpen className="h-3.5 w-3.5" />}
        {node.type === 'skill-file' &&
          (node.fileKind === 'skill-md' ? (
            <File className="h-3.5 w-3.5" />
          ) : (
            <FileCode className="h-3.5 w-3.5" />
          ))}
      </span>
      <span className="truncate">{node.title}</span>
      <span className="ml-auto flex items-center gap-1">
        {node.system && <Lock className="h-3 w-3 text-muted-foreground" />}
        {node.hil && (
          <span className="rounded bg-amber-500/10 px-1 text-[9px] font-semibold text-amber-500">HIL</span>
        )}
      </span>
    </button>
  )
}

export function LeftPanel({
  tree,
  selectedId,
  onSelect,
  scope,
  onScope,
  workspaceName = 'workspace',
}: Props) {
  // Single mutable open-set. Top-level scope folders (agents/skills/
  // templates) auto-open so the user sees what's there. Individual skill
  // folders stay collapsed until the user clicks their row — at which
  // point `select` opens them in addition to selecting their SKILL.md.
  const [openSet, setOpenSet] = useState<Set<string>>(() => new Set())
  useEffect(() => {
    setOpenSet((prev) => {
      const next = new Set(prev)
      next.add('agents')
      next.add('skills')
      next.add('templates')
      return next
    })
  }, [tree])
  const isOpen = (id: string) => openSet.has(id)
  const [query, setQuery] = useState('')

  const toggle = (id: string) => {
    setOpenSet((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const flatLeaves = useMemo(() => flatten(tree), [tree])
  const filtered = query.trim()
    ? flatLeaves.filter((n) =>
      ((n.title ?? '') + ' ' + (n.description ?? '') + ' ' + (n.tags ?? []).join(' '))
        .toLowerCase()
        .includes(query.toLowerCase()),
    )
    : null

  return (
    <aside className="flex h-full w-[280px] shrink-0 flex-col border-r border-sidebar-border/60 bg-sidebar">


      {/* Scope rail */}
      <div className="flex gap-1 border-b border-sidebar-border/60 px-2 py-2">
        {SCOPE_TABS.map((t) => (
          <button
            key={t.id}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-medium transition-colors ${scope === t.id
              ? 'bg-sidebar-accent text-sidebar-accent-foreground'
              : 'text-muted-foreground hover:bg-sidebar-accent/40'
              }`}
            onClick={() => onScope(t.id)}
            title={t.label}
          >
            <t.Icon className="h-3.5 w-3.5" />
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      {/* Search + New */}
      <div className="flex items-center gap-1 border-b border-sidebar-border/60 px-2 py-2">
        <div className="flex flex-1 items-center gap-1.5 rounded-md border border-sidebar-border/60 bg-background px-2 py-1">
          <Search className="h-3 w-3 text-muted-foreground" />
          <input
            placeholder="Search workspace…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent text-xs outline-none placeholder:text-muted-foreground"
          />

        </div>
        {/* The old "+" / create-new menu was here. Removed: creating
            agents/skills/templates is now driven through the global
            Distri chat panel (trigger lives top-right of the layout). */}
      </div>

      {/* Tree / filtered list */}
      <div className="flex-1 overflow-auto px-1 py-2">
        {filtered ? (
          <div>
            <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              {filtered.length} match{filtered.length === 1 ? '' : 'es'}
            </div>
            {filtered.map((n) => {
              const glyph = TYPE_GLYPH[n.type]
              return (
                <button
                  key={n.id}
                  className={`flex w-full items-center gap-2 rounded-md px-3 py-1.5 text-sm hover:bg-sidebar-accent/40 ${n.id === selectedId ? 'bg-sidebar-accent' : ''
                    }`}
                  onClick={() => onSelect(n.id)}
                >
                  <span className={glyph.color}>
                    {n.type === 'agent' && <Zap className="h-3.5 w-3.5" />}
                    {n.type === 'skill' && <Sparkles className="h-3.5 w-3.5" />}
                    {n.type === 'template' && <BookOpen className="h-3.5 w-3.5" />}
                  </span>
                  <span className="truncate">
                    {n._parent && <span className="text-muted-foreground">{n._parent} / </span>}
                    {n.title}
                  </span>
                </button>
              )
            })}
          </div>
        ) : (
          tree.map((n) => (
            <NodeRow
              key={n.id}
              node={n}
              depth={0}
              selectedId={selectedId}
              isOpen={isOpen}
              toggle={toggle}
              select={onSelect}
            />
          ))
        )}
      </div>
    </aside>
  )
}
