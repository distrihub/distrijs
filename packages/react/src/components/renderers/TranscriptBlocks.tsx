import React from 'react';
import type { DistriChatMessage, DistriEvent, DistriMessage } from '@distri/core';
import type { TranscriptBlock } from '@distri/state';
import { MessageRenderer, MessageRow } from './MessageRenderer';
import { ToolStepsRenderer } from './ToolStepsRenderer';
import { ToolCallState } from '@/stores/chatStateStore';
import { ToolRendererMap, RenderingMode, TranscriptRenderingProps } from '@/types';

/** Events the web transcript renders as their own row; everything else is bookkeeping. */
const RENDERED_EVENT_TYPES = new Set(['agent_handover', 'run_error', 'live_view']);
export const isRenderedEvent = (event: DistriEvent) => RENDERED_EVENT_TYPES.has(event.type);

function textOf(message: DistriMessage): string {
  return message.parts
    .filter(part => part.part_type === 'text')
    .map(part => (part as { data: string }).data)
    .join('')
    .trim();
}

/** First source index a block covers (steps blocks span several events). */
export function blockStart(block: TranscriptBlock): number {
  return block.kind === 'steps' ? block.startIndex : block.index;
}

export interface TranscriptBlockViewProps extends TranscriptRenderingProps {
  toolCalls: Map<string, ToolCallState>;
  /** Streaming state per step, for the AssistantText slot. */
  stepStatus?: (stepId: string) => string | undefined;
  toolRenderers?: ToolRendererMap;
  rendering?: RenderingMode;
  verbose?: boolean;
  debug?: boolean;
  threadId?: string;
  enableFeedback?: boolean;
  onShowTrace?: (threadId: string) => void;
  /** Set inside a SubTaskCard: its messages carry a parentTaskId and would otherwise be skipped. */
  inSubTaskCard?: boolean;
}

/**
 * One transcript block as the chat draws it. `<ChatMessageList>` and the
 * sub-agent card both render through this, so a helper's tool calls get the
 * same labels, grouping and slots as the lead's.
 */
export function renderTranscriptBlock(block: TranscriptBlock, p: TranscriptBlockViewProps): React.ReactNode {
  switch (block.kind) {
    case 'steps':
      return (
        <MessageRow key={block.key} className="distri-tool-execution-start">
          <ToolStepsRenderer
            block={block}
            toolCallStates={p.toolCalls}
            toolRenderers={p.toolRenderers}
            rendering={p.rendering}
            debug={p.debug}
            verbose={p.verbose}
            grouped={p.groupToolCalls === 'run'}
            toolLabels={p.toolLabels}
            ToolSteps={p.components?.ToolSteps}
          />
        </MessageRow>
      );
    case 'user': {
      const UserMessage = p.components?.UserMessage;
      if (UserMessage) {
        return (
          <MessageRow key={block.key} className="distri-user-message" isUserMessage>
            <UserMessage message={block.message} />
          </MessageRow>
        );
      }
      break;
    }
    case 'assistant': {
      const AssistantText = p.components?.AssistantText;
      if (AssistantText) {
        const stepId = block.message.step_id;
        return (
          <MessageRow key={block.key} className="distri-assistant-message">
            <AssistantText
              message={block.message}
              text={textOf(block.message)}
              isFinal={block.isFinal}
              isStreaming={stepId ? p.stepStatus?.(stepId) === 'running' : false}
            />
          </MessageRow>
        );
      }
      break;
    }
    default:
      break;
  }
  return (
    <MessageRenderer
      key={block.key}
      message={block.message as DistriChatMessage}
      index={block.index}
      toolRenderers={p.toolRenderers}
      debug={p.debug}
      verbose={p.verbose}
      rendering={p.rendering}
      toolSummaryOverrides={p.toolSummaryOverrides}
      threadId={p.threadId}
      enableFeedback={p.enableFeedback}
      onShowTrace={p.onShowTrace}
      inSubTaskCard={p.inSubTaskCard}
    />
  );
}
