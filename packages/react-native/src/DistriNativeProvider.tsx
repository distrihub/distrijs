import { createContext, ReactNode, useContext, useMemo } from 'react';
import { DistriClient, DistriClientConfig } from '@distri/core';
import { DistriNativeThemeInput, DistriThemeProvider } from './theme';

export interface DistriNativeContextValue {
  client: DistriClient | null;
  error: Error | null;
  isLoading: boolean;
}

const DistriNativeContext = createContext<DistriNativeContextValue | null>(null);

export interface DistriNativeProviderProps {
  config: DistriClientConfig;
  /** Colours, fonts, radii and per-slot style overrides for every native renderer. */
  theme?: DistriNativeThemeInput;
  children: ReactNode;
}

/** Creates the shared API client. Pass access tokens from secure app storage. */
export function DistriNativeProvider({ config, theme, children }: DistriNativeProviderProps) {
  const value = useMemo<DistriNativeContextValue>(() => {
    try {
      return { client: new DistriClient(config), error: null, isLoading: false };
    } catch (error) {
      return {
        client: null,
        error: error instanceof Error ? error : new Error('Failed to initialize Distri client'),
        isLoading: false,
      };
    }
  }, [config]);

  return (
    <DistriNativeContext.Provider value={value}>
      <DistriThemeProvider theme={theme}>{children}</DistriThemeProvider>
    </DistriNativeContext.Provider>
  );
}

export function useDistriNative(): DistriNativeContextValue {
  const context = useContext(DistriNativeContext);
  if (!context) {
    throw new Error('useDistriNative must be used inside a <DistriNativeProvider>.');
  }
  return context;
}
