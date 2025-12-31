import React, { useEffect, useRef, forwardRef, useImperativeHandle, useMemo } from 'react';
import type { DistriAnyTool } from '../types';


export interface ChatEmbedProps {
  /** Client ID for cloud authentication */
  clientId: string;
  /** Agent ID to chat with */
  agentId: string;
  /** Theme preference */
  theme?: 'dark' | 'light';
  /** Base URL for the API (defaults to https://api.distri.dev/v1) */
  baseUrl?: string;
  /** Thread ID for conversation persistence */
  threadId?: string;
  /** External tools to register with the chat */
  tools?: DistriAnyTool[];
  /** Enable loading chat history for the threadId */
  enableHistory?: boolean;
  /** Custom URL for the embed script (useful for local testing) */
  embedUrl?: string;
  /** Container width */
  width?: string | number;
  /** Container height */
  height?: string | number;
  /** Custom styles for the container */
  style?: React.CSSProperties;
  /** Custom class name */
  className?: string;
  /** Called when embed is ready */
  onReady?: () => void;
  /** Called on error */
  onError?: (error: string) => void;
  /** Called when a message is received */
  onMessage?: (data: unknown) => void;
}

export interface ChatEmbedInstance {
  /** Send a message programmatically */
  sendMessage: (content: string) => void;
  /** Stop any active streaming */
  stopStreaming: () => void;
  /** Trigger a tool manually */
  triggerTool: (toolName: string, input: any) => void;
}

/**
 * ChatEmbed component - embeds a Distri chat using an iframe.
 * Uses Cloudflare Turnstile for bot verification automatically.
 * 
 * @example
 * ```tsx
 * <ChatEmbed
 *   clientId="dpc_xxx"
 *   agentId="my_agent"
 *   tools={[myTool]}
 *   height={600}
 * />
 * ```
 */
export const ChatEmbed = forwardRef<ChatEmbedInstance, ChatEmbedProps>(function ChatEmbed(
  {
    clientId,
    agentId,
    theme = 'dark',
    baseUrl,
    threadId,
    tools,
    enableHistory = false,
    embedUrl = 'https://embed.distri.dev',
    width = '100%',
    height = 600,
    style,
    className,
    onReady,
    onError,
    onMessage,
  },
  ref
) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Handle postMessage events from iframe
  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      // Only handle messages from our embed
      if (!event.data?.type?.startsWith('distri:')) return;

      switch (event.data.type) {
        case 'distri:ready':
          onReady?.();
          break;
        case 'distri:error':
          onError?.(event.data.error);
          break;
        case 'distri:message':
          onMessage?.(event.data.data);
          break;
        case 'distri:call_tool': {
          const { callId, toolName, input } = event.data;
          const tool = tools?.find(t => t.name === toolName);

          if (!tool) {
            iframeRef.current?.contentWindow?.postMessage({
              type: 'distri:tool_result',
              callId,
              error: `Tool ${toolName} not found`
            }, '*');
            return;
          }

          try {
            let result;
            if (tool.type === 'function' && 'handler' in tool) {
              result = await tool.handler(input);
            } else {
              throw new Error(`Tool ${toolName} of type ${tool.type} is not executable via proxy`);
            }

            iframeRef.current?.contentWindow?.postMessage({
              type: 'distri:tool_result',
              callId,
              result
            }, '*');
          } catch (err: any) {
            iframeRef.current?.contentWindow?.postMessage({
              type: 'distri:tool_result',
              callId,
              error: err.message || 'Tool execution failed'
            }, '*');
          }
          break;
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onReady, onError, onMessage, tools]);

  // Handle iframe load to send non-URL configuration (like tools)
  const handleLoad = () => {
    if (tools?.length) {
      console.log('[ChatEmbed] Sending tools configuration to iframe');
      iframeRef.current?.contentWindow?.postMessage({
        type: 'distri:config',
        tools: tools.map(t => ({
          name: t.name,
          description: t.description,
          parameters: t.parameters,
          is_final: t.is_final,
        }))
      }, '*');
    }
  };

  // Build the embed URL with parameters
  const iframeSrc = useMemo(() => {
    try {
      const url = new URL(embedUrl);
      url.searchParams.set('clientId', clientId);
      url.searchParams.set('agentId', agentId);
      if (theme) url.searchParams.set('theme', theme);
      if (baseUrl) url.searchParams.set('baseUrl', baseUrl);
      if (threadId) url.searchParams.set('threadId', threadId);
      if (enableHistory) url.searchParams.set('enableHistory', 'true');
      return url.toString();
    } catch (e) {
      // Fallback for relative or invalid URLs
      const separator = embedUrl.includes('?') ? '&' : '?';
      let url = `${embedUrl}${separator}clientId=${encodeURIComponent(clientId)}&agentId=${encodeURIComponent(agentId)}`;
      if (theme) url += `&theme=${encodeURIComponent(theme)}`;
      if (baseUrl) url += `&baseUrl=${encodeURIComponent(baseUrl)}`;
      if (threadId) url += `&threadId=${encodeURIComponent(threadId)}`;
      if (enableHistory) url += `&enableHistory=true`;
      return url;
    }
  }, [embedUrl, clientId, agentId, theme, baseUrl, threadId, enableHistory]);

  // Expose methods via ref
  useImperativeHandle(ref, () => ({
    sendMessage: (content: string) => {
      iframeRef.current?.contentWindow?.postMessage(
        { type: 'distri:send', content },
        '*'
      );
    },
    stopStreaming: () => {
      iframeRef.current?.contentWindow?.postMessage(
        { type: 'distri:stop' },
        '*'
      );
    },
    triggerTool: (toolName: string, input: any) => {
      iframeRef.current?.contentWindow?.postMessage(
        { type: 'distri:trigger_tool', toolName, input },
        '*'
      );
    },
  }), []);

  const containerStyle: React.CSSProperties = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
    border: 'none',
    borderRadius: '12px',
    overflow: 'hidden',
    ...style,
  };

  return (
    <div ref={containerRef} className={className} style={containerStyle}>
      <iframe
        ref={iframeRef}
        src={iframeSrc}
        onLoad={handleLoad}
        style={{
          width: '100%',
          height: '100%',
          border: 'none',
        }}
        title="Distri Chat"
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
      />
    </div>
  );
});
