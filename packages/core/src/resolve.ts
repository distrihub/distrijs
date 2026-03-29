/**
 * Variable resolution utilities.
 *
 * Ported from distri-types/src/resolve.rs — extract and substitute `$VAR_NAME`
 * references in strings and JSON values.
 */

const VAR_PATTERN = /\$([A-Z][A-Z0-9_]*)/g;

/**
 * Extract all `$VAR_NAME` references from a string.
 * Variable names must match `[A-Z][A-Z0-9_]*`.
 */
export function extractVars(s: string): string[] {
  const vars: string[] = [];
  let match: RegExpExecArray | null;
  // Reset lastIndex since we reuse the global regex
  VAR_PATTERN.lastIndex = 0;
  while ((match = VAR_PATTERN.exec(s)) !== null) {
    vars.push(match[1]);
  }
  return vars;
}

/**
 * Recursively extract `$VAR_NAME` from all string fields in a JSON value.
 * Returns a deduped, sorted list.
 */
export function extractVarsFromValue(value: unknown): string[] {
  const vars: string[] = [];
  collectVarsFromValue(value, vars);
  vars.sort();
  // Deduplicate (after sort, duplicates are adjacent)
  return vars.filter((v, i) => i === 0 || v !== vars[i - 1]);
}

function collectVarsFromValue(value: unknown, vars: string[]): void {
  if (typeof value === 'string') {
    vars.push(...extractVars(value));
  } else if (Array.isArray(value)) {
    for (const item of value) {
      collectVarsFromValue(item, vars);
    }
  } else if (value !== null && typeof value === 'object') {
    for (const v of Object.values(value as Record<string, unknown>)) {
      collectVarsFromValue(v, vars);
    }
  }
}

/**
 * Replace all `$VAR_NAME` occurrences in a string with their resolved values.
 * Unresolved variables are left as-is.
 */
export function substituteString(s: string, resolved: Record<string, string>): string {
  VAR_PATTERN.lastIndex = 0;
  return s.replace(VAR_PATTERN, (fullMatch, varName) => {
    return resolved[varName] ?? fullMatch;
  });
}

/**
 * Recursively substitute `$VAR_NAME` in all string fields of a JSON value.
 */
export function substituteValue(value: unknown, resolved: Record<string, string>): unknown {
  if (typeof value === 'string') {
    return substituteString(value, resolved);
  }
  if (Array.isArray(value)) {
    return value.map((v) => substituteValue(v, resolved));
  }
  if (value !== null && typeof value === 'object') {
    const result: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      result[k] = substituteValue(v, resolved);
    }
    return result;
  }
  return value;
}
