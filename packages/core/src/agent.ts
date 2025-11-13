import { DistriClient } from './distri-client';
import {
  AgentDefinition,
  DistriBaseTool,
  DistriChatMessage,
  ToolResult,
} from './types';
import { Message, MessageSendParams } from '@a2a-js/sdk/client';
import { decodeA2AStreamEvent } from './encoder';

/**
 * Configuration for Agent invoke method
 */
export interface InvokeConfig {
  /** Configuration for the message */
  configuration?: MessageSendParams['configuration'];
  /** Context/thread ID */
  contextId?: string;
  /** Metadata for the requests */
  metadata?: any;
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
 * Enhanced Agent class with simple tool system following AG-UI pattern
 */
export class Agent {
  private client: DistriClient;
  private agentDefinition: AgentDefinition;

  constructor(agentDefinition: AgentDefinition, client: DistriClient) {
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

  get agentType(): string | undefined {
    return this.agentDefinition.agent_type ?? this.agentDefinition.agentType;
  }

  get iconUrl(): string | undefined {
    return this.agentDefinition.icon_url;
  }

  /**
   * Get the full agent definition (including backend tools)
   */
  getDefinition(): AgentDefinition {
    return this.agentDefinition;
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
  public async invoke(params: MessageSendParams, tools?: DistriBaseTool[]): Promise<Message> {
    // Inject tool definitions into metadata
    const enhancedParams = this.enhanceParamsWithTools(params, tools);
    return await this.client.sendMessage(this.agentDefinition.id, enhancedParams) as Message;
  }

  /**
   * Streaming invoke
   */
  public async invokeStream(params: MessageSendParams, tools?: DistriBaseTool[]): Promise<AsyncGenerator<DistriChatMessage>> {
    // Inject tool definitions into metadata
    const enhancedParams = this.enhanceParamsWithTools(params, tools);
    const a2aStream = this.client.sendMessageStream(this.agentDefinition.id, enhancedParams);


    return (async function* () {
      const events = [];
      const mappedEvents = [];
      for await (const event of a2aStream) {
        events.push(event);
        const converted = decodeA2AStreamEvent(event);
        mappedEvents.push(converted);
        if (converted) {
          yield converted;
        }
      }
    })();
  }

  /**
   * Enhance message params with tool definitions
   */
  private enhanceParamsWithTools(params: MessageSendParams, tools?: DistriBaseTool[]): MessageSendParams {
    const metadata = {
      ...params.metadata,
      external_tools: tools?.map(tool => ({
        name: tool.name,
        description: tool.description,
        parameters: tool.parameters,
        is_final: tool.is_final
      })) || []
    };
    return {
      ...params,
      metadata
    };
  }


  /**
   * Create an agent instance from an agent ID
   */
  static async create(agentIdOrDef: string | AgentDefinition, client: DistriClient): Promise<Agent> {
    const agentDefinition = typeof agentIdOrDef === 'string' ? await client.getAgent(agentIdOrDef) : agentIdOrDef;
    console.log('🤖 Agent definition loaded:', {
      id: agentDefinition.id,
      name: agentDefinition.name,
      tools: agentDefinition.tools?.map(t => ({
        name: t.name,
        type: t.type || 'function'
      })) || [],
      toolCount: agentDefinition.tools?.length || 0
    });
    return new Agent(agentDefinition, client);
  }

  /**
   * Complete an external tool call by sending the result back to the server
   */
  async completeTool(result: ToolResult): Promise<void> {
    await this.client.completeTool(this.agentDefinition.id, result);
  }

  /**
   * List all available agents
   */
  static async list(client: DistriClient): Promise<Agent[]> {
    const agentDefinitions = await client.getAgents();
    return agentDefinitions.map(def => new Agent(def, client));
  }
}
