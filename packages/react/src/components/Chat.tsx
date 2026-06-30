import React, { useState, useCallback, useRef, useEffect, useImperativeHandle, forwardRef, useMemo } from 'react';
import { Agent, DistriChatMessage, DistriMessage, DistriPart, DistriThread, ToolCall, ToolExecutionOptions, DistriClient, convertDistriMessageToA2A } from '@distri/core';
import { ChatInput, AttachedImage } from './ChatInput';
import { useChat } from '../useChat';
import { MessageRenderer } from './renderers/MessageRenderer';
import { SubTaskTree } from './renderers/SubTaskTree';
import { MessageReadProvider } from './renderers/MessageReadContext';
import { LoadingStrip } from './renderers/LoadingStrip';
import { LoadingShimmer } from './renderers/ThinkingRenderer';
import { TodosCompact } from './renderers/TodosCompact';
import { type LoadingAnimationConfig } from './renderers/LoadingAnimation';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { useStore } from 'zustand';
import { ChatState, TaskState, ChatStore, ChatStoreContext, createChatStore } from '../stores/chatStateStore';
import { useSpeechToText } from '../hooks/useSpeechToText';
import { useTts, TtsConfig } from '../hooks/useTts';
import { DistriAnyTool, ToolRendererMap, ChatCommand, ChatSessionSettings, ChatCommandEvent, DeveloperMode } from '@/types';
import { createHttpToolRenderer } from '../utils/createHttpToolRenderer';
import { DeveloperModeComponent } from './developer/DeveloperModeComponent';
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
  sendMessage: (content: string | DistriPart[], options?: import('../useChat').SendMessageOptions) => Promise<void>;
  stopStreaming: () => void;
  triggerTool: (toolName: string, input: any) => Promise<void>;
  isStreaming: boolean;
  isLoading: boolean;
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
  ttsConfig?: TtsConfig;
  /** Handsfree mode: auto-send after transcription and auto-play TTS responses. */
  handsfree?: boolean;
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
   * Enable message feedback (voting) UI on assistant messages.
   * Shows thumbs up/down buttons for rating responses.
   */
  enableFeedback?: boolean;
  /** Enable slash-command palette in the input */
  allowCommands?: boolean;
  /** Initial session settings applied on mount */
  sessionSettings?: Partial<ChatSessionSettings>;
  /** Callback fired when a slash command is selected */
  onCommand?: (event: ChatCommandEvent) => void;
  /** Developer mode options: traces, verbosity, tools panel, and parallel diagnose mode */
  developerMode?: DeveloperMode;
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

function formatTokenCount(tokens: number): string {
  if (tokens >= 1_000_000) return `${(tokens / 1_000_000).toFixed(1)}M`;
  if (tokens >= 1_000) return `${(tokens / 1_000).toFixed(1)}k`;
  return String(tokens);
}

function appendDiagnoseScope(content: string | DistriPart[], threadId: string): DistriPart[] {
  const scope = [
    '',
    `[Diagnose mode scope]`,
    `Target threadId: ${threadId}`,
    'Use the `distri-developer-debug` skill and inspect recent traces, system prompts, recent user prompts, and tool activity for this thread.',
  ].join('\n');

  if (typeof content === 'string') {
    return [{ part_type: 'text', data: `${content}${scope}` }];
  }

  const parts: DistriPart[] = [...content];
  for (let i = parts.length - 1; i >= 0; i -= 1) {
    const part = parts[i];
    if (part.part_type === 'text') {
      parts[i] = { part_type: 'text', data: `${part.data}${scope}` };
      return parts;
    }
  }

  parts.push({ part_type: 'text', data: scope.trim() });
  return parts;
}

