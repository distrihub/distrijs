import React, { useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Copy, Check, Brain, Wrench, FileText } from 'lucide-react';
import { useChatConfig } from './ChatContext';
import { DistriPart, ToolCall, ToolResponse, DistriStreamEvent, isDistriMessage } from '@distri/core';

interface MessageRendererProps {
  content?: string;
  message?: DistriStreamEvent;
  className?: string;
  metadata?: any;
}

// Enhanced Code Block Component with better overflow handling
const CodeBlock: React.FC<{
  language: string;
  children: string;
  inline?: boolean;
}> = ({ language, children, inline = false }) => {
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
      <code className="px-1.5 py-0.5 rounded text-sm font-mono bg-muted text-foreground">
        {children}
      </code>
    );
  }

  const lineCount = children.split('\n').length;
  const shouldShowLineNumbers = lineCount > 4;

  return (
    <div className="relative group">
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={handleCopy}
          className="p-2 rounded-md bg-muted hover:bg-muted/80"
          title="Copy code"
        >
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        </button>
      </div>

      <div className="relative">
        <SyntaxHighlighter
          style={oneLight}
          language={normalizedLanguage}
          PreTag="div"
          showLineNumbers={shouldShowLineNumbers}
          wrapLines={true}
          wrapLongLines={true}
          lineNumberStyle={{
            minWidth: '2.5em',
            paddingRight: '1em',
            color: '#9CA3AF',
            fontSize: '0.75rem',
            userSelect: 'none'
          }}
          customStyle={{
            margin: 0,
            padding: '0.75rem',
            background: 'hsl(var(--muted))',
            fontSize: '0.875rem',
            lineHeight: '1.5',
            fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace',
            overflowX: 'auto',
            maxWidth: '100%',
          }}
          codeTagProps={{
            style: {
              fontSize: '0.875rem',
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

// Code Observation Component
const CodeObservationComponent: React.FC<{
  thought: string;
  code: string;
}> = ({ thought, code }) => {
  return (
    <div className="border rounded-lg p-4 my-4 border-border bg-muted/50">
      <div className="flex items-center gap-2 mb-3">
        <Brain className="h-4 w-4 text-blue-500" />
        <span className="text-sm font-medium text-blue-600">Code Observation</span>
      </div>

      <div className="mb-3">
        <div className="text-sm text-muted-foreground mb-2">Thought:</div>
        <div className="text-sm text-foreground">
          {thought}
        </div>
      </div>

      <div>
        <div className="text-sm text-muted-foreground mb-2">Code:</div>
        <CodeBlock language="javascript">
          {code}
        </CodeBlock>
      </div>
    </div>
  );
};

// Tool Call Component
const ToolCallComponent: React.FC<{
  toolCall: ToolCall;
}> = ({ toolCall }) => {
  return (
    <div className="border rounded-lg p-4 my-4 border-border bg-muted/50">
      <div className="flex items-center gap-2 mb-3">
        <Wrench className="h-4 w-4 text-green-500" />
        <span className="text-sm font-medium text-green-600">Tool Call</span>
      </div>

      <div className="space-y-2">
        <div>
          <span className="text-sm text-muted-foreground">Tool:</span>
          <span className="ml-2 text-sm font-mono text-foreground">
            {toolCall.tool_name}
          </span>
        </div>

        <div>
          <span className="text-sm text-muted-foreground">Input:</span>
          <div className="mt-1">
            <CodeBlock language="json">
              {JSON.stringify(toolCall.input, null, 2)}
            </CodeBlock>
          </div>
        </div>
      </div>
    </div>
  );
};

// Tool Result Component
const ToolResultComponent: React.FC<{
  toolResult: ToolResponse;
}> = ({ toolResult }) => {
  return (
    <div className="border rounded-lg p-4 my-4 border-border bg-muted/50">
      <div className="flex items-center gap-2 mb-3">
        <FileText className="h-4 w-4 text-purple-500" />
        <span className="text-sm font-medium text-purple-600">Tool Result</span>
        <span className={`text-xs px-2 py-1 rounded ${toolResult.success
          ? 'bg-green-100 text-green-800'
          : 'bg-red-100 text-red-800'}`}>
          {toolResult.success ? 'Success' : 'Error'}
        </span>
      </div>

      <div className="space-y-2">
        {toolResult.error && (
          <div>
            <span className="text-sm text-destructive">Error:</span>
            <div className="mt-1 text-sm text-destructive">
              {toolResult.error}
            </div>
          </div>
        )}

        <div>
          <span className="text-sm text-muted-foreground">Result:</span>
          <div className="mt-1">
            <CodeBlock language="json">
              {JSON.stringify(toolResult.result, null, 2)}
            </CodeBlock>
          </div>
        </div>
      </div>
    </div>
  );
};

// Plan Component
const PlanComponent: React.FC<{
  plan: string;
}> = ({ plan }) => {
  return (
    <div className="border rounded-lg p-4 my-4 border-border bg-muted/50">
      <div className="flex items-center gap-2 mb-3">
        <Brain className="h-4 w-4 text-orange-500" />
        <span className="text-sm font-medium text-orange-600">Plan</span>
      </div>

      <div className="text-sm text-foreground">
        {plan}
      </div>
    </div>
  );
};

// Part Renderer Component
const PartRenderer: React.FC<{
  part: DistriPart;
}> = ({ part }) => {
  switch (part.type) {
    case 'text':
      return (
        <div className="whitespace-pre-wrap break-words text-foreground">
          {part.text}
        </div>
      );

    case 'code_observation':
      return <CodeObservationComponent thought={part.thought} code={part.code} />;

    case 'tool_call':
      return <ToolCallComponent toolCall={part.tool_call} />;

    case 'tool_result':
      return <ToolResultComponent toolResult={part.tool_result} />;

    case 'plan':
      return <PlanComponent plan={part.plan} />;

    case 'image_url':
      return (
        <div className="my-4">
          <img
            src={part.image.url}
            alt={part.image.name || 'Image'}
            className="max-w-full rounded-lg"
          />
        </div>
      );

    case 'image_bytes':
      return (
        <div className="my-4">
          <img
            src={`data:${part.image.mime_type};base64,${part.image.data}`}
            alt={part.image.name || 'Image'}
            className="max-w-full rounded-lg"
          />
        </div>
      );

    case 'data':
      return (
        <div className="my-4">
          <CodeBlock language="json">
            {JSON.stringify(part.data, null, 2)}
          </CodeBlock>
        </div>
      );

    default:
      return null;
  }
};

const MessageRenderer: React.FC<MessageRendererProps> = ({
  content,
  message,
  className = "",
  metadata: _metadata,
}) => {
  // Try to get chat config if available, otherwise use defaults
  let config;
  try {
    const chatConfig = useChatConfig();
    config = chatConfig.config;
  } catch {
    // If no chat context available, use defaults
    config = {
      enableMarkdown: true,
      enableCodeHighlighting: true,
      theme: 'chatgpt' as const
    };
  }
  // If we have a DistriMessage, render its parts
  if (message && isDistriMessage(message)) {
    // Filter out tool_result parts if this message has tool_calls (they'll be handled by AssistantWithToolCalls)
    const hasToolCalls = message.parts.some(part => part.type === 'tool_call');
    const filteredParts = hasToolCalls
      ? message.parts.filter(part => part.type !== 'tool_result')
      : message.parts;

    // Group consecutive text parts for concatenation
    const groupedParts: DistriPart[][] = [];
    let currentTextGroup: DistriPart[] = [];

    for (const part of filteredParts) {
      if (part.type === 'text') {
        currentTextGroup.push(part);
      } else {
        if (currentTextGroup.length > 0) {
          groupedParts.push([...currentTextGroup]);
          currentTextGroup = [];
        }
        groupedParts.push([part]);
      }
    }

    // Don't forget the last text group
    if (currentTextGroup.length > 0) {
      groupedParts.push(currentTextGroup);
    }

    return (
      <div className={`space-y-2 ${className}`}>
        {groupedParts.map((group, groupIndex) => {
          if (group.length > 1 && group.every(part => part.type === 'text')) {
            // Concatenate consecutive text parts
            const concatenatedText = group.map(part => part.type === 'text' ? part.text : '').join('');
            return (
              <div key={groupIndex} className="whitespace-pre-wrap break-words text-foreground">
                {concatenatedText}
              </div>
            );
          } else {
            // Render single part normally
            return <PartRenderer key={groupIndex} part={group[0]} />;
          }
        })}
      </div>
    );
  }

  // Fallback to legacy content rendering
  if (!content) return null;

  // Enhanced markdown detection
  const hasMarkdownSyntax = useMemo(() => {
    if (!config.enableMarkdown) return false;

    const markdownPatterns = [
      /^#{1, 6}\s+/m, // Headers
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
  }, [content, config.enableMarkdown]);

  // Much more conservative code detection to avoid thoughts being marked as code
  const looksLikeCode = useMemo(() => {
    if (!config.enableCodeHighlighting) return false;
    if (hasMarkdownSyntax) return false;

    const lines = content.split('\n');
    const totalLines = lines.length;

    // Don't treat short content as code
    if (totalLines === 1 && content.length < 50) {
      return false;
    }

    // Only trigger on very explicit code patterns - NOT thoughts or explanations
    const explicitCodePatterns = [
      /^#!\//, // Shebang
      /^\s*(function|const|let|var)\s+\w+\s*[=\(]/, // JS/TS function/variable declarations
      /^\s*(class|interface)\s+\w+/, // Class/interface declarations
      /^\s*(import|export)\s+/, // Import/export statements
      /^\s*(def|class)\s+\w+/, // Python def/class
      /^\s*(public|private|protected)\s+(class|interface|static)/, // Java/C# declarations
      /^\s*<\?php/, // PHP opening tag
      /^\s*<html|<head|<body|<div /, // HTML tags
      /^\s*\{[\s]*"[\w"]+"\s*:/, // JSON objects (key-value pairs)
      /^\s*SELECT\s+.*\s+FROM\s+/i, // SQL SELECT statements
      /^\s*\/\*[\s\S]*\*\//, // Block comments
      /^[ \t]*\/\/\s*\w+/, // Line comments (with actual content)
      /;\s*$/, // Lines ending with semicolons
    ];

    // Must have at least one very explicit code pattern
    const hasExplicitCode = explicitCodePatterns.some(pattern => pattern.test(content));

    if (!hasExplicitCode) return false;

    // Additional verification: check for programming structure
    const structuralPatterns = [
      /[{ }[\]()]/g, // Brackets and braces
      /^\s{2,}/m, // Indentation
      /=>/g, // Arrow functions
      /[;:]/g, // Semicolons or colons
    ];

    const structureCount = structuralPatterns.reduce((count, pattern) => {
      const matches = content.match(pattern);
      return count + (matches ? matches.length : 0);
    }, 0);

    // Require both explicit code patterns AND structural elements
    return structureCount >= 3;
  }, [content, hasMarkdownSyntax, config.enableCodeHighlighting]);

  // Try to detect language from content
  const detectLanguage = useMemo((): string => {
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
  }, [content]);

  // Render based on content type
  if (looksLikeCode) {
    return (
      <CodeBlock
        language={detectLanguage}
      >
        {content}
      </CodeBlock>
    );
  }

  if (!hasMarkdownSyntax) {
    return (
      <div className={`whitespace-pre-wrap break-words text-foreground ${className}`}>
        {content}
      </div>
    );
  }

  // Enhanced markdown rendering with better overflow handling
  return (
    <div className={`prose prose-sm max-w-none prose-foreground ${className} break-words`}>
      <ReactMarkdown
        components={{
          code({ className, children }) {
            const match = /language-(\w+)/.exec(className || '');
            const language = match ? match[1] : '';

            return (
              <CodeBlock
                language={language}
                inline={true}
              >
                {String(children).replace(/\n$/, '')}
              </CodeBlock>
            );
          },
          // Enhanced blockquote styling
          blockquote({ children }) {
            return (
              <blockquote className="border-l-4 pl-4 py-2 italic my-4 rounded-r border-primary text-primary bg-primary/10">
                {children}
              </blockquote>
            );
          },
          // Enhanced table styling with overflow handling
          table({ children }) {
            return (
              <div className="overflow-x-auto my-4">
                <table className="min-w-full border-collapse rounded-lg overflow-hidden border-border">
                  {children}
                </table>
              </div>
            );
          },
          th({ children }) {
            return (
              <th className="border px-4 py-2 font-semibold text-left border-border bg-muted">
                {children}
              </th>
            );
          },
          td({ children }) {
            return (
              <td className="border px-4 py-2 border-border">
                {children}
              </td>
            );
          }
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default MessageRenderer;