import { DistriClient } from './distri-client';
import {
  AgentDefinition,
  DistriBaseTool,
  DistriChatMessage,
  ToolsConfig
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
  private tools: ToolsConfig = {
    tools: [],
    agent_tools: new Map(),
  };

  constructor(agentDefinition: AgentDefinition, client: DistriClient) {
    this.agentDefinition = agentDefinition;
    this.client = client;
  }


  /**
   * Set the entire agent tools map (for multi-agent scenarios)
   */
  setTools(tools: ToolsConfig): void {
    this.tools = tools;
  }

  /**
   * Get all tools for a specific agent
   */
  getToolsForAgent(agentName: string): DistriBaseTool[] {
    return this.tools.agent_tools.get(agentName) || [];
  }


  /**
   * Check if tools are registered for a specific agent
   */
  hasToolsForAgent(agentName: string): boolean {
    return this.tools.agent_tools.has(agentName);
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

  get iconUrl(): string | undefined {
    return this.agentDefinition.icon_url;
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
    // Inject tool definitions into metadata
    const enhancedParams = this.enhanceParamsWithTools(params);
    console.log('enhancedParams', enhancedParams);
    return await this.client.sendMessage(this.agentDefinition.id, enhancedParams) as Message;
  }

  /**
   * Streaming invoke
   */
  public async invokeStream(params: MessageSendParams): Promise<AsyncGenerator<DistriChatMessage>> {
    // Inject tool definitions into metadata
    const enhancedParams = this.enhanceParamsWithTools(params);
    console.log('enhancedParams', enhancedParams);
    const a2aStream = this.client.sendMessageStream(this.agentDefinition.id, enhancedParams);


    return (async function* () {
      let events = [];
      let mappedEvents = [];
      for await (const event of a2aStream) {
        events.push(event);
        const converted = decodeA2AStreamEvent(event);
        mappedEvents.push(converted);
        if (converted) {
          yield converted;
        }
      }
      console.log('All events', events);
      console.log('Mapped events', mappedEvents);
    })();
  }

  /**
   * Enhance message params with tool definitions
   */
  private enhanceParamsWithTools(params: MessageSendParams): MessageSendParams {

    return {
      ...params,
      metadata: {
        ...params.metadata,
        tools: {
          tools: this.tools.tools.map(tool => ({
            name: tool.name,
            description: tool.description,
            input_schema: tool.input_schema,
          } as DistriBaseTool)),
          agent_tools: Object.fromEntries(Array.from(this.tools.agent_tools.entries()).map(([agentName, tools]) => ([
            agentName,
            tools.map(tool => ({
              name: tool.name,
              description: tool.description,
              input_schema: tool.input_schema,
            } as DistriBaseTool)),
          ]))),
        }
      }
    };
  }


  /**
   * Create an agent instance from an agent ID
   */
  static async create(agentIdOrDef: string | AgentDefinition, client: DistriClient): Promise<Agent> {
    const agentDefinition = typeof agentIdOrDef === 'string' ? await client.getAgent(agentIdOrDef) : agentIdOrDef;
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
