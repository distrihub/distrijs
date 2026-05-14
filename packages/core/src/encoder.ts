import { Message, Part, FileWithBytes, FileWithUri } from '@a2a-js/sdk';
import { DistriMessage, DistriPart, MessageRole, InvokeContext, ToolCall, ToolResult, FileUrl, FileBytes, DistriChatMessage } from './types';
import { DistriEvent, RunStartedEvent, RunFinishedEvent, PlanStartedEvent, PlanFinishedEvent, ToolExecutionStartEvent, ToolExecutionEndEvent, TextMessageStartEvent, TextMessageContentEvent, TextMessageEndEvent, ToolCallsEvent, ToolResultsEvent, RunErrorEvent, InlineHookRequestedEvent, BrowserSessionStartedEvent, TodosUpdatedEvent, TodoItem, TodoStatus, LiveViewEvent } from './events';

/**
 * Converts an A2A Message to a DistriMessage
 */
export function convertA2AMessageToDistri(a2aMessage: Message): DistriMessage {
  // Map A2A roles to Distri roles (A2A only supports 'agent' and 'user')
  const role: MessageRole = a2aMessage.role === 'agent' ? 'assistant' : 'user';

  // Extract agent metadata from A2A message metadata (A2A extension)
  let agent_id: string | undefined;
  let agent_name: string | undefined;
  if (a2aMessage.metadata) {
    const metadata = a2aMessage.metadata as any;
    if (metadata.agent) {
      agent_id = metadata.agent.agent_id;
      agent_name = metadata.agent.agent_name;
    }
  }

  return {
    id: a2aMessage.messageId,
    role,
    parts: a2aMessage.parts.map(convertA2APartToDistri),
    created_at: (a2aMessage as any).createdAt,
    agent_id,
    agent_name,
  };
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
  return {
    ...event,
    taskId: statusUpdate?.taskId,
    parentTaskId: parentTaskId || undefined,
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
        data: { runId: statusUpdate.runId, taskId: statusUpdate.taskId },
      } as RunFinishedEvent);
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

    default: {
      // For unrecognized metadata types, create a generic run_started event
      console.warn(`Unhandled status update metadata type: ${metadata.type}`, metadata);
      return out({
        type: 'run_started',
        data: { runId: statusUpdate.runId, taskId: statusUpdate.taskId },
      } as RunStartedEvent);
    }
  }
}

/**
 * Enhanced decoder for A2A stream events that properly handles all event types
 */
export function decodeA2AStreamEvent(event: any): DistriChatMessage | null {

  // Handle regular messages
  if (event.kind === 'message') {
    return convertA2AMessageToDistri(event as Message);
  }

  // Handle status updates with proper conversion
  if (event.kind === 'status-update') {
    return convertA2AStatusUpdateToDistri(event);
  }



  return null;
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
    if (item.kind === 'message') {
      // Regular message
      const distriMessage = convertA2AMessageToDistri(item);
      results.push(distriMessage);
    }
  }

  return results;
}

/**
 * Converts an A2A Part to a DistriPart
 */
export function convertA2APartToDistri(a2aPart: Part): DistriPart {

  switch (a2aPart.kind) {
    case 'text':
      return { part_type: 'text', data: a2aPart.text };
    case 'file': {
      const mime = a2aPart.file.mimeType ?? 'application/octet-stream';
      const partType: 'image' | 'file' = mime.startsWith('image/') ? 'image' : 'file';
      if ('uri' in a2aPart.file) {
        const fileUrl: FileUrl = {
          type: 'url',
          mime_type: mime,
          url: a2aPart.file.uri,
          name: a2aPart.file.name,
        };
        return { part_type: partType, data: fileUrl } as DistriPart;
      } else {
        const fileBytes: FileBytes = {
          type: 'bytes',
          mime_type: mime,
          bytes: a2aPart.file.bytes ?? '',
          name: a2aPart.file.name,
        };
        return { part_type: partType, data: fileBytes } as DistriPart;
      }
    }
    case 'data':
      switch (a2aPart.data.part_type) {
        case 'tool_call':
          return { part_type: 'tool_call', data: a2aPart.data as unknown as ToolCall };
        case 'tool_result':
          return { part_type: 'tool_result', data: a2aPart.data as unknown as ToolResult };
        default:
          return { part_type: 'data', data: a2aPart.data };
      }
    default:
      // For unknown parts, convert to text by stringifying
      return { part_type: 'text', data: JSON.stringify(a2aPart) };
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

/**
 * Converts a DistriPart to an A2A Part
 */
export function convertDistriPartToA2A(distriPart: DistriPart): Part {
  let result: Part;

  switch (distriPart.part_type) {
    case 'text':
      result = { kind: 'text', text: distriPart.data };
      break;
    case 'image':
    case 'file':
      if ('url' in distriPart.data) {
        const fileUri: FileWithUri = { mimeType: distriPart.data.mime_type, uri: distriPart.data.url };
        result = { kind: 'file', file: fileUri };
      } else {
        const fileBytes: FileWithBytes = { mimeType: distriPart.data.mime_type, bytes: distriPart.data.bytes };
        result = { kind: 'file', file: fileBytes };
      }
      break;
    case 'tool_call':
      result = {
        kind: 'data',
        data: {
          part_type: 'tool_call',
          data: distriPart.data
        }
      };
      break;
    case 'tool_result': {
      // Convert ToolResult to proper ToolResponse structure with parts
      const toolResult = distriPart.data as ToolResult;

      // Convert ToolResult parts to proper distri Part format for Rust deserialization
      // The Rust Part enum uses #[serde(tag = "part_type", content = "data")]
      const parts = toolResult.parts.map(part => {
        if ('type' in part && part.type === 'data') {
          // Convert DistriPart data to Part::Data format
          return {
            part_type: 'data',
            data: part.data
          };
        } else if ('part_type' in part) {
          // DistriPart format already matches Rust Part format, pass through
          return part;
        } else {
          // Fallback - wrap as data part
          return {
            part_type: 'data',
            data: part
          };
        }
      });

      result = {
        kind: 'data',
        data: {
          part_type: 'tool_result',
          data: {
            tool_call_id: toolResult.tool_call_id,
            tool_name: toolResult.tool_name,
            parts: parts
          }
        }
      };
      break;
    }
    case 'data': {
      // A2A DataPart expects data to be an object with string keys
      // Convert null/primitive values to an object structure
      const dataValue = distriPart.data;
      if (dataValue === null || typeof dataValue !== 'object' || Array.isArray(dataValue)) {
        result = { kind: 'data', data: { value: dataValue } };
      } else {
        const dataObj: { [k: string]: unknown } = dataValue as { [k: string]: unknown };
        result = { kind: 'data', data: dataObj };
      }
      break;
    }
    case 'artifact': {
      // Convert ArtifactPart to A2A DataPart
      result = {
        kind: 'data',
        data: {
          part_type: 'artifact',
          data: distriPart.data
        }
      };
      break;
    }
    case 'resource_link': {
      // MCP-Apps resource reference. Same envelope convention as artifact /
      // tool_call — wrap in A2A DataPart with `part_type` discriminator so
      // the Rust side deserializes back to Part::ResourceLink via the
      // `#[serde(tag = "part_type", content = "data")]` Part enum.
      result = {
        kind: 'data',
        data: {
          part_type: 'resource_link',
          data: distriPart.data
        }
      };
      break;
    }
    default: {
      const _exhaustive: never = distriPart;
      throw new Error(`Unhandled DistriPart variant: ${JSON.stringify(_exhaustive)}`);
    }
  }
  return result;
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
