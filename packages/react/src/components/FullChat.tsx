import React, { useState, useCallback, useEffect } from 'react';
import { Agent } from '@distri/core';
import { useThreads } from '../useThreads';
import { useChat } from '../useChat';
import { EmbeddableChat } from './EmbeddableChat';
import AgentsPage from './AgentsPage';
import { AppSidebar } from './AppSidebar';
import { SidebarProvider, SidebarInset, SidebarTrigger } from './ui/sidebar';
import { AgentSelect } from './AgentSelect';
import { useAgent } from '@/useAgent';
import { useTheme } from './ThemeProvider';
import { uuidv4 } from '../../../core/src/distri-client';


export interface FullChatProps {
  agentId: string;
  agent?: Agent;
  getMetadata?: () => Promise<any>;
  className?: string;
  // Available agents for selection
  availableAgents?: Array<{ id: string; name: string; description?: string }>;
  // Customization props
  UserMessageComponent?: React.ComponentType<any>;
  AssistantMessageComponent?: React.ComponentType<any>;
  AssistantWithToolCallsComponent?: React.ComponentType<any>;
  PlanMessageComponent?: React.ComponentType<any>;
  // Theme
  theme?: 'light' | 'dark' | 'auto';
  // Show debug info
  showDebug?: boolean;

  // Callbacks
  onAgentSelect?: (agentId: string) => void;
  onThreadSelect?: (threadId: string) => void;
  onThreadCreate?: (threadId: string) => void;
  onThreadDelete?: (threadId: string) => void;
  onLogoClick?: () => void;
}

type PageType = 'chat' | 'agents';

export const FullChat: React.FC<FullChatProps> = ({
  agentId: initialAgentId,
  getMetadata,
  className = '',
  UserMessageComponent,
  AssistantMessageComponent,
  AssistantWithToolCallsComponent,
  PlanMessageComponent,
  showDebug = false,
  onThreadSelect,
  onThreadCreate,
  onThreadDelete,
  onLogoClick,
  availableAgents,
  onAgentSelect,
}) => {
  const [selectedThreadId, setSelectedThreadId] = useState<string>(uuidv4());
  const [currentAgentId, setCurrentAgentId] = useState<string>(initialAgentId);
  const { threads, refetch: refetchThreads } = useThreads();
  const [currentPage, setCurrentPage] = useState<PageType>('chat');
  const [defaultOpen, setDefaultOpen] = useState(true);
  const { agent, loading: agentLoading, error: agentError } = useAgent({ agentId: currentAgentId });
  const { theme } = useTheme();

  // Get the current thread
  const currentThread = threads.find(t => t.id === selectedThreadId);

  // Use chat hook to get messages for the selected thread
  const { messages } = useChat({
    threadId: selectedThreadId,
    agent: agent || undefined,
    getMetadata
  });

  // Check if thread has started (has messages)
  const threadHasStarted = messages.length > 0;

  // Load sidebar state from localStorage
  useEffect(() => {
    const savedState = localStorage.getItem('sidebar:state');
    if (savedState !== null) {
      setDefaultOpen(savedState === 'true');
    }
  }, []);

  // Auto-populate agent ID from thread when thread is selected
  useEffect(() => {
    if (currentThread?.agent_id && currentThread.agent_id !== currentAgentId) {
      setCurrentAgentId(currentThread.agent_id);
      onAgentSelect?.(currentThread.agent_id);
    }
  }, [currentThread?.agent_id, currentAgentId, onAgentSelect]);

  const handleNewChat = useCallback(() => {
    const newThreadId = `thread-${Date.now()}`;
    setSelectedThreadId(newThreadId);
    onThreadCreate?.(newThreadId);
  }, [onThreadCreate]);

  const handleThreadSelect = useCallback((threadId: string) => {
    setCurrentPage('chat');
    setSelectedThreadId(threadId);
    onThreadSelect?.(threadId);
  }, [onThreadSelect]);

  const handleThreadDelete = useCallback((threadId: string) => {
    // If deleting the active thread, switch to a new one
    if (threadId === selectedThreadId) {
      const remainingThreads = threads.filter(t => t.id !== threadId);
      if (remainingThreads.length > 0) {
        setSelectedThreadId(remainingThreads[0].id);
      } else {
        handleNewChat();
      }
    }
    onThreadDelete?.(threadId);
    refetchThreads();
  }, [selectedThreadId, threads, handleNewChat, onThreadDelete, refetchThreads]);

  const handleAgentSelect = useCallback((newAgentId: string) => {
    // Only allow agent selection if thread hasn't started
    if (!threadHasStarted) {
      setCurrentAgentId(newAgentId);
      onAgentSelect?.(newAgentId);
    }
  }, [threadHasStarted, onAgentSelect]);

  const handleMessagesUpdate = useCallback(() => {
    refetchThreads();
  }, [refetchThreads]);

  const renderMainContent = () => {
    if (currentPage === 'agents') {
      return <AgentsPage onStartChat={(agent) => {
        setCurrentPage('chat');
        handleAgentSelect(agent.id);
      }} />;
    }

    if (!agent) {
      if (agentLoading) return <div>Loading agent...</div>;
      if (agentError) return <div>Error loading agent: {agentError.message}</div>;
      return <div>No agent selected</div>;
    }

    return (
      <EmbeddableChat
        threadId={selectedThreadId}
        showAgentSelector={false}
        agent={agent}
        getMetadata={getMetadata}
        height="calc(100vh - 4rem)"
        availableAgents={availableAgents}
        UserMessageComponent={UserMessageComponent}
        AssistantMessageComponent={AssistantMessageComponent}
        AssistantWithToolCallsComponent={AssistantWithToolCallsComponent}
        PlanMessageComponent={PlanMessageComponent}
        theme={theme as 'light' | 'dark' | 'auto'}
        showDebug={showDebug}
        placeholder="Type your message..."
        disableAgentSelection={threadHasStarted}
        onAgentSelect={handleAgentSelect}
        onMessagesUpdate={handleMessagesUpdate}
      />
    );
  };

  return (

    <div className={`distri-chat ${className} h-full`}>
      <SidebarProvider defaultOpen={defaultOpen}
        style={{
          "--sidebar-width": "20rem",
          "--sidebar-width-mobile": "18rem",
        } as React.CSSProperties}>
        <AppSidebar
          selectedThreadId={selectedThreadId}
          currentPage={currentPage}
          onNewChat={handleNewChat}
          onThreadSelect={handleThreadSelect}
          onThreadDelete={handleThreadDelete}
          onThreadRename={(threadId: string, newTitle: string) => {
            // Placeholder for thread rename functionality
            console.log('Rename thread', threadId, 'to', newTitle);
            refetchThreads();
          }}
          onLogoClick={onLogoClick}
          onPageChange={setCurrentPage}
        />
        <SidebarInset>
          {/* Header with agent selector only */}
          <header className="flex h-16 shrink-0 items-center gap-2 px-4 border-b">
            <div className="flex items-center gap-2 flex-1">
              <SidebarTrigger className="-ml-1" />
              {availableAgents && availableAgents.length > 0 && (
                <div className="w-64">
                  <AgentSelect
                    agents={availableAgents}
                    selectedAgentId={currentAgentId}
                    onAgentSelect={handleAgentSelect}
                    placeholder="Select an agent..."
                    disabled={threadHasStarted}
                  />
                </div>
              )}
            </div>
          </header>

          {/* Main content area */}
          <main className="flex-1 overflow-hidden">
            {renderMainContent()}
          </main>
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
};

export default FullChat;