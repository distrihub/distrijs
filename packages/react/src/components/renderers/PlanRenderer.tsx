import React from 'react';
import { Eye } from 'lucide-react';
import { DistriArtifact, DistriPlan, PlanStep, ThoughtStep, ReactStep } from '@distri/core';
import { useChatStateStore } from '../../stores/chatStateStore';

export interface PlanRendererProps {
  message: DistriArtifact;
  className?: string;
  avatar?: React.ReactNode;
}

const formatDuration = (milliseconds: number): string => {
  const seconds = (milliseconds / 1000).toFixed(2);
  return `${seconds}s`;
};

const StepRenderer: React.FC<{ step: PlanStep; index: number }> = ({ step, index }) => {
  // Only render text for thought and react steps
  if (step.type === 'thought') {
    const thoughtStep = step as ThoughtStep;
    return (
      <div className="border border-border rounded-lg p-4 mb-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="flex items-center justify-center w-6 h-6 bg-primary text-primary-foreground rounded-full text-xs font-medium">
            {index + 1}
          </div>
          <h4 className="font-medium text-foreground">{step.title}</h4>
        </div>
        <div className="text-sm text-muted-foreground pl-8">
          {thoughtStep.message}
        </div>
      </div>
    );
  }

  if (step.type === 'react_step') {
    const reactStep = step as ReactStep;
    return (
      <div className="border border-border rounded-lg p-4 mb-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="flex items-center justify-center w-6 h-6 bg-primary text-primary-foreground rounded-full text-xs font-medium">
            {index + 1}
          </div>
          <h4 className="font-medium text-foreground">{step.title}</h4>
        </div>
        <div className="pl-8 space-y-2">
          <div className="text-sm">
            <span className="font-medium text-muted-foreground">Thought:</span> {reactStep.thought}
          </div>
          <div className="text-sm">
            <span className="font-medium text-muted-foreground">Action:</span> {reactStep.action}
          </div>
        </div>
      </div>
    );
  }

  // For other step types, don't render anything (too complex)
  return null;
};

export const PlanRenderer: React.FC<PlanRendererProps> = ({
  message,
  className = '',
}) => {
  const plans = useChatStateStore(state => state.plans);
  const planState = plans.get(message.id);

  // Type guard to ensure message is DistriPlan
  const isPlan = message.type === 'plan';
  if (!isPlan) return null;

  const plan = message as DistriPlan;
  const thinkingDuration = planState?.thinkingDuration || 0;

  return (
    <div className={`flex items-start gap-4 py-6 ${className}`}>
      <div className="w-full">
        {/* Thought for X seconds header */}
        <div className="flex items-center gap-2 mb-4">
          <Eye className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground font-medium">
            Thought for {formatDuration(thinkingDuration)}
          </span>
        </div>

        {/* Reasoning */}
        {plan.reasoning && (
          <div className="mb-6">
            <div className="bg-muted/30 border border-border rounded-lg p-4">
              <div className="prose prose-sm max-w-none text-foreground">
                {plan.reasoning}
              </div>
            </div>
          </div>
        )}

        {/* Steps - only render thought and react steps */}
        {plan.steps && plan.steps.length > 0 && (
          <div className="space-y-4">
            {plan.steps.map((step, index) => (
              <StepRenderer key={step.id || index} step={step} index={index} />
            )).filter(Boolean)}
          </div>
        )}

      </div>
    </div>
  );
}; 