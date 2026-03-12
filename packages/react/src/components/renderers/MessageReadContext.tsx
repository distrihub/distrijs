import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { useDistri } from '../../DistriProvider';

interface MessageReadContextValue {
  /** Check if a message has been read */
  isRead: (messageId: string) => boolean;
  /** Mark a message as read (will skip if already read) */
  markAsRead: (messageId: string) => Promise<void>;
  /** Set of message IDs that have been read */
  readMessageIds: Set<string>;
  /** Whether the initial fetch is loading */
  isLoading: boolean;
}

const MessageReadContext = createContext<MessageReadContextValue | null>(null);

export interface MessageReadProviderProps {
  threadId: string;
  /** Whether to enable read tracking */
  enabled?: boolean;
  children: React.ReactNode;
}

/**
 * Provider that manages read status for all messages in a thread.
 * Fetches existing read statuses on mount and provides methods to check/mark messages as read.
 */
export const MessageReadProvider: React.FC<MessageReadProviderProps> = ({
  threadId,
  enabled = true,
  children,
}) => {
  const { client } = useDistri();
  const [readMessageIds, setReadMessageIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const pendingMarks = useRef<Set<string>>(new Set());
  const fetchedThreadId = useRef<string | null>(null);

  // Fetch existing read statuses when thread changes
  useEffect(() => {
    if (!enabled || !client || !threadId) {
      setIsLoading(false);
      return;
    }

    // Skip if we already fetched for this thread
    if (fetchedThreadId.current === threadId) {
      return;
    }

    const fetchReadStatuses = async () => {
      try {
        setIsLoading(true);
        const statuses = await client.getThreadReadStatus(threadId);
        const ids = new Set(statuses.map(s => s.message_id));
        setReadMessageIds(ids);
        fetchedThreadId.current = threadId;
      } catch (error) {
        console.error('[MessageReadProvider] Failed to fetch read statuses:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchReadStatuses();
  }, [client, threadId, enabled]);

  // Reset when thread changes
  useEffect(() => {
    if (fetchedThreadId.current !== threadId) {
      setReadMessageIds(new Set());
      pendingMarks.current = new Set();
    }
  }, [threadId]);

  const isRead = useCallback((messageId: string): boolean => {
    return readMessageIds.has(messageId);
  }, [readMessageIds]);

  const markAsRead = useCallback(async (messageId: string): Promise<void> => {
    if (!client || !threadId || !enabled) {
      return;
    }

    // Skip if already read or already pending
    if (readMessageIds.has(messageId) || pendingMarks.current.has(messageId)) {
      return;
    }

    // Mark as pending to prevent duplicate requests
    pendingMarks.current.add(messageId);

    try {
      await client.markMessageRead(threadId, messageId);

      // Update local state
      setReadMessageIds(prev => {
        const next = new Set(prev);
        next.add(messageId);
        return next;
      });
    } catch (error) {
      console.error('[MessageReadProvider] Failed to mark message as read:', error);
    } finally {
      pendingMarks.current.delete(messageId);
    }
  }, [client, threadId, enabled, readMessageIds]);

  const value: MessageReadContextValue = {
    isRead,
    markAsRead,
    readMessageIds,
    isLoading,
  };

  return (
    <MessageReadContext.Provider value={value}>
      {children}
    </MessageReadContext.Provider>
  );
};

/**
 * Hook to access message read context
 */
export const useMessageReadContext = (): MessageReadContextValue | null => {
  return useContext(MessageReadContext);
};

export default MessageReadProvider;
