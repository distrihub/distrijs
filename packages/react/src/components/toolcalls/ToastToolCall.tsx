import React, { useEffect } from 'react';
import { CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { ToolCall } from '@distri/core';
import { useToast } from '../../hooks/use-toast';

interface ToastToolCallProps {
  toolCall: ToolCall;
  onComplete: (result: any, success: boolean, error?: string) => void;
  status: 'pending' | 'running' | 'completed' | 'error' | 'user_action_required';
}

export const ToastToolCall: React.FC<ToastToolCallProps> = ({
  toolCall,
  onComplete,
  status
}) => {
  const { toast } = useToast();
  
  const input = typeof toolCall.input === 'string' ? JSON.parse(toolCall.input) : toolCall.input;
  const message = input.message || 'Toast message';
  const type = input.type || 'info';

  const typeIcons = {
    success: CheckCircle,
    error: AlertCircle,
    warning: AlertTriangle,
    info: Info
  };

  const typeColors = {
    success: 'text-green-600',
    error: 'text-red-600',
    warning: 'text-amber-600',
    info: 'text-blue-600'
  };

  useEffect(() => {
    if (status === 'pending') {
      // Show the toast
      toast({
        title: message,
        variant: type === 'error' ? 'destructive' : 'default',
      });

      // Complete the tool call
      const result = {
        success: true,
        message: 'Toast displayed successfully'
      };
      onComplete(result, true);
    }
  }, [status, message, type, toast, onComplete]);

  const Icon = typeIcons[type as keyof typeof typeIcons] || Info;
  const iconColor = typeColors[type as keyof typeof typeColors] || 'text-blue-600';

  return (
    <div className="border rounded-lg p-3 bg-muted/50">
      <div className="flex items-center gap-2">
        <Icon className={`h-4 w-4 ${iconColor}`} />
        <span className="font-medium text-sm">Toast Notification</span>
      </div>
      <p className="text-sm text-muted-foreground mt-1">{message}</p>
      {status === 'completed' && (
        <p className="text-xs text-green-600 mt-1">✓ Notification displayed</p>
      )}
    </div>
  );
};