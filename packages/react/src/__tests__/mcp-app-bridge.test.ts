import { describe, it, expect, vi } from 'vitest';
import {
  McpAppBridge,
  buildCsp,
  injectCsp,
  buildAllowAttribute,
  htmlFromReadResult,
  MCP_APPS_PROTOCOL_VERSION,
  type JsonRpcMessage,
} from '../mcp-apps/bridge';
import { formatModelContext, messageText } from '../mcp-apps/McpAppsContext';

function makeBridge(handlers = {}) {
  const sent: JsonRpcMessage[] = [];
  const bridge = new McpAppBridge({
    post: (m) => sent.push(m),
    hostInfo: { name: 'distri', version: 'test' },
    hostContext: () => ({ theme: 'dark', displayMode: 'inline', toolInfo: { id: 'tc1', tool: { name: 'open' } } }),
    handlers,
  });
  return { bridge, sent };
}

describe('McpAppBridge', () => {
  it('answers ui/initialize with protocol, host info and context', async () => {
    const { bridge, sent } = makeBridge({ callTool: vi.fn() });
    await bridge.handleMessage({ jsonrpc: '2.0', id: 1, method: 'ui/initialize', params: { protocolVersion: MCP_APPS_PROTOCOL_VERSION } });
    expect(sent).toHaveLength(1);
    expect(sent[0].id).toBe(1);
    expect(sent[0].result.protocolVersion).toBe(MCP_APPS_PROTOCOL_VERSION);
    expect(sent[0].result.hostInfo.name).toBe('distri');
    expect(sent[0].result.hostContext.theme).toBe('dark');
    expect(sent[0].result.hostCapabilities.serverTools).toEqual({});
  });

  it('holds tool-input and tool-result until initialized, in order', async () => {
    const { bridge, sent } = makeBridge();
    bridge.sendToolInput({ url: 'https://example.com' });
    bridge.sendToolResult({ content: [{ type: 'text', text: 'ok' }], structuredContent: { session_id: 's1' } });
    expect(sent).toHaveLength(0);
    await bridge.handleMessage({ jsonrpc: '2.0', method: 'ui/notifications/initialized' });
    expect(sent.map((m) => m.method)).toEqual(['ui/notifications/tool-input', 'ui/notifications/tool-result']);
    expect(sent[0].params).toEqual({ arguments: { url: 'https://example.com' } });
    expect(sent[1].params.structuredContent).toEqual({ session_id: 's1' });
    // Same result again is not re-sent.
    bridge.sendToolResult({ content: [{ type: 'text', text: 'ok' }], structuredContent: { session_id: 's1' } });
    expect(sent).toHaveLength(2);
  });

  it('routes tools/call to the host and returns its result', async () => {
    const callTool = vi.fn().mockResolvedValue({ content: [{ type: 'text', text: 'saved' }] });
    const { bridge, sent } = makeBridge({ callTool });
    await bridge.handleMessage({ jsonrpc: '2.0', id: 'a', method: 'tools/call', params: { name: 'save_value', arguments: { key: 'k', value: 1 } } });
    expect(callTool).toHaveBeenCalledWith('save_value', { key: 'k', value: 1 });
    expect(sent[0]).toEqual({ jsonrpc: '2.0', id: 'a', result: { content: [{ type: 'text', text: 'saved' }] } });
  });

  it('returns a JSON-RPC error when a tool call fails or a method is unknown', async () => {
    const { bridge, sent } = makeBridge({ callTool: vi.fn().mockRejectedValue(new Error('not app-visible')) });
    await bridge.handleMessage({ jsonrpc: '2.0', id: 2, method: 'tools/call', params: { name: 'x' } });
    expect(sent[0].error?.message).toBe('not app-visible');
    await bridge.handleMessage({ jsonrpc: '2.0', id: 3, method: 'ui/does-not-exist' });
    expect(sent[1].error?.code).toBe(-32601);
  });

  it('routes message, model context, size, log and display mode', async () => {
    const message = vi.fn();
    const updateModelContext = vi.fn();
    const sizeChanged = vi.fn();
    const log = vi.fn();
    const { bridge, sent } = makeBridge({ message, updateModelContext, sizeChanged, log, requestDisplayMode: () => 'fullscreen' });
    await bridge.handleMessage({ jsonrpc: '2.0', id: 1, method: 'ui/message', params: { role: 'user', content: { type: 'text', text: 'hi' } } });
    await bridge.handleMessage({ jsonrpc: '2.0', id: 2, method: 'ui/update-model-context', params: { structuredContent: { price: 10 } } });
    await bridge.handleMessage({ jsonrpc: '2.0', method: 'ui/notifications/size-changed', params: { height: 300 } });
    await bridge.handleMessage({ jsonrpc: '2.0', method: 'notifications/message', params: { level: 'info', data: 'clicked' } });
    await bridge.handleMessage({ jsonrpc: '2.0', id: 3, method: 'ui/request-display-mode', params: { mode: 'fullscreen' } });
    expect(message).toHaveBeenCalledWith({ role: 'user', content: { type: 'text', text: 'hi' } });
    expect(updateModelContext).toHaveBeenCalledWith({ content: undefined, structuredContent: { price: 10 } });
    expect(sizeChanged).toHaveBeenCalledWith({ width: undefined, height: 300 });
    expect(log).toHaveBeenCalledWith({ level: 'info', logger: undefined, data: 'clicked' });
    expect(sent.find((m) => m.id === 3)?.result).toEqual({ mode: 'fullscreen' });
  });

  it('refuses non-http links', async () => {
    const openLink = vi.fn();
    const { bridge, sent } = makeBridge({ openLink });
    await bridge.handleMessage({ jsonrpc: '2.0', id: 1, method: 'ui/open-link', params: { url: 'javascript:alert(1)' } });
    expect(openLink).not.toHaveBeenCalled();
    expect(sent[0].error).toBeDefined();
  });

  it('ignores non JSON-RPC data', async () => {
    const { bridge, sent } = makeBridge();
    await bridge.handleMessage({ type: 'mcp-ui:size', payload: {} });
    await bridge.handleMessage('hello');
    expect(sent).toHaveLength(0);
  });

  it('teardown resolves on the app answer', async () => {
    const { bridge, sent } = makeBridge();
    await bridge.handleMessage({ jsonrpc: '2.0', method: 'ui/notifications/initialized' });
    const done = bridge.teardown('unmount', 5000);
    const req = sent.find((m) => m.method === 'ui/resource-teardown')!;
    await bridge.handleMessage({ jsonrpc: '2.0', id: req.id, result: {} });
    await expect(done).resolves.toBeUndefined();
  });
});

