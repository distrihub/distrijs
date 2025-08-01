import React from 'react';
import { Bot, FileText, Plus, MessageSquare, Github } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from './ThemeProvider';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
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

interface AdminSidebarProps {
  currentPage: string;
  onPageChange: (page: string) => void;
}

export function AdminSidebar({
  currentPage,
  onPageChange,
}: AdminSidebarProps) {
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();

  return (
    <Sidebar collapsible="icon" variant="floating">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={() => navigate('/definitions')}
            >
              <Bot />
              Distri Admin
            </SidebarMenuButton>
            <SidebarMenuAction 
              onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
              title="Toggle theme"
              className="absolute right-0 top-0"
            >
              <svg className="h-4 w-4 scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <circle cx="12" cy="12" r="5" />
                <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
              </svg>
              <svg className="absolute h-4 w-4 scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            </SidebarMenuAction>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarSeparator />

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Agent Management</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={currentPage === 'definitions'}
                  onClick={() => onPageChange('definitions')}
                >
                  <Bot className="h-4 w-4" />
                  Definitions
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => navigate('/definitions/new')}
                >
                  <Plus className="h-4 w-4" />
                  New Definition
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Prompt Management</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={currentPage === 'prompts'}
                  onClick={() => onPageChange('prompts')}
                >
                  <FileText className="h-4 w-4" />
                  Prompts
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Chat</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => navigate('/definitions/chat')}
                >
                  <MessageSquare className="h-4 w-4" />
                  Test Chat
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={() => window.open('https://github.com/distrihub/distrijs', '_blank')}
              title="GitHub"
            >
              <Github />
              Distri
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}