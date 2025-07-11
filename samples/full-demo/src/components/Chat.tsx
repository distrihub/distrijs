import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader2, User, Bot, Square } from 'lucide-react';
import { useChat, DistriAgent } from '@distri/react';
import MessageRenderer from './MessageRenderer';
import { ToolCallRenderer, ToolCallState } from './ToolCallRenderer';

interface ChatProps {
  selectedThreadId: string;
  agent: DistriAgent;
  onThreadUpdate: (threadId: string) => void;
}
const Chat: React.FC<ChatProps> = ({ selectedThreadId, agent, onThreadUpdate }) => {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    refreshMessages();
  }, [selectedThreadId]);

  // Use the new hooks
  const {
    messages,
    loading,
    refreshMessages,
    error,
    isStreaming,
    sendMessageStream,
  } = useChat({ agentId: agent.id, contextId: selectedThreadId });

  // Helper function to extract text from message parts
  const extractTextFromMessage = (message: any): string => {
    if (!message?.parts || !Array.isArray(message.parts)) {
      return '';
    }

    return message.parts
      .filter((part: any) => part?.kind === 'text' && part?.text)
      .map((part: any) => part.text)
      .join('') || '';
  };

  // Helper function to check if message has valid content
  const hasValidContent = (message: any): boolean => {
    if (!message) return false;

    // Check if message has text parts with content
    const textContent = extractTextFromMessage(message);
    if (textContent.trim()) return true;

    // Check if tool_call_start
    if (message.metadata?.type === 'tool_call_start') {
      console.log('tool_call_start: true', message);
      return true;
    }

    return false;
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (selectedThreadId && messages.length > 0) {
      scrollToBottom();
    }
  }, [messages, selectedThreadId]);

  // Load thread messages when thread changes
  useEffect(() => {
    // Only refresh if the thread id actually changes (not during streaming)
    if (selectedThreadId) {
      refreshMessages();
    }
    // Do NOT refresh on every message or streaming update
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedThreadId]);


  const sendMessage = async () => {
    if (!input.trim() || loading || isStreaming) return;

    const messageText = input.trim();
    setInput('');

    try {
      await sendMessageStream(messageText, {
        acceptedOutputModes: ['text/plain'],
        blocking: false
      });

      // Update thread after successful message
      onThreadUpdate(selectedThreadId);
    } catch (error) {
      console.error('Failed to send message:', error);
      // Re-add the input text if sending failed
      setInput(messageText);
    }
  };
  const toolCallEventTypes = [
    'tool_call_start',
    'tool_call_args',
    'tool_call_result',
    'tool_call_end',
  ];


  const buildToolCallStatus = (messages: any[]): Record<string, ToolCallState> => {
    const toolCallStatus: Record<string, ToolCallState> = {};

    messages.forEach((message) => {
      const meta = message.metadata;
      if (
        meta &&
        toolCallEventTypes.includes(String(meta.type)) &&
        meta.data &&
        typeof meta.data === 'object' &&
        'tool_call_id' in meta.data
      ) {
        const data = meta.data as any;
        const tool_call_id = data.tool_call_id;
        if (!toolCallStatus[tool_call_id]) {
          toolCallStatus[tool_call_id] = {
            tool_call_id,
            tool_name: undefined,
            args: '',
            result: undefined,
            running: true,
          };
        }
        if (meta.type === 'tool_call_start' && typeof data.tool_call_name === 'string') {
          toolCallStatus[tool_call_id].tool_name = data.tool_call_name;
          toolCallStatus[tool_call_id].running = true;
        }
        if (meta.type === 'tool_call_args' && typeof data.delta === 'string') {
          toolCallStatus[tool_call_id].args += data.delta;
        }
        if (meta.type === 'tool_call_result' && typeof data.result === 'string') {
          toolCallStatus[tool_call_id].running = false;
          toolCallStatus[tool_call_id].result = data.result;
        }
      }
    });

    return toolCallStatus;
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="bg-white rounded-lg shadow h-full flex flex-col">
      {/* Chat Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
            <Bot className="h-4 w-4 text-white" />
          </div>
          <div>
            <p className="text-sm text-gray-500">with {agent.name}</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {(messages.length === 0 && !loading && !isStreaming) && (
          <div className="flex flex-col items-center justify-center h-full py-8">
            <MessageRenderer content={''} className="" />
            <div className="flex flex-col items-center mt-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-300 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8s-9-3.582-9-8 4.03-8 9-8 9 3.582 9 8z" /></svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Start a new conversation</h3>
              <p className="text-gray-500 text-sm">Type a message to begin chatting with {agent.name}.</p>
            </div>
          </div>
        )}


        {(() => {
          // 1. Build toolCallStatus and toolCallNameMap in a single pass
          const toolCallStatus = buildToolCallStatus(messages);
          // 2. Render messages, only render ToolCallRenderer for first occurrence of each tool_call_id
          const renderedToolCalls = new Set<string>();
          return messages.filter(hasValidContent).map((message: any, index: number) => {
            const meta = message.metadata;
            let tool_call_id: string | undefined;
            if (
              meta &&
              toolCallEventTypes.includes(String(meta.type)) &&
              meta.data &&
              typeof meta.data === 'object' &&
              'tool_call_id' in meta.data
            ) {
              tool_call_id = (meta.data as any).tool_call_id;
            }
            if (tool_call_id && !renderedToolCalls.has(tool_call_id)) {
              renderedToolCalls.add(tool_call_id);
              return (
                <div key={message.messageId || `msg-${index}`} className="flex justify-start">
                  <ToolCallRenderer toolCall={toolCallStatus[tool_call_id]} />
                </div>
              );
            }
            // Normal message rendering
            const messageText = extractTextFromMessage(message);
            const isError = messageText.startsWith('Error:') || (messageText.includes('error') && message.role === 'agent');
            return (
              <div
                key={message.messageId || `msg-${index}`}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[70%] rounded-lg px-4 py-2 ${message.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : isError
                      ? 'bg-red-100 text-red-800 border border-red-300'
                      : 'bg-gray-100 text-gray-900'
                    }`}
                >
                  <div className="flex items-start space-x-2">
                    {message.role === 'agent' && (
                      <Bot className={`h-4 w-4 mt-0.5 flex-shrink-0 ${isError ? 'text-red-600' : ''}`} />
                    )}
                    {message.role === 'user' && (
                      <User className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    )}
                    <div className="flex-1">
                      <MessageRenderer
                        content={messageText}
                        className={isError ? 'font-semibold' : ''}
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          });
        })()}



        {loading && !isStreaming && (
          <div className="flex justify-start">
            <div className="flex items-center space-x-2 text-gray-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">Loading...</span>
            </div>
          </div>
        )}

        {error && (
          <div className="flex justify-start">
            <div className="max-w-[70%] rounded-lg px-4 py-2 bg-red-100 text-red-800 border border-red-300">
              <div className="flex items-start space-x-2">
                <Bot className="h-4 w-4 mt-0.5 flex-shrink-0 text-red-600" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Error: {error.message}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t">
        <div className="flex space-x-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={`Message ${agent.name}...`}
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={1}
            disabled={loading || isStreaming}
          />
          {isStreaming ? (
            <button
              onClick={() => {
                if (abortControllerRef.current) {
                  abortControllerRef.current.abort();
                }
              }}
              className="bg-orange-100 text-orange-500 rounded-lg px-4 py-2 hover:bg-orange-200 flex items-center justify-center"
              title="Stop streaming"
            >
              <Square className="h-5 w-5 animate-pulse" />
            </button>
          ) : (
            <button
              onClick={sendMessage}
              disabled={!input.trim() || loading}
              className="bg-blue-600 text-white rounded-lg px-4 py-2 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Chat;