import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Send, Loader2, User, Bot, Square } from 'lucide-react';
import { useChat, DistriAgent, MessageMetadata, ToolResult, ToolCall, ToolCallState } from '@distri/react';
import MessageRenderer from './MessageRenderer';
import { ToolCallRenderer } from './ToolCallRenderer';
import { ExternalToolManager } from '@distri/react';

interface ChatProps {
  selectedThreadId: string;
  agent: DistriAgent;
  onThreadUpdate: (threadId: string) => void;
}

const Chat: React.FC<ChatProps> = ({ selectedThreadId, agent, onThreadUpdate }) => {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const {
    messages,
    loading,
    error,
    isStreaming,
    sendMessageStream,
    cancelToolExecution,
    toolCallStatus,
    pendingExternalToolCalls,
  } = useChat({
    agentId: agent.id,
    threadId: selectedThreadId,
    toolHandlers: {
      // Add any custom tool handlers here
    }
  });

  // Helper function to extract text from message parts
  const extractTextFromMessage = useCallback((message: any): string => {
    if (!message?.parts || !Array.isArray(message.parts)) {
      return '';
    }

    return message.parts
      .filter((part: any) => part?.kind === 'text' && part?.text)
      .map((part: any) => part.text)
      .join('') || '';
  }, []);

  // Helper function to check if message has valid content
  const hasValidContent = useCallback((message: any): boolean => {
    if (!message) return false;

    // Check if message has text parts with content
    const textContent = extractTextFromMessage(message);
    if (textContent.trim()) return true;

    // Check if assistant_response with tool calls
    if (message.metadata?.type === 'assistant_response' && message.metadata.tool_calls) {
      console.log('assistant_response with tool_calls: true', message);
      return true;
    }

    // Check if tool results
    if (message.metadata?.type === 'tool_results') {
      console.log('tool_results: true', message);
      return true;
    }

    return false;
  }, [extractTextFromMessage]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    if (selectedThreadId && messages.length > 0) {
      scrollToBottom();
    }
  }, [messages, selectedThreadId, scrollToBottom]);

  // Handle external tool completion
  const handleToolComplete = useCallback(async (results: ToolResult[]) => {
    try {
      console.log('Tool completion received:', results);

      // Update thread after tool results
      onThreadUpdate(selectedThreadId);
    } catch (error) {
      console.error('Failed to handle tool completion:', error);
    }
  }, [selectedThreadId, onThreadUpdate]);

  const sendMessage = useCallback(async () => {
    if (!input.trim() || loading || isStreaming) return;

    const messageText = input.trim();
    setInput('');

    try {
      await sendMessageStream(messageText);

      // Update thread after successful message
      onThreadUpdate(selectedThreadId);
    } catch (error) {
      console.error('Failed to send message:', error);
      // Re-add the input text if sending failed
      setInput(messageText);
    }
  }, [input, loading, isStreaming, sendMessageStream, onThreadUpdate, selectedThreadId]);

  // Memoize the rendered messages to prevent re-computation on every render
  const renderedMessages = useMemo(() => {
    const renderedToolCalls = new Set<string>();

    return messages.filter(hasValidContent).map((message: any, index: number) => {
      const meta = message.metadata;

      // Handle tool calls from assistant_response metadata
      if (
        meta &&
        meta.type === 'assistant_response' &&
        meta.tool_calls &&
        Array.isArray(meta.tool_calls)
      ) {
        // Render each tool call using toolCallStatus from the hashmap
        return meta.tool_calls.map((toolCall: any) => {
          if (!renderedToolCalls.has(toolCall.tool_call_id)) {
            renderedToolCalls.add(toolCall.tool_call_id);

            // Get tool call status from the hashmap using tool_call_id
            const toolCallState: ToolCallState = toolCallStatus[toolCall.tool_call_id] || {
              tool_call_id: toolCall.tool_call_id,
              tool_name: toolCall.tool_name,
              status: 'pending',
              input: toolCall.input,
              result: null,
              error: null,
            };

            // Map to the format expected by ToolCallRenderer
            const rendererToolCall = {
              tool_call_id: toolCallState.tool_call_id,
              tool_name: toolCallState.tool_name,
              args: toolCallState.input || '',
              result: toolCallState.result ? JSON.stringify(toolCallState.result) : undefined,
              running: toolCallState.status === 'pending' || toolCallState.status === 'executing'
            };

            return (
              <div key={`${message.messageId}-${toolCall.tool_call_id}`} className="flex justify-start">
                <ToolCallRenderer toolCall={rendererToolCall} />
              </div>
            );
          }
          return null;
        }).filter(Boolean);
      }

      // Normal message rendering (including external tools handled by MessageRenderer)
      const messageText = extractTextFromMessage(message);
      const isUser = message.role === 'user';
      const displayText = messageText || 'Empty message';

      // Don't render if no text and not a tool event
      if (!messageText && meta?.type !== 'assistant_response' && meta?.type !== 'tool_results') {
        return null;
      }

      return (
        <div
          key={message.messageId || `msg-${index}`}
          className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
        >
          <div className={`flex max-w-[80%] ${isUser ? 'flex-row-reverse' : 'flex-row'} gap-3`}>
            <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${isUser ? 'bg-blue-500' : 'bg-gray-300'
              }`}>
              {isUser ? (
                <User className="h-4 w-4 text-white" />
              ) : (
                <Bot className="h-4 w-4 text-gray-600" />
              )}
            </div>
            <div className={`rounded-2xl px-4 py-2 ${isUser
              ? 'bg-blue-500 text-white'
              : 'bg-gray-100 text-gray-900'
              }`}>
              <MessageRenderer
                content={displayText}
                className={isUser ? 'text-white' : ''}
                metadata={message.metadata}
              />
            </div>
          </div>
        </div>
      );
    }).filter(Boolean); // Remove null entries
  }, [messages, hasValidContent, toolCallStatus, extractTextFromMessage]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }, [sendMessage]);

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="border-b border-gray-200 p-4 bg-gray-50">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">{agent.name}</h2>
            <p className="text-sm text-gray-600">{agent.description}</p>
          </div>
          {(loading || isStreaming) && (
            <div className="flex items-center text-blue-600">
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              <span className="text-sm">Processing...</span>
            </div>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-700">Error: {error.message}</p>
          </div>
        )}

        {renderedMessages}

        {/* External Tool Manager */}
        {pendingExternalToolCalls.length > 0 && (
          <ExternalToolManager
            toolCalls={pendingExternalToolCalls}
            onToolComplete={handleToolComplete}
            onCancel={cancelToolExecution}
          />
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-gray-200 p-4 bg-gray-50">
        <div className="flex space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={loading || isStreaming}
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || loading || isStreaming}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center"
          >
            {isStreaming ? (
              <Square className="h-4 w-4" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Chat;