import { Message, Part, FileWithBytes, FileWithUri } from '@a2a-js/sdk';
import { DistriMessage, DistriMessageMetadata, PartMetadata, DistriPart, MessageRole, InvokeContext, ToolCall, ToolResult, FileUrl, FileBytes, DistriChatMessage } from './types';
import { DistriEvent, RunStartedEvent, RunFinishedEvent, PlanStartedEvent, PlanFinishedEvent, ToolExecutionStartEvent, ToolExecutionEndEvent, TextMessageStartEvent, TextMessageContentEvent, TextMessageEndEvent, ToolCallsEvent, ToolResultsEvent, RunErrorEvent, InlineHookRequestedEvent, BrowserSessionStartedEvent, TodosUpdatedEvent, TodoItem, TodoStatus, LiveViewEvent } from './events';
import type { RunParkedEvent } from './durable-runs';
import { PART_TYPE_KEY, createdAtOf, fromWire, normalizeRole, normalizeTaskState, parseA2ATimestamp } from './a2a';

/**
 * Converts an A2A Message to a DistriMessage
 */
export function convertA2AMessageToDistri(a2aMessage: Message): DistriMessage {
  // Map A2A roles to Distri roles (A2A only supports 'agent' and 'user')
  const role: MessageRole = normalizeRole(a2aMessage.role) === 'agent' ? 'assistant' : 'user';

  // Extract routing fields from A2A message metadata (Distri extension via
  // AgentEventEnvelope). `taskId` is the spec-level wire field; the parent
  // hint lives in metadata because A2A has no native parent-task concept.
  let agent_id: string | undefined;
  let agent_name: string | undefined;
  let parentTaskId: string | undefined;
  if (a2aMessage.metadata) {
    const metadata = a2aMessage.metadata as any;
    if (metadata.agent) {
      agent_id = metadata.agent.agent_id;
      agent_name = metadata.agent.agent_name;
    }
    if (metadata.parent_task_id) {
      parentTaskId = metadata.parent_task_id;
    }
  }

  // `metadata.is_final` marks the turn's final answer and `metadata.parts`
  // carries per-part flags (`developer`, `save`). Both arrive on the live
  // trailing message frame AND on persisted history, so carrying them here is
  // what lets live and reload render the same transcript.
  const metadata = a2aMessage.metadata
    ? normalizeMessageMetadata(a2aMessage.metadata as Record<string, unknown>)
    : undefined;
  const isFinal = metadata?.is_final === true;

  return {
    id: a2aMessage.messageId,
    role,
    parts: (a2aMessage.parts ?? []).map(convertA2APartToDistri),
    // A2A 1.0 messages carry their time in `metadata["distri/created_at"]`.
    created_at: createdAtOf(a2aMessage) ?? (a2aMessage as any).createdAt,
    ...(isFinal ? { is_final: true } : {}),
    ...(metadata ? { metadata } : {}),
    agent_id,
    agent_name,
    taskId: a2aMessage.taskId,
    parentTaskId,
  };
}

/**
 * Copies wire message metadata into {@link DistriMessageMetadata}, re-keying
 * `parts` by numeric index (JSON object keys arrive as strings) and dropping
 * entries that are not part-metadata objects.
 */
function normalizeMessageMetadata(raw: Record<string, unknown>): DistriMessageMetadata {
  const { parts, ...rest } = raw;
  const out: DistriMessageMetadata = { ...rest };
  if (parts && typeof parts === 'object') {
    const normalized: Record<number, PartMetadata> = {};
    for (const [key, value] of Object.entries(parts as Record<string, unknown>)) {
      const index = Number(key);
      if (!Number.isInteger(index) || index < 0 || !value || typeof value !== 'object') continue;
      const { save, developer } = value as PartMetadata;
      normalized[index] = {
        ...(typeof save === 'boolean' ? { save } : {}),
        ...(typeof developer === 'boolean' ? { developer } : {}),
      };
    }
    out.parts = normalized;
  }
  return out;
}

