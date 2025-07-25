import React, { useState } from 'react';
import { AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { ToolCall } from '@distri/core';

export interface ApprovalDialogProps {
  toolCalls: ToolCall[];
  reason?: string;
  onApprove: () => void;
  onDeny: () => void;
  onCancel: () => void;
}

const ApprovalDialog: React.FC<ApprovalDialogProps> = ({
  toolCalls,
  reason,
  onApprove,
  onDeny,
  onCancel
}) => {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  const handleApprove = () => {
    setIsVisible(false);
    onApprove();
  };

  const handleDeny = () => {
    setIsVisible(false);
    onDeny();
  };

  const handleCancel = () => {
    setIsVisible(false);
    onCancel();
  };

  return (
    <Dialog>
      <DialogContent>
        <DialogHeader>
          <div className="flex items-center">
            <AlertTriangle className="w-6 h-6 text-yellow-500 mr-3" />
            <DialogTitle>Tool Execution Approval</DialogTitle>
          </div>
        </DialogHeader>

        <div className="p-4">
          {reason && (
            <div className="mb-4">
              <p className="text-sm text-muted-foreground">{reason}</p>
            </div>
          )}

          <div className="mb-4">
            <h4 className="text-sm font-medium mb-2">Tools to execute:</h4>
            <div className="space-y-2">
              {toolCalls.map((toolCall) => (
                <div key={toolCall.tool_call_id} className="flex items-center p-2 bg-muted rounded">
                  <div className="flex-1">
                    <p className="text-sm font-medium">{toolCall.tool_name}</p>
                    {toolCall.input && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {typeof toolCall.input === 'string'
                          ? toolCall.input
                          : JSON.stringify(toolCall.input)
                        }
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end space-x-2 p-6 pt-0">
            <Button
              onClick={handleApprove}
              variant="default"
              className="flex-1"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Approve
            </Button>
            <Button
              onClick={handleDeny}
              variant="destructive"
              className="flex-1"
            >
              <XCircle className="w-4 h-4 mr-2" />
              Deny
            </Button>
            <Button
              onClick={handleCancel}
              variant="outline"
            >
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ApprovalDialog; 