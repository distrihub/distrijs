import { useCallback, useEffect, useRef, useState } from 'react';
import { decodeA2AStreamEvent } from '@distri/core';
import type { DistriChatMessage } from '@distri/core';
import { useDistriNative } from './DistriNativeProvider';

export interface UseThreadHistoryResult {
  messages: DistriChatMessage[];
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
}

/**
 * A thread's stored transcript, decoded the way `@distri/react` does
 * (`decodeA2AStreamEvent` over every item), so events and messages both come
 * back. Pass `messages` to `Chat` as `initialMessages` once `loading` is false.
 */
export function useThreadHistory(threadId: string | null | undefined): UseThreadHistoryResult {
  const { client } = useDistriNative();
  const [messages, setMessages] = useState<DistriChatMessage[]>([]);
  // The thread `messages` was loaded for; anything else is stale.
  const [loadedFor, setLoadedFor] = useState<string | null>(null);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  // Only the latest request may write state, so a slow answer for a thread
  // the caller has already left can't replace the current one.
  const requestSeq = useRef(0);

  const refresh = useCallback(async () => {
    const seq = ++requestSeq.current;
    if (!client || !threadId) {
      setMessages([]);
      setLoadedFor(null);
      setFetching(false);
      return;
    }
    setFetching(true);
    try {
      const raw = await client.getThreadMessages(threadId);
      if (seq !== requestSeq.current) return;
      setMessages(raw.map(decodeA2AStreamEvent).filter((m): m is DistriChatMessage => Boolean(m)));
      setError(null);
    } catch (err) {
      if (seq !== requestSeq.current) return;
      // A thread that has never been written to has no history yet.
      setMessages([]);
      setError(err instanceof Error ? err : new Error('Failed to load conversation'));
    } finally {
      if (seq === requestSeq.current) {
        setLoadedFor(threadId);
        setFetching(false);
      }
    }
  }, [client, threadId]);

  useEffect(() => { void refresh(); }, [refresh]);

  // On the render where `threadId` changes, the effect hasn't run yet; report
  // loading with no messages rather than the previous thread's transcript.
  const current = Boolean(threadId) && loadedFor === threadId;
  const loading = fetching || (Boolean(client && threadId) && !current);

  return { messages: current ? messages : [], loading, error: current ? error : null, refresh };
}