/**
 * Stamp the routing envelope (`taskId`, `parentTaskId`) onto a decoded event.
 *
 * The server serializes a typed `AgentEventEnvelope` into `metadata`. Routing
 * fields live there (`metadata.parent_task_id`, `metadata.agent_id`) — NOT
 * on the A2A `TaskStatusUpdateEvent` itself, which we leave at the spec
 * shape. `taskId` comes from the A2A wire envelope (it's a spec field).
 *
 * Without this stamp, a sub-agent's `tool_calls` would arrive with no task
 * linkage, and the chat store would fall back to `currentTaskId` (= the
 * parent), which is exactly the bug this routing fixes.
 */
function stampEnvelope<T extends DistriEvent>(event: T, statusUpdate: any): T {
  const metadata = statusUpdate?.metadata;
  const parentTaskId = metadata?.parent_task_id;
  const parentToolCallId = metadata?.parent_tool_call_id;
  const agentId = metadata?.agent_id;
  const title = metadata?.title;
  const stamped = parseA2ATimestamp(statusUpdate?.status?.timestamp);
  const attempt = metadata?.attempt;
  const stepId = metadata?.step_id;
  return {
    ...event,
    taskId: statusUpdate?.taskId,
    parentTaskId: parentTaskId || undefined,
    ...(parentToolCallId ? { parentToolCallId } : {}),
    ...(typeof agentId === 'string' && agentId ? { agentId } : {}),
    ...(typeof title === 'string' && title ? { title } : {}),
    ...(stamped !== undefined ? { timestamp: stamped } : {}),
    ...(typeof attempt === 'number' && Number.isFinite(attempt) ? { attempt } : {}),
    ...(typeof stepId === 'string' && stepId ? { stepId } : {}),
    ...(metadata?.final === true ? { final: true } : {}),
  };
}

/**
 * Converts A2A status-update events to DistriEvent based on metadata type
 */
