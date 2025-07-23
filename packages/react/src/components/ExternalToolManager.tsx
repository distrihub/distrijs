import React, { useState, useCallback, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import { ToolCall, ToolResult } from '@distri/core';
import Toast from './Toast';
import ApprovalDialog from './ApprovalDialog';
import {
  createBuiltinToolHandlers,
  processExternalToolCalls,
  initializeBuiltinHandlers,
  clearPendingToolCalls
} from '../builtinHandlers';

export interface ExternalToolManagerProps {
  toolCalls: ToolCall[];
  onToolComplete: (results: ToolResult[]) => void;
  onCancel: () => void;
}

interface ToastState {
  id: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
}

interface ApprovalDialogState {
  toolCalls: ToolCall[];
  reason?: string;
  resolve: (approved: boolean) => void;
}

const ExternalToolManager: React.FC<ExternalToolManagerProps> = ({
  toolCalls,
  onToolComplete,
  onCancel
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [toasts, setToasts] = useState<ToastState[]>([]);
  const [approvalDialog, setApprovalDialog] = useState<ApprovalDialogState | null>(null);
  const [processingResults, setProcessingResults] = useState<ToolResult[]>([]);

  // Initialize builtin handlers with callbacks
  useEffect(() => {
    initializeBuiltinHandlers({
      onToolComplete: (results: ToolResult[]) => {
        setProcessingResults(prev => [...prev, ...results]);
        onToolComplete(results);
      },
      onCancel: () => {
        clearPendingToolCalls();
        onCancel();
      },
      showToast: (message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') => {
        const id = Math.random().toString(36).substr(2, 9);
        setToasts(prev => [...prev, { id, message, type }]);
      },
      showApprovalDialog: (toolCalls: ToolCall[], reason?: string): Promise<boolean> => {
        return new Promise((resolve) => {
          setApprovalDialog({ toolCalls, reason, resolve });
        });
      }
    });
  }, [onToolComplete, onCancel]);

  // Process tool calls when they are received
  useEffect(() => {
    if (toolCalls.length > 0 && !isProcessing) {
      processToolCalls();
    }
  }, [toolCalls]);

  const processToolCalls = useCallback(async () => {
    if (toolCalls.length === 0) return;

    setIsProcessing(true);
    setProcessingResults([]);

    try {
      const handlers = createBuiltinToolHandlers();

      // Create a local onToolComplete callback for this processing session
      const localOnToolComplete = async (results: ToolResult[]) => {
        setProcessingResults(prev => [...prev, ...results]);
        onToolComplete(results);
      };

      await processExternalToolCalls(toolCalls, handlers, localOnToolComplete);
      // Results will be handled by the onToolComplete callback
    } catch (error) {
      console.error('Error processing tool calls:', error);
      const errorResults: ToolResult[] = toolCalls.map(toolCall => ({
        tool_call_id: toolCall.tool_call_id,
        result: null,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }));
      setProcessingResults(errorResults);
      onToolComplete(errorResults);
    } finally {
      setIsProcessing(false);
    }
  }, [toolCalls, onToolComplete]);

  const handleApprovalDialogResponse = useCallback((approved: boolean) => {
    if (approvalDialog) {
      approvalDialog.resolve(approved);
      setApprovalDialog(null);
    }
  }, [approvalDialog]);

  const handleApprovalDialogCancel = useCallback(() => {
    if (approvalDialog) {
      approvalDialog.resolve(false);
      setApprovalDialog(null);
    }
  }, [approvalDialog]);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  if (toolCalls.length === 0) return null;

  return (
    <>
      {/* Tool Processing Status */}
      <div className="my-4 p-4 border border-blue-200 bg-blue-50 rounded-lg">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Loader2 className={`w-5 h-5 text-blue-600 ${isProcessing ? 'animate-spin' : ''}`} />
            <span className="font-semibold text-blue-800">
              {isProcessing ? 'Processing External Tools...' : 'External Tools Completed'}
            </span>
          </div>
          <button
            onClick={onCancel}
            className="flex items-center gap-1 px-2 py-1 text-sm text-red-600 hover:text-red-800 hover:bg-red-100 rounded transition-colors"
          >
            <X className="w-4 h-4" />
            Cancel
          </button>
        </div>

        {/* Tool Call Status */}
        <div className="space-y-2">
          {toolCalls.map((toolCall) => {
            const result = processingResults.find(r => r.tool_call_id === toolCall.tool_call_id);
            const status = result ? (result.success ? 'completed' : 'error') : (isProcessing ? 'processing' : 'pending');

            return (
              <div key={toolCall.tool_call_id} className="flex items-center justify-between p-2 bg-white rounded border">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{toolCall.tool_name}</span>
                  <span className={`text-sm ${status === 'completed' ? 'text-green-600' :
                    status === 'error' ? 'text-red-600' :
                      status === 'processing' ? 'text-blue-600' :
                        'text-gray-500'
                    }`}>
                    {status}
                  </span>
                </div>
                {result && !result.success && (
                  <span className="text-xs text-red-600">{result.error}</span>
                )}
              </div>
            );
          })}
        </div>

        {/* Results Summary */}
        {processingResults.length > 0 && (
          <div className="mt-3 p-2 bg-gray-100 rounded">
            <p className="text-sm text-gray-700">
              {processingResults.filter(r => r.success).length} of {processingResults.length} tools completed successfully
            </p>
          </div>
        )}
      </div>

      {/* Approval Dialog */}
      {approvalDialog && (
        <ApprovalDialog
          toolCalls={approvalDialog.toolCalls}
          reason={approvalDialog.reason}
          onApprove={() => handleApprovalDialogResponse(true)}
          onDeny={() => handleApprovalDialogResponse(false)}
          onCancel={handleApprovalDialogCancel}
        />
      )}

      {/* Toasts */}
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </>
  );
};

export default ExternalToolManager; 