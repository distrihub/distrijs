import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { ExtractedContent } from './utils';
import remarkGfm from 'remark-gfm'
import rehypeRaw from 'rehype-raw'
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize'
import type { Options as RehypeSanitizeOptions } from 'rehype-sanitize'

const markdownSanitizeOptions: RehypeSanitizeOptions = {
  ...defaultSchema,
  attributes: {
    ...defaultSchema.attributes,
    code: [
      ...(defaultSchema.attributes?.code ?? []),
      ['className']
    ],
    span: [
      ...(defaultSchema.attributes?.span ?? []),
      ['className']
    ],
    div: [
      ...(defaultSchema.attributes?.div ?? []),
      ['className']
    ]
  }
}

interface TextRendererProps {
  content: ExtractedContent;
  className?: string;
}

const TextRenderer: React.FC<TextRendererProps> = ({ content, className = "" }) => {
  const { text } = content;
  // Render as markdown with syntax highlighting
  return (
    <div className={`prose prose-sm max-w-none overflow-hidden break-words ${className}`} style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}>
      <ReactMarkdown
        rehypePlugins={[rehypeRaw, [rehypeSanitize, markdownSanitizeOptions]]}
        remarkPlugins={[remarkGfm]}
        remarkRehypeOptions={{ passThrough: ['link'] }}
        components={{
          code: ({ className: codeClassName, children }) => {
            const match = /language-(\w+)/.exec(codeClassName || '');
            const language = match ? match[1] : '';
            const isInline = !match;

            return !isInline && language ? (
              <div className="w-full max-w-full overflow-hidden" style={{ maxWidth: '100%' }}>
                <SyntaxHighlighter
                  style={vscDarkPlus}
                  language={language}
                  PreTag="div"
                  className="!mt-0 !mb-0 text-sm"
                  wrapLongLines={true}
                  customStyle={{
                    wordBreak: 'break-all',
                    overflowWrap: 'break-word',
                    whiteSpace: 'pre-wrap',
                    maxWidth: '100%',
                    width: '100%',
                    overflow: 'hidden'
                  }}
                >
                  {String(children).replace(/\n$/, '')}
                </SyntaxHighlighter>
              </div>
            ) : (
              <code className="px-1 py-0.5 rounded text-sm font-mono">
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
