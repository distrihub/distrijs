import React, { useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { ToolCallRenderer, ToolCallState } from './ToolCallRenderer';
import { ExternalToolHandler } from './ExternalToolHandler';
import { DistriEvent, MessageMetadata, ToolCall } from '@distri/core';
import { Copy, Check, Code2 } from 'lucide-react';

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

  // Enhanced language detection and normalization
  const normalizeLanguage = (lang: string): string => {
    if (!lang) return 'text';
    
    const langMap: Record<string, string> = {
      'js': 'javascript',
      'ts': 'typescript',
      'jsx': 'javascript',
      'tsx': 'typescript',
      'py': 'python',
      'rb': 'ruby',
      'sh': 'bash',
      'shell': 'bash',
      'yml': 'yaml',
      'md': 'markdown',
      'json5': 'json',
      'dockerfile': 'docker',
      'rs': 'rust',
      'go': 'go',
      'php': 'php',
      'cpp': 'cpp',
      'cxx': 'cpp',
      'cc': 'cpp',
      'c++': 'cpp',
      'cs': 'csharp',
      'kt': 'kotlin',
      'swift': 'swift',
      'scala': 'scala',
      'clj': 'clojure',
      'cljs': 'clojure',
      'r': 'r',
      'matlab': 'matlab',
      'sql': 'sql',
      'psql': 'sql',
      'mysql': 'sql',
      'sqlite': 'sql',
    };
    
    const normalized = lang.toLowerCase();
    return langMap[normalized] || normalized;
  };

  const normalizedLanguage = normalizeLanguage(language);

  if (inline) {
    return (
      <code className={`px-2 py-1 rounded-md text-sm font-mono border ${
        isDark 
          ? 'bg-gray-800 text-gray-200 border-gray-600' 
          : 'bg-gray-100 text-gray-800 border-gray-200'
      }`}>
        {children}
      </code>
    );
  }

  const lineCount = children.split('\n').length;
  const shouldShowLineNumbers = lineCount > 3;

  return (
    <div className="relative group my-4 rounded-lg overflow-hidden border border-gray-200 shadow-sm">
      <div className="flex items-center justify-between bg-gray-50 border-b border-gray-200 px-4 py-2 text-sm">
        <div className="flex items-center gap-2">
          <Code2 className="h-4 w-4 text-gray-500" />
          <span className="font-medium text-gray-700">
            {normalizedLanguage === 'text' ? 'Code' : normalizedLanguage.toUpperCase()}
          </span>
          <span className="text-gray-500 text-xs">
            {lineCount} {lineCount === 1 ? 'line' : 'lines'}
          </span>
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 px-2 py-1 rounded hover:bg-gray-200 transition-colors opacity-0 group-hover:opacity-100 text-gray-600 hover:text-gray-800"
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
      <div className="overflow-x-auto">
        <SyntaxHighlighter
          style={isDark ? vscDarkPlus : oneLight}
          language={normalizedLanguage}
          PreTag="div"
          showLineNumbers={shouldShowLineNumbers}
          lineNumberStyle={{
            minWidth: '2.5em',
            paddingRight: '1em',
            color: '#9CA3AF',
            fontSize: '0.875em'
          }}
          customStyle={{
            margin: 0,
            padding: '1rem',
            background: isDark ? '#1e1e1e' : '#fafafa',
            fontSize: '14px',
            lineHeight: '1.5',
            fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace',
          }}
          codeTagProps={{
            style: {
              fontSize: '14px',
              fontFamily: 'inherit',
            }
          }}
        >
          {children.replace(/\n$/, '')}
        </SyntaxHighlighter>
      </div>
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

  // Enhanced markdown detection
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
      /!\[.*?\]\(.*?\)/g, // Images
      /^\|.*\|/m, // Tables
    ];

    return markdownPatterns.some(pattern => pattern.test(content));
  }, [content]);

  // Enhanced plain text rendering with much better code detection
  if (!hasMarkdownSyntax) {
    // Comprehensive code detection
    const looksLikeCode = useMemo(() => {
      const lines = content.split('\n');
      const totalLines = lines.length;
      
      // If it's a single line and short, probably not code
      if (totalLines === 1 && content.length < 20) {
        return false;
      }

      const codeIndicators = [
        // Programming language keywords and patterns
        /\b(function|const|let|var|class|interface|type|import|export|from|require)\b/,
        /\b(def|class|if|elif|else|for|while|try|except|import|from)\b/, // Python
        /\b(public|private|protected|static|void|int|string|boolean|return)\b/, // Java/C#
        /\b(fn|let|mut|impl|struct|enum|match|if|else|for|while)\b/, // Rust
        /\b(func|var|const|if|else|for|range|package|import)\b/, // Go
        /\b(SELECT|FROM|WHERE|INSERT|UPDATE|DELETE|CREATE|ALTER|DROP)\b/i, // SQL
        
        // Common code patterns
        /^[ \t]*\/\/.*$/m, // Line comments
        /^[ \t]*#.*$/m, // Python/Shell comments
        /\/\*[\s\S]*?\*\//, // Block comments
        /^[ \t]*<!--.*-->$/m, // HTML comments
        
        // Structural patterns
        /[{}\[\]()]/g, // Brackets and braces
        /^[ \t]{2,}/m, // Indentation
        /[;:]/g, // Semicolons and colons
        /=>\s*[{(]/, // Arrow functions
        /\w+\s*=\s*\w+/, // Assignments
        /\w+\(\s*.*\s*\)/, // Function calls
        /\b\w+\.\w+/, // Method calls
        /^[ \t]*<\w+/, // XML/HTML tags
        /\$\{.*\}/, // Template literals
        /"[^"]*":\s*/, // JSON structure
        /:\s*\{/, // Object definitions
        
        // File extensions or shebangs
        /^#!\//, // Shebang
        /\.(js|ts|py|rb|php|java|cpp|c|h|rs|go|sh|sql|html|css|json|xml|yaml|yml)$/,
      ];

      // Check if significant portion looks like code
      let codeScore = 0;
      const maxScore = codeIndicators.length;

      codeIndicators.forEach(pattern => {
        if (pattern.test(content)) {
          codeScore++;
        }
      });

      // Additional heuristics
      const hasMultipleLines = totalLines > 1;
      const hasIndentation = lines.some(line => /^[ \t]{2,}/.test(line));
      const hasBraces = (content.match(/[{}\[\]()]/g) || []).length > 2;
      const hasSpecialChars = /[;=><]/g.test(content);

      // Calculate final score
      const heuristicScore = (hasMultipleLines ? 1 : 0) + 
                           (hasIndentation ? 2 : 0) + 
                           (hasBraces ? 1 : 0) + 
                           (hasSpecialChars ? 1 : 0);

      return (codeScore / maxScore) > 0.15 || heuristicScore >= 3;
    }, [content]);

    if (looksLikeCode) {
      // Try to detect language from content
      const detectLanguage = (): string => {
        if (/\b(function|const|let|var|=>|console\.log)\b/.test(content)) return 'javascript';
        if (/\b(interface|type|as\s+\w+)\b/.test(content)) return 'typescript';
        if (/\b(def|import|from|print|if\s+\w+:)\b/.test(content)) return 'python';
        if (/\b(public\s+class|static\s+void|System\.out)\b/.test(content)) return 'java';
        if (/\b(fn|let\s+mut|impl|match)\b/.test(content)) return 'rust';
        if (/\b(func|package|import|fmt\.)\b/.test(content)) return 'go';
        if (/SELECT.*FROM|INSERT.*INTO|UPDATE.*SET/i.test(content)) return 'sql';
        if (/<[^>]+>.*<\/[^>]+>/.test(content)) return 'html';
        if (/\{[^}]*:[^}]*\}/.test(content)) return 'json';
        if (/^#!\/bin\/(bash|sh)/.test(content)) return 'bash';
        if (/\$\w+|echo\s+/.test(content)) return 'bash';
        return 'text';
      };

      return (
        <CodeBlock
          language={detectLanguage()}
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
              <blockquote className={`border-l-4 pl-4 py-2 italic my-4 rounded-r ${
                isDark 
                  ? 'border-blue-400 text-blue-200 bg-blue-900/20' 
                  : 'border-blue-500 text-blue-700 bg-blue-50'
              }`}>
                {children}
              </blockquote>
            );
          },
          // Enhanced table styling
          table({ children }) {
            return (
              <div className="overflow-x-auto my-4">
                <table className={`min-w-full border-collapse rounded-lg overflow-hidden ${
                  isDark ? 'border-gray-600' : 'border-gray-300'
                }`}>
                  {children}
                </table>
              </div>
            );
          },
          th({ children }) {
            return (
              <th className={`border px-4 py-2 font-semibold text-left ${
                isDark 
                  ? 'border-gray-600 bg-gray-800' 
                  : 'border-gray-300 bg-gray-100'
              }`}>
                {children}
              </th>
            );
          },
          td({ children }) {
            return (
              <td className={`border px-4 py-2 ${
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