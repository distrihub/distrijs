import React, { createContext, useContext, ReactNode } from 'react';

export type ChatTheme = 'light' | 'dark' | 'auto';

export interface ChatConfig {
  theme: ChatTheme;
  showDebug: boolean;
  autoScroll: boolean;
  showTimestamps: boolean;
  enableMarkdown: boolean;
  enableCodeHighlighting: boolean;
}

export interface ChatContextValue {
  config: ChatConfig;
  updateConfig: (updates: Partial<ChatConfig>) => void;
}

const defaultConfig: ChatConfig = {
  theme: 'auto',
  showDebug: false,
  autoScroll: true,
  showTimestamps: true,
  enableMarkdown: true,
  enableCodeHighlighting: true,
};

const ChatContext = createContext<ChatContextValue | null>(null);

export interface ChatProviderProps {
  children: ReactNode;
  config?: Partial<ChatConfig>;
}

export const ChatProvider: React.FC<ChatProviderProps> = ({ 
  children, 
  config: initialConfig = {} 
}) => {
  const [config, setConfig] = React.useState<ChatConfig>({
    ...defaultConfig,
    ...initialConfig,
  });

  const updateConfig = React.useCallback((updates: Partial<ChatConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }));
  }, []);

  const value: ChatContextValue = {
    config,
    updateConfig,
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChatConfig = (): ChatContextValue => {
  const context = useContext(ChatContext);
  if (!context) {
    // Return default values if used outside provider
    return {
      config: defaultConfig,
      updateConfig: () => {},
    };
  }
  return context;
};

/**
 * Utility function to get theme classes for components
 */
export const getThemeClasses = (theme: ChatTheme): string => {
  switch (theme) {
    case 'dark':
      return 'dark';
    case 'light':
      return '';
    case 'auto':
    default:
      // Use system preference
      return typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches 
        ? 'dark' 
        : '';
  }
};