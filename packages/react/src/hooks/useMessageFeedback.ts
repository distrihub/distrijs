import { useState, useCallback } from 'react';
import {
  MessageReadStatus,
  MessageVote,
  MessageVoteSummary,
  VoteType,
  VoteMessageRequest,
} from '@distri/core';
import { useDistri } from '../DistriProvider';

// ========== Message Read Status Hook ==========

export interface UseMessageReadStatusOptions {
  threadId: string;
  messageId: string;
  /**
   * Whether to fetch the read status automatically on mount.
   * Default: false
   */
  autoFetch?: boolean;
}

export interface UseMessageReadStatusResult {
  readStatus: MessageReadStatus | null;
  loading: boolean;
  error: Error | null;
  markAsRead: () => Promise<MessageReadStatus | null>;
  refetch: () => Promise<void>;
}

/**
 * Hook to manage read status for a specific message
 */
export function useMessageReadStatus(
  options: UseMessageReadStatusOptions
): UseMessageReadStatusResult {
  const { threadId, messageId, autoFetch = false } = options;
  const { client } = useDistri();
  const [readStatus, setReadStatus] = useState<MessageReadStatus | null>(null);
  const [loading, setLoading] = useState(autoFetch);
  const [error, setError] = useState<Error | null>(null);

  const refetch = useCallback(async () => {
    if (!client) {
      setError(new Error('Client not available'));
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const status = await client.getMessageReadStatus(threadId, messageId);
      setReadStatus(status);
    } catch (err) {
      console.error('[useMessageReadStatus] Failed to fetch read status:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch read status'));
    } finally {
      setLoading(false);
    }
  }, [client, threadId, messageId]);

  const markAsRead = useCallback(async () => {
    if (!client) {
      setError(new Error('Client not available'));
      return null;
    }

    try {
      setLoading(true);
      setError(null);
      const status = await client.markMessageRead(threadId, messageId);
      setReadStatus(status);
      return status;
    } catch (err) {
      console.error('[useMessageReadStatus] Failed to mark message as read:', err);
      setError(err instanceof Error ? err : new Error('Failed to mark message as read'));
      return null;
    } finally {
      setLoading(false);
    }
  }, [client, threadId, messageId]);

  return {
    readStatus,
    loading,
    error,
    markAsRead,
    refetch,
  };
}

// ========== Thread Read Status Hook ==========

export interface UseThreadReadStatusOptions {
  threadId: string;
  /**
   * Whether to fetch the read status automatically on mount.
   * Default: true
   */
  enabled?: boolean;
}

export interface UseThreadReadStatusResult {
  readStatuses: MessageReadStatus[];
  loading: boolean;
  error: Error | null;
  /**
   * Check if a specific message has been read
   */
  isRead: (messageId: string) => boolean;
  /**
   * Mark a specific message as read
   */
  markAsRead: (messageId: string) => Promise<MessageReadStatus | null>;
  refetch: () => Promise<void>;
}

/**
 * Hook to manage read status for all messages in a thread
 */
export function useThreadReadStatus(
  options: UseThreadReadStatusOptions
): UseThreadReadStatusResult {
  const { threadId, enabled = true } = options;
  const { client } = useDistri();
  const [readStatuses, setReadStatuses] = useState<MessageReadStatus[]>([]);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<Error | null>(null);

  const refetch = useCallback(async () => {
    if (!client) {
      setError(new Error('Client not available'));
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const statuses = await client.getThreadReadStatus(threadId);
      setReadStatuses(statuses);
    } catch (err) {
      console.error('[useThreadReadStatus] Failed to fetch read statuses:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch read statuses'));
    } finally {
      setLoading(false);
    }
  }, [client, threadId]);

  const isRead = useCallback(
    (messageId: string) => {
      return readStatuses.some((status) => status.message_id === messageId);
    },
    [readStatuses]
  );

  const markAsRead = useCallback(
    async (messageId: string) => {
      if (!client) {
        setError(new Error('Client not available'));
        return null;
      }

      try {
        const status = await client.markMessageRead(threadId, messageId);
        setReadStatuses((prev) => {
          // Check if already exists
          const exists = prev.some((s) => s.message_id === messageId);
          if (exists) {
            return prev.map((s) => (s.message_id === messageId ? status : s));
          }
          return [...prev, status];
        });
        return status;
      } catch (err) {
        console.error('[useThreadReadStatus] Failed to mark message as read:', err);
        setError(err instanceof Error ? err : new Error('Failed to mark message as read'));
        return null;
      }
    },
    [client, threadId]
  );

  return {
    readStatuses,
    loading,
    error,
    isRead,
    markAsRead,
    refetch,
  };
}

// ========== Message Voting Hook ==========

export interface UseMessageVoteOptions {
  threadId: string;
  messageId: string;
  /**
   * Whether to fetch the vote summary automatically on mount.
   * Default: false
   */
  autoFetch?: boolean;
}

