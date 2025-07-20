import React, { useState } from 'react';
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  FileUp, 
  Mail, 
  MessageSquare,
  Loader2 
} from 'lucide-react';
import { ToolCall, APPROVAL_REQUEST_TOOL_NAME } from '@distri/core';

interface ExternalToolHandlerProps {
  toolCalls: ToolCall[];
  requiresApproval: boolean;
  onToolResponse: (toolCallId: string, result: any) => void;
  onApprovalResponse: (approved: boolean, reason?: string) => void;
}

interface ToolCallStatus {
  status: 'pending' | 'executing' | 'completed' | 'error';
  result?: any;
  error?: string;
}

export const ExternalToolHandler: React.FC<ExternalToolHandlerProps> = ({
  toolCalls,
  requiresApproval,
  onToolResponse,
  onApprovalResponse
}) => {
  const [toolStatuses, setToolStatuses] = useState<Record<string, ToolCallStatus>>({});
  const [showApprovalDialog, setShowApprovalDialog] = useState(requiresApproval);

  const getToolIcon = (toolName: string) => {
    switch (toolName) {
      case 'file_upload':
        return <FileUp className="w-4 h-4" />;
      case 'email_send':
        return <Mail className="w-4 h-4" />;
      case 'input_request':
        return <MessageSquare className="w-4 h-4" />;
      case APPROVAL_REQUEST_TOOL_NAME:
        return <AlertTriangle className="w-4 h-4" />;
      default:
        return <AlertTriangle className="w-4 h-4" />;
    }
  };

  const executeToolCall = async (toolCall: ToolCall) => {
    setToolStatuses(prev => ({
      ...prev,
      [toolCall.tool_call_id]: { status: 'executing' }
    }));

    try {
      let result: any;

      switch (toolCall.tool_name) {
        case 'file_upload':
          result = await handleFileUpload(toolCall);
          break;
        case 'email_send':
          result = await handleEmailSend(toolCall);
          break;
        case 'input_request':
          result = await handleInputRequest(toolCall);
          break;
        case APPROVAL_REQUEST_TOOL_NAME:
          result = await handleApprovalRequest(toolCall);
          break;
        default:
          throw new Error(`Unknown external tool: ${toolCall.tool_name}`);
      }

      setToolStatuses(prev => ({
        ...prev,
        [toolCall.tool_call_id]: { status: 'completed', result }
      }));

      onToolResponse(toolCall.tool_call_id, result);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setToolStatuses(prev => ({
        ...prev,
        [toolCall.tool_call_id]: { status: 'error', error: errorMessage }
      }));
      onToolResponse(toolCall.tool_call_id, { error: errorMessage });
    }
  };

  const handleFileUpload = async (toolCall: ToolCall): Promise<any> => {
    const input = JSON.parse(toolCall.input);
    
    return new Promise((resolve, reject) => {
      const fileInput = document.createElement('input');
      fileInput.type = 'file';
      fileInput.multiple = input.multiple || false;
      
      if (input.accept) {
        fileInput.accept = input.accept;
      }

      fileInput.onchange = (e) => {
        const target = e.target as HTMLInputElement;
        if (target.files && target.files.length > 0) {
          const files = Array.from(target.files).map(file => ({
            name: file.name,
            size: file.size,
            type: file.type,
            lastModified: file.lastModified
          }));
          resolve({ 
            success: true, 
            files,
            message: `Uploaded ${files.length} file(s)` 
          });
        } else {
          reject(new Error('No files selected'));
        }
      };

      fileInput.click();
    });
  };

  const handleEmailSend = async (toolCall: ToolCall): Promise<any> => {
    const input = JSON.parse(toolCall.input);
    
    // Simulate email sending with a dialog
    const confirmed = confirm(
      `Send email to: ${input.to}\nSubject: ${input.subject}\n\nContinue?`
    );
    
    if (confirmed) {
      return { 
        success: true, 
        message: 'Email sent successfully',
        messageId: 'msg_' + Date.now()
      };
    } else {
      throw new Error('Email sending cancelled by user');
    }
  };

  const handleInputRequest = async (toolCall: ToolCall): Promise<any> => {
    const input = JSON.parse(toolCall.input);
    const userInput = prompt(input.prompt || 'Please provide input:');
    
    if (userInput !== null) {
      return { input: userInput };
    } else {
      throw new Error('Input request cancelled by user');
    }
  };

  const handleApprovalRequest = async (toolCall: ToolCall): Promise<any> => {
    const input = JSON.parse(toolCall.input);
    const toolCallsToApprove: ToolCall[] = input.tool_calls || [];
    const reason: string = input.reason;

    const toolNames = toolCallsToApprove.map(tc => tc.tool_name).join(', ');
    const message = reason 
      ? `${reason}\n\nTools to execute: ${toolNames}\n\nDo you approve?`
      : `Execute tools: ${toolNames}?`;
    
    const approved = confirm(message);
    
    return {
      approved,
      reason: approved ? 'Approved by user' : 'Denied by user',
      tool_calls: toolCallsToApprove
    };
  };

  const handleApproval = (approved: boolean) => {
    setShowApprovalDialog(false);
    onApprovalResponse(approved, approved ? 'Approved by user' : 'Denied by user');
    
    if (approved) {
      // Execute all tool calls
      toolCalls.forEach(toolCall => {
        if (toolCall.tool_name !== APPROVAL_REQUEST_TOOL_NAME) {
          executeToolCall(toolCall);
        }
      });
    }
  };

  const getStatusColor = (status: ToolCallStatus['status']) => {
    switch (status) {
      case 'pending':
        return 'text-gray-500';
      case 'executing':
        return 'text-blue-500';
      case 'completed':
        return 'text-green-500';
      case 'error':
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  };

  const getStatusIcon = (status: ToolCallStatus['status']) => {
    switch (status) {
      case 'executing':
        return <Loader2 className="w-4 h-4 animate-spin" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4" />;
      case 'error':
        return <XCircle className="w-4 h-4" />;
      default:
        return null;
    }
  };

  if (showApprovalDialog) {
    return (
      <div className="my-4 p-4 border border-yellow-200 bg-yellow-50 rounded-lg">
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle className="w-5 h-5 text-yellow-600" />
          <span className="font-semibold text-yellow-800">Approval Required</span>
        </div>
        <p className="text-yellow-700 mb-4">
          The following tools require your approval to execute:
        </p>
        <ul className="list-disc list-inside mb-4 text-yellow-700">
          {toolCalls.filter(tc => tc.tool_name !== APPROVAL_REQUEST_TOOL_NAME).map(toolCall => (
            <li key={toolCall.tool_call_id}>
              {toolCall.tool_name}
            </li>
          ))}
        </ul>
        <div className="flex gap-2">
          <button
            onClick={() => handleApproval(true)}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
          >
            Approve
          </button>
          <button
            onClick={() => handleApproval(false)}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
          >
            Deny
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="my-4 p-4 border border-blue-200 bg-blue-50 rounded-lg">
      <div className="flex items-center gap-2 mb-3">
        <AlertTriangle className="w-5 h-5 text-blue-600" />
        <span className="font-semibold text-blue-800">External Tool Execution</span>
      </div>
      
      <div className="space-y-3">
        {toolCalls.map(toolCall => {
          const status = toolStatuses[toolCall.tool_call_id] || { status: 'pending' };
          
          return (
            <div key={toolCall.tool_call_id} className="flex items-center justify-between p-2 bg-white rounded border">
              <div className="flex items-center gap-2">
                {getToolIcon(toolCall.tool_name)}
                <span className="font-medium">{toolCall.tool_name}</span>
                <span className={`text-sm ${getStatusColor(status.status)}`}>
                  {status.status}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {getStatusIcon(status.status)}
                {status.status === 'pending' && (
                  <button
                    onClick={() => executeToolCall(toolCall)}
                    className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                  >
                    Execute
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
      
      {Object.values(toolStatuses).some(status => status.error) && (
        <div className="mt-3 p-2 bg-red-100 border border-red-200 rounded">
          <p className="text-red-700 text-sm font-medium">Some tools failed to execute:</p>
          {Object.entries(toolStatuses).map(([toolCallId, status]) => 
            status.error && (
              <p key={toolCallId} className="text-red-600 text-sm">
                • {status.error}
              </p>
            )
          )}
        </div>
      )}
    </div>
  );
};