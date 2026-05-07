// Pure helpers for matching a DraftProposal against the WorkspaceItem
// currently open in SplitEditor, and for unwrapping a proposal body to
// the editor's string buffer. Lives in its own module so the unit tests
// can import without dragging in Monaco / @distri/react.

import type { WorkspaceItem } from './types'

export function proposalEntityMatchesItem(
  entity: 'agent' | 'skill' | 'template',
  item: WorkspaceItem,
): boolean {
  if (entity === 'agent') return item.type === 'agent'
  if (entity === 'skill') return item.type === 'skill' || item.type === 'skill-file'
  return item.type === 'template'
}

export function proposalTargetMatchesItem(
  proposal: { entity: 'agent' | 'skill' | 'skill-file' | 'template'; targetId: string },
  item: WorkspaceItem,
): boolean {
  if (proposal.entity === 'agent' && item.type === 'agent') {
    return item.title === proposal.targetId || item.id === proposal.targetId
  }
  if ((proposal.entity === 'skill' || proposal.entity === 'skill-file') &&
      (item.type === 'skill' || item.type === 'skill-file')) {
    const skillId = item.type === 'skill-file' ? item.parentSkillId : item.id
    return skillId === proposal.targetId
  }
  if (proposal.entity === 'template' && item.type === 'template') {
    return item.title === proposal.targetId || item.id === proposal.targetId
  }
  return false
}

/// The proposal body for skills/agents/templates is `{ content: <markdown> }`.
/// For workflow agents it's a JSON object. Render as a string suitable for
/// the markdown/JSON editor.
export function bodyFromProposal(raw: unknown): string {
  if (typeof raw === 'string') return raw
  if (raw && typeof raw === 'object') {
    const content = (raw as Record<string, unknown>).content
    if (typeof content === 'string') return content
    return JSON.stringify(raw, null, 2)
  }
  return ''
}
