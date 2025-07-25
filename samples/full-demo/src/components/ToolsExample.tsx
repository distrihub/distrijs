import React, { useEffect, useState } from 'react';
import { useAgent, useTools, createTool, createBuiltinTools, Chat } from '@distri/react';
import { Wrench, Plus, Minus, Calculator } from 'lucide-react';

const ToolsExample: React.FC = () => {
  const { agent, loading } = useAgent({ agentId: 'assistant' });
  const { addTools, addTool, getTools, removeTool } = useTools({ agent });
  const [registeredTools, setRegisteredTools] = useState<string[]>([]);

  // Register tools when agent is ready
  useEffect(() => {
    if (agent) {
      // Add built-in tools
      const builtinTools = createBuiltinTools();
      addTools([builtinTools.confirm, builtinTools.input, builtinTools.notify]);

      // Add custom calculator tools
      const calculatorTools = [
        createTool(
          'add',
          'Add two numbers',
          {
            type: 'object',
            properties: {
              a: { type: 'number', description: 'First number' },
              b: { type: 'number', description: 'Second number' }
            },
            required: ['a', 'b']
          },
          async (input: { a: number; b: number }) => {
            const result = input.a + input.b;
            return { result, calculation: `${input.a} + ${input.b} = ${result}` };
          }
        ),

        createTool(
          'multiply',
          'Multiply two numbers',
          {
            type: 'object',
            properties: {
              a: { type: 'number', description: 'First number' },
              b: { type: 'number', description: 'Second number' }
            },
            required: ['a', 'b']
          },
          async (input: { a: number; b: number }) => {
            const result = input.a * input.b;
            return { result, calculation: `${input.a} × ${input.b} = ${result}` };
          }
        ),

        createTool(
          'random_number',
          'Generate a random number within a range',
          {
            type: 'object',
            properties: {
              min: { type: 'number', description: 'Minimum value', default: 1 },
              max: { type: 'number', description: 'Maximum value', default: 100 }
            }
          },
          async (input: { min?: number; max?: number }) => {
            const min = input.min || 1;
            const max = input.max || 100;
            const result = Math.floor(Math.random() * (max - min + 1)) + min;
            return { result, range: `${min}-${max}` };
          }
        ),

        createTool(
          'current_time',
          'Get the current date and time',
          {
            type: 'object',
            properties: {
              format: { 
                type: 'string', 
                enum: ['iso', 'locale', 'timestamp'], 
                default: 'locale',
                description: 'Time format'
              }
            }
          },
          async (input: { format?: string }) => {
            const now = new Date();
            const format = input.format || 'locale';
            
            let formattedTime: string;
            switch (format) {
              case 'iso':
                formattedTime = now.toISOString();
                break;
              case 'timestamp':
                formattedTime = now.getTime().toString();
                break;
              default:
                formattedTime = now.toLocaleString();
            }
            
            return { time: formattedTime, format, timestamp: now.getTime() };
          }
        )
      ];

      addTools(calculatorTools);
      
      // Update registered tools list
      setRegisteredTools(getTools());
    }
  }, [agent, addTools, addTool, getTools]);

  // Update registered tools when they change
  useEffect(() => {
    if (agent) {
      setRegisteredTools(getTools());
    }
  }, [agent, getTools]);

  const handleRemoveTool = (toolName: string) => {
    removeTool(toolName);
    setRegisteredTools(getTools());
  };

  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="inline-flex items-center space-x-2">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
          <span>Loading agent...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Tools Example</h1>
        <p className="text-gray-600">
          Demonstration of the new simplified tool system. Tools are registered directly on the agent
          and executed automatically when called by the AI.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tool Registration Panel */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center space-x-2 mb-4">
              <Wrench className="h-5 w-5 text-blue-600" />
              <h2 className="text-lg font-semibold">Registered Tools</h2>
            </div>
            
            <div className="space-y-2">
              {registeredTools.map((toolName) => (
                <div key={toolName} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <div className="flex items-center space-x-2">
                    {toolName.includes('add') && <Plus className="h-4 w-4 text-green-600" />}
                    {toolName.includes('multiply') && <Calculator className="h-4 w-4 text-purple-600" />}
                    {toolName.includes('confirm') && <span className="h-4 w-4 text-blue-600">✓</span>}
                    {toolName.includes('input') && <span className="h-4 w-4 text-orange-600">📝</span>}
                    {toolName.includes('notify') && <span className="h-4 w-4 text-green-600">🔔</span>}
                    {toolName.includes('random') && <span className="h-4 w-4 text-red-600">🎲</span>}
                    {toolName.includes('time') && <span className="h-4 w-4 text-indigo-600">⏰</span>}
                    <span className="text-sm font-medium">{toolName}</span>
                  </div>
                  <button
                    onClick={() => handleRemoveTool(toolName)}
                    className="text-red-600 hover:text-red-800 text-sm"
                    title="Remove tool"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>

            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h3 className="text-sm font-semibold text-blue-900 mb-2">Available Tools</h3>
              <ul className="text-xs text-blue-800 space-y-1">
                <li>• <strong>add</strong> - Add two numbers</li>
                <li>• <strong>multiply</strong> - Multiply two numbers</li>
                <li>• <strong>random_number</strong> - Generate random number</li>
                <li>• <strong>current_time</strong> - Get current time</li>
                <li>• <strong>confirm</strong> - Ask for confirmation</li>
                <li>• <strong>input</strong> - Request user input</li>
                <li>• <strong>notify</strong> - Show notification</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Chat Panel */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-200 bg-gray-50">
              <h2 className="text-lg font-semibold">Chat with Tools</h2>
              <p className="text-sm text-gray-600 mt-1">
                Try asking: "Add 5 and 3", "What time is it?", "Generate a random number between 1 and 10"
              </p>
            </div>
            
            <div style={{ height: '600px' }}>
              {agent && (
                <Chat
                  agentId="assistant"
                  threadId="tools-demo"
                  agent={agent}
                  height="600px"
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Example Code */}
      <div className="mt-8 bg-gray-900 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Example Code</h3>
        <pre className="text-sm text-gray-300 overflow-x-auto">
          <code>{`import { useAgent, useTools, createTool } from '@distri/react';

function MyComponent() {
  const { agent } = useAgent({ agentId: 'my-agent' });
  const { addTool } = useTools({ agent });

  useEffect(() => {
    if (agent) {
      addTool(createTool(
        'add',
        'Add two numbers',
        {
          type: 'object',
          properties: {
            a: { type: 'number' },
            b: { type: 'number' }
          },
          required: ['a', 'b']
        },
        async (input) => {
          return { result: input.a + input.b };
        }
      ));
    }
  }, [agent, addTool]);

  return <Chat agent={agent} threadId="my-thread" />;
}`}</code>
        </pre>
      </div>
    </div>
  );
};

export default ToolsExample;