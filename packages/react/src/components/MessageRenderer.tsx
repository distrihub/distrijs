import React, { useMemo } from 'react';
import { Copy, Check, Brain, Wrench, FileText } from 'lucide-react';
import { DistriMessage, DistriPart, DistriStreamEvent, isDistriMessage } from '@distri/core';
import { ExecutionSteps } from './ExecutionSteps';

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
    <div className={`relative my-4 ${className}`}>
      <div className="flex justify-between items-center bg-gray-100 dark:bg-gray-800 px-4 py-2 rounded-t-md border-b">
        <span className="text-sm text-gray-600 dark:text-gray-300 font-mono">
          {language || 'text'}
        </span>
        <button
          onClick={copyToClipboard}
          className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100 transition-colors"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4" />
              Copied
            </>
          ) : (
            <>
              <Copy className="w-4 h-4" />
              Copy
            </>
          )}
        </button>
      </div>
      <div className="bg-gray-50 dark:bg-gray-900 rounded-b-md overflow-hidden">
        <pre className="p-4 overflow-x-auto text-sm">
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
        <div className="whitespace-pre-wrap break-words text-foreground">
          {part.text}
        </div>
      );
    case 'tool_call':
      return (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 my-2">
          <div className="flex items-center gap-2 mb-2">
            <Wrench className="w-4 h-4 text-blue-600" />
            <span className="font-medium text-blue-800 dark:text-blue-200">
              Tool Call: {part.tool_call.tool_name}
            </span>
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-300">
            <strong>Input:</strong>
            <pre className="mt-1 bg-gray-100 dark:bg-gray-800 p-2 rounded text-xs overflow-x-auto">
              {JSON.stringify(part.tool_call.input, null, 2)}
            </pre>
          </div>
        </div>
      );
    case 'tool_result':
      return (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 my-2">
          <div className="flex items-center gap-2 mb-2">
            <Check className="w-4 h-4 text-green-600" />
            <span className="font-medium text-green-800 dark:text-green-200">
              Tool Result
            </span>
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-300">
            <pre className="bg-gray-100 dark:bg-gray-800 p-2 rounded text-xs overflow-x-auto">
              {typeof part.tool_result.result === 'string'
                ? part.tool_result.result
                : JSON.stringify(part.tool_result.result, null, 2)}
            </pre>
          </div>
        </div>
      );
    case 'plan':
      return (
        <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4 my-2">
          <div className="flex items-center gap-2 mb-2">
            <Brain className="w-4 h-4 text-purple-600" />
            <span className="font-medium text-purple-800 dark:text-purple-200">
              Plan
            </span>
          </div>
          <div className="text-sm whitespace-pre-wrap">
            {part.plan}
          </div>
        </div>
      );
    case 'code_observation':
      return (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 my-2">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="w-4 h-4 text-yellow-600" />
            <span className="font-medium text-yellow-800 dark:text-yellow-200">
              Code Observation
            </span>
          </div>
          {part.thought && (
            <div className="text-sm text-gray-600 dark:text-gray-300 mb-2">
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
            className="max-w-full h-auto rounded-lg border"
          />
        </div>
      );
    case 'image_bytes':
      return (
        <div className="my-2">
          <img
            src={`data:${part.image.mime_type};base64,${part.image.data}`}
            alt={part.image.name || 'Image'}
            className="max-w-full h-auto rounded-lg border"
          />
        </div>
      );
    default:
      return (
        <div className="bg-gray-100 dark:bg-gray-800 p-2 rounded text-sm">
          <pre>{JSON.stringify(part, null, 2)}</pre>
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
  }

  // If we don't have a message but have content, render the content
  if (!message && content) {
    return (
      <div className={`whitespace-pre-wrap break-words text-foreground ${className}`}>
        {content}
      </div>
    );
  }

  return null;
};

export default MessageRenderer;