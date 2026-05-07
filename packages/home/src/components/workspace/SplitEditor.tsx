// SplitEditor — workspace editor body. Two view modes: Preview / Edit.
//
// Preview composition:
//   workflow agents → <WorkflowAgentPreviewCard /> (DAG graph + metadata)
//   standard agents → <AgentPreviewCard /> + markdown body
//   skills          → <SkillPreviewCard /> + markdown body
//   templates       → no preview (handlebars source only)
//
// Edit mode is always Monaco (<CodeEditor />), with the language picked
// from the item kind: markdown / json / handlebars / script-language.

import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import {
  Layers,
  Zap,
  Sparkles,
  BookOpen,
  Folder,
  ChevronRight,
  Save,
  Pencil,
  Eye,
  Copy,
  Trash2,
  Loader2,
} from 'lucide-react'
import { EditorMode, WorkspaceItem } from './types'
import {
  createSkill,
  deleteAgent,
  deletePromptTemplate,
  deleteSkill,
  registerAgentMarkdown,
  updateSkill,
  upsertPromptTemplate,
} from '../../lib/api'
import { PageHeaderSlot } from '../PageHeader'
import { AgentPreviewCard } from './AgentPreviewCard'
import { SkillPreviewCard } from './SkillPreviewCard'
import { CodeEditor } from './CodeEditor'
import { WorkflowAgentPreviewCard } from './WorkflowAgentPreviewCard'
import { useDraftProposal } from '../../context/DraftProposalContext'
import {
  bodyFromProposal,
  proposalEntityMatchesItem,
  proposalTargetMatchesItem,
} from './draft-matching'
import { DraftBanner } from './DraftBanner'

function pathFor(
  item: WorkspaceItem,
  workspaceName: string,
): Array<{ label: string; tint?: string; Icon?: typeof Layers }> {
  const arr: Array<{ label: string; tint?: string; Icon?: typeof Layers }> = [
    { label: workspaceName, Icon: Layers },
  ]
  if (item.type === 'agent') arr.push({ label: 'agents', tint: 'text-amber-500', Icon: Zap })
  if (item.type === 'skill') arr.push({ label: 'skills', tint: 'text-violet-400', Icon: Sparkles })
  if (item.type === 'template') {
    arr.push({ label: 'templates', tint: 'text-cyan-400', Icon: BookOpen })
  }
  if (item.type === 'skill-file') {
    arr.push({ label: 'skills', tint: 'text-violet-400', Icon: Sparkles })
    if (item.parentSkillId) arr.push({ label: item.parentSkillId, Icon: Folder })
  }
  arr.push({ label: item.name ?? `${item.title}.md` })
  return arr
}

function defaultBody(item: WorkspaceItem): string {
  if (item.type === 'skill-file') return ''
  return `# ${item.title}\n\n${item.description ?? ''}`.trim()
}

/// Strip a leading `---` frontmatter block from a markdown source.
function stripFrontmatter(raw: string): string {
  const trimmed = raw.replace(/^\s+/, '')
  if (!trimmed.startsWith('---')) return raw
  const end = trimmed.indexOf('\n---', 3)
  if (end === -1) return raw
  return trimmed.slice(end + 4).replace(/^\n/, '')
}

function MarkdownPreview({ body }: { body: string }) {
  const cleaned = stripFrontmatter(body)
  // Styling comes from `.markdown-body` in index.css (we authored it
  // ourselves because @tailwindcss/typography wasn't compiling rules
  // in this dev setup — zero `.prose` selectors made it through).
  // remark-gfm enables GitHub-flavoured tables, strikethrough, task
  // lists, and autolinks. rehype-highlight tokenises fenced code blocks
  // (highlight.js theme imported in index.css).
  return (
    <div className="min-w-0 overflow-hidden px-6 py-4">
      <article className="markdown-body min-w-0 max-w-full">
        <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>
          {cleaned}
        </ReactMarkdown>
      </article>
    </div>
  )
}

function languageForItem(item: WorkspaceItem): string {
  if (item.type === 'agent' && item.agent_type === 'workflow_agent') return 'json'
  if (item.type === 'agent') return 'markdown'
  if (item.type === 'skill') return 'markdown'
  if (item.type === 'template') return 'handlebars'
  if (item.type === 'skill-file') {
    if (item.fileKind === 'skill-md') return 'markdown'
    return item.language || 'plaintext'
  }
  return 'plaintext'
}

type Props = {
  item: WorkspaceItem
  mode: EditorMode
  onMode: (m: EditorMode) => void
  workspaceName?: string
  /// Called after a successful Save/Clone so the parent can refetch the
  /// tree (newly-created items show up; updated metadata refreshes).
  onAfterMutate?: () => void
  /// Connections declared by the selected skill (from the skill's
  /// `agent_definition.connections`). Optional — populated lazily by
  /// WorkspacePage after fetching the skill detail.
  skillConnections?: Array<{ name: string; auth_type?: string }>
}