export function convertA2AStatusUpdateToDistri(statusUpdate: any): DistriEvent | null {
  if (!statusUpdate.metadata || !statusUpdate.metadata.type) {
    return null;
  }

  const metadata = statusUpdate.metadata;

  const out = (e: DistriEvent) => stampEnvelope(e, statusUpdate);

  switch (metadata.type) {
    case 'run_started': {
      return out({
        type: 'run_started',
        data: { runId: statusUpdate.runId, taskId: statusUpdate.taskId },
      } as RunStartedEvent);
    }

    case 'run_error': {
      return out({
        type: 'run_error',
        data: {
          message: metadata.message || statusUpdate.status?.message || 'Unknown error',
          code: metadata.code,
        },
      } as RunErrorEvent);
    }

    case 'run_finished': {
      return out({
        type: 'run_finished',
        data: {
          runId: statusUpdate.runId,
          taskId: statusUpdate.taskId,
          ...(typeof metadata.success === 'boolean' ? { success: metadata.success } : {}),
          ...(typeof metadata.failed_steps === 'number' ? { failedSteps: metadata.failed_steps } : {}),
        },
      } as RunFinishedEvent);
    }

    case 'run_parked': {
      // Not terminal: the stream stays open and later segments continue on it.
      const pending = Array.isArray(metadata.pending)
        ? metadata.pending.filter((id: unknown): id is string => typeof id === 'string')
        : [];
      return out({
        type: 'run_parked',
        data: {
          taskId: metadata.task_id ?? statusUpdate.taskId,
          pending,
          ...(typeof metadata.deadline === 'string' ? { deadline: metadata.deadline } : {}),
        },
      } as RunParkedEvent);
    }

    case 'plan_started': {
      return out({ type: 'plan_started', data: { initial_plan: metadata.initial_plan } } as PlanStartedEvent);
    }

    case 'plan_finished': {
      return out({ type: 'plan_finished', data: { total_steps: metadata.total_steps } } as PlanFinishedEvent);
    }

    case 'step_started': {
      return out({
        type: 'step_started',
        data: {
          step_id: metadata.step_id,
          step_title: metadata.step_title || 'Processing',
          step_index: metadata.step_index || 0,
        },
      } as any);
    }

    case 'step_completed': {
      return out({
        type: 'step_completed',
        data: {
          step_id: metadata.step_id,
          step_title: metadata.step_title || 'Processing',
          step_index: metadata.step_index || 0,
        },
      } as any);
    }

    case 'tool_execution_start': {
      return out({
        type: 'tool_execution_start',
        data: {
          tool_call_id: metadata.tool_call_id,
          tool_call_name: metadata.tool_call_name || 'Tool',
          parent_message_id: statusUpdate.taskId,
        },
      } as ToolExecutionStartEvent);
    }

    case 'tool_execution_end': {
      return out({
        type: 'tool_execution_end',
        data: { tool_call_id: metadata.tool_call_id },
      } as ToolExecutionEndEvent);
    }

    case 'text_message_start': {
      return out({
        type: 'text_message_start',
        data: {
          message_id: metadata.message_id,
          step_id: metadata.step_id || '',
          role: metadata.role === 'assistant' ? 'assistant' : 'user',
        },
      } as TextMessageStartEvent);
    }

    case 'text_message_content': {
      return out({
        type: 'text_message_content',
        data: {
          message_id: metadata.message_id,
          step_id: metadata.step_id || '',
          delta: metadata.delta || '',
        },
      } as TextMessageContentEvent);
    }

    case 'text_message_end': {
      return out({
        type: 'text_message_end',
        data: { message_id: metadata.message_id, step_id: metadata.step_id || '' },
      } as TextMessageEndEvent);
    }

    case 'tool_calls': {
      return out({
        type: 'tool_calls',
        data: { tool_calls: metadata.tool_calls || [] },
      } as ToolCallsEvent);
    }

    case 'tool_results': {
      return out({
        type: 'tool_results',
        data: { results: metadata.results || [] },
      } as ToolResultsEvent);
    }

    case 'inline_hook_requested': {
      return out({
        type: 'inline_hook_requested',
        data: {
          hook_id: metadata.request?.hook_id || metadata.hook_id || '',
          hook: metadata.request?.hook || metadata.hook || '',
          context: metadata.request?.context || metadata.context || {
            agent_id: statusUpdate.agentId,
            thread_id: statusUpdate.contextId,
            task_id: statusUpdate.taskId,
            run_id: statusUpdate.agentId,
          },
          timeout_ms: metadata.request?.timeout_ms || metadata.timeout_ms,
          fire_and_forget: metadata.request?.fire_and_forget ?? metadata.fire_and_forget,
          message: metadata.request?.message || metadata.message,
          plan: metadata.request?.plan || metadata.plan,
          result: metadata.request?.result || metadata.result,
        },
      } as InlineHookRequestedEvent);
    }

    case 'browser_session_started': {
      return out({
        type: 'browser_session_started',
        data: {
          session_id: metadata.session_id || '',
          viewer_url: metadata.viewer_url,
          stream_url: metadata.stream_url,
        },
      } as BrowserSessionStartedEvent);
    }

    case 'live_view': {
      return out({
        type: 'live_view',
        data: {
          view_id: metadata.view_id || '',
          url: metadata.url || '',
          title: metadata.title,
          display_mode: metadata.display_mode,
          width: metadata.width,
          height: metadata.height,
        },
      } as LiveViewEvent);
    }

    case 'todos_updated': {
      const todos = parseTodosFromFormatted(metadata.formatted_todos || '');
      return out({
        type: 'todos_updated',
        data: {
          formatted_todos: metadata.formatted_todos || '',
          action: metadata.action || 'write_todos',
          todo_count: metadata.todo_count || 0,
          todos,
        },
      } as TodosUpdatedEvent);
    }

    case 'context_budget_update': {
      return out({
        type: 'context_budget_update',
        data: {
          budget: metadata.budget,
          is_warning: !!metadata.is_warning,
          is_critical: !!metadata.is_critical,
        },
      } as any);
    }

    case 'context_compaction': {
      return out({
        type: 'context_compaction',
        data: {
          tier: metadata.tier,
          tokens_before: metadata.tokens_before ?? 0,
          tokens_after: metadata.tokens_after ?? 0,
          entries_affected: metadata.entries_affected ?? 0,
          context_limit: metadata.context_limit ?? 0,
          usage_ratio: metadata.usage_ratio ?? 0,
          summary: metadata.summary,
          reinjected_skills: metadata.reinjected_skills,
          context_budget: metadata.context_budget,
          source: metadata.source,
          duration_ms: metadata.duration_ms,
        },
      } as any);
    }

    case 'compaction_requested': {
      // Pre-compaction signal — let the store render an in-flight UI.
      // No DistriEvent variant exists for this yet; passthrough is fine.
      return out({
        type: 'compaction_requested',
        data: { source: metadata.source ?? 'auto' },
      } as any);
    }

    case 'diagnostic_log':
      // Server-side diagnostics (LLM token counts, planner cycles) are for
      // traces, not the chat transcript.
      return null;

    default:
      // An event type this client does not know (a newer server, or a
      // server's own extension) is skipped. Turning it into a `run_started`
      // made a run appear that never started: the store flipped
      // `isStreaming` on and created a task for it.
      return null;
  }
}

