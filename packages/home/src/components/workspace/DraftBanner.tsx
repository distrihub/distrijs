// DraftBanner — sticky banner shown above the SplitEditor body when an
// agent-proposed draft is active for the open item. Pure presentation;
// the parent owns the proposal and supplies confirm/discard callbacks.

import { Loader2, Save, Trash2, X } from 'lucide-react'

export type DraftBannerProps = {
  kind: 'edit' | 'create' | 'delete'
  entityLabel: string  // e.g. "skill", "agent"
  targetName?: string  // e.g. "qa-loop" — shown in delete prompt
  pending?: boolean
  onConfirm: () => void
  onDiscard: () => void
}

export function DraftBanner({
  kind,
  entityLabel,
  targetName,
  pending,
  onConfirm,
  onDiscard,
}: DraftBannerProps) {
  const isDelete = kind === 'delete'
  const baseClass = isDelete
    ? 'border-red-500/30 bg-red-500/10 text-red-200'
    : 'border-violet-500/30 bg-violet-500/10 text-violet-100'

  const label =
    kind === 'create'
      ? `Distri proposed a new ${entityLabel}`
      : kind === 'edit'
        ? `Distri proposed changes to this ${entityLabel}`
        : `Delete ${entityLabel}${targetName ? ` ${targetName}` : ''}?`

  const confirmLabel = isDelete ? 'Delete' : 'Save'
  const discardLabel = isDelete ? 'Keep' : 'Discard'
  const ConfirmIcon = isDelete ? Trash2 : Save

  return (
    <div
      className={`sticky top-0 z-10 flex items-center justify-between gap-3 border-b px-4 py-2 text-sm ${baseClass}`}
      role="status"
      aria-live="polite"
    >
      <span className="truncate">{label}</span>
      <div className="flex shrink-0 items-center gap-2">
        <button
          type="button"
          disabled={pending}
          onClick={onDiscard}
          className="inline-flex items-center gap-1 rounded-md border border-current/30 bg-transparent px-2 py-1 text-xs font-medium hover:bg-white/5 disabled:opacity-50"
        >
          <X className="h-3.5 w-3.5" />
          <span>{discardLabel}</span>
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={onConfirm}
          className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold disabled:opacity-50 ${
            isDelete
              ? 'bg-red-500 text-white hover:bg-red-600'
              : 'bg-violet-500 text-white hover:bg-violet-600'
          }`}
        >
          {pending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <ConfirmIcon className="h-3.5 w-3.5" />
          )}
          <span>{confirmLabel}</span>
        </button>
      </div>
    </div>
  )
}
