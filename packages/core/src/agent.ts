import { DistriClient } from './distri-client';
import {
  DistriAgent,
  DistriTool,
  ToolCall,
  ToolHandler,
  ToolResult,
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
  private tools: Map<string, ToolHandler> = new Map();

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
    this.addTool({
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
  addTool(tool: DistriTool): void {
    this.tools.set(tool.name, tool.handler);
  }

  /**
   * Add multiple tools at once
   */
  addTools(tools: DistriTool[]): void {
    tools.forEach(tool => this.addTool(tool));
  }

  /**
   * Remove a tool
   */
  removeTool(toolName: string): void {
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
    const handler = this.tools.get(toolCall.tool_name);
    
    if (!handler) {
      return {
        tool_call_id: toolCall.tool_call_id,
        result: null,
        success: false,
        error: `Tool '${toolCall.tool_name}' not found`
      };
    }

    try {
      const result = await handler(toolCall.input);
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
    this.tools.forEach((handler, name) => {
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
  public async invokeStream(params: MessageSendParams): Promise<AsyncGenerator<A2AStreamEventData>> {
    // Inject tool definitions into metadata
    const enhancedParams = this.enhanceParamsWithTools(params);
    return this.client.sendMessageStream(this.agentDefinition.id, enhancedParams) as AsyncGenerator<A2AStreamEventData>;
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
