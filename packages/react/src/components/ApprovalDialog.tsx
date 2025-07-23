import React, { useState } from 'react';
import { AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="flex items-center p-4 border-b border-gray-200">
          <AlertTriangle className="w-6 h-6 text-yellow-500 mr-3" />
          <h3 className="text-lg font-semibold text-gray-900">Tool Execution Approval</h3>
        </div>

        <div className="p-4">
          {reason && (
            <div className="mb-4">
              <p className="text-sm text-gray-700">{reason}</p>
            </div>
          )}

          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Tools to execute:</h4>
            <div className="space-y-2">
              {toolCalls.map((toolCall) => (
                <div key={toolCall.tool_call_id} className="flex items-center p-2 bg-gray-50 rounded">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{toolCall.tool_name}</p>
                    {toolCall.input && (
                      <p className="text-xs text-gray-600 mt-1">
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

          <div className="flex space-x-3">
            <button
              onClick={handleApprove}
              className="flex-1 flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Approve
            </button>
            <button
              onClick={handleDeny}
              className="flex-1 flex items-center justify-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
            >
              <XCircle className="w-4 h-4 mr-2" />
              Deny
            </button>
            <button
              onClick={handleCancel}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApprovalDialog; 