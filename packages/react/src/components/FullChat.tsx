import React, { useState, useCallback } from 'react';
import { Plus, MessageSquare, Settings, MoreHorizontal, Trash2, Edit3 } from 'lucide-react';
import { Agent } from '@distri/core';
import { useThreads } from '../useThreads';
import { EmbeddableChat } from './EmbeddableChat';
import '../styles/themes.css';

export interface FullChatProps {
  agentId: string;
  agent?: Agent;
  metadata?: any;
  className?: string;
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
  onThreadSelect?: (threadId: string) => void;
  onThreadCreate?: (threadId: string) => void;
  onThreadDelete?: (threadId: string) => void;
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
          ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800' 
          : 'hover:bg-gray-50 dark:hover:bg-gray-800'
      }`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3 flex-1 min-w-0">
          <MessageSquare className="h-4 w-4 text-gray-400 flex-shrink-0" />
          
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
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                {thread.title || 'New Chat'}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
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
              className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-opacity"
            >
              <MoreHorizontal className="h-4 w-4 text-gray-400" />
            </button>

            {showMenu && (
              <div className="absolute right-0 top-6 w-32 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-10">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsEditing(true);
                    setShowMenu(false);
                  }}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center space-x-2"
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
                  className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 text-red-600 dark:text-red-400 flex items-center space-x-2"
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
  UserMessageComponent,
  AssistantMessageComponent,
  AssistantWithToolCallsComponent,
  PlanMessageComponent,
  theme = 'auto',
  showDebug = false,
  showSidebar = true,
  sidebarWidth = 280,
  onThreadSelect,
  onThreadCreate,
  onThreadDelete,
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

  const sidebarStyle = {
    width: showSidebar ? `${sidebarWidth}px` : '0px',
  };

  const mainStyle = {
    marginLeft: showSidebar ? `${sidebarWidth}px` : '0px',
  };

  return (
    <div className={`distri-chat ${themeClass} ${className} h-full flex`}>
      {/* Sidebar */}
      {showSidebar && (
        <div 
          className="fixed left-0 top-0 h-full bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 flex flex-col"
          style={sidebarStyle}
        >
          {/* Header */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <button
              onClick={handleNewChat}
              className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span className="text-sm font-medium">New Chat</span>
            </button>
          </div>

          {/* Threads List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2 distri-scroll">
            {threadsLoading ? (
              <div className="text-center py-8">
                <div className="text-sm text-gray-500 dark:text-gray-400">Loading threads...</div>
              </div>
            ) : threads.length === 0 ? (
              <div className="text-center py-8">
                <MessageSquare className="h-8 w-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                <div className="text-sm text-gray-500 dark:text-gray-400">No conversations yet</div>
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

          {/* Settings */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <button className="w-full flex items-center space-x-2 px-3 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
              <Settings className="h-4 w-4" />
              <span className="text-sm">Settings</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Chat Area */}
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
    </div>
  );
};

export default FullChat;