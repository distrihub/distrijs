import { Link, useLocation } from 'react-router-dom';
import {
  Home,
  Zap,
  Sparkles,
  BookOpen,
  MessageSquare,
  Database,
  Send,
  Link2,
  User,
  Activity,
  BarChart3,
  Settings,
} from 'lucide-react';
import { useDistriHome } from '../provider/context';

type NavSection = {
  label?: string;
  items: NavItem[];
};

type NavItem = {
  id: string;
  label: string;
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  tint?: string;
};

const NAV_SECTIONS: NavSection[] = [
  {
    items: [
      { id: 'home', label: 'Home', to: '/home', icon: Home },
    ],
  },
  {
    label: 'Workspace',
    items: [
      { id: 'agents', label: 'Agents', to: '/workspace/agents', icon: Zap, tint: 'text-amber-500' },
      { id: 'skills', label: 'Skills', to: '/workspace/skills', icon: Sparkles, tint: 'text-violet-400' },
      { id: 'templates', label: 'Templates', to: '/workspace/templates', icon: BookOpen, tint: 'text-cyan-400' },
    ],
  },
  {
    label: 'Operate',
    items: [
      { id: 'threads', label: 'Threads', to: '/threads', icon: MessageSquare },
      { id: 'sessions', label: 'Sessions', to: '/sessions', icon: Database },
      { id: 'channels', label: 'Channels', to: '/channels', icon: Send },
      { id: 'connections', label: 'Connections', to: '/connections', icon: Link2 },
      { id: 'users', label: 'Users', to: '/users', icon: User },
    ],
  },
  {
    label: 'Observe',
    items: [
      { id: 'traces', label: 'Traces', to: '/traces', icon: Activity },
      { id: 'usage', label: 'Usage', to: '/settings/usage', icon: BarChart3 },
      { id: 'settings', label: 'Settings', to: '/settings', icon: Settings },
    ],
  },
];

export interface DistriSidebarProps {
  className?: string;
}

/**
 * Default OSS sidebar nav.
 *
 * Mirrors cloud's four-section IA (primary / workspace / operate / observe).
 * Cloud overrides this entirely via DashboardLayout's `sidebar` prop and
 * injects workspace-specific chrome (WorkspaceSwitcher, user dropdown) via
 * sidebarPrepend/sidebarAppend slots.
 */
export function DistriSidebar({ className }: DistriSidebarProps) {
  const home = useDistriHome();
  const prefix = home.routes?.prefix ?? '';
  const location = useLocation();

  const isActive = (to: string) => {
    const full = `${prefix}${to}`;
    if (to === '/settings') {
      return (
        location.pathname === full ||
        (location.pathname.startsWith(full + '/') &&
          !location.pathname.startsWith(`${prefix}/settings/usage`))
      );
    }
    return location.pathname === full || location.pathname.startsWith(full + '/');
  };

  return (
    <nav className={`flex-1 px-3 py-4 space-y-4 overflow-y-auto${className ? ` ${className}` : ''}`}>
      {NAV_SECTIONS.map((section, si) => (
        <div key={si}>
          {section.label && (
            <p className="mb-1 px-2 text-[10px] uppercase tracking-wider text-sidebar-foreground/60 font-medium">
              {section.label}
            </p>
          )}
          <ul className="space-y-0.5">
            {section.items.map(({ id, label, to, icon: Icon, tint }) => (
              <li key={id}>
                <Link
                  to={`${prefix}${to}`}
                  className={`flex items-center gap-2 px-2 py-2 rounded-md text-sm transition-colors ${
                    isActive(to)
                      ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
                      : 'text-sidebar-foreground hover:bg-sidebar-accent/60'
                  }`}
                >
                  <Icon className={`h-4 w-4 shrink-0${tint ? ` ${tint}` : ''}`} />
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );
}
