import React, { useState, useEffect, useCallback } from 'react';
import { ThumbsUp, ThumbsDown, Loader2, MessageSquare } from 'lucide-react';
import { useMessageVote } from '../../hooks/useMessageFeedback';
import { cn } from '@/lib/utils';

export interface MessageFeedbackProps {
  threadId: string;
  messageId: string;
  /** Show the component in compact mode (icons only) */
  compact?: boolean;
  /** CSS class name */
  className?: string;
  /** Called when a vote is submitted */
  onVote?: (voteType: 'upvote' | 'downvote', comment?: string) => void;
}

/**
 * Message feedback component with thumbs up/down voting.
 * Downvotes require a comment explaining the issue.
 */
export const MessageFeedback: React.FC<MessageFeedbackProps> = ({
  threadId,
  messageId,
  compact = true,
  className,
  onVote,
}) => {
  const [showCommentInput, setShowCommentInput] = useState(false);
  const [comment, setComment] = useState('');
  const [pendingDownvote, setPendingDownvote] = useState(false);

  const {
    summary,
    loading,
    error,
    upvote,
    downvote,
    removeVote,
    refetch,
  } = useMessageVote({ threadId, messageId, autoFetch: false });

  // Fetch summary on mount
  useEffect(() => {
    refetch();
  }, [refetch]);

  const handleUpvote = useCallback(async () => {
    if (loading) return;

    // If already upvoted, remove the vote
    if (summary?.user_vote === 'upvote') {
      await removeVote();
    } else {
      const result = await upvote();
      if (result && onVote) {
        onVote('upvote');
      }
    }
  }, [loading, summary, upvote, removeVote, onVote]);

  const handleDownvoteClick = useCallback(() => {
    if (loading) return;

    // If already downvoted, remove the vote
    if (summary?.user_vote === 'downvote') {
      removeVote();
      return;
    }

    // Show comment input for new downvote
    setPendingDownvote(true);
    setShowCommentInput(true);
  }, [loading, summary, removeVote]);

  const handleDownvoteSubmit = useCallback(async () => {
    if (!comment.trim()) return;

    const result = await downvote(comment.trim());
    if (result) {
      setShowCommentInput(false);
      setComment('');
      setPendingDownvote(false);
      if (onVote) {
        onVote('downvote', comment.trim());
      }
    }
  }, [comment, downvote, onVote]);

  const handleCancelDownvote = useCallback(() => {
    setShowCommentInput(false);
    setComment('');
    setPendingDownvote(false);
  }, []);

  const isUpvoted = summary?.user_vote === 'upvote';
  const isDownvoted = summary?.user_vote === 'downvote';

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <div className="flex items-center gap-1">
        {/* Upvote button */}
        <button
          onClick={handleUpvote}
          disabled={loading}
          className={cn(
            'inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs transition-colors',
            'hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1',
            isUpvoted
              ? 'text-green-600 bg-green-50 dark:bg-green-950/30 dark:text-green-400'
              : 'text-muted-foreground hover:text-foreground',
            loading && 'opacity-50 cursor-not-allowed'
          )}
          title={isUpvoted ? 'Remove upvote' : 'Upvote this response'}
          aria-label={isUpvoted ? 'Remove upvote' : 'Upvote'}
          aria-pressed={isUpvoted}
        >
          {loading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <ThumbsUp className={cn('h-3.5 w-3.5', isUpvoted && 'fill-current')} />
          )}
          {!compact && summary && summary.upvotes > 0 && (
            <span>{summary.upvotes}</span>
          )}
        </button>

        {/* Downvote button */}
        <button
          onClick={handleDownvoteClick}
          disabled={loading}
          className={cn(
            'inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs transition-colors',
            'hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1',
            isDownvoted || pendingDownvote
              ? 'text-red-600 bg-red-50 dark:bg-red-950/30 dark:text-red-400'
              : 'text-muted-foreground hover:text-foreground',
            loading && 'opacity-50 cursor-not-allowed'
          )}
          title={isDownvoted ? 'Remove downvote' : 'Downvote this response'}
          aria-label={isDownvoted ? 'Remove downvote' : 'Downvote'}
          aria-pressed={isDownvoted}
        >
          {loading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <ThumbsDown className={cn('h-3.5 w-3.5', isDownvoted && 'fill-current')} />
          )}
          {!compact && summary && summary.downvotes > 0 && (
            <span>{summary.downvotes}</span>
          )}
        </button>
      </div>

      {/* Comment input for downvote */}
      {showCommentInput && (
        <div className="flex flex-col gap-2 p-3 bg-muted/50 rounded-lg border border-border/50">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <MessageSquare className="h-3.5 w-3.5" />
            <span>Please tell us what was wrong with this response</span>
          </div>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="e.g., The response was inaccurate because..."
            className={cn(
              'w-full min-h-[60px] px-3 py-2 text-sm rounded-md border border-input',
              'bg-background placeholder:text-muted-foreground',
              'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1',
              'resize-none'
            )}
            autoFocus
          />
          <div className="flex items-center gap-2 justify-end">
            <button
              onClick={handleCancelDownvote}
              className={cn(
                'px-3 py-1.5 text-xs rounded-md',
                'text-muted-foreground hover:text-foreground hover:bg-muted',
                'transition-colors'
              )}
            >
              Cancel
            </button>
            <button
              onClick={handleDownvoteSubmit}
              disabled={!comment.trim() || loading}
              className={cn(
                'px-3 py-1.5 text-xs rounded-md',
                'bg-primary text-primary-foreground',
                'hover:bg-primary/90 transition-colors',
                'disabled:opacity-50 disabled:cursor-not-allowed'
              )}
            >
              {loading ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                'Submit Feedback'
              )}
            </button>
          </div>
        </div>
      )}

      {/* Error display */}
      {error && (
        <div className="text-xs text-destructive">
          {error.message}
        </div>
      )}
    </div>
  );
};

export default MessageFeedback;