/**
 * Decode one A2A stream frame — a 1.0 `StreamResponse` (`{message}`,
 * `{statusUpdate}`, `{artifactUpdate}`, `{task}`) or a 0.x `kind`-tagged
 * object — to a DistriMessage / DistriEvent.
 *
 * Stateless: an event-stream envelope becomes its event, a message its
 * message, a file `artifactUpdate` an artifact message. Standard-mode frames
 * that need state (streamed text artifacts, terminal states) are decoded by
 * {@link A2AStreamDecoder}.
 */
export function decodeA2AStreamEvent(event: any): DistriChatMessage | null {
  const frame = fromWire(event);
  if (!frame) return null;
  switch (frame.kind) {
    case 'message':
      return convertA2AMessageToDistri(frame as Message);
    case 'status-update':
      return convertA2AStatusUpdateToDistri(frame);
    case 'artifact-update':
      return artifactFilesMessage(frame);
    default:
      return null;
  }
}

/** The text of a message's text parts, joined. */
function messageText(message: any): string {
  const parts: any[] = Array.isArray(message?.parts) ? message.parts : [];
  return parts
    .filter((p) => p && (p.kind === 'text' || (p.kind === undefined && typeof p.text === 'string')))
    .map((p) => p.text)
    .join('\n');
}

/** The distri part kind of an internal A2A part, if it is a typed DataPart. */
function partTypeOf(part: any): string | undefined {
  const typed = part?.metadata?.[PART_TYPE_KEY];
  if (typeof typed === 'string') return typed;
  const legacy = part?.kind === 'data' ? part?.data?.part_type : undefined;
  return typeof legacy === 'string' ? legacy : undefined;
}

/**
 * The files an `artifactUpdate` carries (produced artifacts, url/raw file
 * parts) as an assistant message keyed by the artifact id. `null` when it
 * carries none (a streamed text artifact). A file artifact's text part is
 * its preview, and is dropped.
 */
function artifactFilesMessage(update: any): DistriMessage | null {
  const artifact = update?.artifact;
  const parts: any[] = Array.isArray(artifact?.parts) ? artifact.parts : [];
  const files = parts.filter((p) => p?.kind === 'file' || (p?.kind === 'data' && partTypeOf(p) === 'artifact'));
  if (files.length === 0) return null;
  const metadata = update?.metadata ?? artifact?.metadata;
  return {
    id: String(artifact?.artifactId ?? ''),
    role: 'assistant',
    parts: files.map(convertA2APartToDistri),
    created_at: createdAtOf(update, artifact) ?? Date.now(),
    ...(metadata?.parent_task_id ? { parentTaskId: metadata.parent_task_id } : {}),
    taskId: update?.taskId,
  };
}

