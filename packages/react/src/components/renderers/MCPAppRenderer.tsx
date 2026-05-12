/**
 * MCPAppRenderer — renders tool results whose payload includes a
 * `ResourceLinkPart` per the MCP-Apps spec (`_meta.ui.resourceUri`).
 *
 * Selected automatically by ToolExecutionRenderer when the tool result
 * carries at least one resource link with `mime_type` matching
 * `text/html;profile=mcp-app`. Mounts the resource HTML in a sandboxed
 * iframe — the same approach the existing `live_view` event uses — and
 * forwards `mcp-ui:*` postMessage events between iframe and chat:
 *
 *   - mcp-ui:tool   → invoke a chat tool (forwarded to onAction)
 *   - mcp-ui:prompt → send a follow-up prompt as the user
 *   - mcp-ui:link   → open the URL in a new tab
 *   - mcp-ui:notify → forwarded to onAction (host can render its own toast)
 *   - mcp-ui:size   → resize the iframe to fit content
 *
 * The renderer fetches the resource body itself rather than letting the
 * iframe load from the `ui://` URI directly — `ui://` isn't a valid
 * browser scheme. The fetch goes through the Distri MCP read-resource
 * endpoint, which mirrors the JSON-RPC `resources/read` call our
 * upstream `distri-mcp` server already exposes.
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { ResourceLinkPart, ToolCall, DistriPart } from '@distri/core';
import type { ToolCallState } from '../../stores/chatStateStore';

export interface MCPAppRendererProps {
  toolCall: ToolCall;
  state: ToolCallState;
  /** Called when the iframe emits mcp-ui:tool or mcp-ui:notify. The host
   * decides whether to fan the event out (e.g., re-send the prompt to
   * the agent, surface a toast, etc.). */
  onAction?: (event: { type: string; payload: unknown }) => void;
  /** Override how a `ui://` resource is fetched. Defaults to using the
   * resource's `text` body if the server already inlined it on the
   * result; otherwise falls back to the configured fetcher. */
  fetchResource?: (uri: string) => Promise<string>;
}

const MCP_UI_MIME = 'text/html;profile=mcp-app';

export function findResourceLinks(result?: { parts: readonly DistriPart[] }): ResourceLinkPart[] {
  if (!result) return [];
  return result.parts.filter(
    (p): p is ResourceLinkPart => p.part_type === 'resource_link',
  );
}

export function isMcpAppResource(link: ResourceLinkPart): boolean {
  const mime = link.data.mime_type?.toLowerCase() ?? '';
  return mime.startsWith('text/html') && mime.includes('mcp-app');
}

export const MCPAppRenderer: React.FC<MCPAppRendererProps> = ({
  toolCall,
  state,
  onAction,
  fetchResource,
}) => {
  const links = useMemo(() => findResourceLinks(state.result), [state.result]);
  const primary = links.find(isMcpAppResource) ?? links[0];

  if (!primary) {
    return null;
  }

  return (
    <MCPAppIframe
      key={primary.data.uri}
      link={primary}
      toolName={toolCall.tool_name}
      onAction={onAction}
      fetchResource={fetchResource}
    />
  );
};

interface IframeProps {
  link: ResourceLinkPart;
  toolName: string;
  onAction?: (event: { type: string; payload: unknown }) => void;
  fetchResource?: (uri: string) => Promise<string>;
}

const MCPAppIframe: React.FC<IframeProps> = ({ link, toolName, onAction, fetchResource }) => {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const [html, setHtml] = useState<string | null>(link.data.text ?? null);
  const [error, setError] = useState<string | null>(null);
  const [height, setHeight] = useState<number>(640);

  // 1. Load resource body. If the server inlined `text`, use it directly;
  //    otherwise resolve via the optional fetcher.
  useEffect(() => {
    if (html != null) return;
    const fetcher = fetchResource;
    if (!fetcher) {
      setError(
        `Resource ${link.data.uri} has no inline body and no fetchResource configured.`,
      );
      return;
    }
    let cancelled = false;
    fetcher(link.data.uri)
      .then((body) => {
        if (!cancelled) setHtml(body);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : String(err));
      });
    return () => {
      cancelled = true;
    };
  }, [link.data.uri, html, fetchResource]);

  // 2. Preferred sizing from _meta.ui.preferredSize.
  useEffect(() => {
    const ui = (link.data.meta?.ui as { preferredSize?: { height?: number } } | undefined);
    if (ui?.preferredSize?.height) setHeight(ui.preferredSize.height);
  }, [link.data.meta]);

  // 3. postMessage relay. The host listens for `mcp-ui:*` from the inner
  //    iframe and either auto-handles (link/size) or delegates to onAction.
  useEffect(() => {
    const inner = iframeRef.current?.contentWindow;
    const onMessage = (e: MessageEvent) => {
      const d = e.data as { type?: string; payload?: unknown } | null;
      if (!d || typeof d !== 'object' || typeof d.type !== 'string') return;
      if (!d.type.startsWith('mcp-ui:')) return;
      if (inner && e.source !== inner) return;

      switch (d.type) {
        case 'mcp-ui:size': {
          const h = (d.payload as { height?: number } | null)?.height;
          if (typeof h === 'number' && h > 0) {
            setHeight(Math.min(h, 2400));
          }
          break;
        }
        case 'mcp-ui:link': {
          const url = (d.payload as { url?: string } | null)?.url;
          if (url) window.open(url, '_blank', 'noopener,noreferrer');
          onAction?.({ type: d.type, payload: d.payload });
          break;
        }
        case 'mcp-ui:ready':
        case 'mcp-ui:tool':
        case 'mcp-ui:prompt':
        case 'mcp-ui:notify':
        default:
          onAction?.({ type: d.type, payload: d.payload });
      }
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [onAction]);

  if (error) {
    return (
      <div className="my-2 rounded-md border border-destructive/40 bg-destructive/5 p-3 text-xs text-destructive">
        Couldn't load Zippy view: {error}
      </div>
    );
  }

  if (html == null) {
    return (
      <div className="my-2 rounded-md border bg-muted/40 p-3 text-xs text-muted-foreground">
        Loading {toolName}…
      </div>
    );
  }

  return (
    <div className="my-2 overflow-hidden rounded-md border bg-background">
      <iframe
        ref={iframeRef}
        title={toolName}
        srcDoc={html}
        sandbox="allow-scripts allow-same-origin allow-popups allow-forms allow-modals"
        style={{ width: '100%', height: `${height}px`, border: 0, display: 'block' }}
      />
    </div>
  );
};
