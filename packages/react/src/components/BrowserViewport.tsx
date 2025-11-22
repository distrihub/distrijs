import React from 'react'
import { useChatStateStore } from '../stores/chatStateStore'
import { BrowserPreviewPanel } from './BrowserPreviewPanel'
import { cn } from '@/lib/utils'

export interface BrowserViewportProps {
  className?: string
  emptyState?: React.ReactNode
  showTimestamp?: boolean
}

const DefaultEmptyState = () => (
  <div className="flex h-full flex-col items-center justify-center gap-2 text-center text-sm text-muted-foreground">
    <p>No browser preview yet.</p>
    <p className="text-xs text-muted-foreground/70">Run the bot to capture a live frame.</p>
  </div>
)

export const BrowserViewport: React.FC<BrowserViewportProps> = ({
  className,
  emptyState,
  showTimestamp = true,
}) => {
  const browserFrame = useChatStateStore((state) => state.browserFrame)
  const browserFrameUpdatedAt = useChatStateStore((state) => state.browserFrameUpdatedAt)

  if (!browserFrame) {
    return (
      <div
        className={cn(
          'h-full min-h-[220px] rounded-xl border border-dashed border-border/40 bg-muted/10 p-4',
          className,
        )}
      >
        {emptyState ?? <DefaultEmptyState />}
      </div>
    )
  }

  const timestampLabel = browserFrameUpdatedAt
    ? new Date(browserFrameUpdatedAt).toLocaleTimeString()
    : undefined

  return (
    <BrowserPreviewPanel
      frameSrc={browserFrame}
      timestampLabel={showTimestamp ? timestampLabel : undefined}
      className={cn('h-full', className)}
    />
  )
}

export default BrowserViewport
