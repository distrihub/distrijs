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
    case 'run_started':
      return {
        type: 'run_started',
        data: {
          runId: statusUpdate.runId,
          taskId: statusUpdate.taskId
        }
      } as RunStartedEvent;

    case 'run_error':
      return {
        type: 'run_error',
        data: {
          message: statusUpdate.error,
          code: statusUpdate.code
        }
      } as RunErrorEvent;

    case 'run_finished':
      return {
        type: 'run_finished',
        data: {
          runId: statusUpdate.runId,
          taskId: statusUpdate.taskId
        }
      } as RunFinishedEvent;

    case 'plan_started':
      return {
        type: 'plan_started',
        data: {
          initial_plan: metadata.initial_plan
        }
      } as PlanStartedEvent;

    case 'plan_finished':
      return {
        type: 'plan_finished',
        data: {
          total_steps: metadata.total_steps
        }
      } as PlanFinishedEvent;

    case 'step_started':
      return {
        type: 'step_started',
        data: {
          step_id: metadata.step_id,
          step_title: metadata.step_title || 'Processing',
          step_index: metadata.step_index || 0
        }
      } as any;

    case 'step_completed':
      return {
        type: 'step_completed',
        data: {
          step_id: metadata.step_id,
          step_title: metadata.step_title || 'Processing',
          step_index: metadata.step_index || 0
        }
      } as any;

    case 'tool_execution_start':
      return {
        type: 'tool_call_start',
        data: {
          tool_call_id: metadata.tool_call_id,
          tool_call_name: metadata.tool_call_name || 'Tool',
          parent_message_id: statusUpdate.taskId,
          is_external: true
        }
      } as ToolCallStartEvent;

    case 'tool_execution_end':
      return {
        type: 'tool_call_end',
        data: {
          tool_call_id: metadata.tool_call_id
        }
      } as ToolCallEndEvent;

    case 'text_message_start':
      return {
        type: 'text_message_start',
        data: {
          message_id: metadata.message_id,
          role: metadata.role === 'assistant' ? 'assistant' : 'user'
        }
      } as TextMessageStartEvent;

    case 'text_message_content':
      return {
        type: 'text_message_content',
        data: {
          message_id: metadata.message_id,
          delta: metadata.delta || ''
        }
      } as TextMessageContentEvent;

    case 'text_message_end':
      return {
        type: 'text_message_end',
        data: {
          message_id: metadata.message_id
        }
      } as TextMessageEndEvent;

    case 'tool_calls':
      return {
        type: 'tool_calls',
        data: {
          tool_calls: metadata.tool_calls || []
        }
      } as ToolCallsEvent;

    case 'tool_results':
      return {
        type: 'tool_results',
        data: {
          results: metadata.results || []
        }
      } as ToolResultsEvent;

    default:
      // For unrecognized metadata types, create a generic run_started event
      console.warn(`Unhandled status update metadata type: ${metadata.type}`, metadata);
      return {
        type: 'run_started',
        data: { metadata }
      } as RunStartedEvent;
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

  // Handle artifact updates  
  if (event.kind === 'artifact-update') {
    return convertA2AArtifactToDistri(event);
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
        return { type: 'image', data: { mime_type: a2aPart.file.mimeType, url: a2aPart.file.uri } as FileUrl };
      }
      else {
        return { type: 'image', data: { mime_type: a2aPart.file.mimeType, data: a2aPart.file.bytes } as FileBytes };
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
    taskId: context.run_id,
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
        result = { kind: 'file', file: { mimeType: distriPart.data.mime_type, uri: distriPart.data.url } as FileWithUri };
      } else {
        result = { kind: 'file', file: { mimeType: distriPart.data.mime_type, bytes: distriPart.data.data } as FileWithBytes };
      }
      break;
    case 'tool_call':
      result = { kind: 'data', data: { part_type: 'tool_call', ...distriPart.data } };
      break;
    case 'tool_result':
      result = {
        kind: 'data', data: {
          part_type: 'tool_result',
          ...distriPart.data
        }
      } as Part;
      break;
    case 'data':
      result = { kind: 'data', data: distriPart.data };
      break;
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