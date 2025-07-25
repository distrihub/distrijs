import React, { useState, useCallback, useEffect } from 'react';
import { Agent } from '@distri/core';
import { useThreads } from '../useThreads';
import { EmbeddableChat } from './EmbeddableChat';
import AgentsPage from './AgentsPage';
import { AgentSelect } from './AgentSelect';
import { useAgent } from '@/useAgent';
import { useTheme } from './ThemeProvider';
import { 
  MessageSquare, 
  MoreHorizontal, 
  Trash2, 
  Edit3, 
  Bot, 
  Users, 
  Edit2, 
  RefreshCw, 
  Github,
  Menu,
  Plus
} from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from './ui/sheet';
import { Button } from './ui/button';

export interface ResponsiveChatProps {
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

// Thread Item Component for the drawer
interface ThreadItemProps {
  thread: any;
  isActive: boolean;
  onClick: () => void;
  onDelete: () => void;
  onRename: (newTitle: string) => void;
}

const ThreadItem: React.FC<ThreadItemProps> = ({
  thread,
  isActive,
  onClick,
  onDelete,
  onRename
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(thread.title || 'New Chat');
  const [showMenu, setShowMenu] = useState(false);

  const handleRename = useCallback(() => {
    if (editTitle.trim() && editTitle !== thread.title) {
      onRename(editTitle.trim());
    }
    setIsEditing(false);
  }, [editTitle, thread.title, onRename]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleRename();
    } else if (e.key === 'Escape') {
      setEditTitle(thread.title || 'New Chat');
      setIsEditing(false);
    }
  }, [handleRename, thread.title]);

  return (
    <div className={`relative group rounded-lg p-3 cursor-pointer transition-colors ${
      isActive ? 'bg-primary/10 border border-primary/20' : 'hover:bg-accent'
    }`}>
      <div onClick={onClick} className="flex items-center space-x-3 flex-1 min-w-0">
        <MessageSquare className="h-4 w-4 flex-shrink-0" />
        {isEditing ? (
          <input
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            onBlur={handleRename}
            onKeyPress={handleKeyPress}
            className="flex-1 text-sm bg-transparent border-none outline-none"
            autoFocus
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate leading-tight">
              {thread.title || 'New Chat'}
            </p>
            <p className="text-xs text-muted-foreground truncate leading-tight mt-0.5">
              {thread.last_message || 'No messages yet'}
            </p>
          </div>
        )}
      </div>

      {!isEditing && (
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(!showMenu);
            }}
            className="p-1.5 rounded-md hover:bg-accent transition-colors"
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>

          {showMenu && (
            <div className="absolute right-0 top-6 w-32 bg-card border rounded-lg shadow-lg z-10">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsEditing(true);
                  setShowMenu(false);
                }}
                className="w-full text-left px-3 py-2 text-sm hover:bg-accent text-card-foreground flex items-center space-x-2 rounded-t-lg"
              >
                <Edit3 className="h-3 w-3" />
                <span>Rename</span>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                  setShowMenu(false);
                }}
                className="w-full text-left px-3 py-2 text-sm hover:bg-accent text-destructive flex items-center space-x-2 rounded-b-lg"
              >
                <Trash2 className="h-3 w-3" />
                <span>Delete</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

type PageType = 'chat' | 'agents';

