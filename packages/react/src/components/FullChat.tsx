import React, { useState, useCallback } from 'react';
import { MessageSquare, MoreHorizontal, Trash2, Edit3, Bot, Users, Edit2 } from 'lucide-react';
import { Agent } from '@distri/core';
import { useThreads } from '../useThreads';
import { EmbeddableChat } from './EmbeddableChat';
import { ThemeToggle } from './ThemeToggle';
import AgentsPage from './AgentsPage';


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
    <div
      className={`group relative p-3 rounded-lg cursor-pointer transition-colors ${isActive
        ? 'bg-accent text-accent-foreground'
        : 'hover:bg-accent hover:text-accent-foreground'
        }`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3 flex-1 min-w-0">
          <MessageSquare className={`h-4 w-4 flex-shrink-0 ${isActive ? 'text-accent-foreground' : 'text-muted-foreground'}`} />

          {isEditing ? (
            <input
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onBlur={handleRename}
              onKeyPress={handleKeyPress}
              className="flex-1 text-sm bg-transparent border-none outline-none text-card-foreground"
              autoFocus
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium truncate ${isActive ? 'text-accent-foreground' : 'text-card-foreground'}`}>
                {thread.title || 'New Chat'}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {thread.last_message || 'No messages yet'}
              </p>
            </div>
          )}
        </div>

        {!isEditing && (
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(!showMenu);
              }}
              className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-accent transition-opacity"
            >
              <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
            </button>

            {showMenu && (
              <div className="absolute right-0 top-6 w-32 bg-card border  rounded-lg shadow-lg z-10">
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
    </div>
  );
};

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
  sidebarWidth = 280,
  onThreadSelect,
  onThreadCreate,
  onThreadDelete,
  onLogoClick,
  availableAgents,
  onAgentSelect,
}) => {
  const [selectedThreadId, setSelectedThreadId] = useState<string>('default');
  const { threads, loading: threadsLoading, refetch: refetchThreads } = useThreads();
  const [currentPage, setCurrentPage] = useState<PageType>('chat');

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

  const mainStyle = {
    marginLeft: showSidebar ? `${sidebarWidth}px` : '0px',
  };

  return (
    <div className={`distri-chat ${className} h-full flex bg-background text-foreground`}>
      {/* Sidebar - ChatGPT Style */}
      {showSidebar && (
        <div
          className="fixed left-0 top-0 h-full border-r  flex flex-col distri-sidebar bg-card text-card-foreground"
          style={{
            width: `${sidebarWidth}px`
          }}
        >
          {/* Logo */}
          <div className="p-4">
            <button
              onClick={onLogoClick}
              className="flex items-center space-x-2 text-card-foreground hover:bg-accent hover:text-accent-foreground rounded-lg p-2 transition-colors w-full"
            >
              <Bot className="h-4 w-4" />
              <span className="font-semibold flex-1 text-left">Distri</span>
              <ThemeToggle />
            </button>
          </div>

          {/* New Chat Button */}


          {/* Agent Selection */}


          {/* Navigation */}
          <div className="px-4 pb-6">

            <div className="space-y-4 mt-4">
              <button
                onClick={() => {
                  setCurrentPage('chat');
                  handleNewChat();
                }}
                className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${currentPage === 'chat'
                  ? 'bg-accent text-accent-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                  }`}
              >
                <Edit2 className="h-4 w-4" />
                <span>New Chat</span>
              </button>
              <button
                onClick={() => setCurrentPage('agents')}
                className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${currentPage === 'agents'
                  ? 'bg-accent text-accent-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                  }`}
              >
                <Users className="h-4 w-4" />
                <span>Agents</span>
              </button>
            </div>
          </div>

          {/* Threads List - Only show when on chat page */}

          <div className="flex-1 overflow-y-auto px-4 space-y-2 distri-scroll">
            <div className="text-sm text-muted-foreground mb-3 mt=3 px-2">Conversations</div>
            {threadsLoading ? (
              <div className="text-center py-12">
                <div className="text-sm text-muted-foreground">Loading threads...</div>
              </div>
            ) : threads.length === 0 ? (
              <div className="text-center py-12">
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
      )}

      {/* Main Chat Area - Only show when on chat page */}
      {currentPage === 'chat' && (
        <div className="flex-1" style={mainStyle}>
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

      {currentPage !== 'chat' && (
        <div
          className="fixed top-0 bg-background h-full overflow-auto"
          style={{
            left: '280px',
            right: '0'
          }}
        >
          {currentPage === 'agents' && <AgentsPage onStartChat={(agent) => {
            setCurrentPage('chat');
            onAgentSelect?.(agent.id);
          }} />}
        </div>
      )}
    </div>
  );
};

export default FullChat;