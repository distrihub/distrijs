import React, { useState, useEffect } from 'react';
import { Button } from '../../ui/button';
import { Checkbox } from '../../ui/checkbox';
import { AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { UiToolProps } from '@/types';
import { createSuccessfulToolResult, ToolCall } from '@distri/core';

export const ApprovalToolCall: React.FC<UiToolProps> = ({
  toolCall,
  toolCallState,
  completeTool
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [dontAskAgain, setDontAskAgain] = useState(false);
  const input = typeof toolCall.input === 'string' ? JSON.parse(toolCall.input) : toolCall.input;
  const reason = input.reason || 'Approval required';
  const toolCallsToApprove = input.tool_calls || [];

  // Get approval preferences from localStorage
  const getApprovalPreferences = (): Record<string, boolean> => {
    try {
      const stored = localStorage.getItem('distri-approval-preferences');
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  };

  // Save approval preferences to localStorage
  const saveApprovalPreference = (toolName: string, approved: boolean) => {
    try {
      const preferences = getApprovalPreferences();
      preferences[toolName] = approved;
      localStorage.setItem('distri-approval-preferences', JSON.stringify(preferences));
    } catch {
      // Silently fail if localStorage is unavailable
    }
  };

  // Check if tool is auto-approved
  useEffect(() => {
    const preferences = getApprovalPreferences();
    const autoApprove = preferences[toolCall.tool_name];
    
    if (autoApprove !== undefined && !toolCallState?.status) {
      // Auto-approve or auto-deny based on stored preference
      handleResponse(autoApprove, false);
    }
  }, [toolCall.tool_name]);

  const handleResponse = async (approved: boolean, savePreference: boolean = true) => {
    if (isProcessing || toolCallState?.status === 'completed') return;

    setIsProcessing(true);

    // Save preference if "don't ask again" is checked
    if (savePreference && dontAskAgain) {
      saveApprovalPreference(toolCall.tool_name, approved);
    }

    const result = createSuccessfulToolResult(
      toolCall.tool_call_id,
      toolCall.tool_name,
      `${toolCall.tool_name} ${approved ? 'approved' : 'denied'} by user`
    );

    completeTool(result);
  };

  if (toolCallState?.status === 'completed') {
    const result = input.result || {};
    return (
      <div className="border rounded-lg p-4 bg-muted/50">
        <div className="flex items-center gap-2 mb-2">
          {result.approved ? (
            <CheckCircle className="h-4 w-4 text-green-600" />
          ) : (
            <XCircle className="h-4 w-4 text-red-600" />
          )}
          <span className="font-medium">
            Approval {result.approved ? 'Granted' : 'Denied'}
          </span>
        </div>
        <p className="text-sm text-muted-foreground">{reason}</p>
      </div>
    );
  }

  return (
    <div className="border rounded-lg p-4 bg-background">
      <div className="flex items-center gap-2 mb-3">
        <AlertTriangle className="h-4 w-4 text-amber-500" />
        <span className="font-medium">Approval Required</span>
      </div>

      <p className="text-sm mb-4">{reason}</p>

      {toolCallsToApprove.length > 0 && (
        <div className="mb-4">
          <p className="text-xs text-muted-foreground mb-2">Tool calls requiring approval:</p>
          <div className="space-y-1">
            {toolCallsToApprove.map((tc: ToolCall, index: number) => (
              <div key={index} className="text-xs bg-muted p-2 rounded">
                <span className="font-mono">{tc.tool_name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-3">
        <div className="flex items-center space-x-2">
          <Checkbox 
            id="dont-ask-again" 
            checked={dontAskAgain}
            onCheckedChange={(checked: boolean) => setDontAskAgain(checked)}
          />
          <label 
            htmlFor="dont-ask-again" 
            className="text-sm text-muted-foreground cursor-pointer"
          >
            Don't ask again for <span className="font-mono text-xs">{toolCall.tool_name}</span>
          </label>
        </div>

        <div className="flex gap-2">
          <Button
            size="sm"
            variant="destructive"
            onClick={() => handleResponse(false)}
            disabled={isProcessing}
          >
            Deny
          </Button>
          <Button
            size="sm"
            onClick={() => handleResponse(true)}
            disabled={isProcessing}
          >
            Approve
          </Button>
        </div>
      </div>
    </div>
  );
};