import { isDistriEvent, isDistriMessage } from '@distri/core';
import type {
  DistriChatMessage,
  DistriEvent,
  DistriMessage,
  DistriPart,
  PartMetadata,
  ToolCall,
  ToolResult,
} from '@distri/core';
import { getToolSummary } from '../utils/getToolSummary';
import type { SummaryFn } from '../utils/getToolSummary';

/**
 * Transcript model shared by every renderer (@distri/react, @distri/react-native).
 *
 * Two rules live here and nowhere else:
 *
 * 1. **Part visibility.** Parts flagged `developer: true` in
 *    `message.metadata.parts` reach the model but are hidden from the
 *    transcript. Hosts can replace the predicate (`hidePart`).
 * 2. **One answer per turn.** The server marks a turn's final answer with
 *    `is_final` (`metadata.is_final` on the wire). Within one task, the Text
 *    parts of EARLIER assistant messages are hidden when that message also
 *    called the `final` tool, or when its text equals the final text. Tool
 *    calls and other parts of those messages still render.
 */

/** Name of the terminal tool whose input the run delivers as the final answer. */
export const FINAL_TOOL_NAME = 'final';

/** Tools never shown as steps: `final` carries the answer the run then delivers as a message. */
export const HIDDEN_TOOL_NAMES: ReadonlySet<string> = new Set([FINAL_TOOL_NAME]);

/**
 * Run bookkeeping that never produces a transcript row; budget and todos
 * belong in a context row, not in the message list.
 */
export const TRANSCRIPT_HIDDEN_EVENTS: ReadonlySet<string> = new Set([
  'run_started', 'run_finished', 'plan_started', 'plan_finished', 'step_started', 'step_completed',
  'text_message_start', 'text_message_content', 'text_message_end', 'tool_results',
  'tool_execution_start', 'tool_execution_end', 'context_budget_update', 'diagnostic_log',
]);

export interface PartVisibilityContext {
  /** The message that owns the part. */
  message: DistriMessage;
  /** Position of the part in `message.parts`. */
  index: number;
  /** `message.metadata.parts[index]`, when present. */
  metadata?: PartMetadata;
}

/** Return true to hide a part from the transcript. */
export type HidePartFn = (part: DistriPart, context: PartVisibilityContext) => boolean;

/** Default {@link HidePartFn}: hide parts flagged `developer: true`. */
export const hideDeveloperParts: HidePartFn = (_part, context) => context.metadata?.developer === true;

/** True when the message is the server-marked final answer of its turn. */
export function isFinalAnswerMessage(message: DistriChatMessage): message is DistriMessage {
  if (!isDistriMessage(message)) return false;
  const msg = message as DistriMessage;
  return msg.is_final === true || msg.metadata?.is_final === true;
}

function partMetadata(message: DistriMessage, index: number): PartMetadata | undefined {
  return message.metadata?.parts?.[index];
}

/** Concatenated, trimmed text of the message's non-developer text parts. */
function visibleText(message: DistriMessage): string {
  return message.parts
    .filter((part, index) => part.part_type === 'text' && partMetadata(message, index)?.developer !== true)
    .map(part => (part as { data: string }).data)
    .join('')
    .trim();
}

function hasFinalToolCallPart(message: DistriMessage): boolean {
  return message.parts.some(part => part.part_type === 'tool_call' && part.data.tool_name === FINAL_TOOL_NAME);
}

function isFinalToolCallsEvent(message: DistriChatMessage, taskId: string): boolean {
  if (!isDistriEvent(message)) return false;
  const event = message as DistriEvent;
  if (event.type !== 'tool_calls') return false;
  if (event.taskId !== undefined && event.taskId !== taskId) return false;
  return event.data.tool_calls.some(call => call.tool_name === FINAL_TOOL_NAME);
}

/**
 * Whether the assistant message at `index` called the `final` tool: either as
 * a `tool_call` part of the message itself, or as the `tool_calls` event that
 * follows it (live streams deliver tool calls as separate events) before the
 * task's next message.
 */
function calledFinalTool(messages: DistriChatMessage[], index: number, taskId: string): boolean {
  if (hasFinalToolCallPart(messages[index] as DistriMessage)) return true;
  for (let i = index + 1; i < messages.length; i++) {
    const next = messages[i];
    if (isDistriMessage(next)) {
      if ((next as DistriMessage).taskId === taskId) return false;
      continue;
    }
    if (isFinalToolCallsEvent(next, taskId)) return true;
  }
  return false;
}

/**
 * Ids of assistant messages whose Text parts are superseded by their task's
 * final answer ("one answer per turn"). Pure; messages without a `taskId`
 * are never superseded because they cannot be attributed to a turn.
 */
export function findSupersededDrafts(messages: DistriChatMessage[]): Set<string> {
  const finalByTask = new Map<string, { index: number; id: string; text: string }>();
  messages.forEach((message, index) => {
    if (!isFinalAnswerMessage(message) || !message.taskId) return;
    finalByTask.set(message.taskId, { index, id: message.id, text: visibleText(message) });
  });

  const superseded = new Set<string>();
  if (finalByTask.size === 0) return superseded;

  messages.forEach((message, index) => {
    if (!isDistriMessage(message)) return;
    const msg = message as DistriMessage;
    if (msg.role !== 'assistant' || !msg.taskId || !msg.id) return;
    const final = finalByTask.get(msg.taskId);
    if (!final || index >= final.index || msg.id === final.id) return;
    const text = visibleText(msg);
    if (!text) return;
    if ((final.text && text === final.text) || calledFinalTool(messages, index, msg.taskId)) {
      superseded.add(msg.id);
    }
  });
  return superseded;
}

export interface ResolveTranscriptOptions {
  /** Part filter; defaults to {@link hideDeveloperParts}. */
  hidePart?: HidePartFn;
}

export interface ResolvedTranscriptEntry {
  message: DistriChatMessage;
  /** Position of the source message in the input array. */
  index: number;
}

/**
 * Collapses repeated message ids (the same message delivered live and again
 * from history, or by the trailing final frame) to one entry: the latest
 * content at the first position.
 */
function dedupeById(messages: DistriChatMessage[]): ResolvedTranscriptEntry[] {
  const entries: ResolvedTranscriptEntry[] = [];
  const positionById = new Map<string, number>();
  messages.forEach((message, index) => {
    const id = isDistriMessage(message) ? (message as DistriMessage).id : undefined;
    if (id) {
      const position = positionById.get(id);
      if (position !== undefined) {
        const previous = entries[position].message as DistriMessage;
        const incoming = message as DistriMessage;
        entries[position] = {
          index: entries[position].index,
          message: { ...previous, ...incoming, parts: incoming.parts.length > 0 ? incoming.parts : previous.parts },
        };
        return;
      }
      positionById.set(id, entries.length);
    }
    entries.push({ message, index });
  });
  return entries;
}

/**
 * Applies part visibility to one message. Returns the original object when
 * nothing changes, a rewritten copy (parts filtered, `metadata.parts`
 * re-indexed, `developer` flags cleared because visibility is already
 * decided) when something does, or null when no parts are left.
 */
function applyPartVisibility(message: DistriMessage, hidePart: HidePartFn, dropText: boolean): DistriMessage | null {
  const keptIndices: number[] = [];
  let changed = false;
  message.parts.forEach((part, index) => {
    const metadata = partMetadata(message, index);
    const hidden = (dropText && part.part_type === 'text') || hidePart(part, { message, index, metadata });
    if (hidden) {
      changed = true;
      return;
    }
    if (metadata?.developer) changed = true;
    keptIndices.push(index);
  });
  if (!changed) return message;
  if (keptIndices.length === 0 && message.parts.length > 0) return null;

  const parts = keptIndices.map(index => message.parts[index]);
  const sourceMetadata = message.metadata?.parts;
  let metadataParts: Record<number, PartMetadata> | undefined;
  if (sourceMetadata) {
    metadataParts = {};
    keptIndices.forEach((sourceIndex, newIndex) => {
      const entry = sourceMetadata[sourceIndex];
      if (!entry) return;
      metadataParts![newIndex] = entry.save === undefined ? {} : { save: entry.save };
    });
  }
  return {
    ...message,
    parts,
    ...(message.metadata ? { metadata: { ...message.metadata, parts: metadataParts } } : {}),
  };
}

/**
 * Resolves the transcript at message granularity: de-duplicates repeated ids,
 * hides parts (developer parts by default) and removes the Text parts of
 * superseded drafts. Messages left with no parts are dropped. Each entry keeps
 * the index of its source message.
 */
export function resolveTranscriptEntries(
  messages: DistriChatMessage[],
  options: ResolveTranscriptOptions = {},
): ResolvedTranscriptEntry[] {
  const hidePart = options.hidePart ?? hideDeveloperParts;
  const entries = dedupeById(messages);
  const superseded = findSupersededDrafts(entries.map(entry => entry.message));
  const resolved: ResolvedTranscriptEntry[] = [];
  for (const entry of entries) {
    if (!isDistriMessage(entry.message)) {
      resolved.push(entry);
      continue;
    }
    const msg = entry.message as DistriMessage;
    const visible = applyPartVisibility(msg, hidePart, superseded.has(msg.id));
    if (visible) resolved.push(visible === msg ? entry : { message: visible, index: entry.index });
  }
  return resolved;
}

/** {@link resolveTranscriptEntries} without the source indices. */
export function resolveTranscriptMessages(
  messages: DistriChatMessage[],
  options: ResolveTranscriptOptions = {},
): DistriChatMessage[] {
  return resolveTranscriptEntries(messages, options).map(entry => entry.message);
}

// ---------------------------------------------------------------------------
// Block model
// ---------------------------------------------------------------------------

export type ToolCallGrouping = 'none' | 'run';

export interface TranscriptUserBlock {
  kind: 'user';
  key: string;
  message: DistriMessage;
  /** Index of the source message in the input array. */
  index: number;
}

export interface TranscriptAssistantBlock {
  kind: 'assistant';
  key: string;
  message: DistriMessage;
  index: number;
  /** True for the server-marked final answer of the turn. */
  isFinal: boolean;
}

export interface TranscriptStepsBlock {
  kind: 'steps';
  key: string;
  /** Visible tool calls in order (`final` removed). */
  toolCalls: ToolCall[];
  /** The `tool_calls` events folded into this block. */
  events: DistriEvent[];
  /** Index of the first source event. */
  startIndex: number;
  /** Index of the last source event. */
  index: number;
}

/** Anything else that renders on its own: visible events, `developer`-role messages. */
export interface TranscriptEventBlock {
  kind: 'event';
  key: string;
  message: DistriChatMessage;
  index: number;
}

export type TranscriptBlock =
  | TranscriptUserBlock
  | TranscriptAssistantBlock
  | TranscriptStepsBlock
  | TranscriptEventBlock;

export interface BuildTranscriptOptions extends ResolveTranscriptOptions {
  /**
   * `'none'` (default): one steps block per `tool_calls` event.
   * `'run'`: consecutive tool calls fold into one steps block until the next
   * visible user/assistant/event block.
   */
  groupToolCalls?: ToolCallGrouping;
  /** Which non-tool events get an `event` block. Defaults to everything not in {@link TRANSCRIPT_HIDDEN_EVENTS}. */
  isVisibleEvent?: (event: DistriEvent) => boolean;
  /** Skip these messages entirely (e.g. child-task messages rendered elsewhere). */
  excludeMessage?: (message: DistriChatMessage) => boolean;
  /** Emit `developer`-role messages as `event` blocks. Default false. */
  includeDeveloperMessages?: boolean;
}

const defaultIsVisibleEvent = (event: DistriEvent) => !TRANSCRIPT_HIDDEN_EVENTS.has(event.type);

/** Whether a user/assistant message has anything to show (non-blank text or an image/file). */
function hasDisplayableContent(message: DistriMessage): boolean {
  return message.parts.some(part =>
    (part.part_type === 'text' && part.data.trim().length > 0)
    || part.part_type === 'image'
    || part.part_type === 'file');
}

/**
 * Builds the renderable block list from raw chat messages: resolved part
 * visibility and drafts ({@link resolveTranscriptEntries}), then user /
 * assistant / steps / event blocks with optional tool-run folding.
 */
