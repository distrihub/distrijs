import React, { useState, useCallback, useRef, useEffect } from 'react';
import { DistriChatMessage, DistriPart } from '@distri/core';
import { ChatInput, AttachedImage } from './ChatInput';
import { useChat } from '../useChat';
import { MessageRenderer } from './renderers/MessageRenderer';
import { ThinkingRenderer } from './renderers/ThinkingRenderer';
import { TypingIndicator } from './renderers/TypingIndicator';
import { ToolCallRenderer } from './renderers/ToolCallRenderer';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

import { useChatStateStore } from '../stores/chatStateStore';
import { WrapToolOptions } from '../utils/toolWrapper';
import { ToolsConfig } from '@distri/core';

export interface ModelOption {
  id: string;
  name: string;
}

export interface ChatProps {
  threadId: string;
  agent?: any;
  onMessage?: (message: DistriChatMessage) => void;
  beforeSendMessage?: (content: string | DistriPart[]) => Promise<string | DistriPart[]>;
  onError?: (error: Error) => void;
  getMetadata?: () => Promise<any>;
  tools?: ToolsConfig;
  // Tool wrapping options
  wrapOptions?: WrapToolOptions;
  // Initial messages to use instead of fetching
  initialMessages?: (DistriChatMessage)[];
  // Theme
  theme?: 'light' | 'dark' | 'auto';
  // Model dropdown options
  models?: ModelOption[];
  selectedModelId?: string;
  onModelChange?: (modelId: string) => void;
}

// Wrapper component to ensure consistent width and centering
const RendererWrapper: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = ''
}) => (
  <div className={`max-w-3xl mx-auto w-full ${className}`}>
    {children}
  </div>
);

export function Chat({
  threadId,
  agent,
  onMessage,
  onError,
  getMetadata,
  tools,
  wrapOptions,
  initialMessages,
  theme = 'auto',
  models,
  selectedModelId,
  beforeSendMessage,
  onModelChange,
}: ChatProps) {
  const [input, setInput] = useState('');
  const [expandedTools, setExpandedTools] = useState<Set<string>>(new Set());
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Image upload state moved from ChatInput
  const [attachedImages, setAttachedImages] = useState<AttachedImage[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);


  const {
    sendMessage,
    stopStreaming,
    isStreaming,
    isLoading,
    error,
    messages,
  } = useChat({
    threadId,
    agent,
    onMessage,
    onError,
    getMetadata,
    tools,
    wrapOptions,
    initialMessages,
  });

  // Get reactive state from store
  const toolCalls = useChatStateStore(state => state.toolCalls);
  const hasPendingToolCalls = useChatStateStore(state => state.hasPendingToolCalls);
  const streamingIndicator = useChatStateStore(state => state.streamingIndicator);
  const currentThought = useChatStateStore(state => state.currentThought);


  // Image upload functions moved from ChatInput
  const addImages = useCallback(async (files: FileList | File[]) => {
    const imageFiles = Array.from(files).filter(file => file.type.startsWith('image/'));

    for (const file of imageFiles) {
      const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
      const preview = URL.createObjectURL(file);

      const newImage: AttachedImage = {
        id,
        file,
        preview,
        name: file.name
      };

      setAttachedImages(prev => [...prev, newImage]);
    }
  }, []);

  const removeImage = useCallback((id: string) => {
    setAttachedImages(prev => {
      const image = prev.find(img => img.id === id);
      if (image) {
        URL.revokeObjectURL(image.preview);
      }
      return prev.filter(img => img.id !== id);
    });
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Only hide drag over if we're leaving the chat container
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragOver(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      addImages(files);
    }
  }, [addImages]);

  const handleSendMessage = useCallback(async (initialContent: string | DistriPart[]) => {

    let content = initialContent;
    if (beforeSendMessage) {
      content = await beforeSendMessage(content);
    }

    if (typeof content === 'string' && !content.trim()) return;
    if (Array.isArray(content) && content.length === 0) return;

    setInput('');
    // Clear attached images when sending
    setAttachedImages(prev => {
      prev.forEach(img => URL.revokeObjectURL(img.preview));
      return [];
    });
    await sendMessage(content);
  }, [sendMessage, beforeSendMessage]);

  const handleStopStreaming = useCallback(() => {
    stopStreaming();
  }, [stopStreaming]);

  const toggleToolExpansion = useCallback((toolId: string) => {
    setExpandedTools(prev => {
      const newSet = new Set(prev);
      if (newSet.has(toolId)) {
        newSet.delete(toolId);
      } else {
        newSet.add(toolId);
      }
      return newSet;
    });
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-expand tools that are running or have errors
  useEffect(() => {
    const newExpanded = new Set(expandedTools);
    let hasChanges = false;

    toolCalls.forEach(toolCall => {
      if (toolCall.status === 'running' || toolCall.status === 'error' || toolCall.status === 'user_action_required') {
        if (!newExpanded.has(toolCall.tool_call_id)) {
          newExpanded.add(toolCall.tool_call_id);
          hasChanges = true;
        }
      }
    });

    if (hasChanges) {
      setExpandedTools(newExpanded);
    }
  }, [toolCalls]); // Remove expandedTools from dependencies

  // Determine theme classes
  const getThemeClasses = () => {
    if (theme === 'dark') return 'dark';
    if (theme === 'light') return '';
    // For 'auto', we'll let the system handle it
    return '';
  };

  // Render messages using the new MessageRenderer
  const renderMessages = () => {
    const elements: React.ReactNode[] = [];

    // Render all messages using MessageRenderer
    messages.forEach((message: any, index: number) => {
      const renderedMessage = (
        <MessageRenderer
          key={`message-${index}`}
          message={message}
          index={index}
          isExpanded={expandedTools.has(message.id || `message-${index}`)}
          onToggle={() => {
            const messageId = message.id || `message-${index}`;
            toggleToolExpansion(messageId);
          }}
        />
      );

      // Only add non-null rendered messages
      if (renderedMessage !== null) {
        elements.push(renderedMessage);
      }
    });

    // Render standalone tool calls that aren't part of any message
    const standaloneToolCalls = Array.from(toolCalls.values()).filter(toolCall =>
      toolCall.status === 'pending' || toolCall.status === 'running'
    );

    if (standaloneToolCalls.length > 0) {
      console.log('🔧 Found standalone tool calls:', standaloneToolCalls.length, standaloneToolCalls.map(tc => ({ name: tc.tool_name, status: tc.status, hasComponent: !!tc.component })));
    }

    standaloneToolCalls.forEach((toolCall) => {
      if (toolCall.component) {
        // Render the tool call component directly
        elements.push(
          <RendererWrapper key={`standalone-tool-${toolCall.tool_call_id}`}>
            {toolCall.component}
          </RendererWrapper>
        );
      } else {
        // Fallback: render with ToolCallRenderer
        console.log('🔧 Rendering standalone tool call with ToolCallRenderer:', toolCall.tool_name);
        elements.push(
          <RendererWrapper key={`standalone-fallback-${toolCall.tool_call_id}`}>
            <ToolCallRenderer
              toolCall={toolCall}
              isExpanded={expandedTools.has(toolCall.tool_call_id)}
              onToggle={() => toggleToolExpansion(toolCall.tool_call_id)}
            />
          </RendererWrapper>
        );
      }
    });

    return elements;
  };

  // Render thinking indicator separately at the end
  const renderThinkingIndicator = () => {
    if (streamingIndicator === 'typing') {
      return (
        <RendererWrapper key={`typing-indicator`}>
          <TypingIndicator />
        </RendererWrapper>
      );
    } else if (streamingIndicator) {
      return (
        <RendererWrapper key={`thinking-${streamingIndicator}`}>
          <ThinkingRenderer
            indicator={streamingIndicator}
            thoughtText={currentThought}
          />
        </RendererWrapper>
      );
    }
    return null;
  };


  return (
    <div
      className={`flex flex-col h-full ${getThemeClasses()} relative`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Global drag overlay */}
      {isDragOver && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-primary/10 border-2 border-primary border-dashed">
          <div className="text-primary font-medium text-lg">Drop images anywhere to upload</div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto bg-background text-foreground">
        {/* Center container with max width and padding like ChatGPT - smaller default font */}
        <div className="max-w-4xl mx-auto px-4 py-8 text-sm space-y-4">
          {error && (
            <div className="p-4 bg-destructive/10 border-l-4 border-destructive">
              <div className="text-destructive text-xs">
                <strong>Error:</strong> {error.message}
              </div>
            </div>
          )}
          {/* Render all messages and state */}
          {renderMessages()}
          {/* Render thinking indicator at the end */}
          {renderThinkingIndicator()}

          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="border-t border-border bg-background">
        <div className="max-w-4xl mx-auto px-4 py-4">
          {/* Model selector dropdown */}
          {models && models.length > 0 && (
            <div className="mb-4 flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Model:</span>
              <Select value={selectedModelId} onValueChange={onModelChange}>
                <SelectTrigger className="w-64">
                  <SelectValue placeholder="Select a model" />
                </SelectTrigger>
                <SelectContent>
                  {models.map((model) => (
                    <SelectItem key={model.id} value={model.id}>
                      {model.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <ChatInput
            value={input}
            onChange={setInput}
            onSend={handleSendMessage}
            onStop={handleStopStreaming}
            placeholder="Type your message..."
            disabled={isLoading || hasPendingToolCalls()}
            isStreaming={isStreaming}
            attachedImages={attachedImages}
            onRemoveImage={removeImage}
            onAddImages={addImages}
          />
        </div>
      </div>


    </div>
  );
}