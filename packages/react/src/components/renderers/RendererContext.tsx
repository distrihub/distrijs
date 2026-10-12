import { createContext, useContext } from 'react';
import { RenderingMode, SummaryFn, MarkdownComponentMap } from '@/types';

interface RendererContextValue {
  rendering: RenderingMode;
  toolSummaryOverrides: Record<string, SummaryFn>;
  onShowTrace?: (threadId: string) => void;
  threadId?: string;
  /** Host overrides merged over the built-in react-markdown `components`. */
  markdownComponents?: MarkdownComponentMap;
}

const defaultValue: RendererContextValue = {
  rendering: 'minimal',
  toolSummaryOverrides: {},
  onShowTrace: undefined,
  threadId: undefined,
};

export const RendererContext = createContext<RendererContextValue>(defaultValue);

export const useRendererContext = () => useContext(RendererContext);
