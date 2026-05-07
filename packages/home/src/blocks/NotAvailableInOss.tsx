import type { LucideIcon } from 'lucide-react';
import { Cloud } from 'lucide-react';

export interface NotAvailableInOssProps {
  /** Feature name displayed in the heading. */
  feature: string;
  /** Optional description shown below the heading. */
  description?: string;
  /** Optional icon for the feature. */
  icon?: LucideIcon;
  /** Optional CTA url for cloud. Defaults to https://distri.dev. */
  ctaHref?: string;
  className?: string;
}

/**
 * Placeholder shown for features that exist in cloud but not in OSS.
 * Designed to look intentional, not broken.
 */
export function NotAvailableInOss({
  feature,
  description,
  icon: Icon,
  ctaHref = 'https://distri.dev',
  className,
}: NotAvailableInOssProps) {
  return (
    <div className={`flex min-h-0 flex-1 items-center justify-center p-6 ${className ?? ''}`}>
      <div className="max-w-md w-full text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
          {Icon ? <Icon className="h-6 w-6 text-muted-foreground" /> : <Cloud className="h-6 w-6 text-muted-foreground" />}
        </div>
        <h2 className="text-base font-semibold">{feature}</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {description ?? `${feature} is not available in OSS yet. It is part of Distri Cloud.`}
        </p>
        <a
          href={ctaHref}
          target="_blank"
          rel="noreferrer"
          className="mt-4 inline-flex items-center gap-1 text-sm text-primary hover:underline"
        >
          Learn more about Distri Cloud →
        </a>
      </div>
    </div>
  );
}
