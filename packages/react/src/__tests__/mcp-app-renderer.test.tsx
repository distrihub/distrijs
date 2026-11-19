import React from 'react';
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { MCPAppRenderer } from '../components/renderers/MCPAppRenderer';
import { McpAppsProvider } from '../mcp-apps/McpAppsContext';

const toolCall = { tool_call_id: 'tc1', tool_name: 'browser__open', input: { url: 'https://example.com' } };

function state(meta: Record<string, unknown>, text?: string) {
  return {
    tool_call_id: 'tc1',
    tool_name: 'browser__open',
    input: toolCall.input,
    status: 'completed',
    result: {
      tool_call_id: 'tc1',
      tool_name: 'browser__open',
      parts: [
        { part_type: 'text', data: 'opened' },
        { part_type: 'resource_link', data: { uri: 'ui://distri/browser', mime_type: 'text/html;profile=mcp-app', text, meta } },
      ],
    },
  } as any;
}

describe('MCPAppRenderer', () => {
  it('renders a spec MCP App in an opaque-origin srcdoc frame with its CSP', () => {
    const { container } = render(
      <MCPAppRenderer
        toolCall={toolCall as any}
        state={state({ distri: { server: 'browser', tool: 'open', result: { content: [] } } }, '<html><head></head><body>app</body></html>')}
      />,
    );
    const iframe = container.querySelector('iframe')!;
    expect(iframe).toBeTruthy();
    expect(iframe.getAttribute('sandbox')).not.toContain('allow-same-origin');
    expect(iframe.getAttribute('srcdoc')).toContain('Content-Security-Policy');
    expect(iframe.getAttribute('src')).toBeNull();
  });

  it('keeps the legacy mcp-ui frame for iframeUrl links', () => {
    const { container } = render(
      <MCPAppRenderer toolCall={toolCall as any} state={state({ ui: { iframeUrl: 'https://embed.example.com/x' } })} />,
    );
    expect(container.querySelector('iframe')!.getAttribute('src')).toBe('https://embed.example.com/x');
  });

  it('renders nothing when apps are switched off', () => {
    const { container } = render(
      <McpAppsProvider enabled={false}>
        <MCPAppRenderer toolCall={toolCall as any} state={state({ distri: { server: 'browser', tool: 'open' } }, '<p>x</p>')} />
      </McpAppsProvider>,
    );
    expect(container.querySelector('iframe')).toBeNull();
  });
});
