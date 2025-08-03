import React, { useState, useEffect } from 'react';
import { Button } from '../../ui/button';
import { Wrench, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { UiToolProps } from '@/types';
import { ToolResult, DistriFnTool } from '@distri/core';

export interface DefaultToolActionsProps extends UiToolProps {
  toolHandler: DistriFnTool['handler'];
  autoExecute?: boolean;
}

export const DefaultToolActions: React.FC<DefaultToolActionsProps> = ({
  toolCall,
  toolCallState,
  completeTool,
  toolHandler,
  autoExecute = false
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [hasExecuted, setHasExecuted] = useState(false);

  const input = typeof toolCall.input === 'string' ? JSON.parse(toolCall.input) : toolCall.input;
  const toolName = toolCall.tool_name;

  // Auto-execute if enabled
  useEffect(() => {
    if (autoExecute && !hasExecuted && !isProcessing) {
      handleConfirm();
    }
  }, [autoExecute, hasExecuted, isProcessing]);

  const handleConfirm = async () => {
    if (isProcessing || hasExecuted) return;

    setIsProcessing(true);
    setHasExecuted(true);

    try {
      // Execute the tool handler
      const result = await toolHandler(toolCall.input);

      const toolResult: ToolResult = {
        tool_call_id: toolCall.tool_call_id,
        result: typeof result === 'string' ? result : JSON.stringify(result),
        success: true,
        error: undefined
      };

      completeTool(toolResult);
    } catch (error) {
      const toolResult: ToolResult = {
        tool_call_id: toolCall.tool_call_id,
        result: '',
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };

      completeTool(toolResult);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancel = () => {
    if (isProcessing || hasExecuted) return;

    setHasExecuted(true);

    const toolResult: ToolResult = {
      tool_call_id: toolCall.tool_call_id,
      result: 'Tool execution cancelled by user',
      success: false,
      error: 'User cancelled the operation'
    };

    completeTool(toolResult);
  };

  // Show completed state
  if (hasExecuted && !isProcessing) {
    const wasSuccessful = toolCallState?.status === 'completed';
    return (
      <div className="border rounded-lg p-4 bg-muted/50">
        <div className="flex items-center gap-2 mb-2">
          {wasSuccessful ? (
            <CheckCircle className="h-4 w-4 text-green-600" />
          ) : (
            <XCircle className="h-4 w-4 text-red-600" />
          )}
          <span className="font-medium">
            {wasSuccessful ? 'Tool Executed Successfully' : 'Tool Execution Failed'}
          </span>
        </div>
        <p className="text-sm text-muted-foreground">
          Tool: <code className="bg-background px-1 rounded">{toolName}</code>
        </p>
        {toolCallState?.result && (
          <div className="mt-2">
            <p className="text-xs text-muted-foreground mb-1">Result:</p>
            <pre className="text-xs bg-background p-2 rounded border overflow-x-auto">
              {typeof toolCallState.result === 'string'
                ? toolCallState.result
                : JSON.stringify(toolCallState.result, null, 2)}
            </pre>
          </div>
        )}
        {toolCallState?.error && (
          <div className="mt-2">
            <p className="text-xs text-destructive mb-1">Error:</p>
            <p className="text-xs text-destructive bg-destructive/10 p-2 rounded border">
              {toolCallState.error}
            </p>
          </div>
        )}
      </div>
    );
  }

  // Show processing state
  if (isProcessing) {
    return (
      <div className="border rounded-lg p-4 bg-background">
        <div className="flex items-center gap-2 mb-3">
          <Loader2 className="h-4 w-4 text-primary animate-spin" />
          <span className="font-medium">Executing Tool...</span>
        </div>
        <p className="text-sm text-muted-foreground">
          Running: <code className="bg-muted px-1 rounded">{toolName}</code>
        </p>
      </div>
    );
  }

  // Show pending state with action buttons
  return (
    <div className="border rounded-lg p-4 bg-background">
      <div className="flex items-center gap-2 mb-3">
        <Wrench className="h-4 w-4 text-primary" />
        <span className="font-medium">Tool Action Required</span>
      </div>

      <div className="mb-4">
        <p className="text-sm mb-2">
          Execute tool: <code className="bg-muted px-1 rounded">{toolName}</code>
        </p>

        {/* Show formatted input */}
        <div className="text-xs text-muted-foreground mb-1">Input:</div>
        <pre className="text-xs bg-muted p-2 rounded border overflow-x-auto">
          {JSON.stringify(input, null, 2)}
        </pre>
      </div>

      {!autoExecute && (
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="destructive"
            onClick={handleCancel}
            disabled={isProcessing}
          >
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleConfirm}
            disabled={isProcessing}
          >
            Confirm
          </Button>
        </div>
      )}
    </div>
  );
}; 