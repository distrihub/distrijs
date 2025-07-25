import React, { useState, useCallback } from 'react';
import { MessageSquare, MoreHorizontal, Trash2, Edit3, Bot, Users, Edit2, RefreshCw, Github } from 'lucide-react';
import { useThreads } from '../useThreads';
import { useTheme } from './ThemeProvider';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarGroupAction,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "./ui/sidebar"

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
    <SidebarMenuItem className="mb-3">
      <SidebarMenuButton asChild isActive={isActive} className="group py-3 px-3 rounded-lg">
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
      </SidebarMenuButton>

      {!isEditing && (
        <SidebarMenuAction showOnHover>
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(!showMenu);
              }}
              className="p-1.5 rounded-md hover:bg-sidebar-accent transition-opacity"
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
        </SidebarMenuAction>
      )}
    </SidebarMenuItem>
  );
};

interface AppSidebarProps {
  selectedThreadId: string;
  currentPage: 'chat' | 'agents';
  onNewChat: () => void;
  onThreadSelect: (threadId: string) => void;
  onThreadDelete: (threadId: string) => void;
  onThreadRename: (threadId: string, newTitle: string) => void;
  onLogoClick?: () => void;
  onPageChange: (page: 'chat' | 'agents') => void;
}

export function AppSidebar({
  selectedThreadId,
  currentPage,
  onNewChat,
  onThreadSelect,
  onThreadDelete,
  onThreadRename,
  onLogoClick,
  onPageChange,
}: AppSidebarProps) {
  const { threads, loading: threadsLoading, refetch } = useThreads();
  const { theme, setTheme } = useTheme();

  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <button
          onClick={onLogoClick}
          className="flex items-center space-x-2 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground rounded-lg p-2 transition-colors"
        >
          <Bot className="h-4 w-4" />
          <span className="font-semibold">Distri</span>
        </button>
      </SidebarHeader>

      <SidebarSeparator />

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="px-3 py-2">Actions</SidebarGroupLabel>
          <SidebarGroupContent className="px-2">
            <SidebarMenu>
              <SidebarMenuItem className="mb-1">
                <SidebarMenuButton
                  asChild
                  isActive={currentPage === 'chat'}
                  onClick={() => {
                    onPageChange('chat');
                    onNewChat();
                  }}
                  className="py-3 px-3 rounded-lg"
                >
                  <button className="flex items-center space-x-3 w-full">
                    <Edit2 className="h-4 w-4" />
                    <span>New Chat</span>
                  </button>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem className="mb-1">
                <SidebarMenuButton
                  asChild
                  isActive={currentPage === 'agents'}
                  onClick={() => onPageChange('agents')}
                  className="py-3 px-3 rounded-lg"
                >
                  <button className="flex items-center space-x-3 w-full">
                    <Users className="h-4 w-4" />
                    <span>Agents</span>
                  </button>
                </SidebarMenuButton>
              </SidebarMenuItem>

              {/* Action buttons as regular menu items */}
              <SidebarMenuItem className="mb-1">
                <SidebarMenuButton
                  onClick={handleRefresh}
                  disabled={threadsLoading}
                  className="py-3 px-3 rounded-lg"
                  title="Refresh threads"
                >
                  <RefreshCw className={`h-4 w-4 ${threadsLoading ? 'animate-spin' : ''}`} />
                  <span>Refresh</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="px-3 py-2">Conversations</SidebarGroupLabel>
          <SidebarGroupContent className="px-2">
            <SidebarMenu>
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
                    onClick={() => onThreadSelect(thread.id)}
                    onDelete={() => onThreadDelete(thread.id)}
                    onRename={(newTitle) => onThreadRename(thread.id, newTitle)}
                  />
                ))
              )}
            </SidebarMenu>
          </SidebarGroupContent>

          {/* Refresh action for conversations */}
          <SidebarGroupAction
            onClick={handleRefresh}
            disabled={threadsLoading}
            title="Refresh conversations"
          >
            <RefreshCw className={`h-4 w-4 ${threadsLoading ? 'animate-spin' : ''}`} />
            <span className="sr-only">Refresh conversations</span>
          </SidebarGroupAction>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-sidebar-border">
        <div className="flex items-center justify-between">
          {/* Distri logo and GitHub link */}
          <div className="flex items-center space-x-2">
            <Bot className="h-4 w-4" />
            <span className="text-sm font-medium">Distri</span>
            <button
              onClick={() => window.open('https://github.com/your-repo/distri', '_blank')}
              className="p-1 rounded-md hover:bg-sidebar-accent transition-colors"
              title="GitHub"
            >
              <Github className="h-3 w-3" />
            </button>
          </div>

          {/* Theme toggle */}
          <button
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            className="p-1 rounded-md hover:bg-sidebar-accent transition-colors"
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
      </SidebarFooter>
    </Sidebar>
  );
}