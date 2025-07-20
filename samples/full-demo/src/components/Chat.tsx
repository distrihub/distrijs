import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader2, User, Bot, Square } from 'lucide-react';
import { useChat, DistriAgent, DistriClient, MessageMetadata } from '@distri/react';
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

  // Use the new hooks - useChat automatically handles selectedThreadId changes
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

    // Check if tool_call_start (DistriEvent format)
    if (message.metadata?.type === 'tool_call_start') {
      console.log('tool_call_start: true', message);
      return true;
    }

    // Check if external tool calls
    if (message.metadata?.type === 'external_tool_calls') {
      console.log('external_tool_calls: true', message);
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

  // Handle external tool responses
  const handleToolResponse = async (toolCallId: string, result: any) => {
    try {
      // Create a tool response message
      const responseMessage = DistriClient.initMessage('', 'user', selectedThreadId);
      responseMessage.metadata = {
        type: 'tool_response',
        tool_call_id: toolCallId,
        result: typeof result === 'string' ? result : JSON.stringify(result)
      } as MessageMetadata;

      // Send the response back to the agent
      await sendMessageStream('', {
        acceptedOutputModes: ['text/plain'],
        blocking: false
      });

      // Refresh messages to show the response
      onThreadUpdate(selectedThreadId);
    } catch (error) {
      console.error('Failed to send tool response:', error);
    }
  };

  // Handle approval responses
  const handleApprovalResponse = async (approved: boolean, reason?: string) => {
    try {
      // Send approval response
      console.log('Approval response:', { approved, reason });
      
      // Refresh messages after approval
      onThreadUpdate(selectedThreadId);
    } catch (error) {
      console.error('Failed to send approval response:', error);
    }
  };

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
            const isUser = message.role === 'user';
            const displayText = messageText || (message.metadata?.type === 'external_tool_calls' ? '' : 'Empty message');

            if (!messageText && message.metadata?.type !== 'external_tool_calls') {
              return null;
            }

            return (
              <div
                key={message.messageId || `msg-${index}`}
                className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex max-w-[80%] ${isUser ? 'flex-row-reverse' : 'flex-row'} gap-3`}>
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                    isUser ? 'bg-blue-500' : 'bg-gray-300'
                  }`}>
                    {isUser ? (
                      <User className="h-4 w-4 text-white" />
                    ) : (
                      <Bot className="h-4 w-4 text-gray-600" />
                    )}
                  </div>
                  <div className={`rounded-2xl px-4 py-2 ${
                    isUser 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-gray-100 text-gray-900'
                  }`}>
                    <MessageRenderer 
                      content={displayText} 
                      className={isUser ? 'text-white' : ''}
                      metadata={message.metadata}
                      onToolResponse={handleToolResponse}
                      onApprovalResponse={handleApprovalResponse}
                    />
                  </div>
                </div>
              </div>
            );
          });
        })()}

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