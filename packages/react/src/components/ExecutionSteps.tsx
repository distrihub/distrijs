import React, { useState } from 'react';
import { 
  DistriEvent, 
  PlanStartedEvent, 
  PlanFinishedEvent, 
  StepStartedEvent, 
  StepCompletedEvent,
  ToolExecutionStartEvent,
  ToolExecutionEndEvent,
  ToolRejectedEvent 
} from '@distrijs/core';
import { ChevronDown, ChevronRight, CheckCircle, XCircle, Clock, Play } from 'lucide-react';

export interface ExecutionStep {
  id: string;
  index: number;
  status: 'pending' | 'running' | 'completed' | 'failed';
  started_at?: string;
  completed_at?: string;
  success?: boolean;
}

export interface ExecutionStepsProps {
  steps: ExecutionStep[];
  currentStepId?: string;
  isPlanning?: boolean;
  planDescription?: string;
  className?: string;
}

interface StepItemProps {
  step: ExecutionStep;
  isActive: boolean;
  isExpanded: boolean;
  onToggleExpanded: () => void;
}

const StepStatusIcon: React.FC<{ status: ExecutionStep['status'] }> = ({ status }) => {
  switch (status) {
    case 'pending':
      return <Clock className="w-4 h-4 text-muted-foreground" />;
    case 'running':
      return <Play className="w-4 h-4 text-blue-500 animate-pulse" />;
    case 'completed':
      return <CheckCircle className="w-4 h-4 text-green-500" />;
    case 'failed':
      return <XCircle className="w-4 h-4 text-red-500" />;
    default:
      return <Clock className="w-4 h-4 text-muted-foreground" />;
  }
};

const StepItem: React.FC<StepItemProps> = ({ step, isActive, isExpanded, onToggleExpanded }) => {
  return (
    <div className={`border-l-2 pl-4 pb-4 transition-all duration-200 ${
      isActive ? 'border-blue-500' : 'border-border'
    }`}>
      <div 
        className="flex items-start gap-3 cursor-pointer group"
        onClick={onToggleExpanded}
      >
        <div className="flex items-center gap-2 flex-1">
          <StepStatusIcon status={step.status} />
          <div className="flex items-center gap-1">
            <ChevronRight className="w-3 h-3 text-muted-foreground" />
            <span className="text-sm font-medium">Step {step.index + 1}</span>
          </div>
        </div>
      </div>
      
      <div className="mt-2 pl-6">
        <p className={`text-sm transition-all duration-200 ${
          isActive ? 'text-foreground' : 'text-muted-foreground'
        }`}>
          Step {step.id}
        </p>
        
        {step.status === 'running' && (
          <div className="mt-2 flex items-center gap-2 text-xs text-blue-600">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
            Executing...
          </div>
        )}
      </div>
    </div>
  );
};

export const ExecutionSteps: React.FC<ExecutionStepsProps> = ({
  steps,
  currentStepId,
  isPlanning = false,
  planDescription,
  className = "",
}) => {
  const [expandedSteps, setExpandedSteps] = useState<Set<string>>(new Set());

  const toggleExpanded = (stepId: string) => {
    setExpandedSteps(prev => {
      const newSet = new Set(prev);
      if (newSet.has(stepId)) {
        newSet.delete(stepId);
      } else {
        newSet.add(stepId);
      }
      return newSet;
    });
  };

  if (isPlanning) {
    return (
      <div className={`space-y-3 ${className}`}>
        <div className="flex items-center gap-3 p-3 rounded-md bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800">
          <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <div>
            <div className="text-sm font-medium text-blue-700 dark:text-blue-300">Planning steps...</div>
            {planDescription && (
              <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">{planDescription}</div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-1 ${className}`}>
      {steps.map((step) => (
        <StepItem
          key={step.id}
          step={step}
          isActive={step.id === currentStepId}
          isExpanded={expandedSteps.has(step.id)}
          onToggleExpanded={() => toggleExpanded(step.id)}
        />
      ))}
    </div>
  );
};

export interface ExecutionTrackerProps {
  events: DistriEvent[];
  className?: string;
}

export const ExecutionTracker: React.FC<ExecutionTrackerProps> = ({
  events,
  className = "",
}) => {
  const [steps, setSteps] = useState<ExecutionStep[]>([]);
  const [isPlanning, setIsPlanning] = useState(false);
  const [currentStepId, setCurrentStepId] = useState<string | undefined>();

  React.useEffect(() => {
    // Process events to build execution state
    let newSteps: ExecutionStep[] = [...steps];
    let planning = isPlanning;
    let currentStep = currentStepId;

    for (const event of events) {
      switch (event.type) {
        case 'plan_started':
          planning = true;
          break;

        case 'plan_finished':
          planning = false;
          break;

        case 'step_started':
          const startedEvent = event as StepStartedEvent;
          currentStep = startedEvent.data.step_id;
          
          // Add or update step
          const existingIndex = newSteps.findIndex(s => s.id === startedEvent.data.step_id);
          if (existingIndex >= 0) {
            newSteps[existingIndex] = {
              ...newSteps[existingIndex],
              status: 'running',
              started_at: new Date().toISOString()
            };
          } else {
            newSteps.push({
              id: startedEvent.data.step_id,
              index: startedEvent.data.step_index,
              status: 'running',
              started_at: new Date().toISOString()
            });
          }
          break;

        case 'step_completed':
          const completedEvent = event as StepCompletedEvent;
          const stepIndex = newSteps.findIndex(s => s.id === completedEvent.data.step_id);
          if (stepIndex >= 0) {
            newSteps[stepIndex] = {
              ...newSteps[stepIndex],
              status: completedEvent.data.success ? 'completed' : 'failed',
              success: completedEvent.data.success,
              completed_at: new Date().toISOString()
            };
          }
          break;
      }
    }

    setSteps(newSteps);
    setIsPlanning(planning);
    setCurrentStepId(currentStep);
  }, [events]);

  if (!isPlanning && steps.length === 0) {
    return null;
  }

  return (
    <div className={`p-4 rounded-lg border bg-card ${className}`}>
      <div className="mb-3">
        <h3 className="text-sm font-semibold text-foreground">Execution Plan</h3>
      </div>
      <ExecutionSteps
        steps={steps}
        currentStepId={currentStepId}
        isPlanning={isPlanning}
      />
    </div>
  );
};