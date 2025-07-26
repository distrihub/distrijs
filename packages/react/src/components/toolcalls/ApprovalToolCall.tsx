import React, { useState } from 'react';
import { Button } from '../ui/button';
import { AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { ToolCall } from '@distri/core';

interface ApprovalToolCallProps {
  toolCall: ToolCall;
  onComplete: (result: any, success: boolean, error?: string) => void;
  status: 'pending' | 'running' | 'completed' | 'error' | 'user_action_required';
}

export const ApprovalToolCall: React.FC<ApprovalToolCallProps> = ({
  toolCall,
  onComplete,
  status
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  
  const input = typeof toolCall.input === 'string' ? JSON.parse(toolCall.input) : toolCall.input;
  const reason = input.reason || 'Approval required';
  const toolCallsToApprove = input.tool_calls || [];

  const handleResponse = async (approved: boolean) => {
    if (isProcessing || status === 'completed') return;
    
    setIsProcessing(true);
    
    const result = {
      approved,
      reason: approved ? 'Approved by user' : 'Denied by user',
      tool_calls: toolCallsToApprove
    };
    
    onComplete(result, true);
  };

  if (status === 'completed') {
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
            {toolCallsToApprove.map((tc: any, index: number) => (
              <div key={index} className="text-xs bg-muted p-2 rounded">
                <span className="font-mono">{tc.tool_name}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      
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
  );
};