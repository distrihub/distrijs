import { DistriClient } from './distri-client';
import { 
  DistriAgent, 
  MessageMetadata, 
  ToolCall, 
  ExternalTool, 
  APPROVAL_REQUEST_TOOL_NAME,
  A2AStreamEventData
} from './types';
import { Message, MessageSendParams } from '@a2a-js/sdk/client';

/**
 * Configuration for Agent invoke method
 */
export interface InvokeConfig {
  /** Whether to stream responses */
  stream?: boolean;
  /** Configuration for the message */
  configuration?: MessageSendParams['configuration'];
  /** Context/thread ID */
  contextId?: string;
  /** External tool handlers */
  externalToolHandlers?: Record<string, ExternalToolHandler>;
  /** Approval handler for approval requests */
  approvalHandler?: ApprovalHandler;
}

/**
 * External tool handler function
 */
export type ExternalToolHandler = (toolCall: ToolCall) => Promise<any>;

/**
 * Approval handler function
 */
export type ApprovalHandler = (toolCalls: ToolCall[], reason?: string) => Promise<boolean>;

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
 * Stream response from agent invoke
 */
export interface InvokeStreamResult {
  /** Async generator for streaming events */
  stream: AsyncGenerator<A2AStreamEventData>;
  /** Method to handle external tools and approval requests */
  handleExternalTools: (handler: ExternalToolHandler, approvalHandler?: ApprovalHandler) => Promise<void>;
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
   * Invoke the agent with a message
   */
  async invoke(input: string, config: InvokeConfig = {}): Promise<InvokeResult | InvokeStreamResult> {
    const userMessage = DistriClient.initMessage(input, 'user', config.contextId);
    const params = DistriClient.initMessageParams(userMessage, config.configuration);

    if (config.stream) {
      return this.invokeStream(params);
    } else {
      return this.invokeDirect(params, config);
    }
  }

  /**
   * Direct (non-streaming) invoke
   */
  private async invokeDirect(params: MessageSendParams, config: InvokeConfig): Promise<InvokeResult> {
    let result = await this.client.sendMessage(this.agentDefinition.id, params);

    // Handle external tools if they exist in the response
    if (result.kind === 'message') {
      result = await this.handleMessageExternalTools(result, config);
    }

    return {
      message: result.kind === 'message' ? result : undefined,
      task: result.kind === 'task' ? result : undefined,
      streamed: false
    };
  }

  /**
   * Streaming invoke
   */
  private async invokeStream(params: MessageSendParams): Promise<InvokeStreamResult> {
    const stream = this.client.sendMessageStream(this.agentDefinition.id, params);

    return {
      stream,
      handleExternalTools: async (handler: ExternalToolHandler, approvalHandler?: ApprovalHandler) => {
        await this.handleStreamExternalTools(stream, handler, approvalHandler);
      }
    };
  }

  /**
   * Handle external tools in a message response
   */
  private async handleMessageExternalTools(message: Message, config: InvokeConfig): Promise<Message> {
    // Check for external tool calls in message metadata
    if (message.metadata) {
      const metadata = message.metadata as any;
      
      if (metadata.type === 'external_tool_calls') {
        const toolCalls: ToolCall[] = metadata.tool_calls;
        const requiresApproval: boolean = metadata.requires_approval;

        // Handle approval if required
        if (requiresApproval && config.approvalHandler) {
          const approved = await config.approvalHandler(toolCalls);
          if (!approved) {
            throw new Error('Tool execution cancelled by user');
          }
        }

        // Execute external tools
        for (const toolCall of toolCalls) {
          if (toolCall.tool_name === APPROVAL_REQUEST_TOOL_NAME) {
            await this.handleApprovalRequest(toolCall, config.approvalHandler);
          } else {
            await this.handleExternalTool(toolCall, config.externalToolHandlers);
          }
        }
      }
    }

    return message;
  }

  /**
   * Handle external tools in a stream
   */
  private async handleStreamExternalTools(
    stream: AsyncGenerator<A2AStreamEventData>, 
    handler: ExternalToolHandler, 
    approvalHandler?: ApprovalHandler
  ): Promise<void> {
    for await (const event of stream) {
      if (event.kind === 'message') {
        const message = event as Message;
        if (message.metadata) {
          const metadata = message.metadata as any;
          
          if (metadata.type === 'external_tool_calls') {
            const toolCalls: ToolCall[] = metadata.tool_calls;
            const requiresApproval: boolean = metadata.requires_approval;

            // Handle approval if required
            if (requiresApproval && approvalHandler) {
              const approved = await approvalHandler(toolCalls);
              if (!approved) {
                throw new Error('Tool execution cancelled by user');
              }
            }

            // Execute external tools
            for (const toolCall of toolCalls) {
              if (toolCall.tool_name === APPROVAL_REQUEST_TOOL_NAME) {
                await this.handleApprovalRequest(toolCall, approvalHandler);
              } else {
                const result = await handler(toolCall);
                await this.sendToolResponse(toolCall.tool_call_id, result);
              }
            }
          }
        }
      }
    }
  }

  /**
   * Handle a single external tool call
   */
  private async handleExternalTool(toolCall: ToolCall, handlers?: Record<string, ExternalToolHandler>): Promise<any> {
    if (!handlers || !handlers[toolCall.tool_name]) {
      throw new Error(`No handler found for external tool: ${toolCall.tool_name}`);
    }

    const result = await handlers[toolCall.tool_name](toolCall);
    await this.sendToolResponse(toolCall.tool_call_id, result);
    return result;
  }

  /**
   * Handle approval request
   */
  private async handleApprovalRequest(toolCall: ToolCall, approvalHandler?: ApprovalHandler): Promise<void> {
    if (!approvalHandler) {
      throw new Error('Approval handler required for approval requests');
    }

    try {
      const input = JSON.parse(toolCall.input);
      const toolCalls: ToolCall[] = input.tool_calls || [];
      const reason: string = input.reason;

      const approved = await approvalHandler(toolCalls, reason);
      
      const result = {
        approved,
        reason: approved ? 'Approved by user' : 'Denied by user',
        tool_calls: toolCalls
      };

      await this.sendToolResponse(toolCall.tool_call_id, result);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      await this.sendToolResponse(toolCall.tool_call_id, {
        approved: false,
        reason: `Error processing approval request: ${errorMessage}`,
        tool_calls: []
      });
    }
  }

  /**
   * Send tool response back to the agent
   */
  private async sendToolResponse(toolCallId: string, result: any): Promise<void> {
    const responseMessage = DistriClient.initMessage('', 'user');
    responseMessage.metadata = {
      type: 'tool_response',
      tool_call_id: toolCallId,
      result: typeof result === 'string' ? result : JSON.stringify(result)
    } as MessageMetadata;

    const params = DistriClient.initMessageParams(responseMessage);
    await this.client.sendMessage(this.agentDefinition.id, params);
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