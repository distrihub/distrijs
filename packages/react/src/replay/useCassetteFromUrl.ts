import { useEffect, useState } from 'react';
import { parseCassette } from './cassette';
import type { Cassette } from './types';

export interface UseCassetteFromUrlResult {
  cassette: Cassette | null;
  error: Error | null;
  loading: boolean;
}

/**
 * Fetches and validates a `Cassette` JSON document from a URL — the "data
 * url" a real thread is exported to (e.g. distri-cloud's
 * `GET /v1/public/threads/{id}/cassette`), as opposed to a statically
 * bundled demo cassette. Feed the result straight into `useReplay`, which
 * tolerates `cassette: null` while this is still loading.
 */
export function useCassetteFromUrl(dataUrl: string | null | undefined): UseCassetteFromUrlResult {
  const [state, setState] = useState<UseCassetteFromUrlResult>({
    cassette: null,
    error: null,
    loading: Boolean(dataUrl),
  });

  useEffect(() => {
    if (!dataUrl) {
      setState({ cassette: null, error: null, loading: false });
      return undefined;
    }

    let cancelled = false;
    setState({ cassette: null, error: null, loading: true });

    fetch(dataUrl)
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to load cassette from ${dataUrl}: HTTP ${res.status}`);
        return res.json();
      })
      .then((raw) => {
        if (cancelled) return;
        setState({ cassette: parseCassette(raw), error: null, loading: false });
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setState({ cassette: null, error: err instanceof Error ? err : new Error(String(err)), loading: false });
      });

    return () => {
      cancelled = true;
    };
  }, [dataUrl]);

  return state;
}
