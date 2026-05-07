import type { ReactNode } from 'react';
import { useDistriHome } from '../provider/context';
import { DistriSidebar } from './DistriSidebar';

export interface DashboardLayoutProps {
  children: ReactNode;
  /** Custom sidebar content; defaults to <DistriSidebar />. */
  sidebar?: ReactNode;
  /** Custom header content; merged with home.slots.header. */
  header?: ReactNode;
  className?: string;
}

/**
 * OSS layout shell for Distri dashboard pages.
 *
 * Uses a plain <aside> + <header> shell (not the shadcn collapsible Sidebar
 * primitive — that lives in app-side code). Cloud overrides the sidebar via
 * the `sidebar` prop or the `sidebarPrepend`/`sidebarAppend` slots from
 * DistriHomeProvider. The shadcn collapse-on-mobile behaviour is intentionally
 * OUT of this block; cloud's Task 16 layout can swap it back via override.
 */
export function DashboardLayout({
  children,
  sidebar,
  header,
  className,
}: DashboardLayoutProps) {
  const { slots } = useDistriHome();
  return (
    <div className="flex h-screen min-h-0 bg-background text-foreground">
      <aside className="w-64 shrink-0 border-r border-sidebar-border/70 flex flex-col bg-sidebar text-sidebar-foreground">
        {slots?.sidebarPrepend}
        {sidebar ?? <DistriSidebar />}
        {slots?.sidebarAppend}
      </aside>
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-11 shrink-0 border-b border-border/70 flex items-center px-4 gap-2 bg-background/95">
          {slots?.header}
          {header}
        </header>
        <main className={`flex-1 overflow-auto${className ? ` ${className}` : ''}`}>
          {children}
        </main>
      </div>
    </div>
  );
}
