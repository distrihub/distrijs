import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader2, User, Bot } from 'lucide-react';
import { useTask, useThreadMessages, DistriAgent, DistriThread } from '@distri/react';
import MessageRenderer from './MessageRenderer';

interface ChatProps {
  thread: DistriThread;
  agent: DistriAgent;
  onThreadUpdate?: () => void;
}

const Chat: React.FC<ChatProps> = ({ thread, agent, onThreadUpdate }) => {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Use the new hooks
  const { 
    messages: taskMessages, 
    loading: taskLoading, 
    error: taskError,
    isStreaming,
    sendMessageStream,
    clearMessages 
  } = useTask({ agentId: agent.id });
  
  const { 
    messages: threadMessages, 
    loading: threadLoading,
    refetch: refetchMessages 
  } = useThreadMessages({ threadId: thread.id });

  // Combine task messages (current conversation) with thread messages (historical)
  const allMessages = [...threadMessages, ...taskMessages];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [allMessages]);

  // Load thread messages when thread changes
  useEffect(() => {
    if (thread.id) {
      refetchMessages();
      clearMessages(); // Clear task messages when switching threads
    }
  }, [thread.id, refetchMessages, clearMessages]);

  const sendMessage = async () => {
    if (!input.trim() || taskLoading || isStreaming) return;

    const messageText = input.trim();
    setInput('');

    try {
      // Use streaming for real-time updates
      await sendMessageStream(messageText, {
        contextId: thread.id, // Associate with the thread
        acceptedOutputModes: ['text/plain'],
        blocking: false
      });

      // Update thread after successful message
      if (onThreadUpdate) {
        onThreadUpdate();
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      // Re-add the input text if sending failed
      setInput(messageText);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const loading = taskLoading || threadLoading;

  return (
    <div className="bg-white rounded-lg shadow h-full flex flex-col">
      {/* Chat Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
            <Bot className="h-4 w-4 text-white" />
          </div>
          <div>
            <h3 className="font-medium text-gray-900">{thread.title}</h3>
            <p className="text-sm text-gray-500">with {agent.name}</p>
          </div>
        </div>
        <div className={`w-2 h-2 rounded-full ${agent.status === 'online' ? 'bg-green-400' : 'bg-gray-400'}`} />
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {allMessages.length === 0 && !loading && (
          <div className="text-center py-8">
            <Bot className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Start a conversation with {agent.name}</p>
            <p className="text-sm text-gray-400 mt-1">
              Thread: "{thread.title}"
            </p>
          </div>
        )}

        {allMessages.filter(message => message.parts && message.parts.length > 0).map((message, index) => {
          // Determine if this is an error message
          const messageText = message.parts?.[0]?.text || '';
          const isError = messageText.startsWith('Error:');
          
          return (
            <div
              key={message.messageId || `msg-${index}`}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[70%] rounded-lg px-4 py-2 ${
                  message.role === 'user'
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
                    {message.metadata?.timestamp && (
                      <p className={`text-xs mt-1 ${
                        message.role === 'user'
                          ? 'text-blue-200'
                          : isError
                          ? 'text-red-600'
                          : 'text-gray-500'
                      }`}>
                        {new Date(message.metadata.timestamp as string).toLocaleTimeString()}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {(loading || isStreaming) && (
          <div className="flex justify-start">
            <div className="flex items-center space-x-2 text-gray-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">
                {isStreaming ? 'Agent is responding...' : 'Loading...'}
              </span>
            </div>
          </div>
        )}

        {taskError && (
          <div className="flex justify-start">
            <div className="max-w-[70%] rounded-lg px-4 py-2 bg-red-100 text-red-800 border border-red-300">
              <p className="text-sm font-medium">Error: {taskError.message}</p>
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
          <button
            onClick={sendMessage}
            disabled={!input.trim() || loading || isStreaming}
            className="bg-blue-600 text-white rounded-lg px-4 py-2 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
          >
            {loading || isStreaming ? (
              <Loader2 className="h-4 w-4 animate-spin" />
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