import React, { useState, useCallback, useRef, useEffect, useImperativeHandle, forwardRef, useMemo } from 'react';
import { Agent, DistriChatMessage, DistriMessage, DistriPart, ToolCall, ToolExecutionOptions } from '@distri/core';
import { ChatInput, AttachedImage } from './ChatInput';
import { useChat } from '../useChat';
import { MessageRenderer } from './renderers/MessageRenderer';
import { ThinkingRenderer } from './renderers/ThinkingRenderer';
import { TypingIndicator } from './renderers/TypingIndicator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { ChatState, useChatStateStore } from '../stores/chatStateStore';
import { useSpeechToText } from '../hooks/useSpeechToText';
import { useTts } from '../hooks/useTts';
import { DistriAnyTool } from '@/types';
import { DefaultChatEmptyState, type ChatEmptyStateOptions } from './ChatEmptyState';
import { BrowserPreviewPanel } from './BrowserPreviewPanel';
export type { ChatEmptyStateOptions, ChatEmptyStateCategory, ChatEmptyStateStarter } from './ChatEmptyState';

export interface ModelOption {
  id: string;
  name: string;
}

export interface ChatInstance {
  sendMessage: (content: string | DistriPart[]) => Promise<void>;
  stopStreaming: () => void;
  triggerTool: (toolName: string, input: any) => Promise<void>;
  isStreaming: boolean;
  isLoading: boolean;
  // Streaming voice capabilities
  startStreamingVoice?: () => void;
  stopStreamingVoice?: () => void;
  isStreamingVoice?: boolean;
  streamingTranscript?: string;
}

export interface ChatEmptyStateController {
  input: string;
  setInput: (value: string) => void;
  submit: (content?: string | DistriPart[]) => Promise<void>;
  isLoading: boolean;
  isStreaming: boolean;
  composer?: React.ReactNode;
}

export interface ChatProps {
  threadId: string;
  agent?: Agent;
  onMessage?: (message: DistriChatMessage) => void;
  beforeSendMessage?: (content: DistriMessage) => Promise<DistriMessage>;
  onError?: (error: Error) => void;
  getMetadata?: () => Promise<any>;
  externalTools?: DistriAnyTool[];
  // Tool wrapping options
  executionOptions?: ToolExecutionOptions;
  // Initial messages to use instead of fetching
  initialMessages?: (DistriChatMessage)[];
  // Theme
  theme?: 'light' | 'dark' | 'auto';
  // Model dropdown options
  models?: ModelOption[];
  selectedModelId?: string;
  onModelChange?: (modelId: string) => void;
  // Callback to get ChatInstance API
  onChatInstanceReady?: (instance: ChatInstance) => void;

  onChatStateChange?: (state: ChatState) => void;
  renderEmptyState?: (controller: ChatEmptyStateController) => React.ReactNode;
  emptyState?: ChatEmptyStateOptions;
  // Voice support
  voiceEnabled?: boolean;
  useSpeechRecognition?: boolean;
  ttsConfig?: {
    model: 'openai' | 'gemini';
    voice?: string;
    speed?: number;
  };
  initialInput?: string;
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

export const Chat = forwardRef<ChatInstance, ChatProps>(function Chat({
  threadId,
  agent,
  onMessage,
  onError,
  getMetadata: getMetadataProp,
  externalTools,
  executionOptions,
  initialMessages,
  theme = 'auto',
  models,
  selectedModelId,
  beforeSendMessage,
  onModelChange,
  onChatInstanceReady,
  onChatStateChange,
  renderEmptyState,
  emptyState,
  voiceEnabled = false,
  useSpeechRecognition = false,
  ttsConfig,
  initialInput = '',
}, ref) {
  const [input, setInput] = useState(initialInput ?? '');
  const initialInputRef = useRef(initialInput ?? '');
  const [expandedTools, setExpandedTools] = useState<Set<string>>(new Set());
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Pending message state single message with accumulated parts
  const [pendingMessage, setPendingMessage] = useState<DistriPart[] | null>(null);

  // Image upload state moved from ChatInput
  const [attachedImages, setAttachedImages] = useState<AttachedImage[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);


  // Voice functionality hooks - need DistriClient for API calls
  const speechToText = useSpeechToText();
  const tts = useTts();

  // Streaming voice state
  const [isStreamingVoice, setIsStreamingVoice] = useState(false);
  const [streamingTranscript, setStreamingTranscript] = useState('');
  const [audioChunks, setAudioChunks] = useState<Uint8Array[]>([]);
  const [browserEnabled, setBrowserEnabled] = useState(false);
  const browserFrame = useChatStateStore(state => state.browserFrame);
  const browserFrameUpdatedAt = useChatStateStore(state => state.browserFrameUpdatedAt);
  const clearBrowserFrame = useChatStateStore(state => state.clearBrowserFrame);
  const agentDefinition = useMemo(() => agent?.getDefinition(), [agent]);
  const supportsBrowserStreaming = Boolean(agentDefinition?.browser_config);
  const browserAgentIdRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    const agentId = agentDefinition?.id;

    if (!agentDefinition || !supportsBrowserStreaming) {
      setBrowserEnabled(false);
      browserAgentIdRef.current = agentId;
      clearBrowserFrame();
      return;
    }

    if (browserAgentIdRef.current !== agentId) {
      browserAgentIdRef.current = agentId;
      const defaultEnabled = agentDefinition.browser_config?.enabled ?? false;
      setBrowserEnabled(defaultEnabled);
      if (!defaultEnabled) {
        clearBrowserFrame();
      }
    }
  }, [agentDefinition, supportsBrowserStreaming, clearBrowserFrame]);

