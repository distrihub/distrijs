import React, { type ReactNode } from 'react';
import { Card, cn } from '@distri/components';

export interface SettingsSectionProps {
  name: string;
  description?: string;
  children: ReactNode;
  className?: string;
}

/**
 * SettingsSection — composable section header + card body.
 * Used by Task 13's SettingsPage to compose sections:
 *
 *   <SettingsSection name="Skills"><SkillBrowser /></SettingsSection>
 *
 * Cloud injects extra sections (e.g. billing, workspace settings) via
 * `extraSections` prop on the SettingsPage.
 */
export function SettingsSection({ name, description, children, className }: SettingsSectionProps) {
  return (
    <section className={cn('space-y-3', className)}>
      <div>
        <h2 className="text-lg font-semibold">{name}</h2>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
      <Card className="p-4">{children}</Card>
    </section>
  );
}