export interface UseMessageVoteResult {
  summary: MessageVoteSummary | null;
  loading: boolean;
  error: Error | null;
  /**
   * Upvote the message
   */
  upvote: () => Promise<MessageVote | null>;
  /**
   * Downvote the message with a required comment
   */
  downvote: (comment: string) => Promise<MessageVote | null>;
  /**
   * Remove the current user's vote
   */
  removeVote: () => Promise<void>;
  /**
   * Refetch the vote summary
   */
  refetch: () => Promise<void>;
}

/**
 * Hook to manage voting on a specific message
 */
export function useMessageVote(options: UseMessageVoteOptions): UseMessageVoteResult {
  const { threadId, messageId, autoFetch = false } = options;
  const { client } = useDistri();
  const [summary, setSummary] = useState<MessageVoteSummary | null>(null);
  const [loading, setLoading] = useState(autoFetch);
  const [error, setError] = useState<Error | null>(null);

  const refetch = useCallback(async () => {
    if (!client) {
      setError(new Error('Client not available'));
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const voteSummary = await client.getMessageVoteSummary(threadId, messageId);
      setSummary(voteSummary);
    } catch (err) {
      console.error('[useMessageVote] Failed to fetch vote summary:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch vote summary'));
    } finally {
      setLoading(false);
    }
  }, [client, threadId, messageId]);

  const vote = useCallback(
    async (voteType: VoteType, comment?: string) => {
      if (!client) {
        setError(new Error('Client not available'));
        return null;
      }

      try {
        setLoading(true);
        setError(null);
        const request: VoteMessageRequest = { vote_type: voteType, comment };
        const result = await client.voteMessage(threadId, messageId, request);

        // Update local summary optimistically
        setSummary((prev) => {
          if (!prev) {
            return {
              message_id: messageId,
              upvotes: voteType === 'upvote' ? 1 : 0,
              downvotes: voteType === 'downvote' ? 1 : 0,
              user_vote: voteType,
            };
          }

          const wasUpvote = prev.user_vote === 'upvote';
          const wasDownvote = prev.user_vote === 'downvote';
          const isUpvote = voteType === 'upvote';

          return {
            ...prev,
            upvotes: prev.upvotes + (isUpvote ? 1 : 0) - (wasUpvote ? 1 : 0),
            downvotes: prev.downvotes + (isUpvote ? 0 : 1) - (wasDownvote ? 1 : 0),
            user_vote: voteType,
          };
        });

        return result;
      } catch (err) {
        console.error('[useMessageVote] Failed to vote:', err);
        setError(err instanceof Error ? err : new Error('Failed to vote'));
        return null;
      } finally {
        setLoading(false);
      }
    },
    [client, threadId, messageId]
  );

  const upvote = useCallback(() => vote('upvote'), [vote]);

  const downvote = useCallback(
    (comment: string) => {
      if (!comment || comment.trim() === '') {
        setError(new Error('Downvotes require a comment'));
        return Promise.resolve(null);
      }
      return vote('downvote', comment);
    },
    [vote]
  );

  const removeVote = useCallback(async () => {
    if (!client) {
      setError(new Error('Client not available'));
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await client.removeVote(threadId, messageId);

      // Update local summary
      setSummary((prev) => {
        if (!prev) return prev;

        const wasUpvote = prev.user_vote === 'upvote';
        const wasDownvote = prev.user_vote === 'downvote';

        return {
          ...prev,
          upvotes: prev.upvotes - (wasUpvote ? 1 : 0),
          downvotes: prev.downvotes - (wasDownvote ? 1 : 0),
          user_vote: undefined,
        };
      });
    } catch (err) {
      console.error('[useMessageVote] Failed to remove vote:', err);
      setError(err instanceof Error ? err : new Error('Failed to remove vote'));
    } finally {
      setLoading(false);
    }
  }, [client, threadId, messageId]);

  return {
    summary,
    loading,
    error,
    upvote,
    downvote,
    removeVote,
    refetch,
  };
}

// ========== All Message Votes Hook (Admin/Analytics) ==========

export interface UseMessageVotesOptions {
  threadId: string;
  messageId: string;
  /**
   * Whether to fetch the votes automatically on mount.
   * Default: false
   */
  enabled?: boolean;
}

export interface UseMessageVotesResult {
  votes: MessageVote[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

/**
 * Hook to get all votes for a message (useful for admin/analytics)
 */
export function useMessageVotes(options: UseMessageVotesOptions): UseMessageVotesResult {
  const { threadId, messageId, enabled = false } = options;
  const { client } = useDistri();
  const [votes, setVotes] = useState<MessageVote[]>([]);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<Error | null>(null);

  const refetch = useCallback(async () => {
    if (!client) {
      setError(new Error('Client not available'));
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const result = await client.getMessageVotes(threadId, messageId);
      setVotes(result);
    } catch (err) {
      console.error('[useMessageVotes] Failed to fetch votes:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch votes'));
    } finally {
      setLoading(false);
    }
  }, [client, threadId, messageId]);

  return {
    votes,
    loading,
    error,
    refetch,
  };
}
