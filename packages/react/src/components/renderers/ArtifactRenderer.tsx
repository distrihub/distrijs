import React from 'react';
import { DistriArtifact, AssistantWithToolCalls, ToolResults, GenericArtifact } from '@distri/core';
import { AssistantWithToolCalls as AssistantWithToolCallsComponent } from '../Components';

interface ArtifactRendererProps {
  artifact: DistriArtifact;
  toolCallStates: Map<string, any>;
}

export function ArtifactRenderer({ artifact, toolCallStates }: ArtifactRendererProps) {
  switch (artifact.type) {
    case 'llm_response':
      return renderLLMResponse(artifact as AssistantWithToolCalls, toolCallStates);
    case 'tool_results':
      return renderToolResults(artifact as ToolResults);
    case 'artifact':
      return renderGenericArtifact(artifact as GenericArtifact);
    default:
      return null;
  }
}

function renderLLMResponse(llmArtifact: AssistantWithToolCalls, toolCallStates: Map<string, any>) {
  // Convert Map to array for the component
  const toolCallStatesArray = Array.from(toolCallStates.values()).filter(Boolean);

  return (
    <div className="space-y-2">
      {/* Text content if present */}
      {llmArtifact.content && (
        <div className="prose prose-sm max-w-none">
          <p>{llmArtifact.content}</p>
        </div>
      )}

      {/* Tool calls */}
      {llmArtifact.tool_calls && llmArtifact.tool_calls.length > 0 && (
        <AssistantWithToolCallsComponent
          message={{
            id: llmArtifact.id,
            role: 'assistant',
            parts: llmArtifact.tool_calls.map(toolCall => ({
              type: 'tool_call',
              tool_call: toolCall
            }))
          }}
          toolCallStates={toolCallStatesArray}
          timestamp={new Date(llmArtifact.timestamp)}
          isStreaming={false}
        />
      )}
    </div>
  );
}

function renderToolResults(toolResultsArtifact: ToolResults) {
  return (
    <div className="space-y-2">
      {/* Text observation */}
      <div className="prose prose-sm max-w-none">
        <p>Tool execution completed with {toolResultsArtifact.results.length} result(s).</p>
      </div>

      {/* Tool results */}
      {toolResultsArtifact.results.map((result, index) => (
        <div key={result.tool_call_id || index} className="border rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">{result.tool_name}</span>
            <span className="text-xs text-green-600">Success</span>
          </div>
          <div className="text-sm text-gray-600">
            <strong>Result:</strong>
            <pre className="whitespace-pre-wrap text-xs bg-gray-50 p-2 rounded mt-1 max-h-32 overflow-y-auto">
              {typeof result.result === 'string' ? result.result : JSON.stringify(result.result, null, 2)}
            </pre>
          </div>
        </div>
      ))}
    </div>
  );
}

function renderGenericArtifact(genericArtifact: GenericArtifact) {
  return (
    <div className="space-y-2">
      {/* Text observation */}
      <div className="prose prose-sm max-w-none">
        <p>Artifact processed: {genericArtifact.name}</p>
      </div>

      {/* Artifact data */}
      <div className="border rounded-lg p-3">
        <div className="text-sm">
          <strong>Data:</strong>
          <pre className="whitespace-pre-wrap text-xs bg-gray-50 p-2 rounded mt-1 max-h-32 overflow-y-auto">
            {JSON.stringify(genericArtifact.data, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
} 