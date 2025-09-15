import React from 'react';
import { AlertTriangle, XCircle } from 'lucide-react';
import { Button } from '../../ui/button';
import { UiToolProps } from '@/types';
import { createFailedToolResult } from '@distri/core';

export const MissingTool: React.FC<UiToolProps> = ({
  toolCall,
  completeTool
}) => {
  const input = typeof toolCall.input === 'string' ? JSON.parse(toolCall.input) : toolCall.input;
  const toolName = toolCall.tool_name;

  const handleDismiss = () => {
    const toolResult = createFailedToolResult(
      toolCall.tool_call_id,
      toolName,
      `Tool '${toolName}' not found in external tools`,
      `Tool '${toolName}' is not available`
    );

    completeTool(toolResult);
  };

  return (
    <div className="border rounded-lg p-4 bg-destructive/5 border-destructive/20">
      <div className="flex items-center gap-2 mb-3">
        <AlertTriangle className="h-4 w-4 text-destructive" />
        <span className="font-medium text-destructive">Missing Tool</span>
      </div>

      <div className="mb-4">
        <p className="text-sm text-destructive mb-2">
          Tool <code className="bg-destructive/10 px-1 rounded font-mono">{toolName}</code> not found
        </p>

        <div className="text-xs text-muted-foreground mb-2">
          This tool is not available in the current agent definition or external tools.
        </div>

        {/* Show the attempted input for debugging */}
        <details className="mt-3">
          <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
            Show attempted input
          </summary>
          <pre className="text-xs bg-muted p-2 rounded border mt-2 overflow-x-auto">
            {JSON.stringify(input, null, 2)}
          </pre>
        </details>
      </div>

      <div className="flex gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={handleDismiss}
          className="border-destructive/20 text-destructive hover:bg-destructive/10"
        >
          <XCircle className="h-3 w-3 mr-1" />
          Dismiss
        </Button>
      </div>

      <div className="mt-3 p-2 bg-muted/50 rounded text-xs text-muted-foreground">
        <strong>Tip:</strong> Make sure the tool is properly registered with the agent or included in the external tools array.
      </div>
    </div>
  );
}; 