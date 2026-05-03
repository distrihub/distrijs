import { createContext, useContext } from 'react';
import type { DistriHomeConfig } from './types';
import type { DistriHomeClient } from '../DistriHomeClient';

export const DistriHomeContext = createContext<DistriHomeConfig | null>(null);

export function useDistriHome(): DistriHomeConfig {
  const ctx = useContext(DistriHomeContext);
  if (!ctx) {
    throw new Error('useDistriHome must be used within <DistriHomeProvider>');
  }
  return ctx;
}

/**
 * Returns the DistriHomeClient provided via <DistriHomeProvider config={{ homeClient }}>.
 * Returns null if no homeClient was provided. Callers should guard: if (!client) return.
 */
export function useDistriHomeClient(): DistriHomeClient | null {
  const ctx = useDistriHome();
  return ctx.homeClient ?? null;
}

/**
 * Returns the navigate callback provided via <DistriHomeProvider config={{ navigate }}>.
 * Falls back to a no-op so pages that only use react-router's useNavigate don't break.
 * @deprecated Prefer useNavigate() from react-router-dom directly.
 */
export function useDistriHomeNavigate(): (path: string) => void {
  const ctx = useDistriHome();
  return ctx.navigate ?? (() => {});
}
