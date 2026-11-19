/**
 * McpAppView — renders one MCP App (SEP-1865) for a tool call.
 *
 * - Loads the `ui://` HTML: inline `link.data.text`, else `resources/read`
 *   through the distri host route (`client.readMcpAppResource`).
 * - Runs it in `<iframe srcdoc>` without `allow-same-origin` (an opaque
 *   origin: no access to the host's cookies, storage or DOM) under the CSP the
 *   resource declares in `_meta.ui.csp` (no network by default).
 * - Speaks the JSON-RPC bridge (`bridge.ts`): answers `ui/initialize`, sends
 *   `tool-input` and `tool-result` for the call, routes the app's
 *   `tools/call`, `ui/message`, `ui/update-model-context`, `ui/open-link`,
 *   display mode, size and log messages to the host (`McpAppsContext`).
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { McpAppHostMeta, McpAppReadResourceResult, ResourceLinkPart, ToolCall } from '@distri/core';
import type { ToolCallState } from '../stores/chatStateStore';
import { useDistri } from '../DistriProvider';
import {
  McpAppBridge,
  MCP_APP_SANDBOX,
  buildAllowAttribute,
  buildCsp,
  htmlFromReadResult,
  injectCsp,
  type DisplayMode,
  type HostContext,
} from './bridge';
import { messageText, useMcpAppsHost, type McpAppSource } from './McpAppsContext';

export interface McpAppViewProps {
  link: ResourceLinkPart;
  toolCall: ToolCall;
  state: ToolCallState;
}

export function getHostMeta(link: ResourceLinkPart): McpAppHostMeta | undefined {
  const d = (link.data.meta as { distri?: McpAppHostMeta } | undefined)?.distri;
  return d && typeof d.server === 'string' ? d : undefined;
}

function currentTheme(): 'light' | 'dark' {
  if (typeof document === 'undefined') return 'light';
  const root = document.documentElement;
  if (root.classList.contains('dark') || root.dataset.theme === 'dark') return 'dark';
  if (root.classList.contains('light') || root.dataset.theme === 'light') return 'light';
  return typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export const McpAppView: React.FC<McpAppViewProps> = ({ link, toolCall, state }) => {
  const { client } = useDistri();
  const host = useMcpAppsHost();
  const hostMeta = getHostMeta(link);
  const server = hostMeta?.server;
  const uri = link.data.uri;
  const maxHeight = host.maxHeight ?? 720;

  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const [resource, setResource] = useState<McpAppReadResourceResult | null>(
    link.data.text != null
      ? { contents: [{ uri, mimeType: link.data.mime_type, text: link.data.text }] }
      : null,
  );
  const [error, setError] = useState<string | null>(null);
  const preferred = (link.data.meta?.ui as { preferredSize?: { height?: number } } | undefined)?.preferredSize?.height;
  const [height, setHeight] = useState<number>(Math.min(preferred ?? 420, maxHeight));
  const [displayMode, setDisplayMode] = useState<DisplayMode>('inline');

  const source: McpAppSource = useMemo(
    () => ({ toolCallId: toolCall.tool_call_id, toolName: toolCall.tool_name, server, uri }),
    [toolCall.tool_call_id, toolCall.tool_name, server, uri],
  );

  // 1. Load the resource.
  useEffect(() => {
    if (resource) return;
    if (!client || !server) {
      if (!server) setError(`No MCP connection named for ${uri}.`);
      return;
    }
    let cancelled = false;
    client
      .readMcpAppResource(server, uri)
      .then((r) => !cancelled && setResource(r))
      .catch((e) => !cancelled && setError(e instanceof Error ? e.message : String(e)));
    return () => {
      cancelled = true;
    };
  }, [client, server, uri, resource]);

  const html = useMemo(() => {
    const body = htmlFromReadResult(resource ?? undefined);
    if (body == null) return null;
    const ui = resource?.contents?.[0]?._meta?.ui;
    return injectCsp(body, buildCsp(ui?.csp));
  }, [resource]);
  const allow = buildAllowAttribute(resource?.contents?.[0]?._meta?.ui?.permissions);
  const prefersBorder = resource?.contents?.[0]?._meta?.ui?.prefersBorder !== false;

  // Latest values for the bridge's handlers without re-creating it.
  const live = useRef({ host, client, server, source, displayMode, maxHeight });
  live.current = { host, client, server, source, displayMode, maxHeight };

  const hostContext = useCallback((): HostContext => {
    const { displayMode: mode, maxHeight: mh } = live.current;
    const width = iframeRef.current?.clientWidth;
    return {
      theme: currentTheme(),
      displayMode: mode,
      availableDisplayModes: ['inline', 'fullscreen'],
      containerDimensions: mode === 'fullscreen' && typeof window !== 'undefined'
        ? { width: window.innerWidth, height: window.innerHeight }
        : { maxHeight: mh, ...(width ? { width } : {}) },
      locale: typeof navigator !== 'undefined' ? navigator.language : undefined,
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      platform: 'web',
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
      toolInfo: { id: toolCall.tool_call_id, tool: { name: hostMeta?.tool ?? toolCall.tool_name } },
    };
  }, [toolCall.tool_call_id, toolCall.tool_name, hostMeta?.tool]);

  // 2. The bridge (one per mounted frame).
  const bridge = useMemo(
    () =>
      new McpAppBridge({
        post: (m) => iframeRef.current?.contentWindow?.postMessage(m, '*'),
        hostInfo: { name: 'distri', version: '1' },
        hostContext,
        handlers: {},
      }),
    // A new document needs a new bridge.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [html],
  );

  useEffect(() => {
    const emit = (e: Parameters<NonNullable<typeof host.onEvent>>[0]) => live.current.host.onEvent?.(e);
    bridge.setHandlers({
      callTool: async (name, args) => {
        const { client: c, server: s, source: src, host: h } = live.current;
        if (!c || !s) throw new Error('no MCP connection for this app');
        try {
          const result = await c.callMcpAppTool(s, name, args);
          h.onToolCall?.({ name, arguments: args, result }, src);
          emit({ type: 'tool-call', source: src, name, arguments: args, result });
          return result;
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          h.onToolCall?.({ name, arguments: args, error: msg }, src);
          emit({ type: 'tool-call', source: src, name, arguments: args, error: msg });
          throw err;
        }
      },
      readResource: async (u) => {
        const { client: c, server: s } = live.current;
        if (!c || !s) throw new Error('no MCP connection for this app');
        return c.readMcpAppResource(s, u);
      },
      openLink: (url) => {
        window.open(url, '_blank', 'noopener,noreferrer');
        emit({ type: 'open-link', source: live.current.source, url });
      },
      message: async ({ role, content }) => {
        const { host: h, source: src } = live.current;
        const text = messageText(content);
        const handled = await h.onMessage?.(text, src);
        if (handled !== false && text) await h.defaultSendMessage?.(text);
        emit({ type: 'message', source: src, role, text, content });
      },
      updateModelContext: async (ctx) => {
        const { host: h, source: src } = live.current;
        const context = { source: src, ...ctx };
        const handled = await h.onModelContext?.(context);
        if (handled !== false) h.defaultSetModelContext?.(context);
        emit({ type: 'model-context', source: src, context });
      },
      requestDisplayMode: (mode) => {
        const next: DisplayMode = mode === 'fullscreen' ? 'fullscreen' : 'inline';
        setDisplayMode(next);
        emit({ type: 'display-mode', source: live.current.source, mode: next });
        return next;
      },
      sizeChanged: ({ height: h }) => {
        if (typeof h === 'number' && h > 0) setHeight(Math.min(Math.ceil(h), 2000));
      },
      log: (entry) => {
        live.current.host.onLog?.(entry, live.current.source);
        emit({ type: 'log', source: live.current.source, entry });
      },
    });
  }, [bridge]);

  // 3. Messages from this frame only.
  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      const win = iframeRef.current?.contentWindow;
      if (!win || e.source !== win) return;
      void bridge.handleMessage(e.data);
    };
    window.addEventListener('message', onMessage);
    return () => {
      window.removeEventListener('message', onMessage);
      void bridge.teardown('unmount');
    };
  }, [bridge]);

  // 4. Tool input and result (queued by the bridge until the app is initialized).
  useEffect(() => {
    bridge.sendToolInput(toolCall.input as Record<string, unknown> | undefined);
  }, [bridge, toolCall.input]);

  useEffect(() => {
    if (state.status === 'completed') {
      bridge.sendToolResult(hostMeta?.result ?? { content: textContentOf(state) });
    } else if (state.status === 'error') {
      bridge.sendToolCancelled(state.error ?? 'tool failed');
    }
  }, [bridge, state, hostMeta?.result]);

  // 5. Display-mode changes reach the app.
  useEffect(() => {
    if (bridge.isInitialized) bridge.sendHostContextChanged({ displayMode, containerDimensions: hostContext().containerDimensions });
  }, [bridge, displayMode, hostContext]);

  if (error) {
    return (
      <div className="distri-mcp-app my-2 rounded-md border border-destructive/40 bg-destructive/5 p-3 text-xs text-destructive">
        Couldn't load the app {uri}: {error}
      </div>
    );
  }
  if (html == null) {
    return (
      <div className="distri-mcp-app my-2 rounded-md border bg-muted/40 p-3 text-xs text-muted-foreground">
        Loading {toolCall.tool_name}…
      </div>
    );
  }

  const frame = (
    <iframe
      ref={iframeRef}
      title={`${toolCall.tool_name} app`}
      srcDoc={html}
      sandbox={MCP_APP_SANDBOX}
      {...(allow ? { allow } : {})}
      style={{
        width: '100%',
        height: displayMode === 'fullscreen' ? '100%' : `${height}px`,
        border: 0,
        display: 'block',
      }}
    />
  );

  if (displayMode === 'fullscreen') {
    return (
      <div className="distri-mcp-app fixed inset-0 z-50 flex flex-col bg-background">
        <div className="flex items-center justify-between border-b px-3 py-1.5 text-xs text-muted-foreground">
          <span className="truncate font-medium">{toolCall.tool_name}</span>
          <button
            type="button"
            className="rounded px-2 py-0.5 hover:bg-muted"
            onClick={() => setDisplayMode('inline')}
            aria-label="Exit full screen"
          >
            Close
          </button>
        </div>
        <div className="flex-1">{frame}</div>
      </div>
    );
  }

  return (
    <div className={`distri-mcp-app my-2 overflow-hidden rounded-md ${prefersBorder ? 'border' : ''} bg-background`}>
      {frame}
    </div>
  );
};

function textContentOf(state: ToolCallState): Array<{ type: 'text'; text: string }> {
  const parts = (state.result?.parts ?? []) as Array<{ part_type: string; data: unknown }>;
  return parts
    .filter((p) => p.part_type === 'text' && typeof p.data === 'string')
    .map((p) => ({ type: 'text' as const, text: p.data as string }));
}
