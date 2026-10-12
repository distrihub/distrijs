import React, { useEffect, useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { summarizeToolRun, toolStepLabel } from '@distri/state';
import type { TranscriptStepsBlock } from '@distri/state';
import { ToolCallState } from '@/stores/chatStateStore';
import { ToolRendererMap, RenderingMode, ToolStepsSlotProps } from '@/types';
import { ToolExecutionRenderer } from './ToolExecutionRenderer';
import { useRendererContext } from './RendererContext';

export interface ToolStepsRendererProps {
  block: TranscriptStepsBlock;
  toolCallStates: Map<string, ToolCallState>;
  toolRenderers?: ToolRendererMap;
  rendering?: RenderingMode;
  debug?: boolean;
  verbose?: boolean;
  /** Fold the calls behind one "N steps · …" row (`groupToolCalls="run"`). */
  grouped?: boolean;
  /** Host labels per tool name for the folded summary. */
  toolLabels?: Record<string, string>;
  /** Host replacement for the whole block. */
  ToolSteps?: React.ComponentType<ToolStepsSlotProps>;
}

function needsAttention(state?: ToolCallState): boolean {
  return state?.status === 'user_action_required' || state?.status === 'error';
}

function RunStatus({ states }: { states: (ToolCallState | undefined)[] }) {
  if (states.some(s => s?.status === 'error')) {
    return <span className="text-destructive text-[11px] w-3.5 text-center flex-shrink-0">✗</span>;
  }
  if (states.some(s => s?.status === 'running' || s?.status === 'pending' || s?.status === 'user_action_required')) {
    return (
      <span className="w-3.5 flex-shrink-0 flex items-center justify-center">
        <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
      </span>
    );
  }
  return <span className="text-primary text-[11px] w-3.5 text-center flex-shrink-0">✓</span>;
}

/**
 * Renders one transcript `steps` block: the tool calls as Distri's usual rows
 * or cards, or — when `grouped` — folded behind a single expandable
 * "N steps · label, label…" row. A folded run opens itself when a call needs
 * the user (approval/input) or fails, so nothing actionable stays hidden.
 */
export const ToolStepsRenderer: React.FC<ToolStepsRendererProps> = ({
  block,
  toolCallStates,
  toolRenderers,
  rendering,
  debug = false,
  verbose = false,
  grouped = false,
  toolLabels,
  ToolSteps,
}) => {
  const { toolSummaryOverrides } = useRendererContext();
  const states = block.toolCalls.map(call => toolCallStates.get(call.tool_call_id));
  const attention = states.some(needsAttention);
  const [open, setOpen] = useState(attention);

  useEffect(() => {
    if (attention) setOpen(true);
  }, [attention]);

  const labels = block.toolCalls.map((call, i) => toolStepLabel(call, {
    toolLabels,
    summaryOverrides: toolSummaryOverrides,
    result: states[i]?.result,
  }));
  const summary = summarizeToolRun(labels);

  // Tool calls only render once the store knows them (same rule as before folding).
  if (toolCallStates.size === 0) return null;

  const content = (
    <ToolExecutionRenderer
      event={{ type: 'tool_calls', data: { tool_calls: block.toolCalls } }}
      toolCallStates={toolCallStates}
      toolRenderers={toolRenderers}
      rendering={rendering}
      debug={debug}
      verbose={verbose}
    />
  );

  if (ToolSteps) {
    return (
      <ToolSteps
        toolCalls={block.toolCalls}
        toolCallStates={toolCallStates}
        labels={labels}
        summary={summary}
        grouped={grouped}
      >
        {content}
      </ToolSteps>
    );
  }

  if (!grouped) return content;

  return (
    <div className="distri-tool-steps">
      <button
        type="button"
        className="flex w-full items-center gap-2 py-1 text-left text-xs text-muted-foreground hover:text-foreground transition-colors"
        aria-expanded={open}
        onClick={() => setOpen(prev => !prev)}
      >
        {open
          ? <ChevronDown className="h-3 w-3 flex-shrink-0" />
          : <ChevronRight className="h-3 w-3 flex-shrink-0" />}
        <RunStatus states={states} />
        <span className="truncate">{summary}</span>
      </button>
      {open && <div className="distri-tool-steps-body pl-5">{content}</div>}
    </div>
  );
};