export function buildTranscript(
  messages: DistriChatMessage[],
  options: BuildTranscriptOptions = {},
): TranscriptBlock[] {
  const { groupToolCalls = 'none', isVisibleEvent = defaultIsVisibleEvent, excludeMessage, includeDeveloperMessages = false } = options;
  const source = excludeMessage ? messages.map(m => (excludeMessage(m) ? null : m)) : messages;
  // Keep source indices aligned with the caller's array while skipping excluded messages.
  const kept: DistriChatMessage[] = [];
  const keptIndex: number[] = [];
  source.forEach((message, index) => {
    if (message) {
      kept.push(message);
      keptIndex.push(index);
    }
  });

  const blocks: TranscriptBlock[] = [];
  for (const entry of resolveTranscriptEntries(kept, options)) {
    const index = keptIndex[entry.index];
    const message = entry.message;

    if (isDistriMessage(message)) {
      const msg = message as DistriMessage;
      if (msg.role === 'user' || msg.role === 'assistant') {
        if (!hasDisplayableContent(msg)) continue;
        const key = msg.id || `message-${index}`;
        blocks.push(msg.role === 'user'
          ? { kind: 'user', key, message: msg, index }
          : { kind: 'assistant', key, message: msg, index, isFinal: isFinalAnswerMessage(msg) });
      } else if (msg.role === 'developer' && includeDeveloperMessages) {
        blocks.push({ kind: 'event', key: msg.id || `message-${index}`, message: msg, index });
      }
      continue;
    }

    if (!isDistriEvent(message)) continue;
    const event = message as DistriEvent;
    if (event.type === 'tool_calls') {
      const toolCalls = event.data.tool_calls.filter(call => !HIDDEN_TOOL_NAMES.has(call.tool_name));
      if (toolCalls.length === 0) continue;
      const previous = blocks[blocks.length - 1];
      if (groupToolCalls === 'run' && previous?.kind === 'steps') {
        previous.toolCalls = [...previous.toolCalls, ...toolCalls];
        previous.events = [...previous.events, event];
        previous.index = index;
        continue;
      }
      blocks.push({
        kind: 'steps',
        key: `steps-${toolCalls[0].tool_call_id || index}`,
        toolCalls,
        events: [event],
        startIndex: index,
        index,
      });
      continue;
    }

    if (isVisibleEvent(event)) {
      blocks.push({ kind: 'event', key: `event-${index}`, message: event, index });
    }
  }
  return blocks;
}

// ---------------------------------------------------------------------------
// Step labels
// ---------------------------------------------------------------------------

export interface ToolStepLabelOptions {
  /** Host-supplied label per tool name; wins over the derived summary. */
  toolLabels?: Record<string, string>;
  /** Same overrides `getToolSummary` accepts. */
  summaryOverrides?: Record<string, SummaryFn>;
  result?: ToolResult;
}

/** Human label for one tool call: `toolLabels[name]`, else "verb subject" from {@link getToolSummary}. */
export function toolStepLabel(toolCall: ToolCall, options: ToolStepLabelOptions = {}): string {
  const custom = options.toolLabels?.[toolCall.tool_name];
  if (custom) return custom;
  const input = (toolCall.input && typeof toolCall.input === 'object' ? toolCall.input : {}) as Record<string, unknown>;
  const summary = getToolSummary(toolCall.tool_name, input, options.result, options.summaryOverrides);
  return summary.subject ? `${summary.verb} ${summary.subject}` : summary.verb;
}

/**
 * One-line summary of a folded tool run: "3 steps · Read file, Searched the web".
 * Repeated labels collapse; more than `maxLabels` distinct labels end in "…".
 */
export function summarizeToolRun(labels: string[], maxLabels = 3): string {
  const count = labels.length;
  const head = `${count} ${count === 1 ? 'step' : 'steps'}`;
  const distinct = Array.from(new Set(labels.filter(Boolean)));
  if (distinct.length === 0) return head;
  const shown = distinct.slice(0, maxLabels).join(', ');
  return `${head} · ${shown}${distinct.length > maxLabels ? '…' : ''}`;
}
