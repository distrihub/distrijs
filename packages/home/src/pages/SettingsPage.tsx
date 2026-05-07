import type { ReactNode } from 'react';
import { SettingsSection } from '../blocks/SettingsSection';
import { SkillBrowser } from '../blocks/SkillBrowser';
import { TemplateBrowser } from '../blocks/TemplateBrowser';
import { ConnectionList } from '../blocks/ConnectionList';
import { SecretsManager } from '../blocks/SecretsManager';
import { ProvidersManager } from '../blocks/ProvidersManager';
import { ProfileEditor } from '../blocks/ProfileEditor';
import { AppearancePicker } from '../blocks/AppearancePicker';
import { useNavigate } from 'react-router-dom';
import { useDistriHome } from '../provider/context';
import type { Connection } from '../blocks/ConnectionList';

export interface SettingsPageProps {
  /** Cloud injects billing + workspace sections here. */
  extraSections?: ReactNode;
  /** Disable specific built-in sections. */
  hide?: {
    skills?: boolean;
    templates?: boolean;
    connections?: boolean;
    secrets?: boolean;
    providers?: boolean;
    profile?: boolean;
    appearance?: boolean;
  };
}

/**
 * SettingsPage — Tier-3 page that composes settings sections.
 * OSS-relevant sections (skills, templates, connections) are included by
 * default. Cloud injects extra sections (billing, workspace members, etc.)
 * via the `extraSections` prop.
 *
 * Secrets, Providers, Profile, and Appearance don't yet have block-level
 * equivalents — they are stubbed with TODOs for follow-up tasks.
 */
export function SettingsPage({ extraSections, hide }: SettingsPageProps = {}) {
  const nav = useNavigate();
  const home = useDistriHome();
  const prefix = home.routes?.prefix ?? '';

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
      <div className="p-4 sm:p-6 space-y-6 max-w-4xl">
        <h1 className="text-xl font-semibold">Settings</h1>

        {!hide?.skills && (
          <SettingsSection
            name="Skills"
            description="Manage workspace skills — reusable prompt snippets attached to agents."
          >
            <SkillBrowser />
          </SettingsSection>
        )}

        {!hide?.templates && (
          <SettingsSection
            name="Templates"
            description="Reusable prompt templates for quick agent setup."
          >
            <TemplateBrowser />
          </SettingsSection>
        )}

        {!hide?.connections && (
          <SettingsSection
            name="Connections"
            description="OAuth and custom integrations available to agents in this workspace."
          >
            <ConnectionList
              onAdd={() => nav(`${prefix}/connections/new`)}
              onEdit={(conn: Connection) =>
                nav(`${prefix}/connections/${encodeURIComponent(conn.id)}/edit`)
              }
            />
          </SettingsSection>
        )}

        {!hide?.secrets && (
          <SettingsSection
            name="Secrets"
            description="Workspace secret values used by skills and agents."
          >
            <SecretsManager />
          </SettingsSection>
        )}

        {!hide?.providers && (
          <SettingsSection
            name="Providers & Models"
            description="Configure AI model providers and custom endpoints."
          >
            <ProvidersManager />
          </SettingsSection>
        )}

        {!hide?.profile && (
          <SettingsSection
            name="Profile"
            description="Your display name and personal preferences."
          >
            <ProfileEditor />
          </SettingsSection>
        )}

        {!hide?.appearance && (
          <SettingsSection
            name="Appearance"
            description="Theme and display options."
          >
            <AppearancePicker />
          </SettingsSection>
        )}

        {extraSections}
      </div>
    </div>
  );
}
