// Pure helper for synthesising a placeholder WorkspaceItem from a
// create-kind DraftProposal. Lives in its own module so the unit tests
// can import without dragging in the rest of WorkspacePage's imports
// (api/, providers/, @distri/react).

import type { ItemType, WorkspaceItem } from '../components/workspace/types'

/// For *create* proposals, the target item doesn't exist in the tree
/// yet. We synthesise a placeholder WorkspaceItem so SplitEditor can
/// render the proposed body before any backend write has happened.
export function synthesiseDraftItem(type: ItemType, rawBody: unknown): WorkspaceItem {
  const body = (rawBody && typeof rawBody === 'object' ? rawBody : {}) as Record<string, unknown>
  const name = (body.name as string | undefined) ?? (body.title as string | undefined) ?? 'untitled'
  if (type === 'skill') {
    return {
      type: 'skill-file',
      id: '_draft',
      name: 'SKILL.md',
      title: name,
      fileKind: 'skill-md',
      parentSkillId: '_draft',
      language: 'markdown',
    }
  }
  if (type === 'agent') {
    return {
      type: 'agent',
      id: '_draft',
      name: `${name}.md`,
      title: name,
      agent_type: 'standard_agent',
    }
  }
  // template
  return {
    type: 'template',
    id: '_draft',
    name: `${name}.hbs`,
    title: name,
  }
}
