import { DistriClient } from './distri-client';
import {
  DistriAgent,
  DistriTool,
  ToolCall,
  ToolResult,
  APPROVAL_REQUEST_TOOL_NAME,
  DistriMessage
} from './types';
import { convertA2AMessageToDistri } from './encoder';
import { Message, MessageSendParams } from '@a2a-js/sdk/client';
import { DistriEvent } from './events';

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
 * Enhanced Agent class with simple tool system following AG-UI pattern
 */
export class Agent {
  private client: DistriClient;
  private agentDefinition: DistriAgent;
  private tools: Map<string, DistriTool> = new Map();

  constructor(agentDefinition: DistriAgent, client: DistriClient) {
    this.agentDefinition = agentDefinition;
    this.client = client;
    // Initialize with built-in tools
    this.initializeBuiltinTools();
  }

  /**
   * Initialize built-in tools
   */
  private initializeBuiltinTools() {
    this.registerTool({
      name: APPROVAL_REQUEST_TOOL_NAME,
      description: 'Request user approval for actions',
      parameters: {
        type: 'object',
        properties: {
          prompt: { type: 'string', description: 'Approval prompt to show user' },
          action: { type: 'string', description: 'Action requiring approval' }
        },
        required: ['prompt']
      },
      handler: async (input: any) => {
        const userInput = prompt(input.prompt || 'Please provide input:');
        return { approved: !!userInput, input: userInput };
      }
    });
  }

  /**
   * Add a tool to the agent (AG-UI style)
   */
  registerTool(tool: DistriTool): void {
    this.tools.set(tool.name, tool);
  }

  /**
   * Add multiple tools at once
   */
  registerTools(tools: DistriTool[]): void {
    tools.forEach(tool => this.registerTool(tool));
  }

  /**
   * Remove a tool
   */
  unregisterTool(toolName: string): void {
    this.tools.delete(toolName);
  }

  /**
   * Get all registered tools
   */
  getTools(): string[] {
    return Array.from(this.tools.keys());
  }

  /**
   * Check if a tool is registered
   */
  hasTool(toolName: string): boolean {
    return this.tools.has(toolName);
  }

  /**
   * Execute a tool call
   */
  async executeTool(toolCall: ToolCall): Promise<ToolResult> {
    const tool = this.tools.get(toolCall.tool_name);

    if (!tool) {
      return {
        tool_call_id: toolCall.tool_call_id,
        result: null,
        success: false,
        error: `Tool '${toolCall.tool_name}' not found`
      };
    }

    try {
      const result = await tool.handler(toolCall.input);
      return {
        tool_call_id: toolCall.tool_call_id,
        result,
        success: true
      };
    } catch (error) {
      return {
        tool_call_id: toolCall.tool_call_id,
        result: null,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get tool definitions for context metadata
   */
  getToolDefinitions(): Record<string, any> {
    const definitions: Record<string, any> = {};

    // Note: We only send tool names to the backend since handlers are frontend-only
    this.tools.forEach((_handler, name) => {
      definitions[name] = { name };
    });

    return definitions;
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
    return await this.client.sendMessage(this.agentDefinition.id, enhancedParams) as Message;
  }

  /**
   * Streaming invoke
   */
  public async invokeStream(params: MessageSendParams): Promise<AsyncGenerator<DistriEvent | DistriMessage>> {
    // Inject tool definitions into metadata
    const enhancedParams = this.enhanceParamsWithTools(params);
    const a2aStream = this.client.sendMessageStream(this.agentDefinition.id, enhancedParams);

    return (async function* () {
      for await (const event of a2aStream) {

        if (event.kind === 'message') {
          yield convertA2AMessageToDistri(event as Message);
        }
        else if (event.kind === 'status-update') {
          yield event as unknown as DistriEvent;
        }
        else if (event.kind === 'artifact-update') {
          yield event as unknown as DistriEvent;
        }
        else {
          yield event as unknown as DistriEvent;
        }
      }
    })();
  }

  /**
   * Enhance message params with tool definitions
   */
  private enhanceParamsWithTools(params: MessageSendParams): MessageSendParams {
    const toolDefinitions = this.getToolDefinitions();

    return {
      ...params,
      metadata: {
        ...params.metadata,
        tools: Object.keys(toolDefinitions).length > 0 ? toolDefinitions : undefined
      }
    };
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
