import { useParams } from 'react-router-dom';
import { ThreadView } from '../blocks/ThreadView';

/**
 * ThreadDetailPage — Tier-3 page that renders a single thread by ID.
 *
 * URL params (path):
 *   :threadId — the thread to display
 *
 * Delegates all loading / error / rendering logic to the ThreadView block.
 * Consumer app is responsible for wrapping this in a layout shell.
 */
export function ThreadDetailPage() {
  const { id = '', threadId = '' } = useParams<{ id?: string; threadId?: string }>();
  const resolvedThreadId = threadId || id;

  return (
    <div className="flex h-full w-full flex-col bg-slate-950 text-slate-50">
      <ThreadView threadId={resolvedThreadId} className="flex-1" />
    </div>
  );
}
