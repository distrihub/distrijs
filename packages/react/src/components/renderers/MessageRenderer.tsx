import React, { useMemo } from 'react';
import { Copy, Check, Brain, Wrench, FileText } from 'lucide-react';
import { DistriMessage, DistriPart, DistriStreamEvent, isDistriMessage } from '@distri/core';
import { ExecutionSteps } from '../ExecutionSteps';

interface MessageRendererProps {
  content?: string;
  message?: DistriStreamEvent;
  className?: string;
  metadata?: any;
  messages?: DistriStreamEvent[]; // Add this prop to detect execution sequences
}

// Enhanced Code Block Component with better overflow handling
const CodeBlock: React.FC<{
  code: string;
  language?: string;
  className?: string;
}> = ({ code, language = 'text', className = '' }) => {
  const [copied, setCopied] = React.useState(false);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  return (
    <div className={`relative my-3 ${className}`}>
      <div className="flex justify-between items-center bg-muted px-3 py-1.5 rounded-t-md border-b text-xs">
        <span className="text-muted-foreground font-mono">
          {language || 'text'}
        </span>
        <button
          onClick={copyToClipboard}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          {copied ? (
            <>
              <Check className="w-3 h-3" />
              Copied
            </>
          ) : (
            <>
              <Copy className="w-3 h-3" />
              Copy
            </>
          )}
        </button>
      </div>
      <div className="bg-muted/50 rounded-b-md overflow-hidden">
        <pre className="p-3 overflow-x-auto text-xs">
          <code className="font-mono whitespace-pre-wrap break-words">
            {code}
          </code>
        </pre>
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
        <div className="whitespace-pre-wrap break-words text-foreground text-sm leading-relaxed">
          {part.text}
        </div>
      );
    case 'tool_call':
      return (
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-md p-3 my-2">
          <div className="flex items-center gap-2 mb-2">
            <Wrench className="w-3 h-3 text-blue-500" />
            <span className="font-medium text-blue-600 text-xs">
              Tool Call: {part.tool_call.tool_name}
            </span>
          </div>
          <div className="text-xs text-muted-foreground">
            <strong>Input:</strong>
            <pre className="mt-1 bg-muted p-2 rounded text-xs overflow-x-auto">
              {JSON.stringify(part.tool_call.input, null, 2)}
            </pre>
          </div>
        </div>
      );
    case 'tool_result':
      return (
        <div className="bg-green-500/10 border border-green-500/20 rounded-md p-3 my-2">
          <div className="flex items-center gap-2 mb-2">
            <Check className="w-3 h-3 text-green-500" />
            <span className="font-medium text-green-600 text-xs">
              Tool Result
            </span>
          </div>
          <div className="text-xs text-muted-foreground">
            <strong>Result:</strong>
            <pre className="mt-1 bg-muted p-2 rounded text-xs overflow-x-auto">
              {JSON.stringify(part.tool_result.result, null, 2)}
            </pre>
          </div>
        </div>
      );
    case 'plan':
      return (
        <div className="bg-purple-500/10 border border-purple-500/20 rounded-md p-3 my-2">
          <div className="flex items-center gap-2 mb-2">
            <Brain className="w-3 h-3 text-purple-500" />
            <span className="font-medium text-purple-600 text-xs">
              Plan
            </span>
          </div>
          <div className="text-xs whitespace-pre-wrap text-muted-foreground">
            {part.plan}
          </div>
        </div>
      );
    case 'code_observation':
      return (
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-md p-3 my-2">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="w-3 h-3 text-yellow-500" />
            <span className="font-medium text-yellow-600 text-xs">
              Code Observation
            </span>
          </div>
          {part.thought && (
            <div className="text-xs text-muted-foreground mb-2">
              <strong>Thought:</strong> {part.thought}
            </div>
          )}
          <CodeBlock code={part.code} language="text" />
        </div>
      );
    case 'image_url':
      return (
        <div className="my-2">
          <img
            src={part.image.url}
            alt={part.image.name || 'Image'}
            className="max-w-full h-auto rounded-md border"
          />
        </div>
      );
    case 'image_bytes':
      return (
        <div className="my-2">
          <img
            src={`data:${part.image.mime_type};base64,${part.image.data}`}
            alt={part.image.name || 'Image'}
            className="max-w-full h-auto rounded-md border"
          />
        </div>
      );
    default:
      return (
        <div className="bg-muted p-2 rounded text-xs">
          <pre className="text-muted-foreground">{JSON.stringify(part, null, 2)}</pre>
        </div>
      );
  }
};

const MessageRenderer: React.FC<MessageRendererProps> = ({
  content,
  message,
  className = "",
  metadata: _metadata,
  messages, // Add this prop to detect execution sequences
}) => {
  // Check if this is part of an execution sequence (multiple messages with tool calls)
  const isExecutionSequence = useMemo(() => {
    if (!messages || messages.length <= 1) return false;

    return messages.some(msg =>
      isDistriMessage(msg) &&
      msg.parts.some(part => part.type === 'tool_call' || part.type === 'tool_result')
    );
  }, [messages]);

  // If this is an execution sequence, render with ExecutionSteps
  if (isExecutionSequence && messages) {
    const distriMessages = messages.filter(isDistriMessage) as DistriMessage[];
    return (
      <div className={`space-y-4 ${className}`}>
        <ExecutionSteps messages={distriMessages} />
      </div>
    );
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
              <MessageRenderer
                key={groupIndex}
                content={concatenatedText}
                className={className}
              />
            );
          } else {
            // Render individual part
            const part = group[0];
            return <PartRenderer key={groupIndex} part={part} />;
          }
        })}
      </div>
    );
  } else if (message) {
    return <div className={`whitespace-pre-wrap break-words text-foreground ${className}`}>{JSON.stringify(message, null, 2)}</div>;
  }

  // If we don't have a message but have content, render the content
  else if (!message && content) {
    return (
      <div className={`whitespace-pre-wrap break-words text-foreground ${className}`}>
        {content}
      </div>
    );
  }

  return null;
};

export default MessageRenderer;