/** Text deltas of a streamed text artifact, or `null` when it is not one. */
function artifactText(update: any): string | null {
  const parts: any[] = Array.isArray(update?.artifact?.parts) ? update.artifact.parts : [];
  if (parts.length === 0 || !parts.every((p) => p?.kind === 'text')) return null;
  return parts.map((p) => p.text ?? '').join('');
}

export interface A2AStreamDecoderOptions {
  /**
   * The `event-stream` extension is active for this stream (the server echoed
   * it in `A2A-Extensions`). Then text arrives as `text_message_*` envelopes
   * and text artifacts are ignored; without it, text artifacts and the
   * standard status updates are turned into the same events.
   */
  eventStream: boolean;
}

/**
 * Stateful decoder for one A2A stream. Feeds the distri event model from
 * either stream mode:
 *
 * - **event-stream**: every `statusUpdate.metadata` is an event envelope
 *   (`step_id` set, `final` only on the root's end), the answer is a trailing
 *   `{message}`.
 * - **standard**: `{task}` SUBMITTED → `{statusUpdate}` WORKING (`run_started`)
 *   → text `{artifactUpdate}`s (`text_message_start|content|end`, keyed by
 *   the artifact id) → terminal `{statusUpdate}` whose `status.message` is the
 *   answer (`message` then `run_finished`, or `run_error`) → final `{task}`.
 *   INPUT_REQUIRED lists the pending tool calls (`tool_calls`, `run_parked`).
 *
 * File `{artifactUpdate}`s become artifact messages in both modes.
 */
export class A2AStreamDecoder {
  private readonly eventStream: boolean;
  private readonly startedTasks = new Set<string>();
  private readonly openText = new Set<string>();

  constructor(options: A2AStreamDecoderOptions) {
    this.eventStream = options.eventStream;
  }

  decode(raw: unknown): DistriChatMessage[] {
    const frame: any = fromWire(raw);
    if (!frame) return [];
    switch (frame.kind) {
      case 'message':
        return [convertA2AMessageToDistri(frame as Message)];
      case 'status-update':
        if (frame.metadata && typeof frame.metadata.type === 'string') {
          const evt = convertA2AStatusUpdateToDistri(frame);
          return evt ? [evt] : [];
        }
        return this.standardStatus(frame);
      case 'artifact-update':
        return this.artifactUpdate(frame);
      default:
        // `{task}` snapshots repeat what the status updates said.
        return [];
    }
  }

  private envelope<T extends DistriEvent>(event: T, frame: any, extra: Partial<DistriEvent> = {}): T {
    const timestamp = parseA2ATimestamp(frame?.status?.timestamp);
    return {
      ...event,
      taskId: frame?.taskId,
      ...(timestamp !== undefined ? { timestamp } : {}),
      ...extra,
    } as T;
  }

  private standardStatus(frame: any): DistriChatMessage[] {
    const state = normalizeTaskState(frame?.status?.state);
    const taskId: string | undefined = frame?.taskId;
    const message = frame?.status?.message;
    switch (state) {
      case 'working': {
        if (!taskId || this.startedTasks.has(taskId)) return [];
        this.startedTasks.add(taskId);
        return [this.envelope({ type: 'run_started', data: { taskId } } as RunStartedEvent, frame)];
      }
      case 'completed': {
        const out: DistriChatMessage[] = [];
        if (message && Array.isArray(message.parts) && message.parts.length > 0) {
          const answer = convertA2AMessageToDistri(message as Message);
          out.push({ ...answer, taskId: answer.taskId ?? taskId });
        }
        out.push(this.envelope({ type: 'run_finished', data: { taskId, success: true } } as RunFinishedEvent, frame, { final: true }));
        return out;
      }
      case 'failed':
      case 'rejected':
      case 'canceled':
      case 'auth-required': {
        const code = state === 'canceled' ? 'CANCELLED' : state === 'auth-required' ? 'AUTH_REQUIRED' : 'EXECUTION_ERROR';
        const text = messageText(message) || (state === 'canceled' ? 'Canceled' : 'Run failed');
        return [this.envelope({ type: 'run_error', data: { message: text, code } } as RunErrorEvent, frame, { final: true })];
      }
      case 'input-required': {
        const parts: any[] = Array.isArray(message?.parts) ? message.parts : [];
        const calls = parts
          .filter((p) => p?.kind === 'data' && partTypeOf(p) === 'tool_call')
          .map((p) => (convertA2APartToDistri(p) as { data: ToolCall }).data);
        const out: DistriChatMessage[] = [];
        if (calls.length > 0) {
          out.push(this.envelope({ type: 'tool_calls', data: { tool_calls: calls } } as ToolCallsEvent, frame));
        }
        out.push(this.envelope({
          type: 'run_parked',
          data: { taskId, pending: calls.map((c) => c.tool_call_id) },
        } as RunParkedEvent, frame));
        return out;
      }
      default:
        return [];
    }
  }

  private artifactUpdate(frame: any): DistriChatMessage[] {
    const files = artifactFilesMessage(frame);
    if (files) return [files];
    if (this.eventStream) return [];
    const text = artifactText(frame);
    if (text === null) return [];
    const messageId = String(frame?.artifact?.artifactId ?? '');
    const timestamp = createdAtOf(frame, frame?.artifact);
    const stamp = <T extends DistriEvent>(e: T): T =>
      ({ ...e, taskId: frame?.taskId, ...(timestamp !== undefined ? { timestamp } : {}) } as T);
    const out: DistriChatMessage[] = [];
    if (frame.append !== true || !this.openText.has(messageId)) {
      this.openText.add(messageId);
      out.push(stamp({ type: 'text_message_start', data: { message_id: messageId, step_id: '', role: 'assistant' } } as TextMessageStartEvent));
    }
    if (text) {
      out.push(stamp({ type: 'text_message_content', data: { message_id: messageId, step_id: '', delta: text } } as TextMessageContentEvent));
    }
    if (frame.lastChunk === true) {
      this.openText.delete(messageId);
      out.push(stamp({ type: 'text_message_end', data: { message_id: messageId, step_id: '' } } as TextMessageEndEvent));
    }
    return out;
  }
}

/**
 * Process A2A stream data (like from stream.json) and convert to DistriMessage/DistriEvent/DistriArtifact array
 */
export function processA2AStreamData(streamData: any[]): (DistriMessage | DistriEvent)[] {
  const results: (DistriMessage | DistriEvent)[] = [];

  for (const item of streamData) {
    const converted = decodeA2AStreamEvent(item);
    if (converted) {
      results.push(converted);
    }
  }

  return results;
}

/**
 * Process A2A messages.json data and convert to DistriMessage array
 */
export function processA2AMessagesData(data: any[]): DistriMessage[] {
  const results: DistriMessage[] = [];

  for (const item of data) {
    const frame = fromWire(item);
    if (frame?.kind === 'message') {
      results.push(convertA2AMessageToDistri(frame as Message));
    }
  }

  return results;
}

/**
 * Converts an A2A Part (internal `kind`-tagged shape) to a DistriPart.
 *
 * A DataPart whose `metadata["distri/part_type"]` names a distri kind
 * (`tool_call`, `tool_result`, `artifact`, `resource_link`) is that kind with
 * `data` as its body; the 0.x `{part_type, data}` wrapper is still accepted.
 * Any other DataPart is plain data.
 */
