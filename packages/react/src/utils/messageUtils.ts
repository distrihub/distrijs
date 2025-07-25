// Utility functions for message handling

/**
 * Utility function to extract text content from message parts
 */
export const extractTextFromMessage = (message: any): string => {
  if (!message?.parts || !Array.isArray(message.parts)) {
    return '';
  }

  return message.parts
    .filter((part: any) => part?.kind === 'text' && part?.text)
    .map((part: any) => part.text)
    .join('') || '';
};

/**
 * Utility function to determine if a message should be displayed
 * Can be used by builders when creating custom chat components
 */
export const shouldDisplayMessage = (message: any, showDebugMessages: boolean = false): boolean => {
  if (!message) return false;

  // Always show user messages with content
  if (message.role === 'user') {
    const textContent = extractTextFromMessage(message);
    return textContent.trim().length > 0;
  }

  // Check if message has text content
  const textContent = extractTextFromMessage(message);
  if (textContent.trim()) return true;

  // Always show tool calls (visible by default, not just in debug mode)
  if (message.metadata?.type === 'assistant_response' && message.metadata.tool_calls) {
    return true;
  }

  // Show plan messages
  if (message.metadata?.type === 'plan' || message.metadata?.plan) {
    return true;
  }

  // Show other metadata messages only if debug is enabled
  if (message.metadata?.type && message.metadata.type !== 'assistant_response') {
    return showDebugMessages;
  }

  // Don't show empty messages
  return false;
};

/**
 * Utility function to determine message type for rendering
 */
export const getMessageType = (message: any): 'user' | 'assistant' | 'assistant_with_tools' | 'plan' | 'system' => {
  if (message.role === 'user') return 'user';
  
  if (message.metadata?.type === 'assistant_response' && message.metadata.tool_calls) {
    return 'assistant_with_tools';
  }
  
  if (message.metadata?.type === 'plan' || message.metadata?.plan) {
    return 'plan';
  }
  
  if (message.role === 'assistant') return 'assistant';
  
  return 'system';
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