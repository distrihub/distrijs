import React from 'react';
import { processA2AStreamData, DistriMessage, DistriEvent } from '@distri/core';
import { TaskExecutionRenderer } from '@distri/react';

// Sample stream data based on the actual stream.json format
const sampleStreamData = [
  {
    "jsonrpc": "2.0",
    "result": {
      "kind": "status-update",
      "taskId": "6ded840d-e1d5-4cbe-9c3d-bdd5a2cc5fce",
      "contextId": "57fd0469-7e71-4332-b413-78d12950d0e1",
      "status": {
        "state": "submitted",
        "message": null,
        "timestamp": "1754070972747"
      },
      "final": true,
      "metadata": {
        "type": "run_started"
      }
    },
    "id": "1"
  },
  {
    "jsonrpc": "2.0",
    "result": {
      "kind": "status-update",
      "taskId": "6ded840d-e1d5-4cbe-9c3d-bdd5a2cc5fce",
      "contextId": "57fd0469-7e71-4332-b413-78d12950d0e1",
      "status": {
        "state": "working",
        "message": null,
        "timestamp": "1754070972747"
      },
      "final": false,
      "metadata": {
        "type": "step_started",
        "step_id": "1",
        "step_index": 0,
        "step_title": "Generating response ..."
      }
    },
    "id": "1"
  },
  {
    "jsonrpc": "2.0",
    "result": {
      "artifactId": "89e0ea8a-ec32-44dd-9151-02da7488697a",
      "parts": [
        {
          "kind": "data",
          "data": {
            "id": "89e0ea8a-ec32-44dd-9151-02da7488697a",
            "created_at": 1754070975967,
            "updated_at": 1754070975967,
            "type": "llm_response",
            "step_id": "1",
            "content": "",
            "tool_calls": [
              {
                "tool_call_id": "call_ct3kfS2uhpkXb2xUhSHfXkl4",
                "tool_name": "search",
                "input": "{\"query\": \"Tazapay founders\"}"
              },
              {
                "tool_call_id": "call_Y3LYWV2jQ5ySahceV5Dspvf8",
                "tool_name": "extract_structured_data",
                "input": "{\"url\": \"https://www.tazapay.com\"}"
              }
            ],
            "success": true,
            "rejected": false,
            "reason": null,
            "timestamp": 1754070975967
          }
        }
      ],
      "name": "89e0ea8a-ec32-44dd-9151-02da7488697a",
      "description": null
    },
    "id": "1"
  },
  {
    "jsonrpc": "2.0",
    "result": {
      "kind": "status-update",
      "taskId": "6ded840d-e1d5-4cbe-9c3d-bdd5a2cc5fce",
      "contextId": "57fd0469-7e71-4332-b413-78d12950d0e1",
      "status": {
        "state": "working",
        "message": null,
        "timestamp": "1754070975968"
      },
      "final": false,
      "metadata": {
        "type": "step_completed",
        "step_id": "1",
        "success": true
      }
    },
    "id": "1"
  },
  {
    "jsonrpc": "2.0",
    "result": {
      "kind": "status-update",
      "taskId": "6ded840d-e1d5-4cbe-9c3d-bdd5a2cc5fce",
      "contextId": "57fd0469-7e71-4332-b413-78d12950d0e1",
      "status": {
        "state": "working",
        "message": null,
        "timestamp": "1754070975968"
      },
      "final": false,
      "metadata": {
        "type": "tool_execution_start",
        "tool_call_id": "call_ct3kfS2uhpkXb2xUhSHfXkl4",
        "tool_call_name": "search",
        "input": "{\"query\": \"Tazapay founders\"}"
      }
    },
    "id": "1"
  },
  {
    "jsonrpc": "2.0",
    "result": {
      "kind": "status-update",
      "taskId": "6ded840d-e1d5-4cbe-9c3d-bdd5a2cc5fce",
      "contextId": "57fd0469-7e71-4332-b413-78d12950d0e1",
      "status": {
        "state": "working",
        "message": null,
        "timestamp": "1754070978935"
      },
      "final": false,
      "metadata": {
        "type": "tool_execution_end",
        "tool_call_id": "call_ct3kfS2uhpkXb2xUhSHfXkl4",
        "tool_call_name": "search",
        "success": true
      }
    },
    "id": "1"
  },
  {
    "jsonrpc": "2.0",
    "result": {
      "artifactId": "f2123de7-0b17-4ca3-b9b3-d642c3188bbc",
      "parts": [
        {
          "kind": "data",
          "data": {
            "id": "f2123de7-0b17-4ca3-b9b3-d642c3188bbc",
            "created_at": 1754070978927,
            "updated_at": 1754070978927,
            "type": "tool_results",
            "step_id": "7c246028-737e-4239-8f62-fbd29b8402ef",
            "results": [
              {
                "tool_call_id": "call_ct3kfS2uhpkXb2xUhSHfXkl4",
                "tool_name": "search",
                "result": "{\"results\":[{\"title\":\"TazaPay Founders\",\"content\":\"Rahul Shinghal (CEO), Saroj Mishra (COO), Arul Kumaravel (CTO)\"}]}"
              }
            ],
            "success": true,
            "rejected": false,
            "reason": null,
            "timestamp": 1754070978927
          }
        }
      ],
      "name": "f2123de7-0b17-4ca3-b9b3-d642c3188bbc",
      "description": null
    },
    "id": "1"
  },
  {
    "jsonrpc": "2.0",
    "result": {
      "kind": "message",
      "messageId": "215ce2db-1414-4be8-b379-f204d9d441f5",
      "role": "agent",
      "parts": [
        {
          "kind": "text",
          "text": "Tazapay is a fintech company co-founded by Rahul Shinghal (CEO), Saroj Mishra (COO), and Arul Kumaravel (CTO). The company offers cross-border payment solutions."
        }
      ],
      "contextId": "57fd0469-7e71-4332-b413-78d12950d0e1",
      "taskId": null,
      "referenceTaskIds": [],
      "extensions": [],
      "metadata": {
        "type": "text_message_end",
        "message_id": "215ce2db-1414-4be8-b379-f204d9d441f5"
      }
    },
    "id": "1"
  }
];

