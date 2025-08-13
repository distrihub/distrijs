import React, { useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';

/**
 * Process <agent_response> blocks to extract only <thought> content
 * Remove <action> parts since they're handled by separate events
 */
function processAgentResponseBlocks(text: string): string {
  if (!text) return text;

  let processed = text;

  // First, remove standalone agent_response tags that appear without content
  processed = processed.replace(/<agent_response[^>]*>\s*<\/agent_response>/gi, '');
  processed = processed.replace(/<agent_response[^>]*>\s*$/gi, '');
  processed = processed.replace(/^\s*<\/agent_response>/gi, '');

  // Find and process each agent_response block with content
  const agentResponseRegex = /<agent_response[^>]*>([\s\S]*?)<\/agent_response>/gi;

  processed = processed.replace(agentResponseRegex, (_match, content) => {
    // Extract only the thought content from within the agent_response
    const thoughtMatches = content.match(/<thought[^>]*>([\s\S]*?)<\/thought>/gi);

    if (thoughtMatches) {
      // Extract and clean the thought content, wrap it in markdown thought blocks
      const thoughtContent = thoughtMatches.map((thoughtMatch: string) => {
        const thoughtText = thoughtMatch.replace(/<\/?thought[^>]*>/gi, '').trim();
        if (thoughtText) {
          return `<thought>\n${thoughtText}\n</thought>`;
        }
        return '';
      }).filter(Boolean).join('\n\n');

      return thoughtContent;
    }

    // If no thought tags found, remove the entire block
    return '';
  });

  // Remove any remaining standalone agent_response or thought tags
  processed = processed.replace(/<\/?agent_response[^>]*>/gi, '');

  // Clean up any extra whitespace left behind
  processed = processed.replace(/\n\s*\n\s*\n/g, '\n\n').trim();

  return processed;
}

interface StreamingTextRendererProps {
  text: string;
  isStreaming?: boolean;
  className?: string;
}

export const StreamingTextRenderer: React.FC<StreamingTextRendererProps> = ({
  text,
  isStreaming = false,
  className = ""
}) => {
  // Optimize rendering by memoizing the markdown result
  const renderedContent = useMemo(() => {
    // Process agent_response blocks to extract only thought content
    const cleanedText = processAgentResponseBlocks(text);

    if (!cleanedText.trim()) {
      return null;
    }

    return (
      <div className={`prose prose-sm max-w-none ${className}`}>
        <ReactMarkdown
          rehypePlugins={[rehypeRaw]}
          remarkPlugins={[remarkGfm]}
          remarkRehypeOptions={{
            passThrough: ['link'],
            allowDangerousHtml: true
          }}
          components={
            {
              // Handle custom AI tags - cast to any to bypass TypeScript component restrictions
              thought: ({ children }: any) => (
                <span className="inline-flex items-start gap-1">
                  <span className="text-muted-foreground">💭</span>
                  <span className="text-foreground">{children}</span>
                </span>
              ),
              thinking: ({ children }: any) => (
                <div className="border-l-4 border-blue-400/30 pl-4 my-3 bg-blue-50/20 p-3 rounded-r-md">
                  <div className="text-sm text-blue-600 font-medium mb-1">🤔 Processing</div>
                  <div className="text-sm text-muted-foreground italic">{children}</div>
                </div>
              ),
              action: ({ children }: any) => (
                <div className="border-l-4 border-green-400/30 pl-4 my-3 bg-green-50/20 p-3 rounded-r-md">
                  <div className="text-sm text-green-600 font-medium mb-1">⚡ Action</div>
                  <div className="text-sm text-muted-foreground">{children}</div>
                </div>
              ),
              code: ({ className: codeClassName, children }: { className: string, children: React.ReactNode }) => {
                const match = /language-(\w+)/.exec(codeClassName || '');
                const language = match ? match[1] : '';
                const isInline = !match;

                return !isInline && language ? (
                  <SyntaxHighlighter
                    style={tomorrow}
                    language={language}
                    PreTag="div"
                    className="!mt-0 !mb-0 rounded-md"
                  >
                    {String(children).replace(/\n$/, '')}
                  </SyntaxHighlighter>
                ) : (
                  <code className="bg-muted px-2 py-1 rounded text-sm font-mono text-foreground">
                    {children}
                  </code>
                );
              },
              p: ({ children }: { children: React.ReactNode }) => (
                <p className="mb-3 last:mb-0 leading-relaxed text-foreground">{children}</p>
              ),
              ul: ({ children }: { children: React.ReactNode }) => (
                <ul className="list-disc list-inside mb-3 space-y-1 text-foreground">{children}</ul>
              ),
              ol: ({ children }: { children: React.ReactNode }) => (
                <ol className="list-decimal list-inside mb-3 space-y-1 text-foreground">{children}</ol>
              ),
              blockquote: ({ children }: { children: React.ReactNode }) => (
                <blockquote className="border-l-4 border-border pl-4 italic text-muted-foreground my-3">
                  {children}
                </blockquote>
              ),
              h1: ({ children }: { children: React.ReactNode }) => (
                <h1 className="text-xl font-bold mb-3 text-foreground">{children}</h1>
              ),
              h2: ({ children }: { children: React.ReactNode }) => (
                <h2 className="text-lg font-bold mb-3 text-foreground">{children}</h2>
              ),
              h3: ({ children }: { children: React.ReactNode }) => (
                <h3 className="text-base font-bold mb-2 text-foreground">{children}</h3>
              ),
              h4: ({ children }: { children: React.ReactNode }) => (
                <h4 className="text-sm font-semibold mb-2 text-foreground">{children}</h4>
              ),
              h5: ({ children }: { children: React.ReactNode }) => (
                <h5 className="text-sm font-semibold mb-1 text-foreground">{children}</h5>
              ),
              h6: ({ children }: { children: React.ReactNode }) => (
                <h6 className="text-xs font-semibold mb-1 text-foreground">{children}</h6>
              ),
              strong: ({ children }: { children: React.ReactNode }) => (
                <strong className="font-semibold text-foreground">{children}</strong>
              ),
              em: ({ children }: { children: React.ReactNode }) => (
                <em className="italic text-foreground">{children}</em>
              ),
              pre: ({ children }: { children: React.ReactNode }) => (
                <pre className="bg-muted border border-border rounded-md p-3 overflow-x-auto mb-3">
                  {children}
                </pre>
              ),
              table: ({ children }: { children: React.ReactNode }) => (
                <div className="overflow-x-auto mb-3">
                  <table className="min-w-full border-collapse border border-border">
                    {children}
                  </table>
                </div>
              ),
              th: ({ children }: { children: React.ReactNode }) => (
                <th className="border border-border px-3 py-2 bg-muted font-semibold text-left">
                  {children}
                </th>
              ),
              td: ({ children }: { children: React.ReactNode }) => (
                <td className="border border-border px-3 py-2">
                  {children}
                </td>
              ),
              a: ({ children, href }: { children: React.ReactNode, href: string }) => (
                <a
                  href={href}
                  className="text-primary underline hover:no-underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {children}
                </a>
              ),
            } as any}
        >
          {cleanedText}
        </ReactMarkdown>
      </div>
    );
  }, [text, className]);

  if (!renderedContent) {
    return null;
  }

  return (
    <div className="relative">
      <div className="transition-all duration-200 ease-out">
        {renderedContent}
      </div>
      {/* Streaming cursor */}
      {isStreaming && (
        <span className="inline-block w-0.5 h-4 bg-primary animate-pulse ml-1 transition-opacity duration-200" />
      )}
    </div>
  );
};

export default StreamingTextRenderer;