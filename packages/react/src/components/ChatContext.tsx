import React, { createContext, useContext, useState, ReactNode } from 'react';

// Simple state types for context-level management
export interface PlanState {
  id: string;
  steps: string[];
  status: 'pending' | 'running' | 'completed' | 'failed';
}

export interface TaskState {
  id: string;
  title: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  startTime?: number;
  endTime?: number;
}

export interface RunState {
  id: string;
  status: 'idle' | 'running' | 'completed' | 'failed';
  startTime?: number;
  endTime?: number;
}

interface ChatContextType {
  // State management
  planState: PlanState | null;
  taskState: TaskState | null;
  runState: RunState | null;

  // State setters
  setPlanState: (state: PlanState | null) => void;
  setTaskState: (state: TaskState | null) => void;
  setRunState: (state: RunState | null) => void;

  // Utility functions
  clearAllStates: () => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const useChatConfig = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChatConfig must be used within a ChatProvider');
  }
  return context;
};

interface ChatProviderProps {
  children: ReactNode;
}

export const ChatProvider: React.FC<ChatProviderProps> = ({ children }) => {
  const [planState, setPlanState] = useState<PlanState | null>(null);
  const [taskState, setTaskState] = useState<TaskState | null>(null);
  const [runState, setRunState] = useState<RunState | null>(null);

  const clearAllStates = () => {
    setPlanState(null);
    setTaskState(null);
    setRunState(null);
  };

  const value: ChatContextType = {
    planState,
    taskState,
    runState,
    setPlanState,
    setTaskState,
    setRunState,
    clearAllStates,
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
};

/**
 * Utility function to get theme classes for components
 */
export const getThemeClasses = (theme: 'light' | 'dark' | 'auto'): string => {
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