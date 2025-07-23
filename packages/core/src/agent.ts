import { DistriClient } from './distri-client';
import {
  DistriAgent,
  ToolCall,
  ToolHandler,
  ExternalTool,
  A2AStreamEventData,
  APPROVAL_REQUEST_TOOL_NAME
} from './types';
import { Message, MessageSendParams } from '@a2a-js/sdk/client';

/**
 * Configuration for Agent invoke method
 */
export interface InvokeConfig {
  /** Configuration for the message */
  configuration?: MessageSendParams['configuration'];
  /** Context/thread ID */
  contextId?: string;
  /** External tool handlers */
  tools?: Record<string, ToolHandler>;
  /** Metadata for the requests */
  metadata?: any;
}

export interface ToolCallState {
  tool_call_id: string;
  tool_name?: string;
  args: string;
  result?: string;
  running: boolean;
}

/**
 * Result from agent invoke
 */
export interface InvokeResult {
  /** Final response message */
  message?: Message;
  /** Task if created */
  task?: any;
  /** Whether the response was streamed */
  streamed: boolean;
}


/**
 * Enhanced Agent class with nice API
 */
export class Agent {
  private client: DistriClient;
  private agentDefinition: DistriAgent;

  constructor(agentDefinition: DistriAgent, client: DistriClient) {
    this.agentDefinition = agentDefinition;
    this.client = client;
  }

  /**
   * Get agent information
   */
  get id(): string {
    return this.agentDefinition.id;
  }

  get name(): string {
    return this.agentDefinition.name;
  }

  get description(): string | undefined {
    return this.agentDefinition.description;
  }

  get externalTools(): ExternalTool[] {
    return this.agentDefinition.external_tools || [];
  }

  /**
   * Fetch messages for a thread (public method for useChat)
   */
  async getThreadMessages(threadId: string): Promise<Message[]> {
    return this.client.getThreadMessages(threadId);
  }



  /**
   * Direct (non-streaming) invoke
   */
  public async invoke(params: MessageSendParams): Promise<Message> {
    return await this.client.sendMessage(this.agentDefinition.id, params) as Message;
  }

  /**
   * Streaming invoke
   */
  public async invokeStream(params: MessageSendParams): Promise<AsyncGenerator<A2AStreamEventData>> {
    return this.client.sendMessageStream(this.agentDefinition.id, params) as AsyncGenerator<A2AStreamEventData>;
  }


  /**
   * Create an agent instance from an agent ID
   */
  static async create(agentId: string, client: DistriClient): Promise<Agent> {
    const agentDefinition = await client.getAgent(agentId);
    return new Agent(agentDefinition, client);
  }

  /**
   * List all available agents
   */
  static async list(client: DistriClient): Promise<Agent[]> {
    const agentDefinitions = await client.getAgents();
    return agentDefinitions.map(def => new Agent(def, client));
  }
}

/**
 * Built-in external tool handlers
 */
export const createBuiltinToolHandlers = (): Record<string, ToolHandler> => ({
  [APPROVAL_REQUEST_TOOL_NAME]: async (toolCall: ToolCall) => {
    const input = JSON.parse(toolCall.input);
    const userInput = prompt(input.prompt || 'Please provide input:');
    return { input: userInput };
  },

  // Input request handler
  input_request: async (toolCall: ToolCall) => {
    const input = JSON.parse(toolCall.input);
    const userInput = prompt(input.prompt || 'Please provide input:');
    return { input: userInput };
  },
});
