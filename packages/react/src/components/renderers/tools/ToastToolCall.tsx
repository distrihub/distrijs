import React, { useEffect } from 'react';
import { UiToolProps } from '@/types';
import { ToolResult } from '@distri/core';

import { toast } from "sonner";

export const ToastToolCall: React.FC<UiToolProps> = ({
  toolCall,
  completeTool
}) => {

  const input = typeof toolCall.input === 'string' ? JSON.parse(toolCall.input) : toolCall.input;
  const message = input.message || 'Toast message';
  const type = input.type || 'info';
  let method;
  switch (type) {
    case 'success':
      method = toast.success;
      break;
    case 'error':
      method = toast.error;
      break;
    case 'warning':
      method = toast.warning;
      break;
    default:
      method = toast.info;
  }
  const duration = 500;
  useEffect(() => {

    method(message, {
      duration: duration * 2,
      position: 'top-right',
      className: 'bg-background text-foreground border border-border',
      style: {
        backgroundColor: 'var(--background)',
        color: 'var(--foreground)',
        border: '1px solid var(--border)'
      },
    });
    setTimeout(() => {
      // Complete the tool call
      const result: ToolResult = {
        tool_call_id: toolCall.tool_call_id,
        tool_name: toolCall.tool_name,
        result: 'Toast displayed successfully',
        success: true,
        error: undefined
      };
      completeTool(result);
    }, duration);
  }, [message, type, completeTool]);

  return (<></>);
};