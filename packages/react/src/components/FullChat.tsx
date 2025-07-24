import React, { useState, useCallback } from 'react';
import { Plus, MessageSquare, Settings, MoreHorizontal, Trash2, Edit3, Bot, Users, BarChart3 } from 'lucide-react';
import { Agent } from '@distri/core';
import { useThreads } from '../useThreads';
import { EmbeddableChat } from './EmbeddableChat';
import '../styles/themes.css';

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
  // Navigation
  currentPage?: 'chat' | 'agents' | 'tasks';
  onPageChange?: (page: 'chat' | 'agents' | 'tasks') => void;
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
      className={`group relative p-3 rounded-lg cursor-pointer transition-colors ${
        isActive 
          ? 'bg-white/10' 
          : 'hover:bg-white/5'
      }`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3 flex-1 min-w-0">
          <MessageSquare className={`h-4 w-4 flex-shrink-0 ${isActive ? 'text-white' : 'text-gray-400'}`} />
          
          {isEditing ? (
            <input
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onBlur={handleRename}
              onKeyPress={handleKeyPress}
              className="flex-1 text-sm bg-transparent border-none outline-none text-white"
              autoFocus
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium truncate ${isActive ? 'text-white' : 'text-gray-200'}`}>
                {thread.title || 'New Chat'}
              </p>
              <p className="text-xs text-gray-400 truncate">
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
              className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-white/10 transition-opacity"
            >
              <MoreHorizontal className="h-4 w-4 text-gray-400" />
            </button>

            {showMenu && (
              <div className="absolute right-0 top-6 w-32 bg-gray-800 border border-gray-600 rounded-lg shadow-lg z-10">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsEditing(true);
                    setShowMenu(false);
                  }}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-gray-700 text-white flex items-center space-x-2 rounded-t-lg"
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
                  className="w-full text-left px-3 py-2 text-sm hover:bg-gray-700 text-red-400 flex items-center space-x-2 rounded-b-lg"
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

export const FullChat: React.FC<FullChatProps> = ({
  agentId,
  agent,
  metadata,
  className = '',
  availableAgents = [],
  UserMessageComponent,
  AssistantMessageComponent,
  AssistantWithToolCallsComponent,
  PlanMessageComponent,
  theme = 'dark',
  showDebug = false,
  showSidebar = true,
  sidebarWidth = 280,
  currentPage = 'chat',
  onPageChange,
  onAgentSelect,
  onThreadSelect,
  onThreadCreate,
  onThreadDelete,
  onLogoClick,
}) => {
  const [selectedThreadId, setSelectedThreadId] = useState<string>('default');
  const { threads, loading: threadsLoading, refetch: refetchThreads } = useThreads();

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

  // Apply theme class
  const themeClass = theme === 'auto' ? '' : theme;

  const mainStyle = {
    marginLeft: showSidebar ? `${sidebarWidth}px` : '0px',
  };

  // Get current agent
  const currentAgent = availableAgents.find(a => a.id === agentId);

  return (
    <div className={`distri-chat ${themeClass} ${className} h-full flex`} style={{ backgroundColor: '#343541' }}>
      {/* Sidebar - ChatGPT Style */}
      {showSidebar && (
        <div 
          className="fixed left-0 top-0 h-full border-r flex flex-col distri-sidebar"
          style={{ 
            backgroundColor: '#000000',
            borderRightColor: '#2f2f2f',
            width: `${sidebarWidth}px`
          }}
        >
          {/* Logo */}
          <div className="p-4">
            <button 
              onClick={onLogoClick}
              className="flex items-center space-x-2 text-white hover:bg-white/10 rounded-lg p-2 transition-colors w-full"
            >
              <Bot className="h-6 w-6" />
              <span className="font-semibold">Distri</span>
            </button>
          </div>

          {/* New Chat Button */}
          <div className="px-4 pb-4">
            <button
              onClick={handleNewChat}
              className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span className="text-sm font-medium">New Chat</span>
            </button>
          </div>

          {/* Agent Selection */}
          {availableAgents.length > 0 && (
            <div className="px-4 pb-4">
              <div className="text-xs text-gray-400 mb-2 px-2">Agent</div>
              <select
                value={agentId}
                onChange={(e) => onAgentSelect?.(e.target.value)}
                className="w-full bg-gray-800 border border-gray-600 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {availableAgents.map((agent) => (
                  <option key={agent.id} value={agent.id}>
                    {agent.name}
                  </option>
                ))}
              </select>
              {currentAgent?.description && (
                <p className="text-xs text-gray-500 mt-1 px-2">{currentAgent.description}</p>
              )}
            </div>
          )}

          {/* Navigation */}
          <div className="px-4 pb-4">
            <div className="text-xs text-gray-400 mb-2 px-2">Navigation</div>
            <div className="space-y-1">
              <button
                onClick={() => onPageChange?.('chat')}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                  currentPage === 'chat' 
                    ? 'bg-white/10 text-white' 
                    : 'text-gray-300 hover:bg-white/5 hover:text-white'
                }`}
              >
                <MessageSquare className="h-4 w-4" />
                <span>Chat</span>
              </button>
              <button
                onClick={() => onPageChange?.('agents')}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                  currentPage === 'agents' 
                    ? 'bg-white/10 text-white' 
                    : 'text-gray-300 hover:bg-white/5 hover:text-white'
                }`}
              >
                <Users className="h-4 w-4" />
                <span>Agents</span>
              </button>
              <button
                onClick={() => onPageChange?.('tasks')}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                  currentPage === 'tasks' 
                    ? 'bg-white/10 text-white' 
                    : 'text-gray-300 hover:bg-white/5 hover:text-white'
                }`}
              >
                <BarChart3 className="h-4 w-4" />
                <span>Tasks</span>
              </button>
            </div>
          </div>

          {/* Threads List - Only show when on chat page */}
          {currentPage === 'chat' && (
            <div className="flex-1 overflow-y-auto px-4 space-y-2 distri-scroll">
              <div className="text-xs text-gray-400 mb-2 px-2">Conversations</div>
              {threadsLoading ? (
                <div className="text-center py-8">
                  <div className="text-sm text-gray-400">Loading threads...</div>
                </div>
              ) : threads.length === 0 ? (
                <div className="text-center py-8">
                  <MessageSquare className="h-8 w-8 text-gray-600 mx-auto mb-2" />
                  <div className="text-sm text-gray-400">No conversations yet</div>
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
          )}

          {/* Settings */}
          <div className="p-4 border-t border-gray-700">
            <button className="w-full flex items-center space-x-3 px-3 py-2 text-gray-300 hover:bg-white/10 rounded-lg transition-colors">
              <Settings className="h-4 w-4" />
              <span className="text-sm">Settings</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Chat Area - Only show when on chat page */}
      {currentPage === 'chat' && (
        <div className="flex-1" style={mainStyle}>
          <EmbeddableChat
            agentId={agentId}
            threadId={selectedThreadId}
            agent={agent}
            metadata={metadata}
            height="100vh"
            UserMessageComponent={UserMessageComponent}
            AssistantMessageComponent={AssistantMessageComponent}
            AssistantWithToolCallsComponent={AssistantWithToolCallsComponent}
            PlanMessageComponent={PlanMessageComponent}
            theme={theme}
            showDebug={showDebug}
            placeholder="Type your message..."
          />
        </div>
      )}
    </div>
  );
};

export default FullChat;