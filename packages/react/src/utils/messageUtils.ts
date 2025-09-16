// Utility functions for message handling

import { DistriStreamEvent, isDistriMessage, isDistriEvent } from "@distri/core";

/**
 * Utility function to extract text content from message parts
 */
export const extractTextFromMessage = (message: DistriStreamEvent): string => {
  if (isDistriMessage(message)) {
    if (!message?.parts || !Array.isArray(message.parts)) {
      return '';
    }

    const textParts = message.parts
      .filter((part: any) => part?.type === 'text' && part?.text)
      .map((part: any) => part.text);

    return textParts.join('') || '';
  } else {
    return JSON.stringify(message);
  }
};

/**
 * Utility function to determine if a message should be displayed
 * Can be used by builders when creating custom chat components
 */
export const shouldDisplayMessage = (message: DistriStreamEvent, showDebugMessages: boolean = false): boolean => {
  if (!message) return false;

  // Always display events
  if (isDistriEvent(message)) {
    return true;
  }

  if (isDistriMessage(message)) {
    // Check if message has text content
    const textContent = extractTextFromMessage(message);
    if (textContent.trim()) return true;
  }
  return showDebugMessages;
};


/**
 * Utility function to format timestamps
 */
export const formatTimestamp = (timestamp: string | number | Date): string => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

/**
 * Utility function to scroll to bottom of chat
 */
export const scrollToBottom = (element: HTMLElement | null, _behavior: ScrollBehavior = 'smooth') => {
  if (element) {
    element.scrollTop = element.scrollHeight;
  }
};