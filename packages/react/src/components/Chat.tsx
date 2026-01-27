import React, { useState, useCallback, useRef, useEffect, useImperativeHandle, forwardRef, useMemo } from 'react';
import { Agent, DistriChatMessage, DistriMessage, DistriPart, ToolCall, ToolExecutionOptions } from '@distri/core';
import { ChatInput, AttachedImage } from './ChatInput';
import { useChat } from '../useChat';
import { MessageRenderer } from './renderers/MessageRenderer';
import { MessageReadProvider } from './renderers/MessageReadContext';
import { ThinkingRenderer } from './renderers/ThinkingRenderer';
import { TypingIndicator } from './renderers/TypingIndicator';
import { LoadingAnimation, type LoadingAnimationConfig } from './renderers/LoadingAnimation';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { ChatState, TaskState, useChatStateStore } from '../stores/chatStateStore';
import { useSpeechToText } from '../hooks/useSpeechToText';
import { useTts } from '../hooks/useTts';
import { DistriAnyTool, ToolRendererMap } from '@/types';
import { DefaultChatEmptyState, type ChatEmptyStateOptions, type ChatEmptyStateStarter } from './ChatEmptyState';
import { useAgent } from '../useAgent';
import { useChatMessages } from '../hooks/useChatMessages';
import { AuthLoading } from './AuthLoading';
import { useDistri } from '../DistriProvider';
export type { ChatEmptyStateOptions, ChatEmptyStateCategory, ChatEmptyStateStarter } from './ChatEmptyState';
export type { LoadingAnimationConfig, LoadingAnimationPreset } from './renderers/LoadingAnimation';

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
  agent?: Agent | null;
  onMessage?: (message: DistriChatMessage) => void;
  beforeSendMessage?: (content: DistriMessage) => Promise<DistriMessage>;
  onError?: (error: Error) => void;
  getMetadata?: () => Promise<any>;
  externalTools?: DistriAnyTool[];
  toolRenderers?: ToolRendererMap;
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
  onTaskFinish?: (task: TaskState) => void;
  renderEmptyState?: (controller: ChatEmptyStateController) => React.ReactNode;
  emptyState?: ChatEmptyStateOptions;
  /**
   * Starter commands shown in empty state. These are quick-action buttons
   * that users can click to send predefined prompts.
   * Alternative to emptyState.categories - if provided, these will be merged.
   */
  starterCommands?: ChatEmptyStateStarter[];
  /**
   * Configuration for the loading/typing animation shown while waiting for responses.
   * Supports presets like 'typing-dots', 'teacher-typing', 'pulse-ring', 'spinner', 'wave'.
   */
  loadingAnimation?: LoadingAnimationConfig;
  /**
   * Custom render function for the loading animation.
   * If provided, overrides loadingAnimation config.
   */
  renderLoadingAnimation?: () => React.ReactNode;
  // Voice support
  voiceEnabled?: boolean;
  useSpeechRecognition?: boolean;
  ttsConfig?: {
    model: 'openai' | 'gemini';
    voice?: string;
    speed?: number;
  };
  initialInput?: string;
  allowBrowserPreview?: boolean;
  // Optional max width for chat content (defaults to flexible, respects container width)
  maxWidth?: string;
  // Optional class name for the container
  className?: string;
  // Agent loading
  agentId?: string;
  // History loading
  enableHistory?: boolean;
  /**
   * Enable debug mode to show developer messages in the chat.
   * Developer messages are hidden by default.
   */
  debug?: boolean;
  /**
   * Enable message feedback (voting) UI on assistant messages.
   * Shows thumbs up/down buttons for rating responses.
   */
  enableFeedback?: boolean;
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

// Helper to determine theme classes
const getThemeClasses = (theme: 'light' | 'dark' | 'auto') => {
  if (theme === 'dark') return 'dark';
  if (theme === 'light') return 'light';
  return '';
};

