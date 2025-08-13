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
  
  // Find and process each agent_response block
  const agentResponseRegex = /<agent_response[^>]*>([\s\S]*?)<\/agent_response>/gi;
  
  processed = processed.replace(agentResponseRegex, (match, content) => {
    // Extract only the thought content from within the agent_response
    const thoughtMatches = content.match(/<thought[^>]*>([\s\S]*?)<\/thought>/gi);
    
    if (thoughtMatches) {
      // Extract and clean the thought content
      const thoughtContent = thoughtMatches.map(thoughtMatch => {
        const thoughtText = thoughtMatch.replace(/<\/?thought[^>]*>/gi, '').trim();
        return thoughtText;
      }).join('\n\n');
      
      return thoughtContent;
    }
    
    // If no thought tags found, remove the entire block
    return '';
  });
  
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
          components={{
            // Handle custom AI tags
            thought: ({ children }) => (
              <div className="border-l-4 border-muted-foreground/30 pl-4 my-3 bg-muted/20 p-3 rounded-r-md">
                <div className="text-sm text-muted-foreground font-medium mb-1">💭 Thinking</div>
                <div className="text-sm text-muted-foreground italic">{children}</div>
              </div>
            ),
            thinking: ({ children }) => (
              <div className="border-l-4 border-blue-400/30 pl-4 my-3 bg-blue-50/20 p-3 rounded-r-md">
                <div className="text-sm text-blue-600 font-medium mb-1">🤔 Processing</div>
                <div className="text-sm text-muted-foreground italic">{children}</div>
              </div>
            ),
            action: ({ children }) => (
              <div className="border-l-4 border-green-400/30 pl-4 my-3 bg-green-50/20 p-3 rounded-r-md">
                <div className="text-sm text-green-600 font-medium mb-1">⚡ Action</div>
                <div className="text-sm text-muted-foreground">{children}</div>
              </div>
            ),
            code: ({ className: codeClassName, children }) => {
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
            p: ({ children }) => (
              <p className="mb-3 last:mb-0 leading-relaxed text-foreground">{children}</p>
            ),
            ul: ({ children }) => (
              <ul className="list-disc list-inside mb-3 space-y-1 text-foreground">{children}</ul>
            ),
            ol: ({ children }) => (
              <ol className="list-decimal list-inside mb-3 space-y-1 text-foreground">{children}</ol>
            ),
            blockquote: ({ children }) => (
              <blockquote className="border-l-4 border-border pl-4 italic text-muted-foreground my-3">
                {children}
              </blockquote>
            ),
            h1: ({ children }) => (
              <h1 className="text-xl font-bold mb-3 text-foreground">{children}</h1>
            ),
            h2: ({ children }) => (
              <h2 className="text-lg font-bold mb-3 text-foreground">{children}</h2>
            ),
            h3: ({ children }) => (
              <h3 className="text-base font-bold mb-2 text-foreground">{children}</h3>
            ),
            h4: ({ children }) => (
              <h4 className="text-sm font-semibold mb-2 text-foreground">{children}</h4>
            ),
            h5: ({ children }) => (
              <h5 className="text-sm font-semibold mb-1 text-foreground">{children}</h5>
            ),
            h6: ({ children }) => (
              <h6 className="text-xs font-semibold mb-1 text-foreground">{children}</h6>
            ),
            strong: ({ children }) => (
              <strong className="font-semibold text-foreground">{children}</strong>
            ),
            em: ({ children }) => (
              <em className="italic text-foreground">{children}</em>
            ),
            pre: ({ children }) => (
              <pre className="bg-muted border border-border rounded-md p-3 overflow-x-auto mb-3">
                {children}
              </pre>
            ),
            table: ({ children }) => (
              <div className="overflow-x-auto mb-3">
                <table className="min-w-full border-collapse border border-border">
                  {children}
                </table>
              </div>
            ),
            th: ({ children }) => (
              <th className="border border-border px-3 py-2 bg-muted font-semibold text-left">
                {children}
              </th>
            ),
            td: ({ children }) => (
              <td className="border border-border px-3 py-2">
                {children}
              </td>
            ),
            a: ({ children, href }) => (
              <a 
                href={href} 
                className="text-primary underline hover:no-underline"
                target="_blank" 
                rel="noopener noreferrer"
              >
                {children}
              </a>
            ),
          }}
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