/**
 * Host side of the MCP Apps (SEP-1865, spec 2026-01-26) postMessage bridge.
 *
 * An MCP App is HTML served as a `ui://` resource and rendered by the host in
 * a sandboxed iframe. App and host talk JSON-RPC 2.0 over `postMessage`:
 *
 *   app → host requests:  ui/initialize, tools/call, resources/read,
 *                         ui/open-link, ui/message, ui/update-model-context,
 *                         ui/request-display-mode, ping
 *   app → host notifs:    ui/notifications/initialized,
 *                         ui/notifications/size-changed, notifications/message
 *   host → app notifs:    ui/notifications/tool-input, tool-input-partial,
 *                         tool-result, tool-cancelled, host-context-changed
 *   host → app requests:  ui/resource-teardown
 *
 * This file is framework-free so it can be unit-tested and reused outside
 * React. `McpAppView` wires it to an iframe.
 */
import type { McpAppCallToolResult, McpAppCsp, McpAppPermissions, McpAppReadResourceResult } from '@distri/core';

export const MCP_APPS_PROTOCOL_VERSION = '2026-01-26';

export type DisplayMode = 'inline' | 'fullscreen' | 'pip';

export interface HostContext {
  theme?: 'light' | 'dark';
  displayMode?: DisplayMode;
  availableDisplayModes?: DisplayMode[];
  containerDimensions?: { width?: number; maxWidth?: number; height?: number; maxHeight?: number };
  locale?: string;
  timeZone?: string;
  platform?: 'web' | 'desktop' | 'mobile';
  userAgent?: string;
  toolInfo?: { id?: string; tool: { name: string; [k: string]: unknown } };
  [k: string]: unknown;
}

/** A log entry an app sent with `notifications/message`. */
export interface McpAppLogEntry {
  level: string;
  logger?: string;
  data: unknown;
}

/** What the bridge asks its host to do. Every handler is optional; a request
 * whose handler is missing gets a JSON-RPC error back. */
export interface McpAppBridgeHandlers {
  callTool?: (name: string, args: Record<string, unknown>) => Promise<McpAppCallToolResult>;
  readResource?: (uri: string) => Promise<McpAppReadResourceResult>;
  openLink?: (url: string) => void;
  message?: (message: { role: string; content: unknown }) => Promise<void> | void;
  updateModelContext?: (ctx: { content?: unknown; structuredContent?: unknown }) => Promise<void> | void;
  requestDisplayMode?: (mode: DisplayMode) => DisplayMode;
  sizeChanged?: (size: { width?: number; height?: number }) => void;
  log?: (entry: McpAppLogEntry) => void;
  initialized?: () => void;
  /** Called for every message from the app (after it is handled). */
  onAnyMessage?: (msg: JsonRpcMessage) => void;
}

export interface JsonRpcMessage {
  jsonrpc: '2.0';
  id?: string | number;
  method?: string;
  params?: any;
  result?: any;
  error?: { code: number; message: string; data?: unknown };
}

const METHOD_NOT_FOUND = -32601;
const INTERNAL_ERROR = -32603;
const INVALID_PARAMS = -32602;

export interface McpAppBridgeOptions {
  /** Send a message to the app (e.g. `iframe.contentWindow.postMessage(m, '*')`). */
  post: (message: JsonRpcMessage) => void;
  hostInfo?: { name: string; version: string };
  hostCapabilities?: Record<string, unknown>;
  hostContext: () => HostContext;
  handlers: McpAppBridgeHandlers;
}

export class McpAppBridge {
  private opts: McpAppBridgeOptions;
  private initialized = false;
  private queue: JsonRpcMessage[] = [];
  private nextId = 1;
  private pending = new Map<string | number, (msg: JsonRpcMessage) => void>();
  private lastToolInput: Record<string, unknown> | undefined;
  private lastToolResult: McpAppCallToolResult | undefined;
  private lastCancelled: string | undefined;

  constructor(opts: McpAppBridgeOptions) {
    this.opts = opts;
  }

  get isInitialized(): boolean {
    return this.initialized;
  }

  setHandlers(handlers: McpAppBridgeHandlers) {
    this.opts = { ...this.opts, handlers };
  }

