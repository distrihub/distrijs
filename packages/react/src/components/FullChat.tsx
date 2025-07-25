import React, { useState, useCallback, useEffect } from 'react';
import { Agent } from '@distri/core';
import { useThreads } from '../useThreads';
import { EmbeddableChat } from './EmbeddableChat';
import AgentsPage from './AgentsPage';
import { AppSidebar } from './AppSidebar';
import { SidebarProvider, SidebarInset, SidebarTrigger } from './ui/sidebar';
import { AgentSelect } from './AgentSelect';
import { useAgent } from '@/useAgent';
import { useTheme } from './ThemeProvider';


export interface FullChatProps {
  agentId: string;
  agent?: Agent;
  metadata?: any;
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
  agentId,
  metadata,
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
  const [selectedThreadId, setSelectedThreadId] = useState<string>('default');
  const { threads, refetch: refetchThreads } = useThreads();
  const [currentPage, setCurrentPage] = useState<PageType>('chat');
  const [defaultOpen, setDefaultOpen] = useState(true);
  const { agent, loading: agentLoading, error: agentError } = useAgent({ agentId });
  const { theme } = useTheme();

  // Load sidebar state from localStorage
  useEffect(() => {
    const savedState = localStorage.getItem('sidebar:state');
    if (savedState !== null) {
      setDefaultOpen(savedState === 'true');
    }
  }, []);

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

  const handleThreadRename = useCallback((threadId: string, newTitle: string) => {
    // In a real implementation, this would call an API to rename the thread
    console.log('Rename thread', threadId, 'to', newTitle);
    refetchThreads();
  }, [refetchThreads]);

  const handleMessagesUpdate = useCallback(() => {
    // Refresh threads when messages are updated
    refetchThreads();
  }, [refetchThreads]);
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
          onThreadRename={handleThreadRename}
          onLogoClick={onLogoClick}
          onPageChange={setCurrentPage}
        />
        <SidebarInset>
          {/* Header with agent selector only */}
          <header className="flex h-16 shrink-0 items-center gap-2 px-4 border-b">
            <div className="flex items-center gap-2 flex-1">
              <SidebarTrigger className="-ml-1" />              {availableAgents && availableAgents.length > 0 && (
                <div className="w-64">
                  <AgentSelect
                    agents={availableAgents}
                    selectedAgentId={agentId}
                    onAgentSelect={(agentId) => onAgentSelect?.(agentId)}
                    placeholder="Select an agent..."
                  />
                </div>
              )}
            </div>
          </header>

          {/* Main content area */}
          <main className="flex-1 overflow-hidden">
            {currentPage === 'chat' && agent && (
              <EmbeddableChat
                agentId={agentId}
                threadId={selectedThreadId}
                showAgentSelector={false}
                agent={agent}
                metadata={metadata}
                height="calc(100vh - 4rem)"
                availableAgents={availableAgents}
                UserMessageComponent={UserMessageComponent}
                AssistantMessageComponent={AssistantMessageComponent}
                AssistantWithToolCallsComponent={AssistantWithToolCallsComponent}
                PlanMessageComponent={PlanMessageComponent}
                theme={theme as 'light' | 'dark' | 'auto'}
                showDebug={showDebug}
                placeholder="Type your message..."
                onAgentSelect={onAgentSelect}
                onMessagesUpdate={handleMessagesUpdate}
              />
            )}

            {agentLoading && <div>Loading agent...</div>}
            {agentError && <div>Error loading agent: {agentError.message}</div>}
            {!agent && !agentLoading && <div>No agent selected</div>}
            {currentPage === 'agents' && (
              <div className="h-full overflow-auto">
                <AgentsPage onStartChat={(agent) => {
                  setCurrentPage('chat');
                  onAgentSelect?.(agent.id);
                }} />
              </div>
            )}
          </main>
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
};

export default FullChat;