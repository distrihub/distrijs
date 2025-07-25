import React, { useState, useCallback, useEffect } from 'react';
import { Agent } from '@distri/core';
import { useThreads } from '../useThreads';
import { EmbeddableChat } from './EmbeddableChat';
import { ThemeToggle } from './ThemeToggle';
import AgentsPage from './AgentsPage';
import { AppSidebar } from './AppSidebar';
import { SidebarProvider, SidebarInset, SidebarTrigger } from './ui/sidebar';


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
  // Sidebar
  showSidebar?: boolean;
  sidebarWidth?: number;
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
  agent,
  metadata,
  className = '',
  UserMessageComponent,
  AssistantMessageComponent,
  AssistantWithToolCallsComponent,
  PlanMessageComponent,
  theme = 'dark',
  showDebug = false,
  showSidebar = true,
  sidebarWidth: _sidebarWidth = 280, // Unused but kept for API compatibility
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

  if (!showSidebar) {
    // Fallback for when sidebar is disabled
    return (
      <div className={`distri-chat ${className} h-full flex bg-background text-foreground`}>
        {currentPage === 'chat' && (
          <div className="flex-1">
            <EmbeddableChat
              agentId={agentId}
              threadId={selectedThreadId}
              showAgentSelector={true}
              agent={agent}
              metadata={metadata}
              height="100vh"
              availableAgents={availableAgents}
              UserMessageComponent={UserMessageComponent}
              AssistantMessageComponent={AssistantMessageComponent}
              AssistantWithToolCallsComponent={AssistantWithToolCallsComponent}
              PlanMessageComponent={PlanMessageComponent}
              theme={theme}
              showDebug={showDebug}
              placeholder="Type your message..."
              onAgentSelect={onAgentSelect}
            />
          </div>
        )}
        {currentPage === 'agents' && <AgentsPage onStartChat={(agent) => {
          setCurrentPage('chat');
          onAgentSelect?.(agent.id);
        }} />}
      </div>
    );
  }

  return (
    <div className={`distri-chat ${className} h-full`}>
      <SidebarProvider defaultOpen={defaultOpen}>
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
          {/* Header with sidebar trigger and theme toggle */}
          <header className="flex h-16 shrink-0 items-center gap-2 px-4 border-b">
            <div className="flex items-center gap-2 flex-1">
              <SidebarTrigger className="-ml-1" />
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
            </div>
          </header>

          {/* Main content area */}
          <main className="flex-1 overflow-hidden">
            {currentPage === 'chat' && (
              <EmbeddableChat
                agentId={agentId}
                threadId={selectedThreadId}
                showAgentSelector={true}
                agent={agent}
                metadata={metadata}
                height="calc(100vh - 4rem)"
                availableAgents={availableAgents}
                UserMessageComponent={UserMessageComponent}
                AssistantMessageComponent={AssistantMessageComponent}
                AssistantWithToolCallsComponent={AssistantWithToolCallsComponent}
                PlanMessageComponent={PlanMessageComponent}
                theme={theme}
                showDebug={showDebug}
                placeholder="Type your message..."
                onAgentSelect={onAgentSelect}
              />
            )}

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