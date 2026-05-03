import React, { useEffect, useState, useCallback, type ReactNode } from 'react';
import { Activity } from 'lucide-react';
import { useDistriHome } from '../provider/context';
import { useDistriHomeClient } from '../DistriHomeProvider';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface UsageCurrentPeriod {
  day_tokens: number;
  week_tokens?: number;
  month_tokens?: number;
  tier?: string;
}

export interface UsageTokenLimits {
  daily_tokens?: number | null;
  weekly_tokens?: number | null;
  monthly_tokens?: number | null;
}

export interface UsageData {
  current: UsageCurrentPeriod;
  token_limits: UsageTokenLimits;
}

// ---------------------------------------------------------------------------
// Slots
// ---------------------------------------------------------------------------

export interface UsageWidgetSlots {
  /**
   * Cloud injects an "Upgrade" CTA here, gated by `home.features?.usage?.plansCta`.
   */
  usageCta?: ReactNode;
}

export interface UsageWidgetProps {
  slots?: UsageWidgetSlots;
  onNavigateToUsage?: () => void;
  className?: string;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function formatNumber(num: number): string {
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return num.toString();
}

function TokenUsageBar({ current, limit }: { current: number; limit: number | null | undefined }) {
  const percentage = limit ? Math.min((current / limit) * 100, 100) : 0;
  const isUnlimited = !limit;
  const isWarning = percentage >= 80;
  const isDanger = percentage >= 95;
  const remaining = limit ? limit - current : null;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">Daily tokens</span>
        <span className="font-medium text-foreground">
          {formatNumber(current)}
          {isUnlimited ? '' : ` / ${formatNumber(limit!)}`}
        </span>
      </div>
      {!isUnlimited ? (
        <>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className={`h-full transition-all ${
                isDanger ? 'bg-red-500' : isWarning ? 'bg-yellow-500' : 'bg-primary'
              }`}
              style={{ width: `${percentage}%` }}
            />
          </div>
          {remaining !== null && remaining > 0 && (
            <div className="text-xs text-muted-foreground">{formatNumber(remaining)} remaining</div>
          )}
        </>
      ) : (
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div className="h-full w-full bg-emerald-500/30" />
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main block
// ---------------------------------------------------------------------------

/**
 * UsageWidget — shows daily token usage + optional limit bar.
 * For OSS installs, limits are typically null (unlimited).
 * Cloud injects an "Upgrade" CTA via `slots.usageCta` when
 * `home.features?.usage?.plansCta` is enabled.
 */
export function UsageWidget({ slots, onNavigateToUsage, className }: UsageWidgetProps) {
  const home = useDistriHome();
  const homeClient = useDistriHomeClient();

  const [usage, setUsage] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Resolve CTA: prop slot takes precedence over provider slot; both gated by feature flag
  const showPlansCta = home.features?.usage?.plansCta ?? false;
  const usageCta = showPlansCta ? (slots?.usageCta ?? null) : null;

  const load = useCallback(async () => {
    if (!homeClient) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const stats = await homeClient.getUsage();
      // Map UsageStatsResponse → UsageData (what this widget expects)
      setUsage({
        current: {
          day_tokens: stats.totals.input_tokens + stats.totals.output_tokens,
          month_tokens: undefined,
          tier: undefined,
        },
        token_limits: {
          daily_tokens: null,
          weekly_tokens: null,
          monthly_tokens: null,
        },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, [homeClient]);

  useEffect(() => {
    void load();
  }, [load]);

  const tierLabel =
    usage?.current.tier === 'professional'
      ? 'Pro'
      : usage?.current.tier === 'premium'
      ? 'Premium'
      : usage?.current.tier === 'free'
      ? 'Free'
      : null;

  return (
    <div className={`rounded-2xl border border-border/70 bg-card p-4 shadow-sm ${className ?? ''}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Activity className="h-4 w-4 text-primary" />
          Usage
        </div>
        {tierLabel && (
          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
            {tierLabel}
          </span>
        )}
      </div>

      {loading ? (
        <div className="mt-4 text-xs text-muted-foreground">Loading...</div>
      ) : error ? (
        <div className="mt-4 text-xs text-red-500">{error}</div>
      ) : usage ? (
        <div className="mt-4">
          <TokenUsageBar
            current={usage.current.day_tokens}
            limit={usage.token_limits.daily_tokens}
          />
        </div>
      ) : (
        <div className="mt-4 text-xs text-muted-foreground">No usage data</div>
      )}

      {/* Cloud "Upgrade" CTA slot */}
      {usageCta && <div className="mt-4">{usageCta}</div>}

      {onNavigateToUsage && (
        <button
          type="button"
          onClick={onNavigateToUsage}
          className="mt-4 w-full rounded-md border border-primary/20 bg-primary/5 px-3 py-1.5 text-xs font-medium text-primary transition hover:bg-primary/10"
        >
          View details
        </button>
      )}
    </div>
  );
}
