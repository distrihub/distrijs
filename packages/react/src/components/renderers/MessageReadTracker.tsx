import React, { useEffect, useRef } from 'react';
import { useMessageReadContext } from './MessageReadContext';

export interface MessageReadTrackerProps {
  messageId: string;
  /** Only track read status for this message if enabled */
  enabled?: boolean;
  /** Threshold for intersection (0-1). Default 0.5 means 50% visible */
  threshold?: number;
  /** Delay in ms before marking as read (prevents marking during fast scroll) */
  delay?: number;
  children: React.ReactNode;
}

/**
 * Wrapper component that tracks when a message comes into view
 * and automatically marks it as read using the MessageReadContext.
 *
 * Must be used inside a MessageReadProvider.
 */
export const MessageReadTracker: React.FC<MessageReadTrackerProps> = ({
  messageId,
  enabled = true,
  threshold = 0.5,
  delay = 500,
  children,
}) => {
  const readContext = useMessageReadContext();
  const ref = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasTriggered = useRef(false);

  useEffect(() => {
    // Skip if disabled, no context, no element, or already read
    if (!enabled || !readContext || !ref.current || !messageId) {
      return;
    }

    // Skip if already read (check from context)
    if (readContext.isRead(messageId)) {
      return;
    }

    const element = ref.current;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];

        if (entry.isIntersecting && !hasTriggered.current) {
          // Check again if already read (might have been marked while scrolling)
          if (readContext.isRead(messageId)) {
            return;
          }

          // Start delay timer when message becomes visible
          if (!timeoutRef.current) {
            timeoutRef.current = setTimeout(() => {
              hasTriggered.current = true;
              readContext.markAsRead(messageId);
              timeoutRef.current = null;
            }, delay);
          }
        } else if (!entry.isIntersecting) {
          // Clear timer if message scrolls out of view before delay completes
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
          }
        }
      },
      {
        threshold,
        root: null,
      }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [enabled, threshold, delay, messageId, readContext]);

  // Reset trigger flag if messageId changes
  useEffect(() => {
    hasTriggered.current = false;
  }, [messageId]);

  return (
    <div ref={ref} data-message-id={messageId}>
      {children}
    </div>
  );
};

export default MessageReadTracker;
