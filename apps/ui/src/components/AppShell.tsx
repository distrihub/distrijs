import type { ReactNode } from 'react';
import { DistriSidebar } from '@distri/home';
import { Button } from '@distri/components';
import { Sparkles } from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar';

interface AppShellProps {
  children: ReactNode;
  onOpenCopilot?: () => void;
}

/**
 * Mobile-friendly layout shell for apps/ui.
 *
 * Hides the Channels/Traces/Users nav items because those are cloud-only
 * features today. The top bar carries a "Distri" copilot trigger so the
 * AI assistant is one click away on every page.
 */
export function AppShell({ children, onOpenCopilot }: AppShellProps) {
  return (
    <SidebarProvider defaultOpen>
      <Sidebar collapsible="offcanvas" variant="sidebar">
        <SidebarContent>
          <DistriSidebar hide={['channels', 'traces', 'users']} />
        </SidebarContent>
      </Sidebar>

      <SidebarInset className="flex flex-col min-h-0 min-w-0 overflow-x-hidden bg-background text-foreground">
        <header className="h-11 shrink-0 flex items-center gap-2 border-b border-border/70 bg-background/95 px-3">
          <SidebarTrigger className="md:hidden shrink-0" />
          <div className="ml-auto flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 gap-1.5 text-xs"
              onClick={onOpenCopilot}
              title="Ask Distri (⌘K)"
            >
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              Distri
              <kbd className="hidden md:inline-flex ml-1 rounded border border-border/60 bg-muted/40 px-1 text-[10px] text-muted-foreground">
                ⌘K
              </kbd>
            </Button>
          </div>
        </header>
        <main className="flex-1 min-w-0 overflow-auto">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
