import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { ToolCallRenderer, ToolCallState } from './ToolCallRenderer';
import { ExternalToolHandler } from './ExternalToolHandler';
import { DistriEvent, MessageMetadata, ToolCall } from '@distri/core';

interface MessageRendererProps {
  content: string;
  className?: string;
  metadata?: DistriEvent | MessageMetadata;
  onToolResponse?: (toolCallId: string, result: any) => void;
  onApprovalResponse?: (approved: boolean, reason?: string) => void;
}

const MessageRenderer: React.FC<MessageRendererProps> = ({ 
  content, 
  className = "", 
  metadata,
  onToolResponse,
  onApprovalResponse
}) => {
  // Handle external tool calls
  if (metadata && (metadata as any).type === 'external_tool_calls') {
    const externalMetadata = metadata as MessageMetadata & { type: 'external_tool_calls' };
    return (
      <ExternalToolHandler
        toolCalls={externalMetadata.tool_calls}
        requiresApproval={externalMetadata.requires_approval}
        onToolResponse={onToolResponse || (() => {})}
        onApprovalResponse={onApprovalResponse || (() => {})}
      />
    );
  }

  // ToolCall event detection using concrete types
  if (metadata && (
    (metadata as DistriEvent).type === 'tool_call_start' ||
    (metadata as DistriEvent).type === 'tool_call_args' ||
    (metadata as DistriEvent).type === 'tool_call_end' ||
    (metadata as DistriEvent).type === 'tool_call_result'
  )) {
    const eventMetadata = metadata as DistriEvent;
    let toolCall: ToolCallState = {
      tool_call_id: eventMetadata.data.tool_call_id,
      tool_name: undefined,
      args: '',
      running: true,
      result: undefined,
    };
    
    if (eventMetadata.type === 'tool_call_start') {
      toolCall.tool_name = eventMetadata.data.tool_call_name;
      toolCall.args = '';
      toolCall.running = true;
      // Check if this is an external tool
      if ((eventMetadata.data as any).is_external) {
        // Don't render external tools as regular tool calls
        return null;
      }
    } else if (eventMetadata.type === 'tool_call_args') {
      toolCall.args = eventMetadata.data.delta;
      toolCall.running = true;
    } else if (eventMetadata.type === 'tool_call_end') {
      toolCall.running = false;
    } else if (eventMetadata.type === 'tool_call_result') {
      toolCall.result = eventMetadata.data.result;
      toolCall.running = false;
    }
    return <ToolCallRenderer toolCall={toolCall} />;
  }

  // Check if content looks like markdown (has markdown syntax)
  const hasMarkdownSyntax = (text: string): boolean => {
    const markdownPatterns = [
      /^#{1,6}\s+/m, // Headers
      /\*\*.*?\*\*/g, // Bold
      /\*.*?\*/g, // Italic
      /`.*?`/g, // Inline code
      /```[\s\S]*?```/g, // Code blocks
      /^\s*[-*+]\s+/m, // Lists
      /^\s*\d+\.\s+/m, // Numbered lists
      /^\s*>\s+/m, // Blockquotes
      /\[.*?\]\(.*?\)/g, // Links
    ];

    return markdownPatterns.some(pattern => pattern.test(text));
  };

  // If content doesn't look like markdown, render as plain text with some basic formatting
  if (!hasMarkdownSyntax(content)) {
    return (
      <div className={`whitespace-pre-wrap ${className}`}>
        {content}
      </div>
    );
  }

  // Render markdown
  return (
    <div className={`prose prose-sm max-w-none ${className}`}>
      <ReactMarkdown
        components={{
          code({ node, inline, className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || '');
            return !inline && match ? (
              <SyntaxHighlighter
                style={tomorrow}
                language={match[1]}
                PreTag="div"
                {...props}
              >
                {String(children).replace(/\n$/, '')}
              </SyntaxHighlighter>
            ) : (
              <code className={className} {...props}>
                {children}
              </code>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default MessageRenderer;