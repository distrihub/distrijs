import React from 'react';
import { processA2AMessagesData, DistriMessage } from '@distri/core';
import { MessageRenderer } from '@distri/react';

// Example A2A data (subset of messages.json)
const exampleA2AData = [
  {
    "kind": "message",
    "messageId": "1595e622-6a0d-4b48-8929-afc31bbd3d5e",
    "role": "user",
    "parts": [
      {
        "kind": "text",
        "text": "who are tazapay founders"
      }
    ]
  },
  {
    "artifactId": "89e0ea8a-ec32-44dd-9151-02da7488697a",
    "parts": [
      {
        "kind": "data",
        "data": {
          "id": "89e0ea8a-ec32-44dd-9151-02da7488697a",
          "type": "llm_response",
          "tool_calls": [
            {
              "tool_call_id": "call_ct3kfS2uhpkXb2xUhSHfXkl4",
              "tool_name": "search",
              "input": "{\"query\": \"Tazapay founders\"}"
            }
          ]
        }
      }
    ]
  },
  {
    "artifactId": "f2123de7-0b17-4ca3-b9b3-d642c3188bbc",
    "parts": [
      {
        "kind": "data",
        "data": {
          "type": "tool_results",
          "results": [
            {
              "tool_call_id": "call_ct3kfS2uhpkXb2xUhSHfXkl4",
              "result": "{\"results\":[{\"title\":\"TazaPay Founders\",\"content\":\"Rahul Shinghal (CEO), Saroj Mishra (COO), Arul Kumaravel (CTO)\"}]}"
            }
          ]
        }
      }
    ]
  },
  {
    "artifactId": "db9f5f0d-810e-429c-9e18-42d46e949f33",
    "parts": [
      {
        "kind": "data",
        "data": {
          "type": "llm_response",
          "content": "Tazapay is a fintech company co-founded by Rahul Shinghal (CEO), Saroj Mishra (COO), and Arul Kumaravel (CTO). The company offers cross-border payment solutions."
        }
      }
    ]
  }
];

export const TestA2AProcessing: React.FC = () => {
  // Process the A2A data into DistriMessage format
  const distriMessages = React.useMemo(() => {
    console.log('Processing A2A data...');
    const result = processA2AMessagesData(exampleA2AData);
    console.log('Converted messages:', result);
    return result;
  }, []);

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h1 className="text-2xl font-bold text-blue-900 mb-2">
          A2A Message Processing Demo
        </h1>
        <p className="text-blue-700">
          This demo shows how the Distri framework processes A2A format messages 
          and renders them with step-by-step execution updates like Cursor.
        </p>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Processed Messages ({distriMessages.length})</h2>
        
        {distriMessages.map((message, index) => (
          <div key={message.id} className="border rounded-lg p-4 bg-white">
            <div className="flex items-center gap-2 mb-3 text-sm text-gray-600">
              <span className="bg-gray-100 px-2 py-1 rounded font-mono">
                {message.role}
              </span>
              <span>•</span>
              <span>{message.parts.map(p => p.type).join(', ')}</span>
            </div>
            
            <MessageRenderer 
              message={message}
              messages={distriMessages}
              className="min-h-0"
            />
          </div>
        ))}
      </div>

      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h3 className="font-semibold mb-2">What this demonstrates:</h3>
        <ul className="text-sm text-gray-700 space-y-1">
          <li>• Conversion from A2A format to Distri format</li>
          <li>• Step-by-step execution rendering</li>
          <li>• Tool calls and results visualization</li>
          <li>• Proper message part handling</li>
        </ul>
      </div>

      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <h3 className="font-semibold text-green-900 mb-2">Usage</h3>
        <pre className="text-xs bg-green-100 p-2 rounded overflow-x-auto">
{`import { processA2AMessagesData } from '@distri/core';
import { MessageRenderer } from '@distri/react';

// Process A2A messages.json data
const distriMessages = processA2AMessagesData(a2aData);

// Render with execution steps
<MessageRenderer 
  messages={distriMessages} 
  className="space-y-4" 
/>`}
        </pre>
      </div>
    </div>
  );
};

export default TestA2AProcessing;