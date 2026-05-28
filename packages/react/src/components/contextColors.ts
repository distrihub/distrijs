/**
 * Threshold color for a context-usage ratio, shared by `<ContextIndicator />`
 * and `<ContextUsagePanel />`. Returns a hex literal so both inline-styled
 * components can use it directly. Keep in sync with the bands the server's
 * `ContextBudget::is_warning()` / `is_critical()` checks use.
 */
export function contextUsageColor(ratio: number): string {
  if (ratio < 0.5) return '#22c55e'; // green
  if (ratio < 0.7) return '#eab308'; // yellow
  if (ratio < 0.85) return '#f97316'; // orange
  return '#ef4444'; // red
}
