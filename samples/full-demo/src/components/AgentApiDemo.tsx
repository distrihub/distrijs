import React from 'react';
import { Code } from 'lucide-react';

const AgentApiDemo: React.FC = () => {
  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Agent API Demo</h1>
        <p className="text-gray-600">
          Demonstration of direct API interactions with Distri agents.
        </p>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Code className="h-5 w-5 text-blue-600" />
          <h2 className="text-lg font-semibold">API Examples</h2>
        </div>
        
        <div className="space-y-6">
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-md font-medium mb-2">Coming Soon</h3>
            <p className="text-gray-600 text-sm">
              This demo will showcase direct API interactions with agents,
              including message sending, streaming responses, and tool execution.
            </p>
          </div>

          <div className="bg-gray-900 rounded-lg p-4">
            <pre className="text-sm text-green-400 overflow-x-auto">
              <code>{`// Example: Direct agent interaction
import { Agent } from '@distri/core';

const agent = await Agent.create('my-agent', client);
const response = await agent.invoke({
  message: { text: 'Hello!' },
  configuration: { blocking: false }
});`}</code>
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgentApiDemo;