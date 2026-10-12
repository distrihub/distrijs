import { isDistriEvent, isDistriMessage } from '@distri/core';
import type { DistriChatMessage, DistriEvent, DistriMessage, DistriPart } from '@distri/core';
import { HIDDEN_TOOL_NAMES, TRANSCRIPT_HIDDEN_EVENTS, resolveTranscriptMessages } from '@distri/state';
import type { HidePartFn } from '@distri/state';

/**
 * The `final` tool carries the answer the run then delivers as an assistant
 * message, so rendering it would show the reply twice. Shared with
 * `@distri/react` through `@distri/state`.
 */
export { HIDDEN_TOOL_NAMES };

export function isVisiblePart(part: DistriPart): boolean {
  if (part.part_type === 'tool_result') return false;
  if (part.part_type === 'tool_call') return !HIDDEN_TOOL_NAMES.has(part.data.tool_name);
  if (part.part_type === 'text') return part.data.trim().length > 0;
  return true;
}

/** Whether a message or event produces anything in the transcript. */
export function isVisibleMessage(message: DistriChatMessage): boolean {
  if (isDistriMessage(message)) {
    const msg = message as DistriMessage;
    if (msg.role !== 'user' && msg.role !== 'assistant') return false;
    return msg.parts.some(isVisiblePart);
  }
  if (isDistriEvent(message)) {
    const event = message as DistriEvent;
    if (TRANSCRIPT_HIDDEN_EVENTS.has(event.type)) return false;
    if (event.type === 'tool_calls') {
      return event.data.tool_calls.some(call => !HIDDEN_TOOL_NAMES.has(call.tool_name));
    }
    return true;
  }
  return true;
}

/**
 * The messages the transcript shows: developer parts hidden (or whatever
 * `hidePart` decides), superseded drafts' text removed in favour of the
 * turn's final answer, repeated ids collapsed — the same rules
 * `@distri/react` applies, from `@distri/state` — then invisible rows dropped.
 */
export function resolveVisibleMessages(messages: DistriChatMessage[], hidePart?: HidePartFn): DistriChatMessage[] {
  return resolveTranscriptMessages(messages, { hidePart }).filter(isVisibleMessage);
}

/** True between a user message and the first visible assistant output after it. */
export function isAwaitingReply(messages: DistriChatMessage[], isRunning: boolean, hidePart?: HidePartFn): boolean {
  if (!isRunning) return false;
  const visible = resolveVisibleMessages(messages, hidePart);
  for (let i = visible.length - 1; i >= 0; i--) {
    const message = visible[i];
    if (!isVisibleMessage(message)) continue;
    return isDistriMessage(message) && (message as DistriMessage).role === 'user';
  }
  return true;
}
