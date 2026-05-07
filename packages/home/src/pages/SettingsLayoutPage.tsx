import type { ComponentType, ReactElement } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { BarChart3, KeyRound, Layers, LockIcon, Settings as SettingsIcon } from 'lucide-react';
import { useDistriHome } from '../provider/context';
import { ApiKeysManager } from '../blocks/ApiKeysManager';
import { AgentSettingsView } from '../components/AgentSettingsView';
import { UsageWidget } from '../blocks/UsageWidget';
import SecretsPage from './SecretsPage';

export type SectionId = 'models' | 'secrets' | 'apiKeys' | 'usage';

interface SectionDef {
  id: SectionId;
  label: string;
  href: string;
  icon: ComponentType<{ className?: string }>;
  render: () => ReactElement;
}

// Settings sections — kept aligned with cloud's IA. Cloud adds Workspace
// Details/Members/Billing on top via SettingsView's `sections` prop;
// OSS sticks to the platform-level settings only.
function makeSections(navigate: (to: string) => void, prefix: string): SectionDef[] {
  return [
    {
      id: 'models',
      label: 'Models',
      href: '/settings/models',
      icon: Layers,
      render: () => (
        <AgentSettingsView
          activeTab={
            // The /settings/models/providers sub-route activates the providers tab
            window.location.pathname.endsWith('/providers') ? 'providers' : 'models'
          }
          onTabChange={(t) =>
            navigate(t === 'providers' ? `${prefix}/settings/models/providers` : `${prefix}/settings/models`)
          }
        />
      ),
    },
    {
      id: 'secrets',
      label: 'Secrets',
      href: '/settings/secrets',
      icon: LockIcon,
      render: () => <SecretsPage />,
    },
    {
      id: 'apiKeys',
      label: 'API Keys',
      href: '/settings/api-keys',
      icon: KeyRound,
      render: () => <ApiKeysManager />,
    },
    {
      id: 'usage',
      label: 'Usage',
      href: '/settings/usage',
      icon: BarChart3,
      render: () => (
        <div className="max-w-2xl">
          <UsageWidget />
        </div>
      ),
    },
  ];
}

function pickActive(pathname: string, prefix: string, sections: SectionDef[]): SectionDef {
  // Models has a sub-route (/settings/models/providers) — match by prefix.
  const models = sections.find((s) => s.id === 'models')!;
  if (pathname.startsWith(`${prefix}/settings/models`)) return models;
  const exact = sections.find((s) => {
    const full = `${prefix}${s.href}`;
    return pathname === full || pathname === `${full}/`;
  });
  return exact ?? sections[0];
}

export interface SettingsLayoutPageProps {
  /** Override the section id derived from the URL (used for testing). */
  activeSection?: SectionId;
  className?: string;
}

/**
 * SettingsLayoutPage — settings shell with tabbed sub-routes.
 * Mirrors cloud's settings IA: each section is a real route so the URL
 * is shareable and the back button works.
 *
 * Mounted at /settings + /settings/* by homeRoutes.
 */
export function SettingsLayoutPage({ activeSection, className }: SettingsLayoutPageProps = {}) {
  const home = useDistriHome();
  const prefix = home.routes?.prefix ?? '';
  const location = useLocation();
  const navigate = useNavigate();
  const sections = makeSections(navigate, prefix);
  const active = activeSection
    ? sections.find((s) => s.id === activeSection) ?? sections[0]
    : pickActive(location.pathname, prefix, sections);

  const Section = active.render;

  return (
    <div className={`flex min-h-0 flex-1 flex-col ${className ?? ''}`}>
      <div className="flex items-center gap-2 border-b border-border/60 px-4 py-3 sm:px-6">
        <SettingsIcon className="h-4 w-4" />
        <h1 className="text-base font-semibold sm:text-lg">Settings</h1>
      </div>

      <div className="border-b border-border/60 px-4 sm:px-6">
        <nav className="-mb-px flex flex-wrap gap-4 text-sm font-medium text-muted-foreground sm:gap-6">
          {sections.map(({ id, label, href, icon: Icon }) => {
            const isActive = active.id === id;
            return (
              <Link
                key={id}
                to={`${prefix}${href}`}
                className={`flex items-center gap-2 border-b-2 px-1 py-3 transition ${
                  isActive
                    ? 'border-primary text-primary'
                    : 'border-transparent hover:border-border/80 hover:text-foreground'
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        <div className="mx-auto w-full max-w-5xl">{Section()}</div>
      </div>
    </div>
  );
}