  useEffect(() => {
    if (typeof initialInput === 'string' && initialInput !== initialInputRef.current) {
      setInput(initialInput);
      initialInputRef.current = initialInput;
    }
  }, [initialInput]);


  const mergedMetadataProvider = useCallback(async () => {
    const baseMetadata = (await getMetadataProp?.()) ?? {};
    const existingOverrides = (baseMetadata.definition_overrides as Record<string, unknown> | undefined) ?? {};

    const overrides = supportsBrowserStreaming
      ? { ...existingOverrides, use_browser: browserEnabled }
      : existingOverrides;

    return {
      ...baseMetadata,
      definition_overrides: overrides,
    };
  }, [browserEnabled, getMetadataProp, supportsBrowserStreaming]);

  const {
    sendMessage,
    stopStreaming,
    isStreaming,
    isLoading,
    error,
    messages
  } = useChat({
    threadId,
    agent,
    onMessage,
    onError,
    getMetadata: mergedMetadataProvider,
    externalTools,
    executionOptions,
    initialMessages,
    beforeSendMessage,
  });

  const browserTimestampLabel = useMemo(() => {
    if (!browserFrameUpdatedAt) return null;
    try {
      const date = new Date(browserFrameUpdatedAt);
      return date.toLocaleTimeString();
    } catch {
      return null;
    }
  }, [browserFrameUpdatedAt]);

  // Get reactive state from store
  const toolCalls = useChatStateStore(state => state.toolCalls);
  const hasPendingToolCalls = useChatStateStore(state => state.hasPendingToolCalls);
  const streamingIndicator = useChatStateStore(state => state.streamingIndicator);
  const currentThought = useChatStateStore(state => state.currentThought);

  const currentState = useChatStateStore(state => state);
  useEffect(() => {
    if (onChatStateChange) {
      onChatStateChange(currentState);
    }
  }, [currentState, onChatStateChange]);

  const handleToggleBrowser = useCallback((enabled: boolean) => {
    if (!supportsBrowserStreaming) return;
    setBrowserEnabled(enabled);
    if (!enabled) {
      clearBrowserFrame();
    }
  }, [supportsBrowserStreaming, clearBrowserFrame]);


