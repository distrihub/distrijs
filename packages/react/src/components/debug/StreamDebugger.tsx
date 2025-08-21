import React, { useState, useEffect } from 'react';
import { useAgent, useChat } from '../../index';

interface StreamDebuggerProps {
  agentIdOrDef: string;
  className?: string;
}

export const StreamDebugger: React.FC<StreamDebuggerProps> = ({
  agentIdOrDef,
  className = ''
}) => {
  const { agent, loading: agentLoading } = useAgent({ agentIdOrDef });
  const { messages, sendMessage, isLoading } = useChat({ agent: agent });
  const [debugLogs, setDebugLogs] = useState<any[]>([]);
  const [testMessage, setTestMessage] = useState("Tell me about the founders of LangDB");

  // Intercept console.log calls to capture our debug messages
  useEffect(() => {
    const originalLog = console.log;
    const originalWarn = console.warn;

    console.log = (...args) => {
      // Check if this is one of our debug messages
      if (args[0] && typeof args[0] === 'string' &&
        (args[0].includes('🔍') || args[0].includes('⚡') || args[0].includes('📝') ||
          args[0].includes('✅') || args[0].includes('❌') || args[0].includes('📋') ||
          args[0].includes('🏪'))) {
        setDebugLogs(prev => [...prev, {
          type: 'log',
          timestamp: Date.now(),
          args: args
        }]);
      }
      originalLog(...args);
    };

    console.warn = (...args) => {
      if (args[0] && typeof args[0] === 'string' && args[0].includes('❌')) {
        setDebugLogs(prev => [...prev, {
          type: 'warn',
          timestamp: Date.now(),
          args: args
        }]);
      }
      originalWarn(...args);
    };

    return () => {
      console.log = originalLog;
      console.warn = originalWarn;
    };
  }, []);

  const handleSendMessage = async () => {
    setDebugLogs([]); // Clear previous logs
    console.log('🚀 Starting debug session for message:', testMessage);
    await sendMessage(testMessage);
  };

  const clearLogs = () => {
    setDebugLogs([]);
  };

  return (
    <div className={`p-6 border rounded-lg bg-gray-50 ${className}`}>
      <div className="mb-4">
        <h3 className="text-lg font-semibold mb-2">Stream Debugger</h3>
        <p className="text-sm text-gray-600 mb-4">
          Debug streaming message processing and event handling
        </p>

        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={testMessage}
            onChange={(e) => setTestMessage(e.target.value)}
            className="flex-1 px-3 py-2 border rounded"
            placeholder="Enter test message..."
          />
          <button
            onClick={handleSendMessage}
            disabled={agentLoading || isLoading}
            className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
          >
            {isLoading ? 'Sending...' : 'Send & Debug'}
          </button>
          <button
            onClick={clearLogs}
            className="px-4 py-2 bg-gray-500 text-white rounded"
          >
            Clear
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Debug Logs */}
        <div>
          <h4 className="font-semibold mb-2">Debug Messages ({debugLogs.length})</h4>
          <div className="max-h-96 overflow-y-auto bg-black text-green-400 p-3 rounded text-xs font-mono">
            {debugLogs.length === 0 ? (
              <div className="text-gray-500">No debug messages yet. Click "Send & Debug" to start.</div>
            ) : (
              debugLogs.map((log, index) => (
                <div key={index} className="mb-1">
                  <span className="text-gray-400">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </span>
                  {' '}
                  <span className={log.type === 'warn' ? 'text-yellow-400' : 'text-green-400'}>
                    {log.args.map((arg: any, _i: number) =>
                      typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
                    ).join(' ')}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Current Messages */}
        <div>
          <h4 className="font-semibold mb-2">Current Messages ({messages.length})</h4>
          <div className="max-h-96 overflow-y-auto bg-white border rounded p-3">
            {messages.length === 0 ? (
              <div className="text-gray-500">No messages yet.</div>
            ) : (
              messages.map((message, index) => (
                <div key={index} className="mb-3 p-2 border-l-2 border-blue-200">
                  <div className="text-xs text-gray-500 mb-1">
                    Message {index + 1} - {message?.role} - {message?.id}
                  </div>
                  <div className="text-sm">
                    {message.parts?.map((part: any, partIndex: number) => (
                      <div key={partIndex}>
                        <span className="text-xs bg-gray-100 px-1 rounded">{part.type}</span>
                        {part.type === 'text' && (
                          <div className="mt-1">{part.text}</div>
                        )}
                        {part.type === 'tool_call' && (
                          <div className="mt-1 text-blue-600">
                            Tool: {part.tool_call?.tool_name}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="mt-4 p-3 bg-blue-50 rounded text-sm">
        <h5 className="font-semibold mb-2">What to look for:</h5>
        <ul className="text-xs space-y-1">
          <li>• <strong>🔍 addMessage called with:</strong> Shows each message/event being processed</li>
          <li>• <strong>⚡ Processing event:</strong> Shows event types being handled</li>
          <li>• <strong>✅ Created new streaming message:</strong> Shows when streaming starts</li>
          <li>• <strong>📝 Processing text_message_content:</strong> Shows text deltas being appended</li>
          <li>• <strong>❌ Cannot find streaming message:</strong> Shows streaming failures</li>
          <li>• <strong>📋 Current messages before processing:</strong> Shows message array state</li>
        </ul>
      </div>
    </div>
  );
};