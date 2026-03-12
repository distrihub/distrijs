import { useCallback, useRef, useState } from 'react';
import type { ContextCompactionEvent, ContextHealth } from '@distri/core';

/**
 * Hook that tracks context health by listening for ContextCompaction events
 * in the agent event stream.
 *
 * Usage:
 * ```tsx
 * const { contextHealth, lastCompaction, isCompacting } = useContextHealth();
 * ```
 *
 * This hook maintains a running picture of context usage. It updates whenever
 * a `context_compaction` event is received from the server event stream.
 */
export function useContextHealth() {
  const [contextHealth, setContextHealth] = useState<ContextHealth | null>(null);
  const [isCompacting, setIsCompacting] = useState(false);
  const lastCompactionRef = useRef<ContextCompactionEvent | null>(null);

  /**
   * Process a raw event from the agent stream.
   * Call this from your event handling loop when you receive task status updates.
   */
  const handleEvent = useCallback((event: Record<string, unknown>) => {
    if (event?.type !== 'context_compaction') return;

    const compactionEvent = event as unknown as ContextCompactionEvent;
    lastCompactionRef.current = compactionEvent;

    setContextHealth({
      usage_ratio: compactionEvent.tokens_after / compactionEvent.context_limit,
      tokens_used: compactionEvent.tokens_after,
      tokens_limit: compactionEvent.context_limit,
      last_compaction: compactionEvent,
    });

    // Brief compacting state for UI transitions
    setIsCompacting(true);
    setTimeout(() => setIsCompacting(false), 1500);
  }, []);

  /**
   * Reset context health (e.g., on new thread).
   */
  const reset = useCallback(() => {
    setContextHealth(null);
    lastCompactionRef.current = null;
    setIsCompacting(false);
  }, []);

  return {
    /** Current context health snapshot, or null if no compaction has occurred yet */
    contextHealth,
    /** The most recent compaction event */
    lastCompaction: lastCompactionRef.current,
    /** Whether a compaction just occurred (true for ~1.5s after event) */
    isCompacting,
    /** Call with raw event objects from the stream to update health */
    handleEvent,
    /** Reset state (e.g., when switching threads) */
    reset,
  };
}
