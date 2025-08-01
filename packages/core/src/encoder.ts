import { Message, Part } from '@a2a-js/sdk/client';
import { DistriMessage, DistriPart, MessageRole, InvokeContext, A2AStreamEventData, ToolCall, ToolResult, CodeObservationPart, PlanPart, ToolCallPart, ToolResultPart, DataPart, FileUrl, FileBytes, ImageBytesPart, ImageUrlPart } from './types';
import { DistriEvent } from './events';
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
 * Converts A2A artifacts to DistriMessage or DistriEvent based on content
 */
export function convertA2AArtifactToDistri(artifact: any): DistriMessage | DistriEvent | null {
  if (!artifact || !artifact.parts || !Array.isArray(artifact.parts)) {
    return null;
  }

  const part = artifact.parts[0];
  if (!part || part.kind !== 'data' || !part.data) {
    return null;
  }

  const data = part.data;
  
  // Handle different artifact types based on the data structure
  if (data.type === 'llm_response') {
    // This is an LLM response with potential tool calls
    const message: DistriMessage = {
      id: data.id || artifact.artifactId,
      role: 'assistant',
      parts: [],
      created_at: data.created_at ? new Date(data.created_at).toISOString() : undefined,
    };

    // Add content if present
    if (data.content && data.content.trim()) {
      message.parts.push({ type: 'text', text: data.content });
    }

    // Add tool calls if present
    if (data.tool_calls && Array.isArray(data.tool_calls)) {
      data.tool_calls.forEach((toolCall: any) => {
        const parsedInput = typeof toolCall.input === 'string' 
          ? JSON.parse(toolCall.input) 
          : toolCall.input;
        
        message.parts.push({
          type: 'tool_call',
          tool_call: {
            tool_call_id: toolCall.tool_call_id,
            tool_name: toolCall.tool_name,
            input: parsedInput,
          }
        });
      });
    }

    return message;
  }

  if (data.type === 'tool_results') {
    // This contains tool results
    const message: DistriMessage = {
      id: data.id || artifact.artifactId,
      role: 'assistant',
      parts: [],
      created_at: data.created_at ? new Date(data.created_at).toISOString() : undefined,
    };

    if (data.results && Array.isArray(data.results)) {
      data.results.forEach((result: any) => {
        let parsedResult = result.result;
        if (typeof parsedResult === 'string') {
          try {
            parsedResult = JSON.parse(parsedResult);
          } catch {
            // Keep as string if not valid JSON
          }
        }

        message.parts.push({
          type: 'tool_result',
          tool_result: {
            tool_call_id: result.tool_call_id,
            result: parsedResult,
            success: data.success !== false,
          }
        });
      });
    }

    return message;
  }

  return null;
}

export function decodeA2AStreamEvent(event: A2AStreamEventData): DistriEvent | DistriMessage {
  if (event.kind === 'message') {
    return convertA2AMessageToDistri(event as Message) as DistriMessage;
  }
  else if (event.kind === 'status-update') {
    return event as unknown as DistriEvent;
  }
  else if (event.kind === 'artifact-update') {
    return event as unknown as DistriEvent;
  }
  return event as unknown as DistriEvent;
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
    } else if (item.artifactId && item.parts) {
      // Artifact
      const distriMessage = convertA2AArtifactToDistri(item);
      if (distriMessage && 'role' in distriMessage) {
        results.push(distriMessage as DistriMessage);
      }
    }
  }
  
  return results;
}