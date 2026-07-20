import { useEffect, useRef, useState } from 'react';
import { useReplay, type UseReplayOptions, type UseReplayResult } from './useReplay';
import type { Cassette } from './types';

const VALID_SPEEDS = [1, 1.5, 2];

function readSpeedFromUrl(): number | undefined {
  if (typeof window === 'undefined') return undefined;
  const raw = Number(new URLSearchParams(window.location.search).get('speed'));
  return VALID_SPEEDS.includes(raw) ? raw : undefined;
}

function writeSpeedToUrl(speed: number) {
  if (typeof window === 'undefined') return;
  const params = new URLSearchParams(window.location.search);
  params.set('speed', String(speed));
  // `replaceState`, not `pushState` — cycling speed shouldn't spam the
  // back-button history the way selecting a different sample/component does.
  window.history.replaceState(null, '', `?${params.toString()}`);
}

/**
 * `useReplay`, but the playback speed is read from the URL once on mount
 * (so a shared link opens at the same speed the sender was watching at) and
 * written back whenever the user cycles it via `ReplayScrubber`, so every
 * demo's URL fully describes what's on screen. `cassette` may be `null`
 * while a `dataUrl` source is still loading.
 */
export function useUrlSyncedReplay(cassette: Cassette | null, options: UseReplayOptions = {}): UseReplayResult {
  const [initialSpeed] = useState(() => readSpeedFromUrl() ?? options.speed ?? 1);
  const replay = useReplay(cassette, { ...options, speed: initialSpeed });

  const mounted = useRef(false);
  useEffect(() => {
    if (!mounted.current) {
      // Skip the mount-time run: `replay.speed` here is just `initialSpeed`
      // echoed back, writing it out would be a no-op at best and would
      // needlessly add `speed=1` to every demo's URL at worst.
      mounted.current = true;
      return;
    }
    writeSpeedToUrl(replay.speed);
  }, [replay.speed]);

  return replay;
}
