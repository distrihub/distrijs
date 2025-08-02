import React from 'react';
import { DistriPlan } from '@distri/core';
import { PlanMessage } from '../Components';

interface PlanRendererProps {
  plan: DistriPlan;
}

export function PlanRenderer({ plan }: PlanRendererProps) {
  return (
    <div className="space-y-2">
      {/* Text observation */}
      <div className="prose prose-sm max-w-none">
        <p>Planning phase completed with {plan.steps.length} step(s).</p>
      </div>

      {/* Plan details */}
      <PlanMessage
        message={{
          id: plan.id,
          role: 'assistant',
          parts: []
        }}
        plan={plan.steps.join('\n')}
        timestamp={new Date(plan.timestamp)}
      />
    </div>
  );
} 