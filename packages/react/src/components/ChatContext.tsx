import React, { createContext, useContext, ReactNode } from 'react';

export type ChatTheme = 'light' | 'dark' | 'chatgpt';

export interface ChatConfig {
  theme: ChatTheme;
  showDebugMessages: boolean;
  enableCodeHighlighting: boolean;
  enableMarkdown: boolean;
  maxMessageWidth: string;
  borderRadius: string;
  spacing: string;
}

export interface ChatContextValue {
  config: ChatConfig;
  updateConfig: (updates: Partial<ChatConfig>) => void;
}

const defaultConfig: ChatConfig = {
  theme: 'chatgpt',
  showDebugMessages: false,
  enableCodeHighlighting: true,
  enableMarkdown: true,
  maxMessageWidth: '80%',
  borderRadius: '2xl',
  spacing: '4',
};

const ChatContext = createContext<ChatContextValue | null>(null);

export interface ChatProviderProps {
  children: ReactNode;
  config?: Partial<ChatConfig>;
}

export function ChatProvider({ children, config: initialConfig }: ChatProviderProps) {
  const [config, setConfig] = React.useState<ChatConfig>({
    ...defaultConfig,
    ...initialConfig,
  });

  const updateConfig = React.useCallback((updates: Partial<ChatConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }));
  }, []);

  return (
    <ChatContext.Provider value={{ config, updateConfig }}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChatConfig(): ChatContextValue {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChatConfig must be used within a ChatProvider');
  }
  return context;
}

// Theme utilities
export const getThemeClasses = (theme: ChatTheme) => {
  switch (theme) {
    case 'dark':
      return {
        background: 'bg-gray-900',
        surface: 'bg-gray-800',
        text: 'text-gray-100',
        textSecondary: 'text-gray-400',
        border: 'border-gray-700',
        userBubble: 'bg-blue-600 text-white',
        assistantBubble: 'bg-gray-700 text-gray-100',
        avatar: {
          user: 'bg-blue-600',
          assistant: 'bg-gray-600',
        },
      };
    case 'light':
      return {
        background: 'bg-white',
        surface: 'bg-gray-50',
        text: 'text-gray-900',
        textSecondary: 'text-gray-600',
        border: 'border-gray-200',
        userBubble: 'bg-blue-500 text-white',
        assistantBubble: 'bg-gray-100 text-gray-900',
        avatar: {
          user: 'bg-blue-500',
          assistant: 'bg-gray-300',
        },
      };
    case 'chatgpt':
    default:
      return {
        background: 'bg-white',
        surface: 'bg-gray-50/50',
        text: 'text-gray-900',
        textSecondary: 'text-gray-600',
        border: 'border-gray-200',
        userBubble: 'bg-gray-900 text-white',
        assistantBubble: 'bg-white text-gray-900 border border-gray-200',
        avatar: {
          user: 'bg-gray-900',
          assistant: 'bg-green-600',
        },
      };
  }
};