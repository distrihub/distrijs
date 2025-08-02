import React from 'react';
import { processA2AStreamData } from '@distri/core';
import { TaskExecutionRenderer } from '@distri/react';

// Test data based on the actual stream.json format with all event types
const testStreamData = [
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
        "type": "plan_started",
        "initial_plan": true
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
        "type": "plan_finished",
        "total_steps": 3
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
        "step_id": "step_1",
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
            "step_id": "step_1",
            "content": "",
            "tool_calls": [
              {
                "tool_call_id": "call_search_1",
                "tool_name": "search",
                "input": "{\"query\": \"Tazapay founders\"}"
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
        "step_id": "step_1",
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
        "tool_call_id": "call_search_1",
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
        "tool_call_id": "call_search_1",
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
            "step_id": "step_2",
            "results": [
              {
                "tool_call_id": "call_search_1",
                "tool_name": "search",
                "result": "Tazapay is co-founded by Rahul Shinghal (CEO), Saroj Mishra (COO), and Arul Kumaravel (CTO)."
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
      "messageId": "final_response_1",
      "role": "agent",
      "parts": [
        {
          "kind": "text",
          "text": "Based on my search, Tazapay is co-founded by three individuals:\n\n1. **Rahul Shinghal** - CEO\n2. **Saroj Mishra** - COO  \n3. **Arul Kumaravel** - CTO\n\nTazapay is a Singapore-based fintech startup that offers cross-border payment solutions."
        }
      ],
      "contextId": "57fd0469-7e71-4332-b413-78d12950d0e1",
      "taskId": null,
      "referenceTaskIds": [],
      "extensions": [],
      "metadata": {
        "type": "text_message_end",
        "message_id": "final_response_1"
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
        "state": "completed",
        "message": null,
        "timestamp": "1754070991278"
      },
      "final": true,
      "metadata": {
        "type": "run_finished"
      }
    },
    "id": "1"
  }
];

export const StreamTestDemo: React.FC = () => {
  // Process the test stream data
  const processedEvents = React.useMemo(() => {
    console.log('Processing test stream data...');
    const result = processA2AStreamData(testStreamData);
    console.log('Converted events:', result);
    return result;
  }, []);

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <h1 className="text-2xl font-bold text-green-900 mb-2">
          ✅ Fixed Stream Processing Test
        </h1>
        <p className="text-green-700">
          This demonstrates the CORRECTED A2A stream processing with all event types:
          <br />
          • run_started/finished • plan_started/finished • step_started/completed 
          • tool_execution_start/end • artifact processing
        </p>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Step-by-Step Execution (Cursor-like)</h2>
        <p className="text-sm text-gray-600">
          Now properly showing: planning, tool execution, and task completion with all status updates.
        </p>
        
        <TaskExecutionRenderer 
          events={processedEvents}
          className="border rounded-lg p-4 bg-white"
        />
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">Event Flow Summary</h3>
        <div className="text-sm space-y-1">
          {processedEvents.map((event, index) => (
            <div key={index} className="font-mono text-xs">
              <span className="text-blue-600">
                {index + 1}.
              </span>{' '}
              <span className="text-gray-700">
                {'type' in event ? event.type : 'message'}
              </span>
              {' → '}
              <span className="text-gray-500">
                {'role' in event 
                  ? `${event.role} message` 
                  : JSON.stringify(event.data, null, 0)
                }
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h3 className="font-semibold text-yellow-900 mb-2">✅ What's Fixed</h3>
        <ul className="text-sm text-yellow-800 space-y-1">
          <li>• Added <code>plan_started</code> and <code>plan_finished</code> events</li>
          <li>• Fixed <code>tool_call_name</code> missing error with default fallback</li>
          <li>• Added <code>TaskArtifact</code> event with Resolution handling</li>
          <li>• Proper step status tracking (pending → running → completed)</li>
          <li>• All tool execution events now show in step-by-step UI</li>
          <li>• Task updates and artifacts are properly rendered</li>
        </ul>
      </div>
    </div>
  );
};

export default StreamTestDemo;