  /** Feed one `message` event's `data` from the app. Non-JSON-RPC data is ignored. */
  async handleMessage(data: unknown): Promise<void> {
    if (!data || typeof data !== 'object') return;
    const msg = data as JsonRpcMessage;
    if (msg.jsonrpc !== '2.0') return;

    // A response to one of our requests.
    if (msg.method === undefined && msg.id !== undefined) {
      const resolve = this.pending.get(msg.id);
      if (resolve) {
        this.pending.delete(msg.id);
        resolve(msg);
      }
      return;
    }
    if (!msg.method) return;

    const isRequest = msg.id !== undefined;
    try {
      const result = await this.dispatch(msg.method, msg.params ?? {});
      if (isRequest) this.opts.post({ jsonrpc: '2.0', id: msg.id, result: result ?? {} });
    } catch (err) {
      if (isRequest) {
        const e = err as { code?: number; message?: string };
        this.opts.post({
          jsonrpc: '2.0',
          id: msg.id,
          error: { code: typeof e?.code === 'number' ? e.code : INTERNAL_ERROR, message: e?.message ?? String(err) },
        });
      }
    } finally {
      this.opts.handlers.onAnyMessage?.(msg);
    }
  }

  private async dispatch(method: string, params: any): Promise<unknown> {
    const h = this.opts.handlers;
    switch (method) {
      case 'ui/initialize':
        return {
          protocolVersion: MCP_APPS_PROTOCOL_VERSION,
          hostInfo: this.opts.hostInfo ?? { name: 'distri', version: '1' },
          hostCapabilities: this.opts.hostCapabilities ?? defaultHostCapabilities(h),
          hostContext: this.opts.hostContext(),
        };
      case 'ui/notifications/initialized':
        this.initialized = true;
        h.initialized?.();
        this.flush();
        return undefined;
      case 'ping':
        return {};
      case 'tools/call': {
        if (!h.callTool) throw rpcError(METHOD_NOT_FOUND, 'tools/call is not supported by this host');
        if (typeof params?.name !== 'string') throw rpcError(INVALID_PARAMS, "missing 'name'");
        return h.callTool(params.name, (params.arguments ?? {}) as Record<string, unknown>);
      }
      case 'resources/read': {
        if (!h.readResource) throw rpcError(METHOD_NOT_FOUND, 'resources/read is not supported by this host');
        if (typeof params?.uri !== 'string') throw rpcError(INVALID_PARAMS, "missing 'uri'");
        return h.readResource(params.uri);
      }
      case 'ui/open-link': {
        if (typeof params?.url !== 'string') throw rpcError(INVALID_PARAMS, "missing 'url'");
        if (!/^https?:\/\//i.test(params.url)) throw rpcError(INVALID_PARAMS, 'only http(s) links can be opened');
        if (!h.openLink) throw rpcError(METHOD_NOT_FOUND, 'ui/open-link is not supported by this host');
        h.openLink(params.url);
        return {};
      }
      case 'ui/message': {
        if (!h.message) throw rpcError(METHOD_NOT_FOUND, 'ui/message is not supported by this host');
        await h.message({ role: params?.role ?? 'user', content: params?.content });
        return {};
      }
      case 'ui/update-model-context': {
        if (!h.updateModelContext) throw rpcError(METHOD_NOT_FOUND, 'ui/update-model-context is not supported by this host');
        await h.updateModelContext({ content: params?.content, structuredContent: params?.structuredContent });
        return {};
      }
      case 'ui/request-display-mode': {
        const wanted = params?.mode as DisplayMode;
        const mode = h.requestDisplayMode ? h.requestDisplayMode(wanted) : 'inline';
        return { mode };
      }
      case 'ui/notifications/size-changed':
        h.sizeChanged?.({ width: params?.width, height: params?.height });
        return undefined;
      case 'notifications/message':
        h.log?.({ level: params?.level ?? 'info', logger: params?.logger, data: params?.data });
        return undefined;
      default:
        if (method.startsWith('notifications/') || method.startsWith('ui/notifications/')) return undefined;
        throw rpcError(METHOD_NOT_FOUND, `unknown method '${method}'`);
    }
  }

  /** Host → app notifications wait for `ui/notifications/initialized`. */
  private notify(method: string, params: unknown) {
    const msg: JsonRpcMessage = { jsonrpc: '2.0', method, params };
    if (this.initialized) this.opts.post(msg);
    else this.queue.push(msg);
  }

  private flush() {
    const q = this.queue;
    this.queue = [];
    q.forEach((m) => this.opts.post(m));
  }

  sendToolInput(args: Record<string, unknown> | undefined) {
    const value = args ?? {};
    if (this.lastToolInput !== undefined && sameJson(this.lastToolInput, value)) return;
    this.lastToolInput = value;
    this.notify('ui/notifications/tool-input', { arguments: value });
  }

  sendToolResult(result: McpAppCallToolResult) {
    if (this.lastToolResult !== undefined && sameJson(this.lastToolResult, result)) return;
    this.lastToolResult = result;
    this.notify('ui/notifications/tool-result', result);
  }

  sendToolCancelled(reason: string) {
    if (this.lastCancelled === reason) return;
    this.lastCancelled = reason;
    this.notify('ui/notifications/tool-cancelled', { reason });
  }

  sendHostContextChanged(ctx: Partial<HostContext>) {
    this.notify('ui/notifications/host-context-changed', ctx);
  }

  /** Ask the app to tear down. Resolves when it answers or after `timeoutMs`. */
  teardown(reason = 'unmount', timeoutMs = 500): Promise<void> {
    if (!this.initialized) return Promise.resolve();
    const id = `host-${this.nextId++}`;
    return new Promise((resolve) => {
      const timer = setTimeout(() => {
        this.pending.delete(id);
        resolve();
      }, timeoutMs);
      this.pending.set(id, () => {
        clearTimeout(timer);
        resolve();
      });
      this.opts.post({ jsonrpc: '2.0', id, method: 'ui/resource-teardown', params: { reason } });
    });
  }
}

function defaultHostCapabilities(h: McpAppBridgeHandlers): Record<string, unknown> {
  const caps: Record<string, unknown> = { logging: {} };
  if (h.openLink) caps.openLinks = {};
  if (h.callTool) caps.serverTools = {};
  if (h.readResource) caps.serverResources = {};
  if (h.updateModelContext) caps.updateModelContext = {};
  if (h.message) caps.message = {};
  return caps;
}

function rpcError(code: number, message: string) {
  return Object.assign(new Error(message), { code });
}

function sameJson(a: unknown, b: unknown): boolean {
  try {
    return JSON.stringify(a) === JSON.stringify(b);
  } catch {
    return false;
  }
}

// ── Sandbox: CSP and permissions ────────────────────────────────────────────

function sanitizeSources(list?: string[]): string[] {
  // Keep only plain origins / scheme sources; drop anything that could break
  // out of the directive (quotes, semicolons, whitespace inside).
  return (list ?? [])
    .map((s) => String(s).trim())
    .filter((s) => s.length > 0 && !/[;'"\s,]/.test(s));
}

/** Build the Content-Security-Policy an app runs under from `_meta.ui.csp`.
 * With no csp the app gets no network (`connect-src 'none'`) and may only use
 * inline scripts/styles and data:/blob: images. */
export function buildCsp(csp?: McpAppCsp): string {
  const resource = sanitizeSources(csp?.resourceDomains);
  const connect = sanitizeSources(csp?.connectDomains);
  const frame = sanitizeSources(csp?.frameDomains);
  const base = sanitizeSources(csp?.baseUriDomains);
  const join = (xs: string[]) => xs.join(' ');
  const directives = [
    `default-src 'none'`,
    `script-src 'unsafe-inline' ${join(resource)}`.trim(),
    `style-src 'unsafe-inline' ${join(resource)}`.trim(),
    `img-src data: blob: ${join(resource)}`.trim(),
    `font-src data: ${join(resource)}`.trim(),
    `media-src data: blob: ${join(resource)}`.trim(),
    `connect-src ${connect.length ? join(connect) : "'none'"}`,
    `frame-src ${frame.length ? join(frame) : "'none'"}`,
    `base-uri ${base.length ? join(base) : "'none'"}`,
    `form-action 'none'`,
  ];
  return directives.join('; ');
}

/** Put the CSP `<meta>` first in the document's head (before any script). */
export function injectCsp(html: string, policy: string): string {
  const meta = `<meta http-equiv="Content-Security-Policy" content="${policy.replace(/"/g, '&quot;')}">`;
  if (/<head[^>]*>/i.test(html)) return html.replace(/<head[^>]*>/i, (m) => `${m}${meta}`);
  if (/<html[^>]*>/i.test(html)) return html.replace(/<html[^>]*>/i, (m) => `${m}<head>${meta}</head>`);
  return `<!doctype html><html><head>${meta}</head><body>${html}</body></html>`;
}

/** Map `_meta.ui.permissions` to the iframe `allow` attribute. */
export function buildAllowAttribute(permissions?: McpAppPermissions): string {
  if (!permissions) return '';
  const out: string[] = [];
  if (permissions.camera) out.push('camera');
  if (permissions.microphone) out.push('microphone');
  if (permissions.geolocation) out.push('geolocation');
  if (permissions.clipboardWrite) out.push('clipboard-write');
  return out.join('; ');
}

/** The iframe sandbox for MCP Apps: scripts run, but without
 * `allow-same-origin` the document has an opaque origin, so it cannot read the
 * host's cookies, storage or DOM. */
export const MCP_APP_SANDBOX = 'allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox';

/** HTML of a `resources/read` result: first content's text, or its base64 blob decoded. */
export function htmlFromReadResult(result: McpAppReadResourceResult | undefined): string | null {
  const first = result?.contents?.[0];
  if (!first) return null;
  if (typeof first.text === 'string') return first.text;
  if (typeof first.blob === 'string') {
    try {
      const bin = atob(first.blob);
      const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
      return new TextDecoder().decode(bytes);
    } catch {
      return null;
    }
  }
  return null;
}