export const ChatInner = forwardRef<ChatInstance, ChatProps>(function ChatInner({
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
  onTaskFinish,
  renderEmptyState,
  emptyState: emptyStateProp,
  starterCommands,
  loadingAnimation,
  renderLoadingAnimation,
  voiceEnabled = false,
  useSpeechRecognition = false,
  ttsConfig,
  initialInput = '',
  allowBrowserPreview = true,
  maxWidth,
  className = '',
  toolRenderers,
  debug = false,
  enableFeedback = false,
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
  const browserViewerUrl = useChatStateStore(state => state.browserViewerUrl);
  const agentDefinition = useMemo(() => agent?.getDefinition(), [agent]);
  const supportsBrowserStreaming = allowBrowserPreview && Boolean(agentDefinition?.browser_config);
  const browserAgentIdRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    const agentId = agentDefinition?.id;

    if (!agentDefinition || !supportsBrowserStreaming) {
      setBrowserEnabled(false);
      browserAgentIdRef.current = agentId;
      return;
    }

    if (browserAgentIdRef.current !== agentId) {
      browserAgentIdRef.current = agentId;
      const defaultEnabled = agentDefinition.browser_config?.enabled ?? false;
      setBrowserEnabled(defaultEnabled);

    }
  }, [agentDefinition, supportsBrowserStreaming]);

  useEffect(() => {
    if (typeof initialInput === 'string' && initialInput !== initialInputRef.current) {
      setInput(initialInput);
      initialInputRef.current = initialInput;
    }
  }, [initialInput]);


  const browserSessionId = useChatStateStore(state => state.browserSessionId);

  const mergedMetadataProvider = useCallback(async () => {
    const baseMetadata = (await getMetadataProp?.()) ?? {};
    const existingOverrides = (baseMetadata.definition_overrides as Record<string, unknown> | undefined) ?? {};

    const overrides = supportsBrowserStreaming
      ? { ...existingOverrides, use_browser: browserEnabled }
      : existingOverrides;

    return {
      ...baseMetadata,
      definition_overrides: overrides,
      // Include browser_session_id if we have one so browsr reuses the same session
      ...(browserSessionId ? { browser_session_id: browserSessionId } : {}),
    };
  }, [browserEnabled, browserSessionId, getMetadataProp, supportsBrowserStreaming]);

  const {
    sendMessage,
    stopStreaming,
    isStreaming,
    isLoading,
    error,
    messages
  } = useChat({
    threadId,
    agent: agent as any,
    onMessage,
    onError,
    getMetadata: mergedMetadataProvider,
    externalTools: externalTools as any,
    executionOptions,
    initialMessages,
    beforeSendMessage,
  });

  // Merge starterCommands with emptyState categories
  const emptyState = useMemo<ChatEmptyStateOptions | undefined>(() => {
    if (!emptyStateProp && !starterCommands) return undefined;

    // If starterCommands provided, create a default category for them
    const starterCategory = starterCommands && starterCommands.length > 0
      ? { id: '_starter_commands', starters: starterCommands }
      : null;

    if (!emptyStateProp) {
      return starterCategory ? { categories: [starterCategory] } : undefined;
    }

    // Merge starterCommands into existing categories
    if (starterCategory) {
      const existingCategories = emptyStateProp.categories ?? [];
      return {
        ...emptyStateProp,
        categories: [...existingCategories, starterCategory],
      };
    }

    return emptyStateProp;
  }, [emptyStateProp, starterCommands]);

  // Get reactive state from store
  const toolCalls = useChatStateStore(state => state.toolCalls);
  const hasPendingToolCalls = useChatStateStore(state => state.hasPendingToolCalls());
  const streamingIndicator = useChatStateStore(state => state.streamingIndicator);
  const currentThought = useChatStateStore(state => state.currentThought);
  const currentState = useChatStateStore(state => state);
  useEffect(() => {
    if (onChatStateChange) {
      onChatStateChange(currentState);
    }
  }, [currentState, onChatStateChange]);

  // Get distri client for browser session creation
  const { client: distriClient } = useDistri();

  const handleToggleBrowser = useCallback(async (enabled: boolean) => {
    if (!supportsBrowserStreaming) return;
    setBrowserEnabled(enabled);

    // When enabling browser, create a session immediately
    if (enabled && !browserSessionId && distriClient) {
      try {
        const session = await distriClient.createBrowserSession();
        useChatStateStore.getState().setBrowserSession(session.session_id, session.viewer_url);
      } catch (err) {
        console.error('Failed to create browser session:', err);
      }
    }
  }, [supportsBrowserStreaming, browserSessionId, distriClient]);


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
    const toolCallId = `manual_${Date.now()}_${Math.random().toString(36).substring(2, 11)} `;

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

  const completedTaskIdsRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    if (!onTaskFinish) return;
    const unsub = useChatStateStore.subscribe((state) => state.tasks);
    const tasks = useChatStateStore.getState().tasks;
    tasks.forEach((task) => {
      if (task.status === 'completed' && !completedTaskIdsRef.current.has(task.id)) {
        completedTaskIdsRef.current.add(task.id);
        onTaskFinish(task);
      }
    });
    return () => unsub();
  }, [onTaskFinish]);

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
          toolRenderers={toolRenderers}
          isExpanded={expandedTools.has(message.id || `message-${index}`)}
          onToggle={() => {
            const messageId = message.id || `message-${index}`;
            toggleToolExpansion(messageId);
          }}
          debug={debug}
          threadId={threadId}
          enableFeedback={enableFeedback}
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
    console.log('[Chat] submitFromEmptyState called with:', value);
    if (typeof value === 'string' || Array.isArray(value)) {
      console.log('[Chat] Sending message:', value);
      await handleSendMessage(value);
      return;
    }
    console.log('[Chat] Sending input:', input);
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
        browserHasSession={Boolean(browserSessionId)}
        onToggleBrowser={supportsBrowserStreaming ? handleToggleBrowser : undefined}
        placeholder={
          isStreamingVoice
            ? 'Voice mode active…'
            : isStreaming
              ? 'Message will be queued…'
              : basePlaceholder
        }
        disabled={isLoading || hasPendingToolCalls || isStreamingVoice}
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
        theme={theme}
      />
    );
  }, [
    input,
    setInput,
    handleSendMessage,
    handleStopStreaming,
    browserEnabled,
    browserSessionId,
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
    theme,
  ]);

  const emptyStateComposer = useMemo(() => {
    const baseClass = 'w-full mx-auto empty-state-composer';
    const className = maxWidth ? baseClass : `${baseClass} max-w-2xl`;
    const composer = renderComposer('hero', className);
    if (maxWidth) {
      return (
        <div style={{ maxWidth }}>
          {composer}
        </div>
      );
    }
    return composer;
  }, [renderComposer, maxWidth]);
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
      <DefaultChatEmptyState controller={controllerWithComposer} options={emptyState} maxWidth={maxWidth} />
    );
  }, [showEmptyState, renderEmptyState, controllerWithComposer, emptyState, maxWidth]);

  const shouldRenderFooterComposer = !showEmptyState || Boolean(renderEmptyState);
  const footerHasContent = shouldRenderFooterComposer
    || (models && models.length > 0)
    || (voiceEnabled && speechToText && (isStreamingVoice || streamingTranscript));
  const showBrowserPreview = supportsBrowserStreaming && browserEnabled && Boolean(browserViewerUrl);


  // Render thinking indicator separately at the end
  const renderThinkingIndicator = () => {
    if (streamingIndicator === 'typing') {
      // Use custom render function if provided
      if (renderLoadingAnimation) {
        return (
          <RendererWrapper key={`typing-indicator`} className="distri-typing-indicator">
            {renderLoadingAnimation()}
          </RendererWrapper>
        );
      }
      // Use LoadingAnimation with custom config if provided
      if (loadingAnimation) {
        return (
          <RendererWrapper key={`typing-indicator`} className="distri-typing-indicator">
            <LoadingAnimation config={loadingAnimation} />
          </RendererWrapper>
        );
      }
      // Default typing indicator
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

  if (!agent)
    return <div> Agent not available</div>

  return (
    <div
      className={`flex flex-col h-full bg-background font-sans overflow-hidden relative ${getThemeClasses(theme)} ${className}`}
      style={{ maxWidth }}
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
        <div
          className="mx-auto w-full px-2 py-4 text-sm space-y-4"
          style={{ maxWidth: maxWidth || '768px', width: '100%', boxSizing: 'border-box' }}
        >
          {error && (
            <div className="p-4 bg-destructive/10 border-l-4 border-destructive">
              <div className="text-destructive text-xs">
                <strong>Error:</strong> {error.message}
              </div>
            </div>
          )}

          <div
            className="flex flex-col gap-4 lg:flex-row lg:items-start"
            style={maxWidth ? { maxWidth: '100%' } : undefined}
          >
            <MessageReadProvider threadId={threadId} enabled={enableFeedback}>
              <div className="flex-1 min-w-0 space-y-4 w-full">
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
            </MessageReadProvider>

            {showBrowserPreview && browserViewerUrl && (
              <div className="w-full lg:w-[320px] xl:w-[360px] shrink-0">
                <div className="lg:sticky lg:top-4 space-y-3">
                  <div className="overflow-hidden rounded-xl border border-border/40 bg-background">
                    <iframe
                      src={browserViewerUrl}
                      className="h-[400px] w-full border-0"
                      title="Browser Viewer"
                      sandbox="allow-scripts allow-same-origin allow-forms"
                    />
                  </div>
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
          <div
            className="mx-auto w-full px-4 py-3 sm:py-4 space-y-3"
            style={{ maxWidth: maxWidth || '768px' }}
          >

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

// Container component that handles loading and error states
import { AlertCircle, Loader2 } from 'lucide-react';

export interface ChatContainerProps extends ChatProps { }

/**
 * The main Chat component that handles authentication via AuthLoading guardian.
 */
export const Chat = forwardRef<ChatInstance, ChatProps>((props, ref) => {
  return (
    <AuthLoading>
      <ChatContainer ref={ref} {...props} />
    </AuthLoading>
  );
});

const ChatContainer = forwardRef<ChatInstance, ChatContainerProps>(function ChatContainer(
  { agent: agentProp, agentId, enableHistory, threadId, initialMessages: initialMessagesProp, theme, enableFeedback, ...props },
  ref
) {
  const { isLoading: clientLoading } = useDistri();


  // Fetch agent if agentId is provided but agentProp is not
  const { agent: fetchedAgent, loading: agentLoading } = useAgent({
    agentIdOrDef: agentId || '',
    enabled: !agentProp && !!agentId
  });

  const agent = agentProp || fetchedAgent;

  // Fetch history if enableHistory is true
  const { messages: fetchedMessages, isLoading: historyLoading } = useChatMessages({
    threadId,
    enabled: !!enableHistory && !initialMessagesProp && !!threadId
  });

  const initialMessages = initialMessagesProp || fetchedMessages;

  // Loading state - client, agent or history is initializing
  if (clientLoading || agentLoading || (enableHistory && historyLoading)) {
    return (
      <div className={`flex flex-col items-center justify-center p-8 text-center h-full bg-background ${getThemeClasses(theme || 'auto')}`}>
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground font-sans text-sm">Initializing...</p>
      </div>
    );
  }

  // Agent not provided
  if (!agent) {
    return (
      <div className={`flex flex-col items-center justify-center p-8 text-center h-full bg-background ${getThemeClasses(theme || 'auto')}`}>
        <AlertCircle className="h-12 w-12 text-amber-500 mb-4" />
        <h2 className="text-lg font-semibold text-foreground mb-2">Agent Not Available</h2>
        <p className="text-muted-foreground font-sans text-sm mb-4">
          No agent has been configured or the backend is not responding.
        </p>
        <p className="text-muted-foreground font-sans text-xs">
          Make sure your Distri backend is running and accessible.
        </p>
      </div>
    );
  }

  return <ChatInner ref={ref} agent={agent} threadId={threadId} initialMessages={initialMessages} theme={theme} enableFeedback={enableFeedback} {...props} />;
});
