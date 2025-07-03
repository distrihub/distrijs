import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Task,
  Message,
  MessageSendParams,
  TaskStatusUpdateEvent,
  TaskArtifactUpdateEvent,
  DistriClient
} from '@distri/core';
import { useDistri } from './DistriProvider';

export interface UseTaskOptions {
  agentId: string;
}

export interface UseTaskResult {
  task: Task | null;
  loading: boolean;
  error: Error | null;
  messages: Message[];
  isStreaming: boolean;
  sendMessage: (text: string, configuration?: MessageSendParams['configuration']) => Promise<void>;
  sendMessageStream: (text: string, configuration?: MessageSendParams['configuration']) => Promise<void>;
  getTask: (taskId: string) => Promise<void>;
  clearTask: () => void;
  clearMessages: () => void;
}

export function useTask({ agentId }: UseTaskOptions): UseTaskResult {
  const { client, error: clientError, isLoading: clientLoading } = useDistri();
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(async (
    text: string,
    configuration?: MessageSendParams['configuration']
  ) => {
    if (!client) {
      setError(new Error('Client not available'));
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const messageId = `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const message = DistriClient.createMessage(messageId, text, 'user');

      // Add user message to local state immediately
      setMessages(prev => [...prev, message]);

      const params = DistriClient.createMessageParams(message, configuration);
      const result = await client.sendMessage(agentId, params);

      if (result.kind === 'task') {
        setTask(result as Task);
      } else if (result.kind === 'message') {
        setMessages(prev => [...prev, result as Message]);
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to send message'));
    } finally {
      setLoading(false);
    }
  }, [client, agentId]);

  const sendMessageStream = useCallback(async (
    text: string,
    configuration?: MessageSendParams['configuration']
  ) => {
    if (!client) {
      setError(new Error('Client not available'));
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setIsStreaming(true);

      // Cancel any existing stream
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      const messageId = `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const message = DistriClient.createMessage(messageId, text, 'user');

      // Add user message to local state immediately
      setMessages(prev => [...prev, message]);

      const params = DistriClient.createMessageParams(message, {
        blocking: false,
        acceptedOutputModes: ['text/plain'],
        ...configuration
      });

      const stream = client.sendMessageStream(agentId, params);
      let currentMessage: Message | null = null;
      
      // Initialize a response message for streaming
      const responseMessageId = `resp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const initialResponseMessage: Message = {
        messageId: responseMessageId,
        role: 'agent',
        parts: [{ kind: 'text', text: '' }],
        contextId: configuration?.contextId,
        kind: 'message'
      };

      for await (const event of stream) {
        if (abortControllerRef.current?.signal.aborted) {
          break;
        }

        console.log('Stream event:', event); // Debug logging

        if (event.kind === 'task') {
          setTask(event as Task);
        } else if (event.kind === 'status-update') {
          const statusEvent = event as TaskStatusUpdateEvent;
          if (statusEvent.status.message) {
            currentMessage = statusEvent.status.message;
            setMessages(prev => {
              const existing = prev.find(m => m.messageId === currentMessage!.messageId);
              if (existing) {
                return prev.map(m => m.messageId === currentMessage!.messageId ? currentMessage! : m);
              } else {
                return [...prev, currentMessage!];
              }
            });
          }

          if (statusEvent.final) {
            setIsStreaming(false);
            break;
          }
        } else if (event.kind === 'artifact-update') {
          const artifactEvent = event as TaskArtifactUpdateEvent;
          // Handle artifact updates if needed
          console.log('Artifact update:', artifactEvent);
        } else if (event.kind === 'message') {
          const messageEvent = event as Message;
          setMessages(prev => {
            const existing = prev.find(m => m.messageId === messageEvent.messageId);
            if (existing) {
              return prev.map(m => m.messageId === messageEvent.messageId ? messageEvent : m);
            } else {
              return [...prev, messageEvent];
            }
          });
        } else if ((event as any).kind === 'text_delta' || (event as any).delta) {
          // Handle streaming text delta events
          const deltaEvent = event as any;
          const delta = deltaEvent.delta || deltaEvent.text || '';
          
          if (delta) {
            // Use currentMessage or initialize with the initial response message
            if (!currentMessage) {
              currentMessage = { ...initialResponseMessage };
              setMessages(prev => [...prev, currentMessage!]);
            }
            
            // Accumulate text deltas into the current message
            const updatedMessage = {
              ...currentMessage,
              parts: currentMessage.parts.map((part: any, index: number) => {
                if (index === 0 && part.kind === 'text') {
                  return {
                    ...part,
                    text: (part.text || '') + delta
                  };
                }
                return part;
              })
            };
            currentMessage = updatedMessage;
            setMessages(prev => {
              return prev.map(m => m.messageId === currentMessage!.messageId ? currentMessage! : m);
            });
          }
        } else {
          // Handle any other event types that might contain text content
          console.log('Unhandled stream event:', event);
        }
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        // Stream was cancelled, not an error
        return;
      }
      setError(err instanceof Error ? err : new Error('Failed to stream message'));
    } finally {
      setLoading(false);
      setIsStreaming(false);
    }
  }, [client, agentId]);

  const getTask = useCallback(async (taskId: string) => {
    if (!client) {
      setError(new Error('Client not available'));
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const fetchedTask = await client.getTask(agentId, taskId);
      setTask(fetchedTask);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch task'));
    } finally {
      setLoading(false);
    }
  }, [client, agentId]);

  const clearTask = useCallback(() => {
    setTask(null);
    setError(null);
    setIsStreaming(false);

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    task,
    loading: loading || clientLoading,
    error: error || clientError,
    messages,
    isStreaming,
    sendMessage,
    sendMessageStream,
    getTask,
    clearTask,
    clearMessages
  };
}