export function convertA2APartToDistri(a2aPart: Part): DistriPart {
  const part = a2aPart as any;
  switch (part.kind) {
    case 'text':
      return { part_type: 'text', data: part.text };
    case 'file': {
      const mime = part.file.mimeType ?? 'application/octet-stream';
      const partType: 'image' | 'file' = mime.startsWith('image/') ? 'image' : 'file';
      if ('uri' in part.file) {
        const fileUrl: FileUrl = {
          type: 'url',
          mime_type: mime,
          url: part.file.uri,
          name: part.file.name,
        };
        return { part_type: partType, data: fileUrl } as DistriPart;
      } else {
        const fileBytes: FileBytes = {
          type: 'bytes',
          mime_type: mime,
          bytes: part.file.bytes ?? '',
          name: part.file.name,
        };
        return { part_type: partType, data: fileBytes } as DistriPart;
      }
    }
    case 'data': {
      const typed = part.metadata?.[PART_TYPE_KEY];
      if (typeof typed === 'string') {
        return { part_type: typed, data: part.data } as DistriPart;
      }
      switch (part.data?.part_type) {
        case 'tool_call': {
          // 0.x wrapper `{ part_type: 'tool_call', data: ToolCall }`; accept a
          // flat ToolCall too.
          const raw = part.data as { data?: ToolCall } & ToolCall;
          const tc = raw.data && (raw.data as ToolCall).tool_call_id ? (raw.data as ToolCall) : (raw as ToolCall);
          return { part_type: 'tool_call', data: tc };
        }
        case 'tool_result': {
          const raw = part.data as { data?: ToolResult } & ToolResult;
          const tr = raw.data && (raw.data as ToolResult).tool_call_id ? (raw.data as ToolResult) : (raw as ToolResult);
          return { part_type: 'tool_result', data: tr };
        }
        case 'artifact':
        case 'resource_link':
          if (part.data.data !== undefined) return { part_type: part.data.part_type, data: part.data.data } as DistriPart;
          return { part_type: 'data', data: part.data };
        default:
          return { part_type: 'data', data: part.data };
      }
    }
    default:
      // For unknown parts, convert to text by stringifying
      return { part_type: 'text', data: JSON.stringify(part) };
  }
}

/**
 * Converts a DistriMessage to an A2A Message using the provided context
 */
export function convertDistriMessageToA2A(distriMessage: DistriMessage, context: InvokeContext): Message {
  // Map Distri roles to A2A roles (A2A only supports 'agent' and 'user')
  let role: 'agent' | 'user';
  switch (distriMessage.role) {
    case 'assistant':
      role = 'agent';
      break;
    case 'user':
      role = 'user';
      break;
    case 'system':
    case 'tool':
    case 'developer':
      // A2A doesn't support these roles, map to user as fallback
      // Developer messages are context messages that should be treated like user input
      role = 'user';
      break;
    default:
      role = 'user';
  }

  return {
    messageId: distriMessage.id,
    role,
    parts: distriMessage.parts.map(convertDistriPartToA2A),
    kind: 'message',
    contextId: context.thread_id,
    taskId: context.task_id || context.run_id || undefined,
    metadata: distriMessage.metadata,
  };
}

/** A distri kind as a DataPart: `data` is the kind's body, `metadata["distri/part_type"]` its name. */
function typedDataPart(partType: string, data: unknown): Part {
  return { kind: 'data', data: data as { [k: string]: unknown }, metadata: { [PART_TYPE_KEY]: partType } };
}

/**
 * Converts a DistriPart to an A2A Part (internal `kind`-tagged shape; the
 * transport sends it as 1.0). Distri kinds A2A has no type for — tool call,
 * tool result, artifact, resource link — are DataParts with
 * `metadata["distri/part_type"]`.
 */