export const ResponsiveChat: React.FC<ResponsiveChatProps> = ({
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
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const { threads, loading: threadsLoading, refetch: refetchThreads } = useThreads();
  const [currentPage, setCurrentPage] = useState<PageType>('chat');
  const { agent, loading: agentLoading, error: agentError } = useAgent({ agentId });
  const { theme, setTheme } = useTheme();

  const handleNewChat = useCallback(() => {
    const newThreadId = `thread-${Date.now()}`;
    setSelectedThreadId(newThreadId);
    setCurrentPage('chat');
    setIsDrawerOpen(false);
    onThreadCreate?.(newThreadId);
  }, [onThreadCreate]);

  const handleThreadSelect = useCallback((threadId: string) => {
    setCurrentPage('chat');
    setSelectedThreadId(threadId);
    setIsDrawerOpen(false);
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

  const handleRefresh = useCallback(() => {
    refetchThreads();
  }, [refetchThreads]);

  const handlePageChange = useCallback((page: PageType) => {
    setCurrentPage(page);
    setIsDrawerOpen(false);
  }, []);

  return (
    <div className={`distri-responsive-chat ${className} h-full flex flex-col`}>
      {/* Header */}
      <header className="flex h-16 shrink-0 items-center gap-2 px-4 border-b bg-background">
        <div className="flex items-center gap-2 flex-1">
          {/* Drawer Trigger */}
          <Sheet open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Open menu</span>
              </Button>
            </SheetTrigger>
            
            <SheetContent side="left" className="w-80 p-0">
              <div className="flex flex-col h-full">
                <SheetHeader className="p-4 border-b">
                  <SheetTitle>
                    <button
                      onClick={onLogoClick}
                      className="flex items-center space-x-2 text-foreground hover:text-primary transition-colors"
                    >
                      <Bot className="h-5 w-5" />
                      <span className="font-semibold">Distri</span>
                    </button>
                  </SheetTitle>
                </SheetHeader>
                
                <div className="flex-1 overflow-hidden flex flex-col">
                  {/* Actions Section */}
                  <div className="p-4 border-b">
                    <h3 className="text-sm font-medium mb-3">Actions</h3>
                    <div className="space-y-2">
                      <Button
                        variant={currentPage === 'chat' ? 'default' : 'ghost'}
                        onClick={handleNewChat}
                        className="w-full justify-start"
                      >
                        <Edit2 className="h-4 w-4 mr-2" />
                        New Chat
                      </Button>
                      <Button
                        variant={currentPage === 'agents' ? 'default' : 'ghost'}
                        onClick={() => handlePageChange('agents')}
                        className="w-full justify-start"
                      >
                        <Users className="h-4 w-4 mr-2" />
                        Agents
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={handleRefresh}
                        disabled={threadsLoading}
                        className="w-full justify-start"
                      >
                        <RefreshCw className={`h-4 w-4 mr-2 ${threadsLoading ? 'animate-spin' : ''}`} />
                        Refresh
                      </Button>
                    </div>
                  </div>

                  {/* Conversations Section */}
                  <div className="flex-1 overflow-auto p-4">
                    <h3 className="text-sm font-medium mb-3">Conversations</h3>
                    <div className="space-y-2">
                      {threadsLoading ? (
                        <div className="text-center py-8">
                          <div className="text-sm text-muted-foreground">Loading threads...</div>
                        </div>
                      ) : threads.length === 0 ? (
                        <div className="text-center py-8">
                          <MessageSquare className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
                          <div className="text-sm text-muted-foreground">No conversations yet</div>
                        </div>
                      ) : (
                        threads.map((thread: any) => (
                          <ThreadItem
                            key={thread.id}
                            thread={thread}
                            isActive={thread.id === selectedThreadId}
                            onClick={() => handleThreadSelect(thread.id)}
                            onDelete={() => handleThreadDelete(thread.id)}
                            onRename={(newTitle) => handleThreadRename(thread.id, newTitle)}
                          />
                        ))
                      )}
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="p-4 border-t">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Bot className="h-4 w-4" />
                        <span className="text-sm font-medium">Distri</span>
                        <button
                          onClick={() => window.open('https://github.com/your-repo/distri', '_blank')}
                          className="p-1 rounded-md hover:bg-accent transition-colors"
                          title="GitHub"
                        >
                          <Github className="h-3 w-3" />
                        </button>
                      </div>
                      <button
                        onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
                        className="p-1 rounded-md hover:bg-accent transition-colors"
                        title="Toggle theme"
                      >
                        <div className="flex items-center justify-center w-4 h-4 relative">
                          <svg className="h-4 w-4 scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <circle cx="12" cy="12" r="5" />
                            <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
                          </svg>
                          <svg className="absolute h-4 w-4 scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                          </svg>
                        </div>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </SheetContent>
          </Sheet>

          {/* Desktop Action Buttons */}
          <div className="hidden md:flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={handleNewChat}>
              <Plus className="h-4 w-4 mr-2" />
              New Chat
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleRefresh}
              disabled={threadsLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${threadsLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>

          {/* Agent Selector */}
          {availableAgents && availableAgents.length > 0 && (
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

        {agentLoading && <div className="p-4">Loading agent...</div>}
        {agentError && <div className="p-4">Error loading agent: {agentError.message}</div>}
        {!agent && !agentLoading && <div className="p-4">No agent selected</div>}
        {currentPage === 'agents' && (
          <div className="h-full overflow-auto">
            <AgentsPage onStartChat={(agent) => {
              setCurrentPage('chat');
              onAgentSelect?.(agent.id);
            }} />
          </div>
        )}
      </main>
    </div>
  );
};

export default ResponsiveChat;