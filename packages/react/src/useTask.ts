import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Task, 
  Message as A2AMessage, 
  MessageSendParams, 
  CreateTaskRequest,
  DistriClient,
  TextDeltaEvent,
  TaskStatusChangedEvent,
  TaskCompletedEvent,
  TaskErrorEvent,
  TaskStatus
} from '@distri/core';
import { useDistri } from './DistriProvider';

export interface UseTaskOptions {
  agentId: string;
  autoSubscribe?: boolean;
}

export interface UseTaskResult {
  task: Task | null;
  loading: boolean;
  error: Error | null;
  streamingText: string;
  isStreaming: boolean;
  sendMessage: (text: string, configuration?: MessageSendParams['configuration']) => Promise<void>;
  createTask: (message: A2AMessage, configuration?: MessageSendParams['configuration']) => Promise<void>;
  getTask: (taskId: string) => Promise<void>;
  clearTask: () => void;
}

export function useTask({ agentId, autoSubscribe = true }: UseTaskOptions): UseTaskResult {
  const { client, error: clientError, isLoading: clientLoading } = useDistri();
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [streamingText, setStreamingText] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);

  const createTask = useCallback(async (
    message: A2AMessage, 
    configuration?: MessageSendParams['configuration']
  ) => {
    if (!client) {
      setError(new Error('Client not available'));
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setStreamingText('');
      setIsStreaming(true);

      const request: CreateTaskRequest = {
        agentId,
        message,
        configuration
      };

      const response = await client.createTask(request);
      
      // Get the full task details
      const fullTask = await client.getTask(response.taskId);
      setTask(fullTask);
      
      if (autoSubscribe) {
        subscribeToAgent();
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to create task'));
      setIsStreaming(false);
    } finally {
      setLoading(false);
    }
  }, [client, agentId, autoSubscribe]);

  const sendMessage = useCallback(async (
    text: string,
    configuration?: MessageSendParams['configuration']
  ) => {
    const messageId = `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const message = DistriClient.createMessage(messageId, text, 'user');
    
    await createTask(message, configuration);
  }, [createTask]);

  const getTask = useCallback(async (taskId: string) => {
    if (!client) {
      setError(new Error('Client not available'));
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const fetchedTask = await client.getTask(taskId);
      setTask(fetchedTask);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch task'));
    } finally {
      setLoading(false);
    }
  }, [client]);

  const clearTask = useCallback(() => {
    setTask(null);
    setStreamingText('');
    setIsStreaming(false);
    setError(null);
    
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
  }, []);

  const subscribeToAgent = useCallback(() => {
    if (!client || eventSourceRef.current) {
      return; // No client or already subscribed
    }

    try {
      const eventSource = client.subscribeToAgent(agentId);
      eventSourceRef.current = eventSource;

      const handleTextDelta = (event: TextDeltaEvent) => {
        if (task && event.task_id === task.id) {
          setStreamingText(prev => prev + event.delta);
        }
      };

      const handleTaskStatusChanged = (event: TaskStatusChangedEvent) => {
        if (task && event.task_id === task.id) {
          // Create a proper TaskStatus object
          const newStatus: TaskStatus = {
            state: event.status as any, // Type assertion for the status
            timestamp: new Date().toISOString()
          };
          setTask(prev => prev ? { ...prev, status: newStatus } : null);
          
          if (event.status === 'completed' || event.status === 'failed' || event.status === 'canceled') {
            setIsStreaming(false);
          }
        }
      };

      const handleTaskCompleted = (event: TaskCompletedEvent) => {
        if (task && event.task_id === task.id) {
          setIsStreaming(false);
          // Optionally refresh the full task to get the complete result
          getTask(event.task_id);
        }
      };

      const handleTaskError = (event: TaskErrorEvent) => {
        if (task && event.task_id === task.id) {
          setError(new Error(event.error));
          setIsStreaming(false);
        }
      };

      // Subscribe to events
      client.on('text_delta', handleTextDelta);
      client.on('task_status_changed', handleTaskStatusChanged);
      client.on('task_completed', handleTaskCompleted);
      client.on('task_error', handleTaskError);

      // Store cleanup function
      const cleanup = () => {
        client.off('text_delta', handleTextDelta);
        client.off('task_status_changed', handleTaskStatusChanged);
        client.off('task_completed', handleTaskCompleted);
        client.off('task_error', handleTaskError);
      };

      return cleanup;
    } catch (err) {
      console.warn('Failed to subscribe to agent events:', err);
    }
  }, [client, agentId, task, getTask]);

  // Auto-subscribe when agent changes and client is available
  useEffect(() => {
    if (autoSubscribe && agentId && client && !clientLoading) {
      const cleanup = subscribeToAgent();
      return cleanup;
    }
  }, [autoSubscribe, agentId, client, clientLoading, subscribeToAgent]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []);

  return {
    task,
    loading: loading || clientLoading,
    error: error || clientError,
    streamingText,
    isStreaming,
    sendMessage,
    createTask,
    getTask,
    clearTask
  };
}