const ThreadTokensBanner: React.FC<{ thread: DistriThread | null }> = ({ thread }) => {
  if (!thread || !(thread.total_tokens ?? 0)) return null;

  return (
    <div className="flex items-center justify-center gap-3 py-1.5 text-[11px] text-muted-foreground/70">
      <span>
        <span className="opacity-60">In:</span>{' '}
        <span className="font-medium text-muted-foreground">{formatTokenCount(thread.input_tokens ?? 0)}</span>
      </span>
      <span className="opacity-30">·</span>
      <span>
        <span className="opacity-60">Out:</span>{' '}
        <span className="font-medium text-muted-foreground">{formatTokenCount(thread.output_tokens ?? 0)}</span>
      </span>
      <span className="opacity-30">·</span>
      <span>
        <span className="opacity-60">Total:</span>{' '}
        <span className="font-medium text-foreground/70">{formatTokenCount(thread.total_tokens ?? 0)} tokens</span>
      </span>
    </div>
  );
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
  voiceEnabled = false,
  useSpeechRecognition = false,
  ttsConfig,
  handsfree = false,
  initialInput = '',
  allowBrowserPreview = true,
  maxWidth,
  className = '',
  toolRenderers,
  enableFeedback = false,
  allowCommands = false,
  sessionSettings,
  onCommand,
  developerMode,
}, ref) {
  // This Chat instance owns its chat-state store. Created once per mount, so a
  // keyed remount (`<Chat key={threadId}>`) gets a fresh, empty store — the old
  // thread's messages and streaming flags cannot leak in. Published to renderer
  // descendants via ChatStoreContext and handed to useChat below.
  const [chatStore] = useState<ChatStore>(() => createChatStore());

  const [input, setInput] = useState(initialInput ?? '');
  const initialInputRef = useRef(initialInput ?? '');
  const [expandedTools, setExpandedTools] = useState<Set<string>>(new Set());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const diagnoseThreadIdsRef = useRef<Map<string, string>>(new Map());
  const diagnoseAgentRef = useRef<Agent | null>(null);
  const [diagnoseModeEnabled, setDiagnoseModeEnabled] = useState(false);

  // Auto-register HTTP tool renderers for distri_request / api_request
  // so every consumer gets formatted HTTP cards by default.
  // User-provided toolRenderers take precedence.
  const mergedToolRenderers = useMemo(() => {
    const defaults = createHttpToolRenderer({
      toolNames: ['distri_request', 'api_request'],
    });
    return { ...defaults, ...toolRenderers };
  }, [toolRenderers]);

  const traceOpener = useMemo(() => {
    if (!developerMode) return undefined;
    if (typeof developerMode.traces === 'object' && developerMode.traces?.open) {
      return developerMode.traces.open;
    }
    return developerMode.onShowTrace;
  }, [developerMode]);

  const tracesEnabled = useMemo(() => Boolean(developerMode?.traces), [developerMode]);
  const diagnoseConfig = useMemo(() => {
    if (!developerMode?.diagnose) return undefined;
    return typeof developerMode.diagnose === 'object' ? developerMode.diagnose : {};
  }, [developerMode]);

  // Pending message state single message with accumulated parts
  const [pendingMessage, setPendingMessage] = useState<DistriPart[] | null>(null);

  // Image upload state moved from ChatInput
  const [attachedImages, setAttachedImages] = useState<AttachedImage[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);


  // Voice functionality hooks - need DistriClient for API calls
  const speechToText = useSpeechToText();
  const tts = useTts(ttsConfig);
  const [isHandsfree, setIsHandsfree] = useState(handsfree);
  const toggleHandsfree = useCallback(() => setIsHandsfree(prev => !prev), []);
  const [browserEnabled, setBrowserEnabled] = useState(false);
  const browserViewerUrl = useStore(chatStore, state => state.browserViewerUrl);
  const agentDefinition = useMemo(() => agent?.getDefinition(), [agent]);
  const supportsBrowserStreaming = allowBrowserPreview && Boolean(agentDefinition?.browser_config);
  const browserAgentIdRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    const agentId = agentDefinition?.name;

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


  const browserSessionId = useStore(chatStore, state => state.browserSessionId);

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
    store: chatStore,
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
  const toolCalls = useStore(chatStore, state => state.toolCalls);
  const hasPendingToolCalls = useStore(chatStore, state => state.hasPendingToolCalls());
  // Cosmetic only: how many external (frontend-handled) tool calls are still
  // awaiting a result. The backend already join_all's the batch with a timeout —
  // this just tells the user we're waiting on outstanding tool calls. If one
  // result is sent and another isn't, the count reflects the laggard until it
  // resolves or the backend timeout fires.
  const pendingToolCallCount = useMemo(
    () =>
      Array.from(toolCalls.values()).filter(
        (tc) => (tc.status === 'pending' || tc.status === 'running') && tc.isExternal,
      ).length,
    [toolCalls],
  );
  const currentState = useStore(chatStore, state => state);
  const todos = useStore(chatStore, state => state.todos);
  const lastTodoChanges = useStore(chatStore, state => state.lastTodoChanges);
  const verbose = useStore(chatStore, state => state.verbose);
  const setVerbose = useStore(chatStore, state => state.setVerbose);
  const audioEnabled = useStore(chatStore, s => s.audioEnabled ?? false);
  const rendering = useStore(chatStore, s => s.rendering);
  const setSessionSettings = useStore(chatStore, s => s.setSessionSettings);

  const handleToggleVerbose = useCallback(() => {
    setVerbose(!verbose);
  }, [verbose, setVerbose]);

  // Apply sessionSettings on mount
  useEffect(() => {
    if (sessionSettings) setSessionSettings(sessionSettings);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (onChatStateChange) {
      onChatStateChange(currentState);
    }
  }, [currentState, onChatStateChange]);

  // Get distri client for browser session creation
  const { client: distriClient } = useDistri();

  const getDiagnoseThreadId = useCallback((sourceThreadId: string) => {
    const configuredThreadId = diagnoseConfig?.threadId;

    if (typeof configuredThreadId === 'function') {
      return configuredThreadId(sourceThreadId);
    }

    if (typeof configuredThreadId === 'string' && configuredThreadId.trim()) {
      return configuredThreadId;
    }

    const existing = diagnoseThreadIdsRef.current.get(sourceThreadId);
    if (existing) return existing;

    const next = crypto.randomUUID();
    diagnoseThreadIdsRef.current.set(sourceThreadId, next);
    return next;
  }, [diagnoseConfig]);

  const resolveDiagnoseAgent = useCallback(async () => {
    if (!distriClient) {
      throw new Error('Distri client is not ready');
    }

    const diagnoseAgentId = diagnoseConfig?.agentId || 'distri';
    if (diagnoseAgentRef.current?.name === diagnoseAgentId) {
      return diagnoseAgentRef.current;
    }

    const nextAgent = await Agent.create(diagnoseAgentId, distriClient);
    diagnoseAgentRef.current = nextAgent;
    return nextAgent;
  }, [diagnoseConfig, distriClient]);

  // Thread token usage tracking
  const [threadDetails, setThreadDetails] = useState<DistriThread | null>(null);
  const wasStreamingRef = useRef(false);

  const refreshThreadDetails = useCallback(() => {
    if (distriClient && threadId) {
      distriClient.getThread(threadId)
        .then(setThreadDetails)
        .catch(() => {});
    }
  }, [distriClient, threadId]);

  // Re-fetch thread details when streaming ends
  useEffect(() => {
    if (wasStreamingRef.current && !isStreaming) {
      refreshThreadDetails();
    }
    wasStreamingRef.current = isStreaming;
  }, [isStreaming, refreshThreadDetails]);

  // Initial fetch for existing threads
  useEffect(() => {
    if (distriClient && threadId && initialMessages && initialMessages.length > 0) {
      refreshThreadDetails();
    }
  }, [distriClient, threadId]); // intentionally only on mount/threadId change

  const handleToggleBrowser = useCallback(async (enabled: boolean) => {
    if (!supportsBrowserStreaming) return;
    setBrowserEnabled(enabled);

    // When enabling browser, create a session immediately
    if (enabled && !browserSessionId && distriClient) {
      try {
        const session = await distriClient.createBrowserSession();
        chatStore.getState().setBrowserSession(session.session_id, session.viewer_url);
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
      if (diagnoseModeEnabled && diagnoseConfig && threadId) {
        const diagnoseThreadId = getDiagnoseThreadId(threadId);
        const diagnoseLabel = diagnoseConfig.label ?? 'Diagnose';
        const diagnoseAgent = await resolveDiagnoseAgent();

        if (!diagnoseAgent) {
          throw new Error('Diagnose agent is not available');
        }

        const store = chatStore.getState();
        const previousContext = {
          currentRunId: store.currentRunId,
          currentTaskId: store.currentTaskId,
          currentPlanId: store.currentPlanId,
          currentAgentId: store.currentAgentId,
        };

        store.setError(null);
        store.setLoading(true);
        store.setStreaming(true);
        store.setStreamingIndicator('typing');

        try {
          let diagnoseMessage = DistriClient.initDistriMessage('user', appendDiagnoseScope(content, threadId));
          diagnoseMessage = {
            ...diagnoseMessage,
            metadata: {
              ...(diagnoseMessage.metadata ?? {}),
              developer_mode: {
                kind: 'diagnose',
                label: diagnoseLabel,
                source_thread_id: threadId,
                target_thread_id: diagnoseThreadId,
                agent_id: diagnoseAgent.name,
                mode_enabled: true,
              },
            },
          };

          store.processMessage(diagnoseMessage, false);

          if (beforeSendMessage) {
            diagnoseMessage = await beforeSendMessage(diagnoseMessage);
          }

          const a2aMessage = convertDistriMessageToA2A(diagnoseMessage, {
            thread_id: diagnoseThreadId,
            run_id: previousContext.currentRunId,
            task_id: previousContext.currentTaskId,
          });

          const metadata = (await mergedMetadataProvider()) ?? {};
          const stream = await diagnoseAgent.invokeStream({
            message: a2aMessage,
            metadata: {
              ...metadata,
              task_id: previousContext.currentTaskId,
            },
          });

          for await (const event of stream) {
            if ((event as { type?: string }).type === 'text_message_start') {
              const textStart = event as unknown as {
                type: 'text_message_start';
                data: Record<string, unknown>;
              };
              store.processMessage(({
                ...textStart,
                data: {
                  ...textStart.data,
                  metadata: {
                    developer_mode: {
                      kind: 'diagnose',
                      label: diagnoseLabel,
                      source_thread_id: threadId,
                      target_thread_id: diagnoseThreadId,
                      agent_id: diagnoseAgent.name,
                      mode_enabled: true,
                    },
                  },
                },
              } as unknown) as DistriChatMessage, true);
              continue;
            }

            store.processMessage(event, true);
          }
        } catch (err) {
          const error = err instanceof Error ? err : new Error('Failed to send diagnose message');
          store.setError(error);
          onError?.(error);
          store.failAllPendingToolCalls(error.message);
        } finally {
          store.setStreamingIndicator(undefined);
          store.setLoading(false);
          store.setStreaming(false);
          chatStore.setState(previousContext);
        }
        return;
      }

      await sendMessage(content);
    }
  }, [
    beforeSendMessage,
    contentToParts,
    diagnoseConfig,
    diagnoseModeEnabled,
    getDiagnoseThreadId,
    isStreaming,
    mergedMetadataProvider,
    onError,
    resolveDiagnoseAgent,
    sendMessage,
    threadId,
  ]);

  const handleStopStreaming = useCallback(() => {
    console.log('handleStopStreaming called, about to call stopStreaming()');
    stopStreaming();

    // Reset all streaming states in the store
    chatStore.getState().resetStreamingStates();
  }, [stopStreaming]);

  // Built-in slash commands
  const builtInCommands: ChatCommand[] = useMemo(() => [
    { id: 'verbose', label: 'Verbose', description: 'Toggle rich tool rendering & detailed output', icon: '📊', type: 'toggle', currentValue: verbose },
    { id: 'audio', label: 'Audio', description: 'Toggle voice input & speech output', icon: '🎙️', type: 'toggle', currentValue: audioEnabled },
    { id: 'reset', label: 'Reset', description: 'Clear conversation & start a new thread', icon: '🔄', type: 'action' },
  ], [verbose, audioEnabled]);

  const handleCommand = useCallback((event: ChatCommandEvent) => {
    if (event.command === 'verbose') {
      setSessionSettings({ verbose: event.value ?? !verbose });
    } else if (event.command === 'audio') {
      setSessionSettings({ audioEnabled: event.value ?? !audioEnabled });
    } else if (event.command === 'reset') {
      handleStopStreaming();
    }
    onCommand?.(event);
  }, [verbose, audioEnabled, setSessionSettings, onCommand, handleStopStreaming]);

  const handleTriggerTool = useCallback(async (toolName: string, input: any) => {
    // Create a tool call with a unique ID
    const toolCallId = `manual_${Date.now()}_${Math.random().toString(36).substring(2, 11)} `;

    const toolCall: ToolCall = {
      tool_call_id: toolCallId,
      tool_name: toolName,
      input: input
    };

    // Get the chat state to initialize the tool call
    const chatState = chatStore.getState();
    const tool = chatState.getToolByName(toolName);
    if (tool) {
      // Initialize the tool call in the state store
      chatState.executeTool(toolCall, tool);
    } else {
      console.error('Tool not found:', toolName);
    }
  }, []);

  // Voice recording: transcribe via backend, then fill textarea (or auto-send in handsfree mode)
  const handleVoiceRecord = useCallback(async (audioBlob: Blob) => {
    try {
      if (!voiceEnabled || !speechToText) {
        console.error('Voice recording not properly configured - missing speechToText');
        return;
      }

      const transcription = await speechToText.transcribe(audioBlob, { model: 'whisper-1' });

      if (transcription.trim()) {
        if (isHandsfree) {
          await handleSendMessage(transcription);
        } else {
          // Fill the textarea so the user can review/edit before sending
          setInput(transcription);
        }
      }
    } catch (error) {
      console.error('Voice transcription failed:', error);
      if (onError) {
        onError(error as Error);
      }
    }
  }, [voiceEnabled, speechToText, isHandsfree, handleSendMessage, onError]);

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
          await handleSendMessage(messageToSend);
        } catch (error) {
          console.error('Failed to send pending message:', error);
        }
      }
    };

    sendPendingMessage();
  }, [handleSendMessage, isStreaming, pendingMessage]);

  // Auto-play TTS for new assistant messages in handsfree mode.
  // Only plays after streaming completes, and tracks already-spoken message IDs.
  const spokenMessageIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!isHandsfree || !voiceEnabled || !ttsConfig || isStreaming) return;

    const lastMessage = messages[messages.length - 1];
    if (
      lastMessage &&
      'role' in lastMessage &&
      lastMessage.role === 'assistant' &&
      'id' in lastMessage &&
      !spokenMessageIds.current.has(lastMessage.id)
    ) {
      // Extract text from message parts
      const text = 'parts' in lastMessage
        ? (lastMessage.parts as DistriPart[])
            .filter((p): p is { part_type: 'text'; data: string } => p.part_type === 'text')
            .map(p => p.data)
            .join(' ')
        : '';

      if (text.trim()) {
        spokenMessageIds.current.add(lastMessage.id);
        tts.speak(text).catch(error => console.error('TTS playback failed:', error));
      }
    }
  }, [messages, isHandsfree, voiceEnabled, ttsConfig, tts, isStreaming]);

  // Create ChatInstance API with useMemo to prevent recreation
  const chatInstance = useMemo<ChatInstance>(() => ({
    sendMessage: handleSendMessage,
    stopStreaming: handleStopStreaming,
    triggerTool: handleTriggerTool,
    isStreaming,
    isLoading,
  }), [handleSendMessage, handleStopStreaming, handleTriggerTool, isStreaming, isLoading]);

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
    const unsub = chatStore.subscribe((state) => state.tasks);
    const tasks = chatStore.getState().tasks;
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
          toolRenderers={mergedToolRenderers}
          isExpanded={expandedTools.has(message.id || `message-${index}`)}
          onToggle={() => {
            const messageId = message.id || `message-${index}`;
            toggleToolExpansion(messageId);
          }}
          debug={tracesEnabled}
          verbose={verbose}
          rendering={rendering}
          threadId={threadId}
          enableFeedback={enableFeedback}
          onShowTrace={traceOpener}
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
          isStreaming
            ? 'Message will be queued…'
            : basePlaceholder
        }
        disabled={isLoading || hasPendingToolCalls}
        isStreaming={isStreaming}
        attachedImages={attachedImages}
        onRemoveImage={removeImage}
        onAddImages={addImages}
        voiceEnabled={voiceEnabled && !!speechToText}
        onVoiceRecord={handleVoiceRecord}
        useSpeechRecognition={useSpeechRecognition}
        onSpeechTranscript={handleSpeechTranscript}
        handsfree={isHandsfree}
        onToggleHandsfree={voiceEnabled ? toggleHandsfree : undefined}
        verbose={verbose}
        onToggleVerbose={undefined}
        developerModeControl={developerMode ? (
          <DeveloperModeComponent
            developerMode={developerMode}
            threadId={threadId}
            verbose={verbose}
            onToggleVerbose={handleToggleVerbose}
            diagnoseEnabled={diagnoseModeEnabled}
            onToggleDiagnose={() => setDiagnoseModeEnabled((prev) => !prev)}
            onOpenTrace={traceOpener}
            agentDefinition={agentDefinition}
            disabled={isStreaming || isLoading}
            triggerClassName="h-10 w-10 rounded-full"
            triggerIconClassName="h-4 w-4"
          />
        ) : undefined}
        developerModeStatus={undefined}
        allowCommands={allowCommands}
        commands={builtInCommands}
        onCommand={handleCommand}
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
    isStreaming,
    isLoading,
    hasPendingToolCalls,
    attachedImages,
    removeImage,
    addImages,
    verbose,
    handleToggleVerbose,
    developerMode,
    voiceEnabled,
    speechToText,
    handleVoiceRecord,
    useSpeechRecognition,
    handleSpeechTranscript,
    isHandsfree,
    toggleHandsfree,
    showEmptyState,
    emptyState,
    theme,
    allowCommands,
    builtInCommands,
    handleCommand,
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
    || Boolean(developerMode)
    || (models && models.length > 0)
    || (voiceEnabled && !!speechToText);
  const showBrowserPreview = supportsBrowserStreaming && browserEnabled && Boolean(browserViewerUrl);


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
    <ChatStoreContext.Provider value={chatStore}>
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

          {/* Thread token usage */}
          <ThreadTokensBanner thread={threadDetails} />

          <div
            className="flex flex-col gap-4 lg:flex-row lg:items-start"
            style={maxWidth ? { maxWidth: '100%' } : undefined}
          >
            <MessageReadProvider threadId={threadId} enabled={enableFeedback}>
              <div className="flex-1 min-w-0 space-y-4 w-full">
                {emptyStateContent}
                {/* Render all messages and state */}
                {renderMessages()}

                <SubTaskTree
                  toolRenderers={mergedToolRenderers}
                  rendering={rendering}
                  threadId={threadId}
                  onShowTrace={traceOpener}
                  verbose={verbose}
                  debug={tracesEnabled}
                />

                {renderExternalToolCalls()}
                {/* Render pending message */}
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
            className="mx-auto w-full px-4 py-3 sm:py-4 space-y-2"
            style={{ maxWidth: maxWidth || '768px' }}
          >

            {/* Pre-input zone: todos + loading strip + tool-call wait */}
            {(todos?.length > 0 || isStreaming || pendingToolCallCount > 0) && (
              <div className="space-y-1.5">
                {todos && todos.length > 0 && (
                  <TodosCompact todos={todos} changes={lastTodoChanges} />
                )}
                {pendingToolCallCount > 0 ? (
                  <LoadingShimmer
                    showIcon
                    className="text-xs sm:text-sm"
                    text={`Waiting for ${pendingToolCallCount} tool response${pendingToolCallCount === 1 ? '' : 's'}…`}
                  />
                ) : (
                  isStreaming && <LoadingStrip words={loadingAnimation?.cycleWords} />
                )}
              </div>
            )}

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

            {shouldRenderFooterComposer ? footerComposer : null}
          </div>
        </footer>
      ) : null}


    </div >
    </ChatStoreContext.Provider>
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
