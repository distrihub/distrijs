// Workspace editor — shared types across LeftPanel, SplitEditor, DetailsCard.
// Mirrors the prototype's data shape (data.jsx) reduced to what the UI needs.
// Real data wiring (mapping from API responses) lives in WorkspacePage.

export type ItemType = 'agent' | 'skill' | 'template' | 'skill-file'
export type EditorMode = 'markdown' | 'preview'
export type Scope = 'workspace' | 'system'

/// Logical kind of a `skill-file` leaf — the tree shows SKILL.md and the
/// contents of `scripts/` inline under each skill folder so the user can
/// see everything that ships with the skill.
export type SkillFileKind = 'skill-md' | 'script'

export type AgentDetailsStats = {
  threads: number
  sub_calls: number
  last_used: string
}

export type WorkspaceItem = {
  type: ItemType
  id: string
  name: string         // file name e.g. "controller.md"
  title: string        // identifier
  description?: string

  // Common
  version?: string
  updated?: string
  content?: string
  frontmatter?: Record<string, unknown>

  // Agent
  /// AgentConfig variant tag from the cloud (`standard_agent` or
  /// `workflow_agent`). Drives icon + preview/edit branching for
  /// workflow agents inside the Agents tree.
  agent_type?: string
  model?: string
  analysis_model?: string
  max_iterations?: number
  history_size?: number
  context_size?: number
  browser?: boolean
  tools?: number
  sub_agents?: string[]
  enabled?: boolean
  stats?: AgentDetailsStats

  // Skill
  path?: string
  trigger?: string
  context?: 'inline' | 'fork'
  tags?: string[]
  hil?: boolean

  // Template
  variables?: string[]
  secrets?: string[]
  missing_secrets?: string[]
  system?: boolean

  // Skill-file (a leaf inside a skill folder — SKILL.md or a scripts/ entry)
  fileKind?: SkillFileKind
  /// Reference back to the parent skill's id, so the editor can fetch the
  /// right blob (SKILL.md content / one script's code).
  parentSkillId?: string
  /// For scripts — the language (used for syntax-highlighting hints).
  language?: string

  // Tree-only
  hidden?: boolean
}

export type TreeFolder = {
  type: 'folder'
  id: string
  name: string
  count?: number
  children: TreeNode[]
  /// Marks a system-seeded folder (e.g. a skill living in the nil
  /// workspace). Used by the Workspace/System scope filter.
  system?: boolean
}

export type TreeNode = TreeFolder | WorkspaceItem

export const TYPE_GLYPH: Record<ItemType, { color: string; label: string }> = {
  agent: { color: 'text-amber-500', label: 'Agent' },
  skill: { color: 'text-violet-400', label: 'Skill' },
  template: { color: 'text-cyan-400', label: 'Template' },
  'skill-file': { color: 'text-muted-foreground', label: 'File' },
}
