import { DistriClient } from './distri-client';
import {
  AgentDefinition,
  DistriBaseTool,
  DistriChatMessage,
  DistriError,
  ToolResult,
  HookHandler,
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

export interface ExternalToolValidationResult {
  isValid: boolean;
  requiredTools: string[];
  providedTools: string[];
  missingTools: string[];
  message?: string;
}

export class ExternalToolValidationError extends DistriError {
  missingTools: string[];
  requiredTools: string[];
  providedTools: string[];
  agentName: string;

  constructor(agentName: string, result: ExternalToolValidationResult) {
    super(
      result.message || 'Missing required external tools for agent invocation.',
      'EXTERNAL_TOOL_VALIDATION_ERROR',
      {
        agentName,
        missingTools: result.missingTools,
        requiredTools: result.requiredTools,
        providedTools: result.providedTools,
      }
    );
    this.name = 'ExternalToolValidationError';
    this.agentName = agentName;
    this.missingTools = result.missingTools;
    this.requiredTools = result.requiredTools;
    this.providedTools = result.providedTools;
  }
}

/**
 * Enhanced Agent class with simple tool system following AG-UI pattern
 */
export class Agent {
  private client: DistriClient;
  private agentDefinition: AgentDefinition;
  private hookHandlers: Map<string, HookHandler> = new Map();
  private defaultHookHandler: HookHandler | null = null;

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
  public async invoke(params: MessageSendParams, tools?: DistriBaseTool[], hooks?: Record<string, HookHandler>): Promise<Message> {
    if (hooks) {
      this.registerHooks(hooks);
    }
    // Inject tool definitions into metadata
    const enhancedParams = this.enhanceParamsWithTools(params, tools);
    return await this.client.sendMessage(this.agentDefinition.id, enhancedParams) as Message;
  }

  /**
   * Streaming invoke
   */
  public async invokeStream(params: MessageSendParams, tools?: DistriBaseTool[], hooks?: Record<string, HookHandler>): Promise<AsyncGenerator<DistriChatMessage>> {
    if (hooks) {
      this.registerHooks(hooks);
    }
    // Inject tool definitions into metadata
    const enhancedParams = this.enhanceParamsWithTools(params, tools);
    const a2aStream = this.client.sendMessageStream(this.agentDefinition.id, enhancedParams);


    const self = this;
    return (async function* () {
      for await (const event of a2aStream) {
        const converted = decodeA2AStreamEvent(event);
        if (converted && (converted as any).type === 'inline_hook_requested') {
          const hookReq: any = (converted as any).data;
          const handler =
            self.hookHandlers.get(hookReq.hook) ||
            self.defaultHookHandler;
          if (handler) {
            try {
              const mutation = await handler(hookReq);
              await self.client.completeInlineHook(hookReq.hook_id, mutation);
            } catch (err) {
              await self.client.completeInlineHook(hookReq.hook_id, { dynamic_values: {} });
            }
          } else {
            await self.client.completeInlineHook(hookReq.hook_id, { dynamic_values: {} });
          }
          yield converted;
        } else if (converted) {
          yield converted;
        }
      }
    })();
  }

  /**
   * Validate that required external tools are registered before invoking.
   */
  public validateExternalTools(tools: DistriBaseTool[] = []): ExternalToolValidationResult {
    const requiredTools = this.getRequiredExternalTools();
    const providedTools = tools.map((tool) => tool.name);

    if (requiredTools.length === 0) {
      return {
        isValid: true,
        requiredTools: [],
        providedTools,
        missingTools: [],
      };
    }

    const providedSet = new Set(providedTools);
    const missingTools = requiredTools.filter((tool) => !providedSet.has(tool));
    const isValid = missingTools.length === 0;

    return {
      isValid,
      requiredTools,
      providedTools,
      missingTools,
      message: isValid
        ? undefined
        : this.formatExternalToolValidationMessage(requiredTools, missingTools),
    };
  }

  /**
   * Enhance message params with tool definitions
   */
  private enhanceParamsWithTools(params: MessageSendParams, tools?: DistriBaseTool[]): MessageSendParams {
    this.assertExternalTools(tools);
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

  private assertExternalTools(tools?: DistriBaseTool[]) {
    const result = this.validateExternalTools(tools ?? []);
    if (!result.isValid) {
      throw new ExternalToolValidationError(this.agentDefinition.name || this.agentDefinition.id, result);
    }
  }

  private getRequiredExternalTools(): string[] {
    const toolConfig = this.resolveToolConfig();
    if (!toolConfig?.external || !Array.isArray(toolConfig.external)) {
      return [];
    }
    return toolConfig.external.filter((tool) => typeof tool === 'string' && tool.trim().length > 0);
  }

  private resolveToolConfig(): { external?: string[] } | null {
    const root = this.agentDefinition as any;
    return (
      this.extractToolConfig(root) ||
      this.extractToolConfig(root?.agent) ||
      this.extractToolConfig(root?.definition)
    );
  }

  private extractToolConfig(candidate: any): { external?: string[] } | null {
    if (!candidate) return null;
    const tools = candidate.tools;
    if (!tools || Array.isArray(tools) || typeof tools !== 'object') {
      return null;
    }
    return tools;
  }

  private formatExternalToolValidationMessage(requiredTools: string[], missingTools: string[]): string {
    const requiredList = requiredTools.join(', ');
    const missingList = missingTools.join(', ');
    return `Agent has external tools that are not registered: ${missingList}. This is an embedded agent that can run within the parent application. Register DistriWidget for embedding the parent component. Required tools: ${requiredList}.`;
  }

  /**
   * Register multiple hooks at once.
   */
  registerHooks(hooks: Record<string, HookHandler>, defaultHandler?: HookHandler) {
    Object.entries(hooks).forEach(([hook, handler]) => {
      this.hookHandlers.set(hook, handler);
    });
    if (defaultHandler) {
      this.defaultHookHandler = defaultHandler;
    }
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
