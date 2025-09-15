import { Artifact, Message, Part } from '@a2a-js/sdk/client';
import { DistriMessage, DistriPart, MessageRole, InvokeContext, ToolCall, ToolResult, FileUrl, FileBytes, DistriArtifact, GenericArtifact, DistriChatMessage, DistriPlan } from './types';
import { DistriEvent, RunStartedEvent, RunFinishedEvent, PlanStartedEvent, PlanFinishedEvent, ToolCallStartEvent, ToolCallEndEvent, TextMessageStartEvent, TextMessageContentEvent, TextMessageEndEvent, ToolCallsEvent, ToolResultsEvent, RunErrorEvent } from './events';
import { FileWithBytes, FileWithUri } from '@a2a-js/sdk';

/**
 * Converts an A2A Message to a DistriMessage
 */
export function convertA2AMessageToDistri(a2aMessage: Message): DistriMessage {
  // Map A2A roles to Distri roles (A2A only supports 'agent' and 'user')
  const role: MessageRole = a2aMessage.role === 'agent' ? 'assistant' : 'user';

  return {
    id: a2aMessage.messageId,
    role,
    parts: a2aMessage.parts.map(convertA2APartToDistri),
    created_at: (a2aMessage as any).createdAt,
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

  switch (metadata.type) {
    case 'run_started': {
      const result: RunStartedEvent = {
        type: 'run_started',
        data: {
          runId: statusUpdate.runId,
          taskId: statusUpdate.taskId
        }
      };
      return result;
    }

    case 'run_error': {
      const result: RunErrorEvent = {
        type: 'run_error',
        data: {
          message: statusUpdate.error,
          code: statusUpdate.code
        }
      };
      return result;
    }

    case 'run_finished': {
      const result: RunFinishedEvent = {
        type: 'run_finished',
        data: {
          runId: statusUpdate.runId,
          taskId: statusUpdate.taskId
        }
      };
      return result;
    }

    case 'plan_started': {
      const result: PlanStartedEvent = {
        type: 'plan_started',
        data: {
          initial_plan: metadata.initial_plan
        }
      };
      return result;
    }

    case 'plan_finished': {
      const result: PlanFinishedEvent = {
        type: 'plan_finished',
        data: {
          total_steps: metadata.total_steps
        }
      };
      return result;
    }

    case 'step_started': {
      const result: any = {
        type: 'step_started',
        data: {
          step_id: metadata.step_id,
          step_title: metadata.step_title || 'Processing',
          step_index: metadata.step_index || 0
        }
      };
      return result;
    }

    case 'step_completed': {
      const result: any = {
        type: 'step_completed',
        data: {
          step_id: metadata.step_id,
          step_title: metadata.step_title || 'Processing',
          step_index: metadata.step_index || 0
        }
      };
      return result;
    }

    case 'tool_execution_start': {
      const result: ToolCallStartEvent = {
        type: 'tool_call_start',
        data: {
          tool_call_id: metadata.tool_call_id,
          tool_call_name: metadata.tool_call_name || 'Tool',
          parent_message_id: statusUpdate.taskId
        }
      };
      return result;
    }

    case 'tool_execution_end': {
      const result: ToolCallEndEvent = {
        type: 'tool_call_end',
        data: {
          tool_call_id: metadata.tool_call_id
        }
      };
      return result;
    }

    case 'text_message_start': {
      const result: TextMessageStartEvent = {
        type: 'text_message_start',
        data: {
          message_id: metadata.message_id,
          step_id: metadata.step_id || '',
          role: metadata.role === 'assistant' ? 'assistant' : 'user'
        }
      };
      return result;
    }

    case 'text_message_content': {
      const result: TextMessageContentEvent = {
        type: 'text_message_content',
        data: {
          message_id: metadata.message_id,
          step_id: metadata.step_id || '',
          delta: metadata.delta || ''
        }
      };
      return result;
    }

    case 'text_message_end': {
      const result: TextMessageEndEvent = {
        type: 'text_message_end',
        data: {
          message_id: metadata.message_id,
          step_id: metadata.step_id || ''
        }
      };
      return result;
    }

    case 'tool_calls': {
      const result: ToolCallsEvent = {
        type: 'tool_calls',
        data: {
          tool_calls: metadata.tool_calls || []
        }
      };
      return result;
    }

    case 'tool_results': {
      const result: ToolResultsEvent = {
        type: 'tool_results',
        data: {
          results: metadata.results || []
        }
      };
      return result;
    }

    default: {
      // For unrecognized metadata types, create a generic run_started event
      console.warn(`Unhandled status update metadata type: ${metadata.type}`, metadata);
      const result: RunStartedEvent = {
        type: 'run_started',
        data: {
          runId: statusUpdate.runId,
          taskId: statusUpdate.taskId
        }
      };
      return result;
    }
  }
}

/**
 * Converts A2A artifacts to DistriArtifact, DistriPlan, or DistriMessage based on content
 */
export function convertA2AArtifactToDistri(artifact: Artifact): DistriArtifact | DistriMessage | null {
  if (!artifact || !artifact.parts || !Array.isArray(artifact.parts)) {
    return null;
  }

  const part = artifact.parts[0];
  if (!part || part.kind !== 'data' || !part.data) {
    return null;
  }

  const data = part.data as any;

  // Handle different artifact types based on the data structure
  // Note: llm_response and tool_results are no longer used as artifacts
  // They come as direct events (tool_calls, tool_results) instead

  if (data.type === 'plan') {
    // Convert to DistriPlan for plan artifacts
    const planResult: DistriPlan = {
      id: data.id || artifact.artifactId,
      type: 'plan',
      timestamp: data.timestamp || data.created_at || Date.now(),
      reasoning: data.reasoning || '',
      steps: data.steps || []
    };

    return planResult;
  }

  // For other artifact types, create a generic artifact
  const executionResult: GenericArtifact = {
    id: artifact.artifactId,
    type: 'artifact',
    timestamp: Date.now(),
    data: data,
    artifactId: artifact.artifactId,
    name: artifact.name || '',
    description: artifact.description || null
  };

  return executionResult;
}

/**
 * Enhanced decoder for A2A stream events that properly handles all event types
 */
export function decodeA2AStreamEvent(event: any): DistriChatMessage | null {
  // Handle artifacts (without kind field)
  if (event.artifactId && event.parts) {
    return convertA2AArtifactToDistri(event);
  }

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
export function processA2AStreamData(streamData: any[]): (DistriMessage | DistriEvent | DistriArtifact)[] {
  const results: (DistriMessage | DistriEvent | DistriArtifact)[] = [];

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
      return { type: 'text', data: a2aPart.text };
    case 'file':
      if ('uri' in a2aPart.file) {
        const fileUrl: FileUrl = { mime_type: a2aPart.file.mimeType || 'application/octet-stream', url: a2aPart.file.uri || '' };
        return { type: 'image', data: fileUrl };
      }
      else {
        const fileBytes: FileBytes = { mime_type: a2aPart.file.mimeType || 'application/octet-stream', data: a2aPart.file.bytes || '' };
        return { type: 'image', data: fileBytes };
      }
    case 'data':
      switch (a2aPart.data.part_type) {
        case 'tool_call':
          return { type: 'tool_call', data: a2aPart.data as unknown as ToolCall };
        case 'tool_result':
          return { type: 'tool_result', data: a2aPart.data as unknown as ToolResult };
        default:
          return { type: 'data', data: a2aPart.data };
      }
    default:
      // For unknown parts, convert to text by stringifying
      return { type: 'text', data: JSON.stringify(a2aPart) };
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
      // A2A doesn't support these roles, map to user as fallback
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
  };
}

/**
 * Converts a DistriPart to an A2A Part
 */
export function convertDistriPartToA2A(distriPart: DistriPart): Part {
  console.log('Converting DistriPart to A2A:', JSON.stringify(distriPart, null, 2));

  let result: Part;

  switch (distriPart.type) {
    case 'text':
      result = { kind: 'text', text: distriPart.data };
      break;
    case 'image':
      if ('url' in distriPart.data) {
        const fileUri: FileWithUri = { mimeType: distriPart.data.mime_type, uri: distriPart.data.url };
        result = { kind: 'file', file: fileUri };
      } else {
        const fileBytes: FileWithBytes = { mimeType: distriPart.data.mime_type, bytes: distriPart.data.data };
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

      // Convert ToolResult parts to proper Part format
      const parts = toolResult.parts.map(part => {
        if ('type' in part && part.type === 'data') {
          // Convert DistriPart data to Part::Data format
          return {
            part_type: 'data',
            data: part.data
          };
        } else if ('part_type' in part) {
          // Already in correct format
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
  }

  console.log('Converted A2A Part:', JSON.stringify(result, null, 2));
  return result;
}

/**
 * Extract text content from DistriMessage
 */
export function extractTextFromDistriMessage(message: DistriMessage): string {
  return message.parts
    .filter(part => part.type === 'text')
    .map(part => (part as { type: 'text'; data: string }).data)
    .join('\n');
}

/**
 * Extract tool calls from DistriMessage
 */
export function extractToolCallsFromDistriMessage(message: DistriMessage): any[] {
  return message.parts
    .filter(part => part.type === 'tool_call')
    .map(part => (part as { type: 'tool_call'; data: any }).data);
}

/**
 * Extract tool results from DistriMessage
 */
export function extractToolResultsFromDistriMessage(message: DistriMessage): any[] {
  return message.parts
    .filter(part => part.type === 'tool_result')
    .map(part => (part as { type: 'tool_result'; data: any }).data);
}