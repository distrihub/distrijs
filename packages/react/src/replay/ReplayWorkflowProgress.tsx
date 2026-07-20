import { WorkflowProgress } from '../components/WorkflowProgress';
import type { WorkflowDefinition } from '@distri/core';
import type { ReplayWorkflow } from './types';

export interface ReplayWorkflowProgressProps {
  workflow: ReplayWorkflow;
  className?: string;
  detailed?: boolean;
}

/**
 * Renders a cassette's `workflow_step` events through the real
 * `WorkflowProgress` component — same fix pattern as `ReplaySubTaskTree`:
 * deterministic, scrubbable steps instead of a `setInterval` faking progress.
 * `ReplayWorkflow` only carries the fields `WorkflowProgress` actually reads
 * (id/label/status/error/result per step), cast at this single call site
 * rather than requiring every hand-authored cassette to supply a full,
 * strict `WorkflowDefinition`.
 */
export function ReplayWorkflowProgress({ workflow, className, detailed }: ReplayWorkflowProgressProps) {
  return (
    <WorkflowProgress
      workflow={workflow as unknown as WorkflowDefinition}
      className={className}
      detailed={detailed}
    />
  );
}