export function SplitEditor({ item, mode, onMode, workspaceName = 'workspace', onAfterMutate, skillConnections }: Props) {
  const navigate = useNavigate()
  const { proposal, clearProposal } = useDraftProposal()

  // Does the active proposal target this item? Edits/deletes match by
  // (entity,targetId); creates match by URL `_draft` segment, so they're
  // only "matched" via WorkspacePage's synthetic item with id === '_draft'.
  const proposalMatches = (() => {
    if (!proposal) return false
    if (proposal.kind === 'create') {
      // `create` proposals are constrained to 'agent' | 'skill' | 'template'.
      return item.id === '_draft' && proposalEntityMatchesItem(proposal.entity, item)
    }
    if (!proposal.targetId) return false
    return proposalTargetMatchesItem({ entity: proposal.entity, targetId: proposal.targetId }, item)
  })()

  const [proposalPending, setProposalPending] = useState(false)
  const [busy, setBusy] = useState<null | 'save' | 'clone' | 'delete'>(null)
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState<string | null>(null)
  const path = pathFor(item, workspaceName)
  const initialBody = useMemo(() => item.content ?? defaultBody(item), [item])
  // Live, editable buffer. Reset whenever the selected item changes (the
  // useMemo guarantees a new identity when item changes).
  const [draft, setDraft] = useState<string>(initialBody)
  useEffect(() => {
    setDraft(initialBody)
  }, [initialBody])
  // When a matching proposal arrives, replace the editor buffer with the
  // proposed body so the user reviews it in place. Re-run when the proposal
  // changes identity (so a new proposal substitutes a new body).
  useEffect(() => {
    if (!proposalMatches) return
    if (!proposal || proposal.kind === 'delete') return
    const proposed = bodyFromProposal(proposal.body)
    setDraft(proposed)
    if (mode !== 'markdown') onMode('markdown')
  }, [proposalMatches, proposal, mode, onMode])
  const body = draft
  const isWorkflowAgent = item.type === 'agent' && item.agent_type === 'workflow_agent'

  const flashStatus = (msg: string) => {
    setStatus(msg)
    window.setTimeout(() => setStatus((s) => (s === msg ? null : s)), 3000)
  }

  // What's actually editable on the server today:
  //   standard agents → POST /agents (text/markdown), upsert by name
  //   skills          → PUT  /skills/:id (JSON body)
  //   templates       → upsert by name via /prompt-templates
  //   skill-files     → SKILL.md leaf is the parent skill's content; route
  //                     through the parent skill's update path
  //   workflow agents → no JSON-update path yet; edit is preview-only.
  const canSave =
    (item.type === 'agent' && !isWorkflowAgent) ||
    item.type === 'skill' ||
    item.type === 'template' ||
    (item.type === 'skill-file' && item.fileKind === 'skill-md')
  // Clone + Delete: same set of types — system items can't be cloned
  // (`item.system` is true for nil-workspace rows; the user can't write
  // back into the system workspace) but for simplicity we still expose the
  // buttons and let the server reject if it does.
  const canClone =
    item.type === 'agent' ||
    item.type === 'skill' ||
    item.type === 'skill-file' ||
    item.type === 'template'
  const canDelete = canClone
  // Preview is meaningful only for markdown bodies. Templates are
  // Handlebars source — there's no rendered preview to show.
  const canPreview =
    item.type === 'agent' ||
    item.type === 'skill' ||
    (item.type === 'skill-file' && item.fileKind === 'skill-md')

  // Auto-correct stale mode state. WorkspacePage owns `mode` and keeps it
  // across selections, so when you jump from a previewable item (mode =
  // 'preview') to a template (canPreview === false) the toggle ends up
  // highlighting Preview while the body is rendering source. Force it
  // back to markdown whenever preview isn't valid for the current item.
  useEffect(() => {
    if (!canPreview && mode === 'preview') onMode('markdown')
  }, [canPreview, mode, onMode])

  const handleSave = async () => {
    setBusy('save')
    setError(null)
    try {
      if (item.type === 'agent') {
        await registerAgentMarkdown(body)
      } else if (item.type === 'skill') {
        await updateSkill(item.id, { content: stripFrontmatter(body) })
      } else if (item.type === 'skill-file' && item.fileKind === 'skill-md' && item.parentSkillId) {
        // Editor body has a synthesised frontmatter block prepended; the
        // server's `content` column stores only the body, so strip before
        // sending. Frontmatter fields aren't yet editable through here.
        await updateSkill(item.parentSkillId, { content: stripFrontmatter(body) })
      } else if (item.type === 'template') {
        await upsertPromptTemplate({ name: item.title, template: body })
      }
      flashStatus('Saved')
      onAfterMutate?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed')
    } finally {
      setBusy(null)
    }
  }

  const handleClone = async () => {
    setBusy('clone')
    setError(null)
    try {
      if (item.type === 'agent') {
        // The agent's authoritative form is the markdown body. Replace the
        // frontmatter `name = "..."` with `<n>_clone` and re-register;
        // the server upserts by name so a new row is created.
        const m = body.match(/^\s*name\s*=\s*"([^"]+)"/m)
        const newName = m ? `${m[1]}_clone` : `${item.title}_clone`
        const cloned = body.replace(
          /^(\s*name\s*=\s*")([^"]+)(")/m,
          (_, a, _n, c) => `${a}${newName}${c}`,
        )
        await registerAgentMarkdown(cloned)
        flashStatus(`Cloned to ${newName}`)
        onAfterMutate?.()
        navigate(`/workspace/agents/${encodeURIComponent(newName)}`)
      } else if (item.type === 'skill' || item.type === 'skill-file') {
        const sourceName =
          item.type === 'skill' ? item.title : (item.parentSkillId ?? item.title)
        const newName = `${sourceName}-clone`
        const created = await createSkill({
          name: newName,
          description: item.description,
          content: stripFrontmatter(body),
          tags: item.tags ?? [],
          is_public: false,
        })
        const newId = (created as { id?: string } | null)?.id ?? newName
        flashStatus(`Cloned to ${newName}`)
        onAfterMutate?.()
        navigate(`/workspace/skills/${encodeURIComponent(newId)}`)
      } else if (item.type === 'template') {
        const newName = `${item.title}-clone`
        await upsertPromptTemplate({ name: newName, template: body })
        flashStatus(`Cloned to ${newName}`)
        onAfterMutate?.()
        navigate(`/workspace/templates/${encodeURIComponent(newName)}`)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Clone failed')
    } finally {
      setBusy(null)
    }
  }

  const handleDelete = async () => {
    const label =
      item.type === 'skill-file' ? `the skill "${item.parentSkillId}"` : `"${item.title}"`
    if (!window.confirm(`Delete ${label}? This cannot be undone.`)) return
    setBusy('delete')
    setError(null)
    try {
      if (item.type === 'agent') {
        await deleteAgent(item.title)
        flashStatus('Deleted')
        onAfterMutate?.()
        navigate('/workspace/agents')
      } else if (item.type === 'skill') {
        await deleteSkill(item.id)
        flashStatus('Deleted')
        onAfterMutate?.()
        navigate('/workspace/skills')
      } else if (item.type === 'skill-file' && item.parentSkillId) {
        await deleteSkill(item.parentSkillId)
        flashStatus('Deleted')
        onAfterMutate?.()
        navigate('/workspace/skills')
      } else if (item.type === 'template') {
        await deletePromptTemplate(item.id)
        flashStatus('Deleted')
        onAfterMutate?.()
        navigate('/workspace/templates')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed')
    } finally {
      setBusy(null)
    }
  }

  return (
    <main className="flex h-full min-h-0 min-w-0 flex-1 flex-col">
      {/* LEFT slot: breadcrumb + view toggle. Type chip removed — it
          looked like a clickable button without doing anything. The
          view toggle (Preview / Edit) lives here next to the path so
          that "what I'm looking at" reads from left to right and the
          right slot is reserved for write actions. */}
      <PageHeaderSlot side="left">
        <div className="flex min-w-0 flex-1 items-center gap-2 text-xs">
          <div className="flex min-w-0 flex-1 items-center gap-1 truncate">
            {path.map((p, i) => (
              <span key={i} className="flex shrink-0 items-center gap-1 last:min-w-0">
                {i > 0 && <ChevronRight className="h-3 w-3 text-muted-foreground/60" />}
                {p.Icon && <p.Icon className={`h-3 w-3 ${p.tint ?? 'text-muted-foreground'}`} />}
                <span
                  className={`truncate ${i === path.length - 1 ? 'font-medium' : 'text-muted-foreground'
                    }`}
                >
                  {p.label}
                </span>
              </span>
            ))}
          </div>
          {/* View toggle — Preview (Eye) | Edit (Pencil). Auto-corrects
              to markdown when canPreview goes false (useEffect above). */}
          <div className="inline-flex shrink-0 items-center rounded-md border border-border bg-background p-0.5">
            <button
              onClick={() => onMode('preview')}
              disabled={!canPreview}
              title={canPreview ? 'Preview' : 'Preview unavailable for this file type'}
              aria-label="Preview"
              aria-pressed={mode === 'preview'}
              className={`inline-flex items-center justify-center rounded p-1 disabled:cursor-not-allowed disabled:opacity-40 ${mode === 'preview'
                ? 'bg-accent text-foreground'
                : 'text-muted-foreground hover:text-foreground'
                }`}
            >
              <Eye className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => onMode('markdown')}
              title="Edit markdown source"
              aria-label="Edit markdown source"
              aria-pressed={mode === 'markdown'}
              className={`inline-flex items-center justify-center rounded p-1 ${mode === 'markdown'
                ? 'bg-accent text-foreground'
                : 'text-muted-foreground hover:text-foreground'
                }`}
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </PageHeaderSlot>

      {/* RIGHT slot: status + write actions only. Clone & Delete are
          icon-only to match the rest of the toolbar; Save keeps its
          label as the primary CTA. Delete uses a tinted background
          rather than just a thin border so it's actually visible. */}
      <PageHeaderSlot side="right">
        <div className="flex shrink-0 items-center gap-2">
          {status && <span className="text-[11px] text-emerald-500">✓ {status}</span>}
          {error && <span className="text-[11px] text-destructive">{error}</span>}
          {canClone && (
            <button
              onClick={handleClone}
              disabled={busy !== null}
              title="Clone — create a copy in this workspace"
              aria-label="Clone"
              className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded border border-border text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-50"
            >
              {busy === 'clone' ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
            </button>
          )}
          {canDelete && (
            <button
              onClick={handleDelete}
              disabled={busy !== null}
              title="Delete from this workspace"
              aria-label="Delete"
              className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded border border-destructive/40 bg-destructive/10 text-destructive hover:bg-destructive hover:text-destructive-foreground disabled:opacity-50"
            >
              {busy === 'delete' ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Trash2 className="h-3.5 w-3.5" />
              )}
            </button>
          )}
          {canSave && mode === 'markdown' && (
            <button
              onClick={handleSave}
              disabled={busy !== null}
              className="inline-flex shrink-0 items-center gap-1 rounded bg-primary px-2.5 py-1 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              <Save className="h-3 w-3" /> {busy === 'save' ? 'Saving…' : 'Save'}
            </button>
          )}
        </div>
      </PageHeaderSlot>

      {/* Body. Preview branches by item kind:
            workflow agents → DAG card (no markdown body)
            standard agents → AgentPreviewCard + markdown body
            skills          → SkillPreviewCard + markdown body
            templates       → no preview; falls through to editor
          Edit mode is always Monaco via CodeEditor with the right language. */}
      <div className="flex-1 min-h-0 min-w-0 overflow-auto bg-background">
        {proposalMatches && proposal && (
          <DraftBanner
            kind={proposal.kind}
            entityLabel={proposal.entity === 'skill-file' ? 'skill' : proposal.entity}
            targetName={proposal.kind !== 'create' ? proposal.targetId : undefined}
            pending={proposalPending}
            onConfirm={async () => {
              setProposalPending(true)
              try {
                if (proposal.kind === 'delete') {
                  proposal.confirm()
                } else {
                  // For edit/create, send back the (possibly user-tweaked) body.
                  // Wrap as { content: ... } if the original was an object with
                  // a content key (skills/agents); otherwise pass the raw string.
                  const original = proposal.body as Record<string, unknown> | undefined
                  const finalBody =
                    original && typeof original === 'object' && 'content' in original
                      ? { ...original, content: stripFrontmatter(draft) }
                      : draft
                  proposal.confirm(finalBody)
                }
                clearProposal()
              } finally {
                setProposalPending(false)
              }
            }}
            onDiscard={() => {
              proposal.discard()
              clearProposal()
            }}
          />
        )}
        {
          mode === 'preview' && isWorkflowAgent ? (
            <div className="flex flex-col gap-4 p-4">
              <WorkflowAgentPreviewCard agentId={item.title} />
            </div>
          ) : mode === 'preview' && item.type === 'agent' ? (
            <div className="flex flex-col gap-4 p-4">
              <AgentPreviewCard agentId={item.title} />
              <article className="markdown-body min-w-0 max-w-full">
                <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>
                  {stripFrontmatter(body)}
                </ReactMarkdown>
              </article>
            </div>
          ) : mode === 'preview' && (item.type === 'skill' || item.type === 'skill-file') ? (
            <div className="flex flex-col gap-4 p-4">
              <SkillPreviewCard
                item={
                  item.type === 'skill-file' && item.parentSkillId
                    ? { ...item, title: item.parentSkillId }
                    : item
                }
                connections={skillConnections}
              />
              <article className="markdown-body min-w-0 max-w-full">
                <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>
                  {stripFrontmatter(body)}
                </ReactMarkdown>
              </article>
            </div>
          ) : mode === 'preview' && canPreview ? (
            <MarkdownPreview body={body} />
          ) : (
            <CodeEditor
              language={languageForItem(item)}
              value={body}
              onChange={setDraft}
              readOnly={!canSave}
            />
          )
        }
      </div >
    </main >
  )
}
