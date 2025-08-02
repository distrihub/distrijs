import React from 'react';
import { Loader2, CheckCircle } from 'lucide-react';
import { StepState } from '../../stores/chatStateStore';

export interface StepRendererProps {
  step: StepState;
  className?: string;
}

export const StepRenderer: React.FC<StepRendererProps> = ({
  step,
  className = '',
}) => {
  const getStatusIcon = () => {
    switch (step.status) {
      case 'running':
        return <Loader2 className="h-4 w-4 text-primary animate-spin" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-primary" />;
      case 'failed':
        return <div className="h-4 w-4 text-destructive">✗</div>;
      default:
        return <Loader2 className="h-4 w-4 text-muted-foreground animate-spin" />;
    }
  };

  const getStatusText = () => {
    switch (step.status) {
      case 'running':
        return 'Running...';
      case 'completed':
        return 'Completed';
      case 'failed':
        return 'Failed';
      default:
        return 'Unknown';
    }
  };

  return (
    <div className={`py-6 ${className}`}>
      <div className="max-w-3xl mx-auto p-4 bg-muted/50 rounded-lg border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {getStatusIcon()}
            <div>
              <div className="text-sm font-medium text-foreground">
                Step {step.index + 1}: {step.title}
              </div>
              <div className="text-xs text-muted-foreground">
                {getStatusText()}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 