  // Image upload functions moved from ChatInput
  const addImages = useCallback(async (files: FileList | File[]) => {
    const imageFiles = Array.from(files).filter(file => file.type.startsWith('image/'));

    for (const file of imageFiles) {
      const id = Date.now().toString() + Math.random().toString(36).substring(2, 11);
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


  // Helper to convert content to parts
  const contentToParts = useCallback((content: string | DistriPart[]): DistriPart[] => {
    if (typeof content === 'string') {
      return [{ part_type: 'text', data: content }];
    }
    return content;
  }, []);

  const handleSendMessage = useCallback(async (content: string | DistriPart[]) => {
    if (typeof content === 'string' && !content.trim()) return;
    if (Array.isArray(content) && content.length === 0) return;

    setInput('');
    // Clear attached images when sending/queuing
    setAttachedImages(prev => {
      prev.forEach(img => URL.revokeObjectURL(img.preview));
      return [];
    });

    // If streaming, add to pending message parts instead of sending immediately
    if (isStreaming) {
      const newParts = contentToParts(content);
      setPendingMessage(prev => prev ? [...prev, ...newParts] : newParts);
    } else {
      await sendMessage(content);
    }
  }, [sendMessage, isStreaming, contentToParts]);

  const handleStopStreaming = useCallback(() => {
    console.log('handleStopStreaming called, about to call stopStreaming()');
    stopStreaming();

    // Reset all streaming states in the store
    useChatStateStore.getState().resetStreamingStates();
  }, [stopStreaming]);

  const handleTriggerTool = useCallback(async (toolName: string, input: any) => {
    // Create a tool call with a unique ID
    const toolCallId = `manual_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;

    const toolCall: ToolCall = {
      tool_call_id: toolCallId,
      tool_name: toolName,
      input: input
    };

    // Get the chat state to initialize the tool call
    const chatState = useChatStateStore.getState();
    const tool = chatState.getToolByName(toolName);
    if (tool) {
      // Initialize the tool call in the state store
      chatState.executeTool(toolCall, tool);
    } else {
      console.error('Tool not found:', toolName);
    }
  }, []);

  // Enhanced voice recording with streaming support
  const handleVoiceRecord = useCallback(async (audioBlob: Blob) => {
    try {
      if (!voiceEnabled || !speechToText) {
        console.error('Voice recording not properly configured - missing speechToText');
        return;
      }

      // Transcribe the audio to text via backend
      const transcription = await speechToText.transcribe(audioBlob, { model: 'whisper-1' });

      if (transcription.trim()) {
        // Set the transcribed text as input
        setInput(transcription);

        // Optionally auto-send the message
        await handleSendMessage(transcription);
      }
    } catch (error) {
      console.error('Voice transcription failed:', error);
      if (onError) {
        onError(error as Error);
      }
    }
  }, [voiceEnabled, speechToText, handleSendMessage, onError]);

  // Start streaming voice conversation
  const startStreamingVoice = useCallback(async () => {
    if (!voiceEnabled || isStreamingVoice || !speechToText) {
      console.error('Cannot start streaming voice - missing requirements');
      return;
    }

    setIsStreamingVoice(true);
    setStreamingTranscript('');
    setAudioChunks([]);

    try {
      // Start streaming transcription
      await speechToText.startStreamingTranscription({
        onTranscript: (text: string, isFinal: boolean) => {
          setStreamingTranscript(text);
          if (isFinal && text.trim()) {
            // Send the final transcription and get AI response
            handleSendMessage(text);
            setStreamingTranscript('');
          }
        },
        onError: (error: Error) => {
          console.error('Streaming transcription error:', error);
          if (onError) onError(error);
          setIsStreamingVoice(false);
        },
        onEnd: () => {
          setIsStreamingVoice(false);
        }
      });

      // Start streaming TTS for AI responses
      tts.startStreamingTts({
        voice: ttsConfig?.voice || 'alloy',
        speed: ttsConfig?.speed || 1.0,
        onAudioChunk: (audioData: Uint8Array) => {
          setAudioChunks(prev => [...prev, audioData]);
        },
        onTextChunk: (text: string, _isFinal: boolean) => {
          // Show the AI's text response as it's being generated
          console.log('AI speaking:', text);
        },
        onError: (error: Error) => {
          console.error('Streaming TTS error:', error);
          if (onError) onError(error);
        },
        onEnd: () => {
          // Play accumulated audio chunks
          if (audioChunks.length > 0) {
            tts.streamingPlayAudio(audioChunks).catch(console.error);
          }
          setAudioChunks([]);
        }
      });

    } catch (error) {
      console.error('Failed to start streaming voice:', error);
      if (onError) onError(error as Error);
      setIsStreamingVoice(false);
    }
  }, [voiceEnabled, isStreamingVoice, speechToText, tts, ttsConfig, handleSendMessage, onError, audioChunks]);

  // Stop streaming voice conversation
  const stopStreamingVoice = useCallback(() => {
    if (!isStreamingVoice) return;

    if (speechToText) {
      speechToText.stopStreamingTranscription();
    }
    tts.stopStreamingTts();
    setIsStreamingVoice(false);
    setStreamingTranscript('');
    setAudioChunks([]);
  }, [isStreamingVoice, speechToText, tts]);

  // Handle speech transcript from VoiceInput component
  const handleSpeechTranscript = useCallback(async (transcript: string) => {
    if (transcript.trim()) {
      // Send the transcribed text as a message
      await handleSendMessage(transcript);
    }
  }, [handleSendMessage]);

  // Auto-send pending message when streaming ends
  useEffect(() => {
    const sendPendingMessage = async () => {
      if (!isStreaming && pendingMessage && pendingMessage.length > 0) {
        console.log('Streaming ended, sending pending message parts:', pendingMessage);
        const messageToSend = [...pendingMessage];
        setPendingMessage(null);

        // Send the accumulated message parts
        try {
          await sendMessage(messageToSend);
        } catch (error) {
          console.error('Failed to send pending message:', error);
        }
      }
    };

    sendPendingMessage();
  }, [isStreaming, pendingMessage, sendMessage]);

  // Auto-play TTS for AI messages when voiceEnabled and ttsConfig are provided
  useEffect(() => {
    if (!voiceEnabled || !ttsConfig || isStreamingVoice) return;

    const lastMessage = messages[messages.length - 1];
    if (lastMessage && 'role' in lastMessage && lastMessage.role === 'assistant' && 'content' in lastMessage && typeof lastMessage.content === 'string') {
      // Synthesize and play the AI's response
      tts.synthesize({
        text: lastMessage.content,
        model: ttsConfig.model || 'openai',
        voice: ttsConfig.voice,
        speed: ttsConfig.speed,
      })
        .then(audioBlob => tts.playAudio(audioBlob))
        .catch(error => console.error('TTS playback failed:', error));
    }
  }, [messages, voiceEnabled, ttsConfig, tts, isStreamingVoice]);

  // Create ChatInstance API with useMemo to prevent recreation
  const chatInstance = useMemo<ChatInstance>(() => ({
    sendMessage: handleSendMessage,
    stopStreaming: handleStopStreaming,
    triggerTool: handleTriggerTool,
    isStreaming,
    isLoading,
    // Streaming voice capabilities - only available with speechToText
    startStreamingVoice: voiceEnabled && speechToText ? startStreamingVoice : undefined,
    stopStreamingVoice: voiceEnabled && speechToText ? stopStreamingVoice : undefined,
    isStreamingVoice: voiceEnabled && speechToText ? isStreamingVoice : undefined,
    streamingTranscript: voiceEnabled && speechToText ? streamingTranscript : undefined,
  }), [handleSendMessage, handleStopStreaming, handleTriggerTool, isStreaming, isLoading, voiceEnabled, speechToText, startStreamingVoice, stopStreamingVoice, isStreamingVoice, streamingTranscript]);

  // Expose ChatInstance via ref
  useImperativeHandle(ref, () => chatInstance, [chatInstance]);

  // Expose ChatInstance via callback
  useEffect(() => {
    if (onChatInstanceReady) {
      onChatInstanceReady(chatInstance);
    }
  }, [onChatInstanceReady, chatInstance]);

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
  }, [toolCalls, expandedTools]);

  // Determine theme classes
  const getThemeClasses = () => {
    if (theme === 'dark') return 'dark';
    if (theme === 'light') return 'light';
    // For 'auto', we'll let the system handle it
    return '';
  };

  // Render messages using the new MessageRenderer
  const renderMessages = (): React.ReactNode[] => {
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

    return elements;
  };

  const renderExternalToolCalls = () => {
    const elements: React.ReactNode[] = [];
    // Render standalone tool calls that aren't part of any message
    const externalToolCalls = Array.from(toolCalls.values()).filter(toolCall =>
      (toolCall.status === 'pending' || toolCall.status === 'running') && toolCall.isExternal && toolCall.component
    );

    externalToolCalls.forEach((toolCall) => {
      // Render the tool call component directly
      elements.push(
        <RendererWrapper key={`external-tool-${toolCall.tool_call_id}`}>
          {toolCall.component}
        </RendererWrapper>
      );
    });
    return elements;
  };

  const showEmptyState = messages.length === 0 && !isLoading && !error;

  const submitFromEmptyState = useCallback(async (value?: string | DistriPart[]) => {
    if (typeof value === 'string' || Array.isArray(value)) {
      await handleSendMessage(value);
      return;
    }
    await handleSendMessage(input);
  }, [handleSendMessage, input]);

  const setComposerInput = useCallback((value: string) => {
    setInput(value);
  }, [setInput]);

  const emptyStateController = useMemo<ChatEmptyStateController>(() => ({
    input,
    setInput: setComposerInput,
    submit: submitFromEmptyState,
    isLoading,
    isStreaming,
  }), [input, setComposerInput, submitFromEmptyState, isLoading, isStreaming]);

  const renderComposer = useCallback((variant: 'default' | 'hero', className?: string) => {
    const basePlaceholder = showEmptyState && emptyState?.promptPlaceholder
      ? emptyState.promptPlaceholder
      : 'Type your message…';

    return (
      <ChatInput
        value={input}
        onChange={setInput}
        onSend={handleSendMessage}
        onStop={handleStopStreaming}
        browserEnabled={supportsBrowserStreaming && browserEnabled}
        onToggleBrowser={supportsBrowserStreaming ? handleToggleBrowser : undefined}
        placeholder={
          isStreamingVoice
            ? 'Voice mode active…'
            : isStreaming
              ? 'Message will be queued…'
              : basePlaceholder
        }
        disabled={isLoading || hasPendingToolCalls() || isStreamingVoice}
        isStreaming={isStreaming}
        attachedImages={attachedImages}
        onRemoveImage={removeImage}
        onAddImages={addImages}
        voiceEnabled={voiceEnabled && !!speechToText}
        onVoiceRecord={handleVoiceRecord}
        onStartStreamingVoice={voiceEnabled && speechToText ? startStreamingVoice : undefined}
        isStreamingVoice={isStreamingVoice}
        useSpeechRecognition={useSpeechRecognition}
        onSpeechTranscript={handleSpeechTranscript}
        className={className}
        variant={variant}
      />
    );
  }, [
    input,
    setInput,
    handleSendMessage,
    handleStopStreaming,
    browserEnabled,
    supportsBrowserStreaming,
    handleToggleBrowser,
    isStreamingVoice,
    isStreaming,
    isLoading,
    hasPendingToolCalls,
    attachedImages,
    removeImage,
    addImages,
    voiceEnabled,
    speechToText,
    handleVoiceRecord,
    startStreamingVoice,
    useSpeechRecognition,
    handleSpeechTranscript,
    showEmptyState,
    emptyState,
  ]);

  const emptyStateComposer = useMemo(() => renderComposer('hero', 'w-full max-w-2xl mx-auto empty-state-composer'), [renderComposer]);
  const footerComposer = useMemo(() => renderComposer('default', 'w-full'), [renderComposer]);

  const controllerWithComposer = useMemo<ChatEmptyStateController>(() => ({
    ...emptyStateController,
    composer: emptyStateComposer,
  }), [emptyStateController, emptyStateComposer]);

  const emptyStateContent = useMemo(() => {
    if (!showEmptyState) {
      return null;
    }
    if (renderEmptyState) {
      return renderEmptyState(controllerWithComposer);
    }
    return (
      <DefaultChatEmptyState controller={controllerWithComposer} options={emptyState} />
    );
  }, [showEmptyState, renderEmptyState, controllerWithComposer, emptyState]);

  const shouldRenderFooterComposer = !showEmptyState || Boolean(renderEmptyState);
  const footerHasContent = shouldRenderFooterComposer
    || (models && models.length > 0)
    || (voiceEnabled && speechToText && (isStreamingVoice || streamingTranscript));
  const showBrowserPreview = supportsBrowserStreaming && browserEnabled && Boolean(browserFrame);


  // Render thinking indicator separately at the end
  const renderThinkingIndicator = () => {
    if (streamingIndicator === 'typing') {
      return (
        <RendererWrapper key={`typing-indicator`} className="distri-typing-indicator">
          <TypingIndicator />
        </RendererWrapper>
      );
    } else if (streamingIndicator) {
      return (
        <RendererWrapper key={`thinking-${streamingIndicator}`} className="distri-thinking-indicator">
          <ThinkingRenderer
            indicator={streamingIndicator}
            thoughtText={currentThought}
          />
        </RendererWrapper>
      );
    }
    return null;
  };

  // Render pending message
  const renderPendingMessage = () => {
    if (!pendingMessage || pendingMessage.length === 0) return null;

    const partCount = pendingMessage.length;

    return (
      <RendererWrapper key="pending-message">
        <div className="border-l-4 border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-r-lg">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse mt-2"></div>
            </div>
            <div className="ml-3 flex-1">
              <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                Message queued ({partCount} part{partCount > 1 ? 's' : ''})
              </h3>
              <div className="mt-2">
                <div className="text-sm text-yellow-700 dark:text-yellow-300 bg-white dark:bg-gray-800 p-2 rounded border">
                  {pendingMessage.map((part, partIndex) => {
                    if (part.part_type === 'text') {
                      return (
                        <span key={partIndex} className="block mb-1">
                          {part.data}
                        </span>
                      );
                    } else if (part.part_type === 'image' && typeof part.data === 'object' && part.data !== null && 'name' in part.data) {
                      return (
                        <span key={partIndex} className="inline-block text-xs text-muted-foreground bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded mr-2 mb-1">
                          📷 {part.data.name}
                        </span>
                      );
                    }
                    return (
                      <span key={partIndex} className="inline-block text-xs text-muted-foreground bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded mr-2 mb-1">
                        [{part.part_type}]
                      </span>
                    );
                  })}
                </div>
              </div>
              <p className="mt-2 text-xs text-yellow-600 dark:text-yellow-400">
                Will be sent automatically when AI response is complete
              </p>
            </div>
          </div>
        </div>
      </RendererWrapper>
    );
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

      <div className="flex-1 overflow-y-auto bg-background text-foreground selection:bg-primary/20 selection:text-primary-foreground dark:selection:bg-primary/40">
        <div className="mx-auto w-full max-w-6xl px-2 sm:px-4 py-4 text-sm space-y-4">
          {error && (
            <div className="p-4 bg-destructive/10 border-l-4 border-destructive">
              <div className="text-destructive text-xs">
                <strong>Error:</strong> {error.message}
              </div>
            </div>
          )}

          <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
            <div className="flex-1 min-w-0 space-y-4">
              {emptyStateContent}
              {/* Render all messages and state */}
              {renderMessages()}

              {renderExternalToolCalls()}
              {/* Render thinking indicator at the end */}
              {renderThinkingIndicator()}
              {/* Render pending message after thinking indicator */}
              {renderPendingMessage()}

              <div ref={messagesEndRef} />
            </div>

            {showBrowserPreview && browserFrame && (
              <div className="w-full lg:w-[320px] xl:w-[360px] shrink-0">
                <div className="lg:sticky lg:top-4 space-y-3">
                  <BrowserPreviewPanel
                    frameSrc={browserFrame}
                    timestampLabel={browserTimestampLabel}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {footerHasContent ? (
        <footer className="
  sticky bottom-0 inset-x-0 z-30
  border-t border-border
  bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60
  pb-[env(safe-area-inset-bottom)]
">
          <div className="max-w-4xl mx-auto w-full px-4 py-3 sm:py-4 space-y-3">

            {models && models.length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm text-muted-foreground shrink-0">Model:</span>
                <Select value={selectedModelId} onValueChange={onModelChange}>
                  <SelectTrigger className="w-64 max-w-full">
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

            {voiceEnabled && speechToText && (isStreamingVoice || streamingTranscript) && (
              <div className="p-3 bg-muted/50 border border-muted rounded-lg">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-sm font-medium text-muted-foreground">
                    {isStreamingVoice ? 'Listening…' : 'Processing…'}
                  </span>
                  {isStreamingVoice && (
                    <button
                      onClick={stopStreamingVoice}
                      className="ml-auto text-xs px-2 py-1 bg-destructive text-destructive-foreground rounded"
                    >
                      Stop
                    </button>
                  )}
                </div>
                {streamingTranscript && (
                  <p className="mt-2 text-sm text-foreground font-mono break-words">
                    “{streamingTranscript}”
                  </p>
                )}
              </div>
            )}

            {shouldRenderFooterComposer ? footerComposer : null}
          </div>
        </footer>
      ) : null}


    </div >
  );
});
