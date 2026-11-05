import type { DistriChatMessage, DistriMessage } from '@distri/core';
import type { ChatStore, SummaryFn, ToolCallState, TranscriptBlock } from '@distri/state';
import type { NativeToolRendererMap, RenderingMode } from '../types';
import { MessageRenderer } from './MessageRenderer';
import { ToolSteps } from './ToolSteps';

export interface TranscriptBlockContext {
  store: ChatStore;
  toolCalls: Map<string, ToolCallState>;
  externalTools: NonNullable<ReturnType<ChatStore['getState']>['externalTools']>;
  rendering: RenderingMode;
  toolRenderers?: NativeToolRendererMap;
  groupToolCalls?: 'none' | 'run';
  toolLabels?: Record<string, string>;
  toolSummaryOverrides?: Record<string, SummaryFn>;
}

/** The message without its tool_call parts: the steps block beside it draws them. */
function withoutToolCalls(message: DistriMessage): DistriMessage {
  if (!message.parts.some(p => p.part_type === 'tool_call')) return message;
  return { ...message, parts: message.parts.filter(p => p.part_type !== 'tool_call') };
}

/** One transcript block as the native chat draws it. The list and the sub-agent card share it. */
export function TranscriptBlockView({ block, ctx }: { block: TranscriptBlock; ctx: TranscriptBlockContext }) {
  if (block.kind === 'steps') {
    return (
      <ToolSteps
        block={block}
        states={ctx.toolCalls}
        tools={ctx.externalTools}
        store={ctx.store}
        renderers={ctx.toolRenderers}
        rendering={ctx.rendering}
        grouped={ctx.groupToolCalls === 'run'}
        toolLabels={ctx.toolLabels}
        toolSummaryOverrides={ctx.toolSummaryOverrides}
      />
    );
  }
  const message: DistriChatMessage = block.kind === 'assistant' ? withoutToolCalls(block.message) : block.message;
  return (
    <MessageRenderer
      message={message}
      store={ctx.store}
      toolCalls={ctx.toolCalls}
      externalTools={ctx.externalTools}
      rendering={ctx.rendering}
      toolRenderers={ctx.toolRenderers}
    />
  );
}
