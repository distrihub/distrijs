import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { Send, Bot, User, Loader2, AlertCircle } from 'lucide-react';
import { useChat } from '../useChat';
import MessageRenderer from './MessageRenderer';
import ExternalToolManager from './ExternalToolManager';
import { Agent, ToolCall } from '@distri/core';
import { DistriThread } from '@distri/core';

export interface ChatProps {
  thread: DistriThread;
  agent: Agent;
  onThreadUpdate?: () => void;
}

const ChatContent: React.FC<ChatProps> = ({
  thread,
  agent,
  onThreadUpdate
}) => {
  const [input, setInput] = useState('');
  const [hasExternalTools, setHasExternalTools] = useState(false);

  const handleToolCalls = useCallback((toolCalls: ToolCall[]) => {
    setHasExternalTools(toolCalls.length > 0);
  }, []);

  const {
    messages,
    loading,
    error,
    sendMessageStream,
    externalToolCalls,
    handleExternalToolComplete,
    handleExternalToolCancel,
  } = useChat({
    agentId: agent.id,
    threadId: thread.id,
    agent,
    onToolCalls: handleToolCalls
  });

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const message = input.trim();
    setInput('');
    
    try {
      await sendMessageStream(message);
      onThreadUpdate?.();
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  }, [input, loading, sendMessageStream, onThreadUpdate]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as any);
    }
  }, [handleSubmit]);

  // Filter messages for display
  const displayMessages = useMemo(() => {
    return messages.filter(msg => {
      // Show user messages
      if (msg.role === 'user') return true;
      
      // Show assistant messages with content
      if (msg.role === 'assistant') {
        const hasContent = msg.parts?.some(part => 
          (part.kind === 'text' && part.text?.trim()) ||
          part.kind === 'image'
        );
        return hasContent;
      }
      
      return false;
    });
  }, [messages]);

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="flex-shrink-0 px-4 py-3 border-b bg-gray-50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <Bot className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h2 className="font-semibold text-gray-900">{agent.name}</h2>
            <p className="text-sm text-gray-500">{agent.description}</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <span className="text-red-700">{error.message}</span>
          </div>
        )}

        {displayMessages.length === 0 && !loading && (
          <div className="text-center py-8">
            <Bot className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500">Start a conversation with {agent.name}</p>
          </div>
        )}

        {displayMessages.map((message, index) => (
          <div
            key={`${message.messageId}-${index}`}
            className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {message.role === 'assistant' && (
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Bot className="w-5 h-5 text-blue-600" />
              </div>
            )}
            
            <div className={`max-w-[80%] ${message.role === 'user' ? 'order-first' : ''}`}>
              <div
                className={`rounded-lg px-4 py-2 ${
                  message.role === 'user'
                    ? 'bg-blue-600 text-white ml-auto'
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                <MessageRenderer 
                  message={message} 
                  isUser={message.role === 'user'}
                  isStreaming={loading && index === displayMessages.length - 1}
                />
              </div>
            </div>

            {message.role === 'user' && (
              <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                <User className="w-5 h-5 text-gray-600" />
              </div>
            )}
          </div>
        ))}

        {loading && displayMessages.length === 0 && (
          <div className="flex gap-3">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <Bot className="w-5 h-5 text-blue-600" />
            </div>
            <div className="bg-gray-100 rounded-lg px-4 py-2">
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-gray-600">Thinking...</span>
              </div>
            </div>
          </div>
        )}

        {/* External Tool Manager */}
        {externalToolCalls.length > 0 && (
          <ExternalToolManager
            agent={agent}
            toolCalls={externalToolCalls}
            onToolComplete={handleExternalToolComplete}
            onCancel={handleExternalToolCancel}
          />
        )}
      </div>

      {/* Input */}
      <div className="flex-shrink-0 border-t bg-white p-4">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <div className="flex-1 relative">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Message ${agent.name}...`}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={1}
              disabled={loading || hasExternalTools}
              style={{ 
                minHeight: '40px',
                maxHeight: '120px',
                height: 'auto'
              }}
            />
          </div>
          <button
            type="submit"
            disabled={!input.trim() || loading || hasExternalTools}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[40px]"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </form>
        
        {hasExternalTools && (
          <div className="mt-2 text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded px-3 py-2">
            Please respond to the tool requests above before sending a new message.
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatContent;