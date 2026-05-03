import type { ReactNode } from 'react';
import { DistriSidebar } from '@distri/home';
import {
  Sidebar,
  SidebarContent,
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar';

interface AppShellProps {
  children: ReactNode;
}

/**
 * Mobile-friendly layout shell for apps/ui.
 *
 * Uses the shadcn Sidebar primitive so mobile visitors get an off-canvas Sheet
 * with a hamburger SidebarTrigger in the top bar. On desktop the sidebar is
 * always visible (collapsible="offcanvas" default keeps it expanded).
 */
export function AppShell({ children }: AppShellProps) {
  return (
    <SidebarProvider defaultOpen>
      <Sidebar collapsible="offcanvas" variant="sidebar">
        <SidebarContent>
          <DistriSidebar />
        </SidebarContent>
      </Sidebar>

      <SidebarInset className="flex flex-col min-h-0 min-w-0 overflow-x-hidden bg-background text-foreground">
        <header className="h-11 shrink-0 flex items-center gap-2 border-b border-border/70 bg-background/95 px-3">
          <SidebarTrigger className="md:hidden shrink-0" />
        </header>
        <main className="flex-1 min-w-0 overflow-auto">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