export const StreamProcessingDemo: React.FC = () => {
  // Process the stream data into DistriMessage/DistriEvent format
  const processedEvents = React.useMemo(() => {
    console.log('Processing stream data...');
    const result = processA2AStreamData(sampleStreamData);
    console.log('Converted events:', result);
    return result;
  }, []);

  // Separate messages and events for display
  const { messages, events } = React.useMemo(() => {
    const messages: DistriMessage[] = [];
    const events: DistriEvent[] = [];
    
    processedEvents.forEach(item => {
      if ('role' in item) {
        messages.push(item as DistriMessage);
      } else {
        events.push(item as DistriEvent);
      }
    });
    
    return { messages, events };
  }, [processedEvents]);

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h1 className="text-2xl font-bold text-blue-900 mb-2">
          Stream Processing Demo
        </h1>
        <p className="text-blue-700">
          This demo shows how the Distri framework processes streaming A2A events 
          and renders them with real-time step-by-step execution updates like Cursor.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Task Execution Rendering */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Task Execution Progress</h2>
          <p className="text-sm text-gray-600">
            Real-time rendering of task execution with status updates, tool calls, and responses.
          </p>
          
          <TaskExecutionRenderer 
            events={processedEvents}
            className="border rounded-lg p-4 bg-white"
          />
        </div>

        {/* Event Breakdown */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Event Breakdown</h2>
          
          <div className="space-y-3">
            <div>
              <h3 className="font-medium text-sm text-gray-700">
                Status Events ({events.length})
              </h3>
              <div className="text-xs bg-gray-50 p-2 rounded mt-1">
                {events.map((event, index) => (
                  <div key={index} className="mb-1">
                    <span className="font-mono text-blue-600">{event.type}</span>
                    {event.data && Object.keys(event.data).length > 0 && (
                      <span className="text-gray-500 ml-2">
                        {JSON.stringify(event.data, null, 0)}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-medium text-sm text-gray-700">
                Messages ({messages.length})
              </h3>
              <div className="text-xs bg-gray-50 p-2 rounded mt-1">
                {messages.map((message, index) => (
                  <div key={index} className="mb-1">
                    <span className="font-mono text-green-600">{message.role}</span>
                    <span className="text-gray-500 ml-2">
                      {message.parts.map(p => p.type).join(', ')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h3 className="font-semibold mb-2">How it works:</h3>
        <ul className="text-sm text-gray-700 space-y-1">
          <li>• Processes JSONrpc wrapped events from stream.json</li>
          <li>• Converts status-update events to DistriEvent types</li>
          <li>• Converts artifacts and messages to DistriMessage types</li>
          <li>• Renders step-by-step execution progress in real-time</li>
          <li>• Shows tool execution start/end, content streaming, and results</li>
        </ul>
      </div>

      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <h3 className="font-semibold text-green-900 mb-2">Usage</h3>
        <pre className="text-xs bg-green-100 p-2 rounded overflow-x-auto">
{`import { processA2AStreamData } from '@distri/core';
import { TaskExecutionRenderer } from '@distri/react';

// Process streaming A2A data
const events = processA2AStreamData(streamData);

// Render with real-time step updates
<TaskExecutionRenderer 
  events={events} 
  className="space-y-3" 
/>`}
        </pre>
      </div>
    </div>
  );
};

export default StreamProcessingDemo;