import { createContext, ReactNode, useContext, useMemo } from 'react';
import { Platform } from 'react-native';
import type { StyleProp, TextStyle, ViewStyle } from 'react-native';

/**
 * Design tokens every native renderer reads. Apps pass a partial theme to
 * `DistriNativeProvider`; anything omitted keeps the default.
 */
export interface DistriNativeTheme {
  colors: {
    background: string;
    surface: string;
    text: string;
    mutedText: string;
    border: string;
    primary: string;
    onPrimary: string;
    userBubble: string;
    userText: string;
    assistantBubble: string;
    assistantBorder: string;
    assistantText: string;
    /** List markers, links and loading dots. */
    accent: string;
    danger: string;
    codeBackground: string;
  };
  fonts: {
    body?: string;
    heading?: string;
    mono: string;
  };
  fontSizes: {
    body: number;
    small: number;
    heading: number;
  };
  lineHeight: number;
  radii: {
    bubble: number;
    card: number;
    input: number;
    button: number;
  };
  /** Per-slot style overrides, applied after the token-derived styles. */
  styles: DistriNativeStyleOverrides;
}

export interface DistriNativeStyleOverrides {
  list?: StyleProp<ViewStyle>;
  userBubble?: StyleProp<ViewStyle>;
  assistantBubble?: StyleProp<ViewStyle>;
  userText?: StyleProp<TextStyle>;
  assistantText?: StyleProp<TextStyle>;
  composer?: StyleProp<ViewStyle>;
  input?: StyleProp<TextStyle>;
  sendButton?: StyleProp<ViewStyle>;
  sendButtonText?: StyleProp<TextStyle>;
  toolCard?: StyleProp<ViewStyle>;
  loadingStrip?: StyleProp<ViewStyle>;
}

type DeepPartial<T> = { [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K] };
export type DistriNativeThemeInput = DeepPartial<Omit<DistriNativeTheme, 'styles'>> & {
  styles?: DistriNativeStyleOverrides;
};

export const defaultNativeTheme: DistriNativeTheme = {
  colors: {
    background: '#f8fafc',
    surface: '#ffffff',
    text: '#111827',
    mutedText: '#475569',
    border: '#cbd5e1',
    primary: '#1d4ed8',
    onPrimary: '#ffffff',
    userBubble: '#1d4ed8',
    userText: '#ffffff',
    assistantBubble: '#ffffff',
    assistantBorder: '#e2e8f0',
    assistantText: '#111827',
    accent: '#1d4ed8',
    danger: '#b91c1c',
    codeBackground: '#eef2f7',
  },
  // iOS has no generic 'monospace' family.
  fonts: { mono: Platform.select({ ios: 'Menlo', default: 'monospace' }) },
  fontSizes: { body: 15, small: 12, heading: 17 },
  lineHeight: 21,
  radii: { bubble: 16, card: 12, input: 12, button: 12 },
  styles: {},
};

export function createNativeTheme(input?: DistriNativeThemeInput): DistriNativeTheme {
  if (!input) return defaultNativeTheme;
  return {
    colors: { ...defaultNativeTheme.colors, ...input.colors },
    fonts: { ...defaultNativeTheme.fonts, ...input.fonts },
    fontSizes: { ...defaultNativeTheme.fontSizes, ...input.fontSizes },
    lineHeight: input.lineHeight ?? defaultNativeTheme.lineHeight,
    radii: { ...defaultNativeTheme.radii, ...input.radii },
    styles: { ...defaultNativeTheme.styles, ...input.styles },
  };
}

const ThemeContext = createContext<DistriNativeTheme>(defaultNativeTheme);

/** Supplies a theme to native renderers. `DistriNativeProvider` wraps this for you. */
export function DistriThemeProvider({ theme, children }: { theme?: DistriNativeThemeInput; children: ReactNode }) {
  const value = useMemo(() => createNativeTheme(theme), [theme]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useDistriTheme(): DistriNativeTheme {
  return useContext(ThemeContext);
}
