import { createContext, useContext } from 'react';
import type { DistriHomeConfig } from './types';

export const DistriHomeContext = createContext<DistriHomeConfig | null>(null);

export function useDistriHome(): DistriHomeConfig {
  const ctx = useContext(DistriHomeContext);
  if (!ctx) {
    throw new Error('useDistriHome must be used within <DistriHomeProvider>');
  }
  return ctx;
}
