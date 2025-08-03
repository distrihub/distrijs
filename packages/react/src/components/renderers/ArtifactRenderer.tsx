import React from 'react';
import { DistriArtifact, AssistantWithToolCalls, ToolResults, GenericArtifact } from '@distri/core';
import { extractContent, renderTextContent } from './utils';

export interface ArtifactRendererProps {
  message: DistriArtifact;
  chatState: any;
  className?: string;
  avatar?: React.ReactNode;
}

export function ArtifactRenderer({ message, chatState: _chatState, className = '', avatar }: ArtifactRendererProps) {
  switch (message.type) {
    case 'llm_response':
      return renderLLMResponse(message as AssistantWithToolCalls, _chatState, className, avatar);
    case 'tool_results':
      return renderToolResults(message as ToolResults, _chatState, className, avatar);
    case 'artifact':
      return renderGenericArtifact(message as GenericArtifact, _chatState, className, avatar);
    default:
      return null;
  }
}

function renderLLMResponse(llmArtifact: AssistantWithToolCalls, _chatState: any, className: string, avatar?: React.ReactNode) {
  const content = extractContent(llmArtifact as any);

  return (
    <div className={`flex items-start gap-4 py-3 px-2 ${className}`}>
      {avatar && <div className="flex-shrink-0">{avatar}</div>}
      <div className="w-full">
        <div className="text-sm font-medium text-foreground mb-2">Assistant</div>

        {/* Text content if present */}
        {content.text && (
          <div className="prose prose-sm max-w-none text-foreground mb-3">
            {renderTextContent(content)}
          </div>
        )}

        {/* Tool calls */}
        {llmArtifact.tool_calls && llmArtifact.tool_calls.length > 0 && (
          <div className="space-y-2">
            {llmArtifact.tool_calls.map((toolCall, index) => (
              <div key={toolCall.tool_call_id || index} className="border rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">{toolCall.tool_name}</span>
                  <span className="text-xs text-primary">Success</span>
                </div>
                <div className="text-sm text-muted-foreground">
                  <strong>Input:</strong>
                  <pre className="whitespace-pre-wrap text-xs bg-muted p-2 rounded mt-1">
                    {JSON.stringify(toolCall.input, null, 2)}
                  </pre>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function renderToolResults(toolResultsArtifact: ToolResults, _chatState: any, className: string, avatar?: React.ReactNode) {
  return (
    <div className={`flex items-start gap-4 py-3 px-2 ${className}`}>
      {avatar && <div className="flex-shrink-0">{avatar}</div>}
      <div className="w-full">
        <div className="text-sm font-medium text-foreground mb-2">Tool Results</div>

        {/* Text observation */}
        <div className="prose prose-sm max-w-none text-foreground mb-3">
          <p>Tool execution completed with {toolResultsArtifact.results.length} result(s).</p>
        </div>

        {/* Tool results */}
        {toolResultsArtifact.results.map((result, index) => (
          <div key={result.tool_call_id || index} className="border rounded-lg p-3 mb-2">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">{result.tool_name}</span>
              <span className="text-xs text-primary">Success</span>
            </div>
            <div className="text-sm text-muted-foreground">
              <strong>Result:</strong>
              <pre className="whitespace-pre-wrap text-xs bg-muted p-2 rounded mt-1 max-h-32 overflow-y-auto">
                {typeof result.result === 'string' ? result.result : JSON.stringify(result.result, null, 2)}
              </pre>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function renderGenericArtifact(genericArtifact: GenericArtifact, _chatState: any, className: string, avatar?: React.ReactNode) {
  return (
    <div className={`flex items-start gap-4 py-3 px-2 ${className}`}>
      {avatar && <div className="flex-shrink-0">{avatar}</div>}
      <div className="w-full">
        <div className="text-sm font-medium text-foreground mb-2">Artifact</div>
        <div className="prose prose-sm max-w-none text-foreground">
          <pre className="whitespace-pre-wrap text-xs bg-muted p-2 rounded">
            {JSON.stringify(genericArtifact, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
} 