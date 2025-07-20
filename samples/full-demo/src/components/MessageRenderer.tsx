import React, { useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus, prism } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { ToolCallRenderer, ToolCallState } from './ToolCallRenderer';
import { ExternalToolHandler } from './ExternalToolHandler';
import { DistriEvent, MessageMetadata, ToolCall } from '@distri/core';
import { Copy, Check } from 'lucide-react';

interface MessageRendererProps {
  content: string;
  className?: string;
  metadata?: DistriEvent | MessageMetadata;
  onToolResponse?: (toolCallId: string, result: any) => void;
  onApprovalResponse?: (approved: boolean, reason?: string) => void;
}

// Enhanced Code Block Component with copy functionality
const CodeBlock: React.FC<{
  language: string;
  children: string;
  inline?: boolean;
  isDark?: boolean;
}> = ({ language, children, inline = false, isDark = false }) => {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(children);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  if (inline) {
    return (
      <code className={`px-1.5 py-0.5 rounded text-sm font-mono ${
        isDark 
          ? 'bg-gray-700 text-gray-200' 
          : 'bg-gray-100 text-gray-800'
      }`}>
        {children}
      </code>
    );
  }

  return (
    <div className="relative group my-4">
      <div className="flex items-center justify-between bg-gray-800 text-gray-200 px-4 py-2 rounded-t-lg text-sm">
        <span className="font-medium">{language || 'text'}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 px-2 py-1 rounded hover:bg-gray-700 transition-colors opacity-0 group-hover:opacity-100"
          title="Copy code"
        >
          {copied ? (
            <>
              <Check className="h-3 w-3" />
              <span className="text-xs">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="h-3 w-3" />
              <span className="text-xs">Copy</span>
            </>
          )}
        </button>
      </div>
      <SyntaxHighlighter
        style={vscDarkPlus}
        language={language || 'text'}
        PreTag="div"
        className="!mt-0 !rounded-t-none"
        showLineNumbers={children.split('\n').length > 10}
        customStyle={{
          margin: 0,
          borderTopLeftRadius: 0,
          borderTopRightRadius: 0,
        }}
      >
        {children.replace(/\n$/, '')}
      </SyntaxHighlighter>
    </div>
  );
};

const MessageRenderer: React.FC<MessageRendererProps> = ({ 
  content, 
  className = "", 
  metadata,
  onToolResponse,
  onApprovalResponse
}) => {
  // Detect if we're in a dark theme context (e.g., user message with white text)
  const isDark = className.includes('text-white');

  // Memoize external tool call creation to prevent re-renders
  const externalToolCall = useMemo(() => {
    if (metadata && (metadata as DistriEvent).type === 'tool_call_start') {
      const eventMetadata = metadata as DistriEvent;
      if ((eventMetadata.data as any).is_external) {
        return {
          tool_call_id: eventMetadata.data.tool_call_id,
          tool_name: eventMetadata.data.tool_call_name,
          input: '' // Will be populated by tool_call_args events
        } as ToolCall;
      }
    }
    return null;
  }, [metadata]);

  // Handle MessageMetadata for external tool calls (for Agent API)
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

  // Handle external tool calls from ToolCallStart events
  if (externalToolCall) {
    return (
      <ExternalToolHandler
        toolCalls={[externalToolCall]}
        requiresApproval={externalToolCall.tool_name === 'approval_request'}
        onToolResponse={onToolResponse || (() => {})}
        onApprovalResponse={onApprovalResponse || (() => {})}
      />
    );
  }

  // ToolCall event detection using DistriEvent format
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
      
      // External tools are already handled above, so skip them here
      if ((eventMetadata.data as any).is_external) {
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
    
    // Only render regular tool calls (non-external)
    return <ToolCallRenderer toolCall={toolCall} />;
  }

  // Memoize markdown detection to avoid recalculating on every render
  const hasMarkdownSyntax = useMemo(() => {
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

    return markdownPatterns.some(pattern => pattern.test(content));
  }, [content]);

  // Enhanced plain text rendering with better formatting
  if (!hasMarkdownSyntax) {
    // Check if content looks like code (indented lines, common programming patterns)
    const looksLikeCode = useMemo(() => {
      const codePatterns = [
        /^[ \t]{2,}/m, // Indented lines
        /function\s+\w+\s*\(/,
        /class\s+\w+/,
        /import\s+/,
        /from\s+['"][\w\/\.\-]+['"]/,
        /def\s+\w+\s*\(/,
        /public\s+class/,
        /console\.log\(/,
        /\w+\s*=\s*\w+/,
        /if\s*\(/,
        /for\s*\(/,
        /while\s*\(/,
        /\{[\s\S]*\}/,
        /\[[\s\S]*\]/,
      ];
      
      return codePatterns.some(pattern => pattern.test(content));
    }, [content]);

    if (looksLikeCode) {
      return (
        <CodeBlock
          language="text"
          isDark={isDark}
        >
          {content}
        </CodeBlock>
      );
    }

    return (
      <div className={`whitespace-pre-wrap ${className}`}>
        {content}
      </div>
    );
  }

  // Enhanced markdown rendering with custom components
  return (
    <div className={`prose prose-sm max-w-none ${isDark ? 'prose-invert' : ''} ${className}`}>
      <ReactMarkdown
        components={{
          code({ node, inline, className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || '');
            const language = match ? match[1] : '';
            
            return (
              <CodeBlock
                language={language}
                inline={inline}
                isDark={isDark}
              >
                {String(children).replace(/\n$/, '')}
              </CodeBlock>
            );
          },
          // Enhanced blockquote styling
          blockquote({ children }) {
            return (
              <blockquote className={`border-l-4 pl-4 italic ${
                isDark 
                  ? 'border-blue-400 text-blue-200' 
                  : 'border-blue-500 text-blue-700 bg-blue-50'
              } rounded-r`}>
                {children}
              </blockquote>
            );
          },
          // Enhanced table styling
          table({ children }) {
            return (
              <div className="overflow-x-auto">
                <table className={`min-w-full border-collapse ${
                  isDark ? 'border-gray-600' : 'border-gray-300'
                }`}>
                  {children}
                </table>
              </div>
            );
          },
          th({ children }) {
            return (
              <th className={`border p-2 font-semibold ${
                isDark 
                  ? 'border-gray-600 bg-gray-700' 
                  : 'border-gray-300 bg-gray-100'
              }`}>
                {children}
              </th>
            );
          },
          td({ children }) {
            return (
              <td className={`border p-2 ${
                isDark ? 'border-gray-600' : 'border-gray-300'
              }`}>
                {children}
              </td>
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