export function convertDistriPartToA2A(distriPart: DistriPart): Part {
  switch (distriPart.part_type) {
    case 'text':
      return { kind: 'text', text: distriPart.data };
    case 'image':
    case 'file': {
      const name = distriPart.data.name ? { name: distriPart.data.name } : {};
      if ('url' in distriPart.data) {
        const fileUri: FileWithUri = { mimeType: distriPart.data.mime_type, uri: distriPart.data.url, ...name };
        return { kind: 'file', file: fileUri };
      }
      const fileBytes: FileWithBytes = { mimeType: distriPart.data.mime_type, bytes: distriPart.data.bytes, ...name };
      return { kind: 'file', file: fileBytes };
    }
    case 'tool_call':
      return typedDataPart('tool_call', distriPart.data);
    case 'tool_result': {
      // The body is the Rust `ToolResponse`; its own parts stay distri parts
      // (`{part_type, data}`, the Rust `Part` enum's serde shape).
      const toolResult = distriPart.data as ToolResult;
      const parts = toolResult.parts.map(part => {
        if ('type' in part && part.type === 'data') {
          return { part_type: 'data', data: part.data };
        } else if ('part_type' in part) {
          return part;
        }
        return { part_type: 'data', data: part };
      });
      return typedDataPart('tool_result', {
        tool_call_id: toolResult.tool_call_id,
        tool_name: toolResult.tool_name,
        parts,
      });
    }
    case 'data': {
      // A2A DataPart data is an object; wrap primitives and arrays.
      const dataValue = distriPart.data;
      if (dataValue === null || typeof dataValue !== 'object' || Array.isArray(dataValue)) {
        return { kind: 'data', data: { value: dataValue } };
      }
      return { kind: 'data', data: dataValue as { [k: string]: unknown } };
    }
    case 'artifact':
      return typedDataPart('artifact', distriPart.data);
    case 'resource_link':
      // MCP-Apps resource reference (`ui://`), part of the mcp-apps extension.
      return typedDataPart('resource_link', distriPart.data);
    default: {
      const _exhaustive: never = distriPart;
      throw new Error(`Unhandled DistriPart variant: ${JSON.stringify(_exhaustive)}`);
    }
  }
}

/**
 * Extract text content from DistriMessage
 */
export function extractTextFromDistriMessage(message: DistriMessage): string {
  return message.parts
    .filter(part => part.part_type === 'text')
    .map(part => (part as { part_type: 'text'; data: string }).data)
    .join('\n');
}

/**
 * Extract tool calls from DistriMessage
 */
export function extractToolCallsFromDistriMessage(message: DistriMessage): any[] {
  return message.parts
    .filter(part => part.part_type === 'tool_call')
    .map(part => (part as { part_type: 'tool_call'; data: any }).data);
}

/**
 * Extract tool results from DistriMessage
 */
export function extractToolResultsFromDistriMessage(message: DistriMessage): any[] {
  return message.parts
    .filter(part => part.part_type === 'tool_result')
    .map(part => (part as { part_type: 'tool_result'; data: any }).data);
}

/**
 * Parse the formatted todos string from backend into TodoItem array
 * Format from backend:
 *   □ Open todo
 *   ◐ In progress todo
 *   ■ Done todo
 */
function parseTodosFromFormatted(formatted: string): TodoItem[] {
  if (!formatted || formatted === '□ No todos') {
    return [];
  }

  const lines = formatted.split('\n').filter(line => line.trim());
  return lines.map((line, index) => {
    const trimmed = line.trim();
    let status: TodoStatus = 'open';
    let content = trimmed;

    // Parse status icon and extract content
    if (trimmed.startsWith('■')) {
      status = 'done';
      content = trimmed.slice(1).trim();
    } else if (trimmed.startsWith('◐')) {
      status = 'in_progress';
      content = trimmed.slice(1).trim();
    } else if (trimmed.startsWith('□')) {
      status = 'open';
      content = trimmed.slice(1).trim();
    }

    // Remove notes in parentheses for cleaner display if needed
    // const notesMatch = content.match(/^(.+?)\s*\((.+)\)$/);
    // if (notesMatch) {
    //   content = notesMatch[1];
    // }

    return {
      id: `todo_${index}`,
      content,
      status,
    };
  });
}