describe('CSP and permissions', () => {
  it('defaults to no network', () => {
    const csp = buildCsp();
    expect(csp).toContain("default-src 'none'");
    expect(csp).toContain("connect-src 'none'");
    expect(csp).toContain("frame-src 'none'");
  });

  it('adds declared domains and drops unsafe values', () => {
    const csp = buildCsp({ connectDomains: ['wss://api.distri.dev', "x; script-src *"], resourceDomains: ['https://cdn.example.com'] });
    expect(csp).toContain('connect-src wss://api.distri.dev');
    expect(csp).not.toContain('script-src *');
    expect(csp).toContain("script-src 'unsafe-inline' https://cdn.example.com");
  });

  it('injects the policy first in head', () => {
    const out = injectCsp('<html><head><script>1</script></head><body></body></html>', "default-src 'none'");
    expect(out.indexOf('Content-Security-Policy')).toBeLessThan(out.indexOf('<script>'));
    expect(injectCsp('<p>x</p>', 'a')).toContain('<head><meta http-equiv="Content-Security-Policy"');
  });

  it('maps permissions to allow', () => {
    expect(buildAllowAttribute({ camera: {}, clipboardWrite: {} })).toBe('camera; clipboard-write');
    expect(buildAllowAttribute()).toBe('');
  });

  it('reads text or base64 blob html', () => {
    expect(htmlFromReadResult({ contents: [{ uri: 'ui://a', text: '<p>a</p>' }] })).toBe('<p>a</p>');
    expect(htmlFromReadResult({ contents: [{ uri: 'ui://a', blob: btoa('<p>b</p>') }] })).toBe('<p>b</p>');
    expect(htmlFromReadResult({ contents: [] })).toBeNull();
  });
});

describe('host helpers', () => {
  it('formats model context for the agent', () => {
    const text = formatModelContext({
      source: { toolCallId: 'tc1', toolName: 'browser__open', server: 'browser', uri: 'ui://distri/browser' },
      content: [{ type: 'text', text: 'User selected: Pricing' }],
      structuredContent: { plan: 'pro' },
    });
    expect(text).toContain('browser app');
    expect(text).toContain('User selected: Pricing');
    expect(text).toContain('{"plan":"pro"}');
  });

  it('reads message text', () => {
    expect(messageText('hi')).toBe('hi');
    expect(messageText([{ type: 'text', text: 'a' }, { type: 'image' }, { type: 'text', text: 'b' }])).toBe('a\nb');
  });
});
