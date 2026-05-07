import { useDistriHome } from '../provider/context';
import { UsageWidget } from '../blocks/UsageWidget';

/**
 * UsagePage — Tier-3 page wrapping the UsageWidget.
 * Cloud's UsagePage (settings/UsagePage.tsx) also exposes limits configuration
 * and history tables; those are cloud-specific (workspace settings API).
 * The OSS page exposes the UsageWidget. Cloud can inject an upgrade CTA via
 * UsageWidget's `slots.usageCta` prop when rendering this page with overrides.
 * Consumer app is responsible for wrapping this in a layout shell.
 */
export function UsagePage() {
  useDistriHome(); // ensure context is present

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="border-b border-border/60 px-4 py-3 sm:px-6 shrink-0">
        <h1 className="text-base font-semibold sm:text-lg">Usage</h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Token usage for the current period.
        </p>
      </div>
      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        <UsageWidget className="max-w-lg" />
      </div>
    </div>
  );
}
