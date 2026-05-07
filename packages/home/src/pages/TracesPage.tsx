import { useState } from 'react';
import { TraceTimeline } from '../blocks/TraceTimeline';
import { TraceDetail } from '../blocks/TraceDetail';
import type { TraceSpan } from '../blocks/TraceTimeline';
import { useDistriHome } from '../provider/context';

/**
 * TracesPage — Tier-3 page that wires TraceTimeline + TraceDetail.
 * Clicking a trace row shows the detail panel in a side-by-side aside.
 * Consumer app is responsible for wrapping this in a layout shell.
 */
export function TracesPage() {
  useDistriHome(); // ensure context is present
  const [selectedSpan, setSelectedSpan] = useState<TraceSpan | null>(null);

  return (
    <div className="flex h-full min-h-0 w-full">
      {/* Left panel — trace list */}
      <div
        className={[
          'flex flex-col min-h-0 border-r border-border',
          selectedSpan ? 'w-80 shrink-0' : 'flex-1',
        ].join(' ')}
      >
        <div className="flex items-center justify-between border-b border-border/60 px-4 py-3 sm:px-6 shrink-0">
          <h1 className="text-base font-semibold sm:text-lg">Traces</h1>
        </div>
        <TraceTimeline
          className="flex-1 min-h-0"
          onSelectSpan={(span) => setSelectedSpan(span)}
        />
      </div>

      {/* Right panel — span detail */}
      {selectedSpan && (
        <aside className="w-96 shrink-0 flex flex-col min-h-0 overflow-hidden">
          <TraceDetail
            span={selectedSpan}
            onClose={() => setSelectedSpan(null)}
            className="flex-1 min-h-0 overflow-y-auto"
          />
        </aside>
      )}
    </div>
  );
}
