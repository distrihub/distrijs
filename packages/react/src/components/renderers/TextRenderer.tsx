import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { ExtractedContent } from './utils';
import remarkGfm from 'remark-gfm'
import rehypeRaw from 'rehype-raw'

interface TextRendererProps {
  content: ExtractedContent;
  className?: string;
}

const TextRenderer: React.FC<TextRendererProps> = ({ content, className = "" }) => {
  const { text } = content;



  // Render as markdown with syntax highlighting
  return (
    <div className={`prose prose-sm max-w-none ${className}`}>
      <ReactMarkdown
        rehypePlugins={[rehypeRaw]}
        remarkPlugins={[remarkGfm]}
        remarkRehypeOptions={{ passThrough: ['link'] }}
        components={{
          code: ({ className: codeClassName, children }) => {
            const match = /language-(\w+)/.exec(codeClassName || '');
            const language = match ? match[1] : '';
            const isInline = !match;

            return !isInline && language ? (
              <SyntaxHighlighter
                style={tomorrow as any}
                language={language}
                PreTag="div"
                className="!mt-0 !mb-0"
              >
                {String(children).replace(/\n$/, '')}
              </SyntaxHighlighter>
            ) : (
              <code className="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono">
                {children}
              </code>
            );
          },
          p: ({ children }) => (
            <p className="mb-2 last:mb-0">{children}</p>
          ),
          ul: ({ children }) => (
            <ul className="list-disc list-inside mb-2">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal list-inside mb-2">{children}</ol>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-gray-300 pl-4 italic text-gray-600">
              {children}
            </blockquote>
          ),
          h1: ({ children }) => (
            <h1 className="text-lg font-bold mb-2">{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-base font-bold mb-2">{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-sm font-bold mb-1">{children}</h3>
          ),
          h4: ({ children }) => (
            <h4 className="text-sm font-semibold mb-1">{children}</h4>
          ),
          h5: ({ children }) => (
            <h5 className="text-xs font-semibold mb-1">{children}</h5>
          ),
          h6: ({ children }) => (
            <h6 className="text-xs font-semibold mb-1">{children}</h6>
          ),
        }}
      >
        {text}
      </ReactMarkdown>
    </div>
  );
};

export default TextRenderer;