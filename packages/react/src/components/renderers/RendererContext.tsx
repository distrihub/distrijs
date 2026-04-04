import { createContext, useContext } from 'react';
import { RenderingMode, SummaryFn } from '@/types';

interface RendererContextValue {
  rendering: RenderingMode;
  toolSummaryOverrides: Record<string, SummaryFn>;
  onShowTrace?: (threadId: string) => void;
}

const defaultValue: RendererContextValue = {
  rendering: 'minimal',
  toolSummaryOverrides: {},
  onShowTrace: undefined,
};

export const RendererContext = createContext<RendererContextValue>(defaultValue);

export const useRendererContext = () => useContext(RendererContext);
