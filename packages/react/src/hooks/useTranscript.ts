import { useMemo } from 'react';
import type { DistriChatMessage } from '@distri/core';
import { buildTranscript } from '@distri/state';
import type { BuildTranscriptOptions, TranscriptBlock } from '@distri/state';

export {
  buildTranscript,
  resolveTranscriptMessages,
  findSupersededDrafts,
  isFinalAnswerMessage,
  hideDeveloperParts,
  toolStepLabel,
  summarizeToolRun,
} from '@distri/state';
export type {
  BuildTranscriptOptions,
  TranscriptBlock,
  TranscriptUserBlock,
  TranscriptAssistantBlock,
  TranscriptStepsBlock,
  TranscriptEventBlock,
  ResolveTranscriptOptions,
} from '@distri/state';

/**
 * The transcript as renderable blocks — `user`, `assistant`, `steps` (tool
 * calls, optionally folded into runs) and `event` — with developer parts
 * hidden and superseded drafts resolved against the turn's final answer.
 * `<ChatMessageList>` renders exactly these blocks; hosts that want their own
 * UI can render them instead of re-deriving the folding and de-dupe rules.
 *
 * Pass stable option values (memoized callbacks) to avoid recomputing on
 * every render.
 */
export function useTranscript(
  messages: DistriChatMessage[],
  options: BuildTranscriptOptions = {},
): TranscriptBlock[] {
  const { hidePart, groupToolCalls, isVisibleEvent, excludeMessage, includeDeveloperMessages } = options;
  return useMemo(
    () => buildTranscript(messages, { hidePart, groupToolCalls, isVisibleEvent, excludeMessage, includeDeveloperMessages }),
    [messages, hidePart, groupToolCalls, isVisibleEvent, excludeMessage, includeDeveloperMessages],
  );
}
