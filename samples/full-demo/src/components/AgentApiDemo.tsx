import React, { useState } from 'react';
import {
  Agent,
  useDistri,
  createBuiltinToolHandlers,
  createBuiltinApprovalHandler,
  ExternalToolHandler,
  ApprovalHandler
} from '@distri/react';
import { Play, FileUp, Mail, MessageSquare, AlertTriangle } from 'lucide-react';

const AgentApiDemo: React.FC = () => {
  const { client } = useDistri();
  const [agent, setAgent] = useState<Agent | null>(null);
  const [result, setResult] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [selectedAgentId, setSelectedAgentId] = useState('');

  // Example external tool handlers
  const externalToolHandlers: Record<string, ExternalToolHandler> = {
    ...createBuiltinToolHandlers(),

    // Custom handler example
    custom_tool: async (toolCall) => {
      const input = JSON.parse(toolCall.input);
      console.log('Custom tool called with:', input);
      return { success: true, message: 'Custom tool executed successfully' };
    }
  };

  // Example approval handler
  const approvalHandler: ApprovalHandler = createBuiltinApprovalHandler();

  const createAgent = async () => {
    if (!client || !selectedAgentId) return;

    try {
      setLoading(true);
      // Using the new Agent API
      const newAgent = await Agent.create(selectedAgentId, client);
      setAgent(newAgent);
      setResult(`Agent created: ${newAgent.name} (${newAgent.id})`);
    } catch (error) {
      setResult(`Error creating agent: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const invokeAgent = async (message: string, useStreaming = false) => {
    if (!agent) return;

    try {
      setLoading(true);
      setResult('Invoking agent...');

      if (useStreaming) {
        // Streaming invoke example
        const streamResult = await agent.invoke(message, {
          stream: true,
          externalToolHandlers,
          approvalHandler,
          contextId: 'demo-context'
        });

        if ('stream' in streamResult) {
          setResult('Streaming response...');

          // Handle the stream
          for await (const event of streamResult.stream) {
            if (event.kind === 'message') {
              const parts = event.parts.filter(p => p.kind === 'text').map(p => p.text).join('');
              if (parts) {
                setResult(prev => prev + '\n' + parts);
              }
            }
          }
        }
      } else {
        // Direct invoke example
        const result = await agent.invoke(message, {
          stream: false,
          externalToolHandlers,
          approvalHandler,
          contextId: 'demo-context'
        });

        if ('message' in result && result.message) {
          const responseText = result.message.parts
            .filter(p => p.kind === 'text')
            .map(p => p.text)
            .join('');
          setResult(responseText || 'No text response');
        } else if ('task' in result && result.task) {
          setResult(`Task created: ${result.task.id}`);
        } else {
          setResult('No response received');
        }
      }
    } catch (error) {
      setResult(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const listAgents = async () => {
    if (!client) return;

    try {
      setLoading(true);
      const agents = await Agent.list(client);
      setResult(`Available agents:\n${agents.map(a => `- ${a.name} (${a.id})`).join('\n')}`);
    } catch (error) {
      setResult(`Error listing agents: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Agent API Demo</h2>
        <p className="text-gray-600 mb-6">
          Demonstrating the new Agent API with nice syntax like <code className="bg-gray-100 px-2 py-1 rounded">new Agent()</code> and{' '}
          <code className="bg-gray-100 px-2 py-1 rounded">agent.invoke()</code>
        </p>

        {/* Agent Creation */}
        <div className="border rounded-lg p-4 mb-6">
          <h3 className="text-lg font-semibold mb-3">1. Create Agent</h3>
          <div className="flex gap-3 mb-3">
            <input
              type="text"
              placeholder="Enter agent ID"
              value={selectedAgentId}
              onChange={(e) => setSelectedAgentId(e.target.value)}
              className="flex-1 border border-gray-300 rounded px-3 py-2"
            />
            <button
              onClick={createAgent}
              disabled={loading || !selectedAgentId}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-gray-300"
            >
              Create Agent
            </button>
          </div>
          <button
            onClick={listAgents}
            disabled={loading}
            className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 disabled:bg-gray-300"
          >
            List Available Agents
          </button>
        </div>

        {/* Agent Information */}
        {agent && (
          <div className="border rounded-lg p-4 mb-6 bg-green-50">
            <h3 className="text-lg font-semibold mb-3">Agent Information</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <strong>Name:</strong> {agent.name}
              </div>
              <div>
                <strong>ID:</strong> {agent.id}
              </div>
              <div className="col-span-2">
                <strong>Description:</strong> {agent.description || 'No description'}
              </div>
              <div className="col-span-2">
                <strong>External Tools:</strong> {agent.externalTools.length > 0
                  ? agent.externalTools.map(t => t.name).join(', ')
                  : 'None'}
              </div>
            </div>
          </div>
        )}

        {/* Invoke Examples */}
        {agent && (
          <div className="border rounded-lg p-4 mb-6">
            <h3 className="text-lg font-semibold mb-3">2. Invoke Agent</h3>
            <div className="space-y-3">
              <button
                onClick={() => invokeAgent('Hello! Please introduce yourself.')}
                disabled={loading}
                className="w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-gray-300 flex items-center justify-center gap-2"
              >
                <Play className="w-4 h-4" />
                Simple Invoke (Direct)
              </button>

              <button
                onClick={() => invokeAgent('Hello! Please introduce yourself.', true)}
                disabled={loading}
                className="w-full bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600 disabled:bg-gray-300 flex items-center justify-center gap-2"
              >
                <Play className="w-4 h-4" />
                Simple Invoke (Streaming)
              </button>

              <button
                onClick={() => invokeAgent('Please upload a file for me to analyze.')}
                disabled={loading}
                className="w-full bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:bg-gray-300 flex items-center justify-center gap-2"
              >
                <FileUp className="w-4 h-4" />
                Test File Upload Tool
              </button>

              <button
                onClick={() => invokeAgent('Send an email to john@example.com with subject "Test".')}
                disabled={loading}
                className="w-full bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600 disabled:bg-gray-300 flex items-center justify-center gap-2"
              >
                <Mail className="w-4 h-4" />
                Test Email Tool
              </button>

              <button
                onClick={() => invokeAgent('Ask me for additional input.')}
                disabled={loading}
                className="w-full bg-cyan-500 text-white px-4 py-2 rounded hover:bg-cyan-600 disabled:bg-gray-300 flex items-center justify-center gap-2"
              >
                <MessageSquare className="w-4 h-4" />
                Test Input Request Tool
              </button>

              <button
                onClick={() => invokeAgent('Perform a dangerous operation that requires approval.')}
                disabled={loading}
                className="w-full bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 disabled:bg-gray-300 flex items-center justify-center gap-2"
              >
                <AlertTriangle className="w-4 h-4" />
                Test Approval Request
              </button>
            </div>
          </div>
        )}

        {/* Code Example */}
        <div className="border rounded-lg p-4 mb-6 bg-gray-50">
          <h3 className="text-lg font-semibold mb-3">Code Example</h3>
          <pre className="text-sm text-gray-700 overflow-x-auto">
            {`// Create an agent
const agent = await Agent.create('my-agent-id', client);

// Simple invoke
const result = await agent.invoke('Hello!', {
  stream: false,
  contextId: 'my-context'
});

// Invoke with external tool handlers
const result = await agent.invoke('Upload a file', {
  stream: false,
  externalToolHandlers: {
    file_upload: async (toolCall) => {
      // Handle file upload
      return { success: true, files: [...] };
    }
  },
  approvalHandler: async (toolCalls, reason) => {
    // Handle approval request
    return confirm(\`Approve: \${reason}?\`);
  }
});

// Streaming invoke
const streamResult = await agent.invoke('Hello!', {
  stream: true,
  contextId: 'my-context'
});

for await (const event of streamResult.stream) {
  if (event.kind === 'message') {
    console.log('Received:', event.parts);
  }
}`}
          </pre>
        </div>

        {/* Result */}
        <div className="border rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-3">Result</h3>
          <div className="bg-gray-100 p-4 rounded min-h-[100px] font-mono text-sm whitespace-pre-wrap">
            {loading ? 'Loading...' : result || 'No result yet'}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgentApiDemo;