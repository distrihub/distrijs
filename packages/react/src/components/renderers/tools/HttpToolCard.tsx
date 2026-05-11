import React, { useState } from 'react';
import { ChevronRight, ChevronDown, CheckCircle2, XCircle } from 'lucide-react';
import { ToolCall } from '@distri/core';
import { ToolCallState } from '@/stores/chatStateStore';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PathConfig {
  /** URL pattern with optional `:param` wildcards, e.g. `/api/users/:id` */
  pattern: string;
  /** Human-readable label shown in the card header, e.g. "Get User" */
  label?: string;
}

export interface HttpToolCardProps {
  toolCall: ToolCall;
  state?: ToolCallState;
  /** Registered path configs for label matching */
  paths?: PathConfig[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const METHOD_STYLES: Record<string, string> = {
  GET: 'bg-green-500/15 text-green-700 dark:text-green-400',
  POST: 'bg-blue-500/15 text-blue-700 dark:text-blue-400',
  PUT: 'bg-amber-500/15 text-amber-700 dark:text-amber-400',
  PATCH: 'bg-purple-500/15 text-purple-700 dark:text-purple-400',
  DELETE: 'bg-red-500/15 text-red-700 dark:text-red-400',
};

function statusStyle(code: number): string {
  if (code >= 200 && code < 300) return 'bg-green-500/15 text-green-700 dark:text-green-400';
  if (code >= 400 && code < 500) return 'bg-amber-500/15 text-amber-700 dark:text-amber-400';
  if (code >= 500) return 'bg-red-500/15 text-red-700 dark:text-red-400';
  return 'bg-muted text-muted-foreground';
}

/** Match a concrete path against a registered pattern (`:param` = wildcard segment). */
export function matchPath(concrete: string, pattern: string): boolean {
  const a = concrete.replace(/^\/|\/$/g, '').split('/');
  const b = pattern.replace(/^\/|\/$/g, '').split('/');
  if (a.length !== b.length) return false;
  return b.every((seg, i) => seg.startsWith(':') || seg === a[i]);
}

function findLabel(path: string | undefined, paths: PathConfig[]): string | undefined {
  if (!path) return undefined;
  for (const cfg of paths) {
    if (matchPath(path, cfg.pattern)) return cfg.label;
  }
  return undefined;
}

function formatBody(body: unknown, maxLen = 1200): string {
  if (body === undefined || body === null) return '';
  const raw = typeof body === 'string' ? body : JSON.stringify(body, null, 2);
  return raw.length > maxLen ? raw.slice(0, maxLen) + '\n…' : raw;
}

interface ExtractedResponse {
  status?: number;
  /** Server-side success flag. Usually `status >= 200 && status < 300` but
   *  the HTTP tool may report `false` for network-level failures with no
   *  status (DNS, connection reset, etc.) — keep it as a separate signal. */
  ok?: boolean;
  body?: unknown;
}

function extractResponseData(state?: ToolCallState): ExtractedResponse {
  if (!state?.result?.parts) return {};
  for (const part of state.result.parts) {
    const p = part as any;
    // Data parts from HTTP handler carry { status, ok, body, headers }
    if (p.part_type === 'data' && typeof p.data === 'object' && p.data !== null) {
      const d = p.data as Record<string, unknown>;
      if ('status' in d) {
        return {
          status: d.status as number,
          ok: typeof d.ok === 'boolean' ? (d.ok as boolean) : undefined,
          body: d.body,
        };
      }
      // Fallback: data part that is the response body itself (no wrapper)
      return { body: d };
    }
    // Text parts — try JSON parse for status extraction
    if (p.part_type === 'text' && typeof p.data === 'string') {
      try {
        const parsed = JSON.parse(p.data);
        if (typeof parsed === 'object' && parsed !== null && 'status' in parsed) {
          return {
            status: parsed.status as number,
            ok: typeof parsed.ok === 'boolean' ? parsed.ok : undefined,
            body: parsed.body ?? parsed,
          };
        }
        return { body: parsed };
      } catch {
        // plain text response
        return { body: p.data };
      }
    }
  }
  return {};
}

/**
 * Treat a response as successful iff the server reported `ok: true`
 * OR the status code is 2xx. Empty body on a 2xx is a perfectly
 * valid response (DELETE → 204 No Content, POST → 201 with no body).
 */
function isResponseOk(status?: number, ok?: boolean): boolean {
  if (typeof ok === 'boolean') return ok;
  if (typeof status === 'number') return status >= 200 && status < 300;
  return false;
}

/** Is `body` effectively empty for display purposes? */
function isEmptyBody(body: unknown): boolean {
  if (body === undefined || body === null) return true;
  if (typeof body === 'string') return body.trim().length === 0;
  if (Array.isArray(body)) return body.length === 0;
  if (typeof body === 'object') return Object.keys(body as object).length === 0;
  return false;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const HttpToolCard: React.FC<HttpToolCardProps> = ({ toolCall, state, paths = [] }) => {
  const input = (toolCall.input ?? {}) as Record<string, unknown>;
  const method = ((input.method as string) ?? 'GET').toUpperCase();
  const urlPath = (input.path as string) ?? (input.url as string) ?? (input.endpoint as string) ?? '';
  const requestBody = input.body;
  const hasRequestBody = requestBody !== undefined && requestBody !== null;

  const isError = state?.status === 'error';
  const isRunning = state?.status === 'running' || state?.status === 'pending';
  const [expanded, setExpanded] = useState(isError);
  const [requestExpanded, setRequestExpanded] = useState(false);

  const label = findLabel(urlPath, paths);
  const { status: statusCode, ok: serverOk, body: responseBody } = extractResponseData(state);
  const succeeded = isResponseOk(statusCode, serverOk);
  const bodyIsEmpty = isEmptyBody(responseBody);

  const timing = state?.endTime && state?.startTime
    ? `${((state.endTime - state.startTime) / 1000).toFixed(1)}s`
    : state?.startTime
      ? `${((Date.now() - state.startTime) / 1000).toFixed(1)}s…`
      : undefined;

  const methodCls = METHOD_STYLES[method] ?? 'bg-muted text-muted-foreground';
  const borderCls = isError ? 'border-destructive/50' : 'border-border';

  return (
    <div className={`rounded-md border ${borderCls} overflow-hidden text-sm`}>
      {/* Header */}
      <div
        className={`flex items-center gap-2 px-3 py-2 cursor-pointer ${isError ? 'bg-destructive/5' : 'bg-card'}`}
        onClick={() => setExpanded(e => !e)}
      >
        {/* Method badge */}
        <span className={`text-[10px] sm:text-[11px] font-semibold px-1.5 py-0.5 rounded ${methodCls} flex-shrink-0`}>
          {method}
        </span>

        {/* URL + label.
           Narrow viewports (the thread side panel can be ~360 px wide)
           used to character-wrap the label because:
             1) the URL had a hard-coded `max-w-[220px]` that ate the
                whole flex line,
             2) the label span had no `truncate`, so the browser
                wrapped it onto multiple lines mid-word.
           Now: URL uses `flex-1 min-w-0 truncate` (no fixed max);
           label is `truncate` with `min-w-0` so both shrink to a
           single line with ellipsis. */}
        <code className="flex-1 min-w-0 text-[11px] text-muted-foreground truncate">
          {urlPath}
        </code>
        {label && (
          <span className="hidden sm:inline min-w-0 max-w-[40%] text-[10px] text-muted-foreground/70 truncate whitespace-nowrap">
            {label}
          </span>
        )}

        {/* Status code badge */}
        {statusCode != null && (
          <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${statusStyle(statusCode)} flex-shrink-0`}>
            {statusCode}
          </span>
        )}

        {/* Running indicator */}
        {isRunning && (
          <span className="flex items-center gap-1 text-[10px] text-primary">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
          </span>
        )}

        {/* Timing */}
        {timing && <span className="text-[10px] text-muted-foreground flex-shrink-0">{timing}</span>}

        {/* Chevron */}
        {expanded
          ? <ChevronDown className="h-3 w-3 text-muted-foreground flex-shrink-0" />
          : <ChevronRight className="h-3 w-3 text-muted-foreground flex-shrink-0" />
        }
      </div>

      {/* Expanded body */}
      {expanded && (
        <div className="border-t border-border bg-background">
          {/* Error */}
          {state?.error && (
            <div className="px-3 py-2 text-[12px] text-destructive">{state.error}</div>
          )}

          {/* Request body (collapsible) */}
          {hasRequestBody && (
            <div className="border-b border-border">
              <div
                className="flex items-center gap-1.5 px-3 py-1.5 cursor-pointer text-[11px] text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => setRequestExpanded(e => !e)}
              >
                {requestExpanded
                  ? <ChevronDown className="h-3 w-3 flex-shrink-0" />
                  : <ChevronRight className="h-3 w-3 flex-shrink-0" />
                }
                <span className="font-medium">Request Body</span>
              </div>
              {requestExpanded && (
                <pre className="px-3 pb-2 text-[11px] font-mono text-muted-foreground whitespace-pre-wrap max-h-[200px] overflow-auto">
                  {formatBody(requestBody)}
                </pre>
              )}
            </div>
          )}

          {/* Response body.
             Empty body on a 2xx (DELETE → 204, idempotent PUT, etc.)
             is a *successful* response — show that explicitly with
             a check + status code instead of an ambiguous "No
             response body" line that reads like an error. */}
          {!isRunning && (
            <div className="p-3 space-y-1.5">
              <div className="text-[11px] font-medium text-muted-foreground">Response</div>
              {bodyIsEmpty ? (
                <div
                  className={`flex items-center gap-1.5 text-[11px] rounded p-2 ${
                    succeeded
                      ? 'bg-green-500/10 text-green-700 dark:text-green-400'
                      : statusCode != null
                        ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400'
                        : 'bg-muted/50 text-muted-foreground'
                  }`}
                >
                  {succeeded ? (
                    <CheckCircle2 className="h-3 w-3 flex-shrink-0" />
                  ) : statusCode != null ? (
                    <XCircle className="h-3 w-3 flex-shrink-0" />
                  ) : null}
                  <span>
                    {succeeded
                      ? `Success · ${statusCode ?? '2xx'} (no body)`
                      : statusCode != null
                        ? `Failed · ${statusCode} (no body)`
                        : 'No response received'}
                  </span>
                </div>
              ) : (
                <pre className="text-[11px] font-mono text-muted-foreground whitespace-pre-wrap max-h-[250px] overflow-auto bg-muted/50 rounded p-2">
                  {formatBody(responseBody)}
                </pre>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
