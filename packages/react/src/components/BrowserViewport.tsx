import React from 'react'
import { useChatStateStore } from '../stores/chatStateStore'
import { cn } from '@/lib/utils'

export interface BrowserViewportProps {
  className?: string
  emptyState?: React.ReactNode
  /** Optional custom viewer URL override */
  viewerUrl?: string
}

const DefaultEmptyState = () => (
  <div className="flex h-full flex-col items-center justify-center gap-2 text-center text-sm text-muted-foreground">
    <p>No browser session.</p>
    <p className="text-xs text-muted-foreground/70">Browser will appear here when an agent uses it.</p>
  </div>
)

export const BrowserViewport: React.FC<BrowserViewportProps> = ({
  className,
  emptyState,
  viewerUrl: viewerUrlOverride,
}) => {
  const browserViewerUrl = useChatStateStore((state) => state.browserViewerUrl)
  const browserSessionId = useChatStateStore((state) => state.browserSessionId)

  const effectiveViewerUrl = viewerUrlOverride || browserViewerUrl

  // Show iframe when we have a viewer URL
  if (effectiveViewerUrl) {
    return (
      <div
        className={cn(
          'relative h-full min-h-[400px] w-full overflow-hidden rounded-xl border border-border/40 bg-background',
          className,
        )}
      >
        {browserSessionId && (
          <div className="absolute left-2 top-2 z-10 rounded-md bg-background/90 px-2 py-1 text-xs text-muted-foreground backdrop-blur-sm">
            Session: {browserSessionId}
          </div>
        )}
        <iframe
          src={effectiveViewerUrl}
          className="h-full w-full border-0"
          title="Browser Viewer"
          sandbox="allow-scripts allow-same-origin allow-forms"
        />
      </div>
    )
  }

  // Empty state when no browser session
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

export default BrowserViewport
