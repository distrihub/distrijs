import { Artifact, Message, Part } from '@a2a-js/sdk/client';
import { DistriMessage, DistriPart, MessageRole, InvokeContext, ToolCall, ToolResult, CodeObservationPart, PlanPart, ToolCallPart, ToolResultPart, DataPart, FileUrl, FileBytes, ImageBytesPart, ImageUrlPart, DistriArtifact, AssistantWithToolCalls, ToolResults, GenericArtifact } from './types';
import { DistriEvent, RunStartedEvent, RunFinishedEvent, PlanStartedEvent, PlanFinishedEvent, ToolCallStartEvent, ToolCallEndEvent, TextMessageStartEvent, TextMessageContentEvent, TextMessageEndEvent } from './events';
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
        data: {}
      } as RunStartedEvent;

    case 'run_finished':
      return {
        type: 'run_finished',
        data: {}
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
        type: 'tool_call_start',
        data: {
          tool_call_id: metadata.step_id,
          tool_call_name: metadata.step_title || 'Processing',
          parent_message_id: statusUpdate.taskId,
          is_external: false
        }
      } as ToolCallStartEvent;

    case 'step_completed':
      return {
        type: 'tool_call_end',
        data: {
          tool_call_id: metadata.step_id
        }
      } as ToolCallEndEvent;

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
  if (data.type === 'llm_response') {
    // Convert to AssistantWithToolCalls for LLM responses
    const executionResult: AssistantWithToolCalls = {
      id: data.id || artifact.artifactId,
      type: 'llm_response',
      timestamp: data.timestamp || data.created_at || Date.now(),
      content: data.content || '',
      tool_calls: data.tool_calls || [],
      step_id: data.step_id,
      success: data.success,
      rejected: data.rejected,
      reason: data.reason
    };

    return executionResult;
  }

  if (data.type === 'tool_results') {
    // Convert to ToolResults for tool results
    const executionResult: ToolResults = {
      id: data.id || artifact.artifactId,
      type: 'tool_results',
      timestamp: data.timestamp || data.created_at || Date.now(),
      results: data.results || [],
      step_id: data.step_id,
      success: data.success,
      rejected: data.rejected,
      reason: data.reason
    };

    return executionResult;
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
export function decodeA2AStreamEvent(event: any): DistriEvent | DistriMessage | DistriArtifact | null {
  // Handle JSONrpc wrapped events from stream.json
  if (event.jsonrpc && event.result) {
    return decodeA2AStreamEvent(event.result);
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

  // Handle artifacts (without kind field)
  if (event.artifactId && event.parts) {
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
      return { type: 'text', text: a2aPart.text };
    case 'file':
      if ('uri' in a2aPart.file) {
        return { type: 'image_url', image: { mime_type: a2aPart.file.mimeType, url: a2aPart.file.uri } as FileUrl } as ImageUrlPart;
      }
      else {
        return { type: 'image_bytes', image: { mime_type: a2aPart.file.mimeType, data: a2aPart.file.bytes } as FileBytes } as ImageBytesPart;
      }
    case 'data':
      switch (a2aPart.data.part_type) {
        case 'tool_call':
          return { type: 'tool_call', tool_call: a2aPart.data as unknown as ToolCall } as ToolCallPart;
        case 'tool_result':
          return { type: 'tool_result', tool_result: a2aPart.data as unknown as ToolResult } as ToolResultPart;
        case 'code_observation':
          return { type: 'code_observation', thought: a2aPart.data.thought, code: a2aPart.data.code } as CodeObservationPart;
        case 'plan':
          return { type: 'plan', plan: a2aPart.data.plan } as PlanPart;
        default:
          return { type: 'data', data: a2aPart.data } as DataPart;
      }
    default:
      // For unknown parts, convert to text by stringifying
      return { type: 'text', text: JSON.stringify(a2aPart) };
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
  switch (distriPart.type) {
    case 'text':
      return { kind: 'text', text: distriPart.text };
    case 'image_url':
      return { kind: 'file', file: { mimeType: distriPart.image.mime_type, uri: distriPart.image.url } as FileWithUri };
    case 'image_bytes':
      return { kind: 'file', file: { mimeType: distriPart.image.mime_type, bytes: distriPart.image.data } as FileWithBytes };
    case 'tool_call':
      return { kind: 'data', data: { part_type: 'tool_call', tool_call: distriPart.tool_call } };
    case 'tool_result':
      let val = {
        kind: 'data', data: {
          tool_call_id: distriPart.tool_result.tool_call_id,
          result: distriPart.tool_result.result,
          part_type: 'tool_result'
        }
      };
      console.log('<> val', val);
      return val as Part;
    case 'code_observation':
      return { kind: 'data', data: { ...distriPart, part_type: 'code_observation' } };
    case 'plan':
      return { kind: 'data', data: { ...distriPart, part_type: 'plan' } };
    case 'data':
      return { kind: 'data', ...distriPart.data };
  }
}

/**
 * Extract text content from DistriMessage
 */
export function extractTextFromDistriMessage(message: DistriMessage): string {
  return message.parts
    .filter(part => part.type === 'text')
    .map(part => (part as { type: 'text'; text: string }).text)
    .join('\n');
}

/**
 * Extract tool calls from DistriMessage
 */
export function extractToolCallsFromDistriMessage(message: DistriMessage): any[] {
  return message.parts
    .filter(part => part.type === 'tool_call')
    .map(part => (part as { type: 'tool_call'; tool_call: any }).tool_call);
}

/**
 * Extract tool results from DistriMessage
 */
export function extractToolResultsFromDistriMessage(message: DistriMessage): any[] {
  return message.parts
    .filter(part => part.type === 'tool_result')
    .map(part => (part as { type: 'tool_result'; tool_result: any }).tool_result);
}