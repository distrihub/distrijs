import { isDistriEvent, isDistriMessage } from '@distri/core';
import type { DistriChatMessage, DistriEvent, DistriMessage, DistriPart } from '@distri/core';

/**
 * The `final` tool carries the answer the run then delivers as an assistant
 * message, so rendering it would show the reply twice. `@distri/react` hides
 * it the same way.
 */
export const HIDDEN_TOOL_NAMES = new Set(['final']);

// Run bookkeeping the web chat also leaves out of the transcript; budget and
// todos belong in `ContextRow`, not in the message list.
const HIDDEN_EVENTS = new Set([
  'run_started', 'run_finished', 'plan_started', 'plan_finished', 'step_started', 'step_completed',
  'text_message_start', 'text_message_content', 'text_message_end', 'tool_results',
  'tool_execution_start', 'tool_execution_end', 'context_budget_update', 'diagnostic_log',
]);

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
    if (HIDDEN_EVENTS.has(event.type)) return false;
    if (event.type === 'tool_calls') {
      return event.data.tool_calls.some(call => !HIDDEN_TOOL_NAMES.has(call.tool_name));
    }
    return true;
  }
  return true;
}

/** True between a user message and the first visible assistant output after it. */
export function isAwaitingReply(messages: DistriChatMessage[], isRunning: boolean): boolean {
  if (!isRunning) return false;
  for (let i = messages.length - 1; i >= 0; i--) {
    const message = messages[i];
    if (!isVisibleMessage(message)) continue;
    return isDistriMessage(message) && (message as DistriMessage).role === 'user';
  }
  return true;
}
