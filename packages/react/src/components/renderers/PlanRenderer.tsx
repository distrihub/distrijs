import React from 'react';
import { Eye, Code, Zap } from 'lucide-react';
import { DistriArtifact, DistriPlan, PlanStep, ThoughtPlanStep, ActionPlanStep, CodePlanStep, ReactStep } from '@distri/core';
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

  if (step.type === 'thought') {
    const thoughtStep = step as ThoughtPlanStep;
    return (
      <div className="border border-border rounded-lg p-4 mb-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="flex items-center justify-center w-6 h-6 bg-blue-500 text-white rounded-full text-xs font-medium">
            <Eye className="h-3 w-3" />
          </div>
          <h4 className="font-medium text-foreground">Thinking</h4>
        </div>
        <div className="text-sm text-muted-foreground pl-8">
          {thoughtStep.message}
        </div>
      </div>
    );
  }

  if (step.type === 'action') {
    const actionStep = step as ActionPlanStep;
    const { action } = actionStep;
    
    return (
      <div className="border border-border rounded-lg p-4 mb-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="flex items-center justify-center w-6 h-6 bg-green-500 text-white rounded-full text-xs font-medium">
            <Zap className="h-3 w-3" />
          </div>
          <h4 className="font-medium text-foreground">
            {action.tool_name ? `Using ${action.tool_name}` : 'Action'}
          </h4>
        </div>
        <div className="pl-8 space-y-2">
          {action.tool_name && (
            <div className="text-sm">
              <span className="font-medium text-muted-foreground">Tool:</span> {action.tool_name}
            </div>
          )}
          {action.input && (
            <div className="text-sm">
              <span className="font-medium text-muted-foreground">Input:</span>
              <pre className="mt-1 text-xs bg-muted p-2 rounded border overflow-x-auto">
                {typeof action.input === 'string' ? action.input : JSON.stringify(action.input, null, 2)}
              </pre>
            </div>
          )}
          {action.prompt && (
            <div className="text-sm">
              <span className="font-medium text-muted-foreground">Prompt:</span> {action.prompt}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (step.type === 'code') {
    const codeStep = step as CodePlanStep;
    return (
      <div className="border border-border rounded-lg p-4 mb-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="flex items-center justify-center w-6 h-6 bg-purple-500 text-white rounded-full text-xs font-medium">
            <Code className="h-3 w-3" />
          </div>
          <h4 className="font-medium text-foreground">Code ({codeStep.language})</h4>
        </div>
        <div className="pl-8">
          <pre className="text-xs bg-muted p-3 rounded border overflow-x-auto">
            <code>{codeStep.code}</code>
          </pre>
        </div>
      </div>
    );
  }

  // Legacy support for react_step
  if ('type' in step && (step as { type: string }).type === 'react_step') {
    const reactStep = step as unknown as ReactStep;
    return (
      <div className="border border-border rounded-lg p-4 mb-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="flex items-center justify-center w-6 h-6 bg-primary text-primary-foreground rounded-full text-xs font-medium">
            {index + 1}
          </div>
          <h4 className="font-medium text-foreground">ReAct Step</h4>
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

  // For other step types, don't render anything
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

        {/* Steps */}
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