import React, { useState, useCallback } from 'react';
import { MessageSquare, MoreHorizontal, Trash2, Edit3, Bot, Users, Edit2 } from 'lucide-react';
import { useThreads } from '../useThreads';
import { ThemeToggle } from './ThemeToggle';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
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
    <SidebarMenuItem>
      <SidebarMenuButton asChild isActive={isActive} className="group">
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
              <p className="text-sm font-medium truncate">
                {thread.title || 'New Chat'}
              </p>
              <p className="text-xs text-muted-foreground truncate">
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
              className="p-1 rounded hover:bg-sidebar-accent transition-opacity"
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
  const { threads, loading: threadsLoading } = useThreads();

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <button
          onClick={onLogoClick}
          className="flex items-center space-x-2 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground rounded-lg p-2 transition-colors w-full"
        >
          <Bot className="h-4 w-4" />
          <span className="font-semibold flex-1 text-left">Distri</span>
          <ThemeToggle />
        </button>
      </SidebarHeader>
      
      <SidebarSeparator />
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={currentPage === 'chat'}
                  onClick={() => {
                    onPageChange('chat');
                    onNewChat();
                  }}
                >
                  <button className="flex items-center space-x-3 w-full">
                    <Edit2 className="h-4 w-4" />
                    <span>New Chat</span>
                  </button>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={currentPage === 'agents'}
                  onClick={() => onPageChange('agents')}
                >
                  <button className="flex items-center space-x-3 w-full">
                    <Users className="h-4 w-4" />
                    <span>Agents</span>
                  </button>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Conversations</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
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
                    onClick={() => onThreadSelect(thread.id)}
                    onDelete={() => onThreadDelete(thread.id)}
                    onRename={(newTitle) => onThreadRename(thread.id, newTitle)}
                  />
                ))
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}