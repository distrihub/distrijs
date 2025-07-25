import { DistriClient } from './distri-client';
import {
  DistriAgent,
  DistriTool,
  ToolCall,
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
    this.addTool({
      name: APPROVAL_REQUEST_TOOL_NAME,
      description: 'Request user approval for actions',
      parameters: {
        type: 'object',
        properties: {
          prompt: { type: 'string', description: 'Approval prompt to show user' },
          action: { type: 'string', description: 'Action requiring approval' },
          tool_calls: { 
            type: 'array', 
            description: 'Tool calls requiring approval',
            items: {
              type: 'object',
              properties: {
                tool_call_id: { type: 'string' },
                tool_name: { type: 'string' },
                input: { type: 'object' }
              }
            }
          }
        },
        required: ['prompt']
      },
      handler: async (_input: any) => {
        // This will be handled by the ExternalToolManager
        return { approved: false, message: 'Approval handler not implemented' };
      }
    });

    // Add other built-in tools
    this.addTool({
      name: 'toast',
      description: 'Show a toast notification to the user',
      parameters: {
        type: 'object',
        properties: {
          message: { type: 'string', description: 'Message to display' },
          type: { 
            type: 'string', 
            enum: ['success', 'error', 'warning', 'info'], 
            default: 'info',
            description: 'Type of toast notification' 
          }
        },
        required: ['message']
      },
      handler: async (_input: any) => {
        // This will be handled by the ExternalToolManager
        return { success: true, message: 'Toast displayed' };
      }
    });

    this.addTool({
      name: 'input_request',
      description: 'Request text input from the user',
      parameters: {
        type: 'object',
        properties: {
          prompt: { type: 'string', description: 'Prompt to show the user' },
          default: { type: 'string', description: 'Default value for the input' }
        },
        required: ['prompt']
      },
      handler: async (input: any) => {
        // This will be handled by the ExternalToolManager
        const userInput = prompt(input.prompt || 'Please provide input:', input.default || '');
        return { input: userInput };
      }
    });
  }

  /**
   * Add a tool to the agent (AG-UI style)
   */
  addTool(tool: DistriTool): void {
    this.tools.set(tool.name, tool);
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
   * Get all registered tool definitions
   */
  getToolDefinitions(): Record<string, any> {
    const definitions: Record<string, any> = {};
    
    this.tools.forEach((tool, name) => {
      definitions[name] = {
        name: tool.name,
        description: tool.description,
        parameters: tool.parameters
      };
    });
    
    return definitions;
  }

  /**
   * Get a specific tool definition
   */
  getTool(toolName: string): DistriTool | undefined {
    return this.tools.get(toolName);
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
   * Execute multiple tool calls in parallel
   */
  async executeToolCalls(toolCalls: ToolCall[]): Promise<ToolResult[]> {
    const promises = toolCalls.map(toolCall => this.executeTool(toolCall));
    return Promise.all(promises);
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
