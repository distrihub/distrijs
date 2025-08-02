import { create } from 'zustand';
import {
  DistriEvent,
  DistriMessage,
  DistriArtifact,
  isDistriEvent,
  isDistriArtifact,
  isDistriMessage,
  Agent,
  ToolCall,
  ToolResult,
  Role,
} from '@distri/core';
import { DistriAnyTool, DistriUiTool, ToolCallStatus } from '../types';

// State types
export interface TaskState {
  id: string;
  runId?: string;
  planId?: string;
  title: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  startTime?: number;
  endTime?: number;
  toolCalls?: any[];
  results?: any[];
  error?: string;
  metadata?: any;
}

export interface PlanState {
  id: string;
  runId?: string;
  steps: string[];
  status: 'pending' | 'running' | 'completed' | 'failed';
  startTime?: number;
  endTime?: number;
}

export interface StepState {
  id: string;
  title: string;
  index: number;
  status: 'running' | 'completed' | 'failed';
  startTime?: number;
  endTime?: number;
}

export interface ToolCallState {
  tool_call_id: string;
  tool_name: string;
  step_title?: string; // Step title for better display
  input: any;
  status: ToolCallStatus;
  result?: any;
  error?: string;
  startTime?: number;
  endTime?: number;
  component?: React.ReactNode;
  startedAt?: Date;
  completedAt?: Date;
  isExternal?: boolean; // Flag to distinguish external tool calls
}

export interface ChatState {
  // Messages state
  messages: (DistriEvent | DistriMessage | DistriArtifact)[];
  isStreaming: boolean;
  isLoading: boolean;
  error: Error | null;

  // Task/Plan/Step state
  tasks: Map<string, TaskState>;
  plans: Map<string, PlanState>;
  steps: Map<string, StepState>;
  toolCalls: Map<string, ToolCallState>;
  currentTaskId?: string;
  currentPlanId?: string;

  // Streaming indicator state
  streamingIndicator: 'agent_starting' | 'planning' | 'generating_response' | undefined;

  // Tool execution state
  agent?: Agent;
  tools?: DistriAnyTool[];
  onAllToolsCompleted?: (toolResults: ToolResult[]) => void;
}

export interface ChatStateStore extends ChatState {
  // Message actions
  addMessage: (message: DistriEvent | DistriMessage | DistriArtifact) => void;
  clearMessages: () => void;
  setStreaming: (isStreaming: boolean) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: Error | null) => void;
  appendToMessage: (messageId: string, role: Role, delta: string) => void;

  // Streaming indicator actions
  setStreamingIndicator: (indicator: 'agent_starting' | 'planning' | 'generating_response' | undefined) => void;

  // State actions
  processMessage: (message: DistriEvent | DistriMessage | DistriArtifact) => void;
  clearAllStates: () => void;
  clearTask: (taskId: string) => void;

  // Tool call management
  initToolCall: (toolCall: ToolCall, timestamp?: number, isExternal?: boolean, stepTitle?: string) => void;
  updateToolCallStatus: (toolCallId: string, status: Partial<ToolCallState>) => void;
  getToolCallById: (toolCallId: string) => ToolCallState | null;
  getPendingToolCalls: () => ToolCallState[];
  getCompletedToolCalls: () => ToolCallState[];
  executeTool: (toolCall: ToolCall) => Promise<void>;
  hasPendingToolCalls: () => boolean;
  clearToolResults: () => void;
  getExternalToolResponses: () => ToolResult[];

  // Getters
  getCurrentTask: () => TaskState | null;
  getCurrentPlan: () => PlanState | null;
  getCurrentTasks: () => TaskState[];
  getTaskById: (taskId: string) => TaskState | null;
  getPlanById: (planId: string) => PlanState | null;

  // Updates
  updateTask: (taskId: string, updates: Partial<TaskState>) => void;
  updatePlan: (planId: string, updates: Partial<PlanState>) => void;
  updateStep: (stepId: string, updates: Partial<StepState>) => void;

  // Setup
  setAgent: (agent: Agent) => void;
  setTools: (tools: DistriAnyTool[]) => void;
  setOnAllToolsCompleted: (callback: (toolResults: ToolResult[]) => void) => void;
}

export const useChatStateStore = create<ChatStateStore>((set, get) => ({
  messages: [],
  isStreaming: false,
  isLoading: false,
  error: null,
  tasks: new Map(),
  plans: new Map(),
  steps: new Map(),
  toolCalls: new Map(),
  currentTaskId: undefined,
  currentPlanId: undefined,
  streamingIndicator: undefined,

  // Message actions
  addMessage: (message: DistriEvent | DistriMessage | DistriArtifact) => {
    set((state: ChatState) => {
      const newState = { ...state };
      newState.messages.push(message);
      return newState;
    });
  },
  clearMessages: () => {
    set({ messages: [] });
  },
  setStreaming: (isStreaming: boolean) => {
    set({ isStreaming });
  },
  setLoading: (isLoading: boolean) => {
    set({ isLoading });
  },
  setError: (error: Error | null) => {
    set({ error });
  },

  setStreamingIndicator: (indicator: 'agent_starting' | 'planning' | 'generating_response' | undefined) => {
    set({ streamingIndicator: indicator });
  },

  appendToMessage: (messageId: string, role: Role, delta: string) => {
    set((state: ChatState) => {
      const newState = { ...state };
      const index = newState.messages.findIndex(
        m => isDistriMessage(m) && (m as DistriMessage).id === messageId
      );

      if (index >= 0) {
        const existing = newState.messages[index] as DistriMessage;
        let textPart = existing.parts.find(p => p.type === 'text') as any;
        if (!textPart) {
          textPart = { type: 'text', text: '' };
          existing.parts.push(textPart as any);
        }
        (textPart as any).text += delta;
      } else {
        const newMessage: DistriMessage = {
          id: messageId,
          role,
          parts: delta ? [{ type: 'text', text: delta }] : [],
        };
        newState.messages.push(newMessage);
      }

      return newState;
    });
  },

  // State actions
  processMessage: (message: DistriEvent | DistriMessage | DistriArtifact) => {
    const timestamp = Date.now(); // Default fallback

    // console.log('processMessage', isDistriEvent(message) ? message.type : 'non-event', 'isDistriEvent:', isDistriEvent(message));
    // Process events based on interaction design
    if (isDistriEvent(message)) {
      switch (message.type) {
        case 'run_started':
          const taskId = `task_${Date.now()}`;
          // console.log('Processing run_started event, creating task:', taskId);
          get().updateTask(taskId, {
            id: taskId,
            title: 'Agent Run',
            status: 'running',
            startTime: timestamp,
            metadata: message.data,
          });
          set({ currentTaskId: taskId });
          // Show "Agent is starting..." indicator
          get().setStreamingIndicator('agent_starting');
          // console.log('Set streamingIndicator to agent_starting');
          break;

        case 'run_finished':
          const currentTaskId = get().currentTaskId;
          if (currentTaskId) {
            get().updateTask(currentTaskId, {
              status: 'completed',
              endTime: timestamp,
            });
          }
          // Clear all indicators and stop loading when run is finished
          get().setStreamingIndicator(undefined);
          set({ isLoading: false });
          break;

        case 'run_error':
          const errorTaskId = get().currentTaskId;
          if (errorTaskId) {
            get().updateTask(errorTaskId, {
              status: 'failed',
              endTime: timestamp,
              error: message.data?.message || 'Unknown error',
            });
          }
          // Clear all indicators and stop loading when run errors
          get().setStreamingIndicator(undefined);
          set({ isLoading: false, isStreaming: false });
          break;

        case 'plan_started':
          const planId = `plan_${Date.now()}`;
          // console.log('Processing plan_started event, creating plan:', planId);
          get().updatePlan(planId, {
            id: planId,
            runId: get().currentTaskId,
            steps: [],
            status: 'running',
            startTime: timestamp,
          });
          set({ currentPlanId: planId });
          // Switch to planning indicator and stop streaming
          get().setStreamingIndicator('planning');
          console.log('Set streamingIndicator to planning');
          set({ isStreaming: false });
          break;

        case 'plan_finished':
          const currentPlanId = get().currentPlanId;
          if (currentPlanId) {
            get().updatePlan(currentPlanId, {
              status: 'completed',
              endTime: timestamp,
            });
          }
          // Clear planning indicator and stop loading when plan is finished
          get().setStreamingIndicator(undefined);
          set({ isLoading: false });
          break;

        case 'tool_call_start':
          const toolTaskId = message.data.tool_call_id;
          const existingTask = get().getTaskById(toolTaskId);
          if (existingTask) {
            get().updateTask(toolTaskId, {
              status: 'running',
              startTime: timestamp,
            });
          } else {
            get().updateTask(toolTaskId, {
              id: toolTaskId,
              runId: get().currentTaskId,
              planId: get().currentPlanId,
              title: message.data.tool_call_name || 'Processing',
              status: 'running',
              startTime: timestamp,
            });
          }
          // Stop streaming when tool calls start - the agent is now executing tools, not generating text
          set({ isStreaming: false });
          break;

        case 'tool_call_end':
          const finishedTaskId = message.data.tool_call_id;
          if (finishedTaskId) {
            get().updateTask(finishedTaskId, {
              status: 'completed',
              endTime: timestamp,
            });
          }
          // Check if all tool calls are completed
          const pendingToolCalls = get().getPendingToolCalls();
          if (pendingToolCalls.length === 0) {
            // All tool calls completed, agent can continue
            set({ isLoading: false });
          }
          break;

        case 'text_message_start':
          get().appendToMessage(message.data.message_id, message.data.role, '');
          // Start generating response indicator and streaming
          set({ isStreaming: true });
          break;

        case 'text_message_content':
          get().appendToMessage(message.data.message_id, 'assistant', message.data.delta);

          get().setStreamingIndicator(undefined);

          break;

        case 'text_message_end':
          // Stop generating response indicator and streaming when text message generation ends
          set({ isStreaming: false });
          break;

        case 'step_started':
          const stepId = message.data.step_id;
          get().updateStep(stepId, {
            id: stepId,
            title: message.data.step_title,
            index: message.data.step_index,
            status: 'running',
            startTime: timestamp,
          });
          break;

        case 'step_completed':
          const completedStepId = message.data.step_id;
          get().updateStep(completedStepId, {
            status: 'completed',
            endTime: timestamp,
          });
          break;

        case 'agent_handover':
          // Handle agent handover events
          break;

        default:
          // Handle any other events
          break;
      }
    }

    // Process artifacts
    if (isDistriArtifact(message)) {
      switch (message.type) {
        case 'llm_response':
          const taskId = message.step_id || message.id;
          if (taskId) {
            get().updateTask(taskId, {
              toolCalls: message.tool_calls || [],
              status: message.success ? 'completed' : 'failed',
              error: message.reason || undefined,
            });

            // Initialize tool calls from LLM response
            if (message.tool_calls && Array.isArray(message.tool_calls)) {
              message.tool_calls.forEach(toolCall => {
                get().initToolCall({
                  tool_call_id: toolCall.tool_call_id,
                  tool_name: toolCall.tool_name || 'Unknown Tool',
                  input: toolCall.input || {},
                }, message.timestamp || timestamp);
              });
            }
          }
          // Stop streaming when LLM response is received (agent is now executing tools)
          set({ isStreaming: false });
          break;

        case 'tool_results':
          const resultsTaskId = message.step_id || message.id;
          if (resultsTaskId) {
            get().updateTask(resultsTaskId, {
              results: message.results || [],
              status: message.success ? 'completed' : 'failed',
              error: message.reason || undefined,
            });

            // Update tool call results
            if (message.results && Array.isArray(message.results)) {
              message.results.forEach(result => {
                get().updateToolCallStatus(result.tool_call_id, {
                  status: message.success ? 'completed' : 'error',
                  result: result.result,
                  error: message.reason || undefined,
                  endTime: message.timestamp || timestamp,
                });
              });
            }
          }
          // Check if all tool calls are completed after results
          const pendingToolCalls = get().getPendingToolCalls();
          if (pendingToolCalls.length === 0) {
            // All tool calls completed, agent can continue
            set({ isLoading: false });
          }
          break;

        case 'plan':
          const planId = message.id;
          if (planId) {
            get().updatePlan(planId, {
              steps: message.steps,
              status: 'completed',
              endTime: message.timestamp || timestamp,
            });
          }
          break;
      }
    }
  },

  initToolCall: (toolCall: ToolCall, timestamp?: number, isExternal?: boolean, stepTitle?: string) => {
    set((state: ChatState) => {
      const newState = { ...state };

      // Determine if tool is external (only if explicitly registered in tools array)
      let toolIsExternal = isExternal;
      if (toolIsExternal === undefined) {
        // Only tools explicitly registered in the tools array are considered external
        const distriTool = state.tools?.find(t => t.name === toolCall.tool_name);
        toolIsExternal = !!distriTool; // Only true if found in tools array
      }

      newState.toolCalls.set(toolCall.tool_call_id, {
        tool_call_id: toolCall.tool_call_id,
        tool_name: toolCall.tool_name || 'Unknown Tool',
        step_title: stepTitle,
        input: toolCall.input || {},
        status: 'pending',
        startTime: timestamp || Date.now(),
        isExternal: toolIsExternal,
      });
      return newState;
    });
  },

  updateToolCallStatus: (toolCallId: string, status: Partial<ToolCallState>) => {
    set((state: ChatState) => {
      const newState = { ...state };
      const existingToolCall = newState.toolCalls.get(toolCallId);
      if (existingToolCall) {
        newState.toolCalls.set(toolCallId, {
          ...existingToolCall,
          ...status,
          endTime: status.status === 'completed' || status.status === 'error' ? Date.now() : existingToolCall.endTime,
        });
      }
      return newState;
    });
  },

  executeTool: async (toolCall: ToolCall) => {
    const state = get();
    const distriTool = state.tools?.find(t => t.name === toolCall.tool_name);

    // Only execute tools that are explicitly registered in the tools array
    if (!distriTool) {
      console.log(`Tool ${toolCall.tool_name} not found in registered tools - skipping execution`);
      // Mark as not external and skip execution
      get().updateToolCallStatus(toolCall.tool_call_id, {
        isExternal: false,
        status: 'pending',
        startedAt: new Date()
      });
      return;
    }

    if (distriTool?.type === 'ui') {
      const uiTool = distriTool as DistriUiTool;
      const component = uiTool.component({
        toolCall,
        toolCallState: state.toolCalls.get(toolCall.tool_call_id),
        completeTool: (result: ToolResult) => {
          get().updateToolCallStatus(toolCall.tool_call_id, {
            status: 'completed',
            result,
            completedAt: new Date(),
            isExternal: true // UI tools are external
          });
        }
      });

      get().updateToolCallStatus(toolCall.tool_call_id, {
        tool_name: toolCall.tool_name,
        input: toolCall.input,
        component,
        status: 'running',
        startedAt: new Date(),
        isExternal: true // UI tools are external
      });
    } else {
      try {
        const result = await (distriTool as any).handler(toolCall.input);
        get().updateToolCallStatus(toolCall.tool_call_id, {
          status: 'completed',
          result: JSON.stringify(result),
          completedAt: new Date(),
          isExternal: true // Function tools are external
        });
      } catch (error) {
        get().updateToolCallStatus(toolCall.tool_call_id, {
          status: 'error',
          error: error instanceof Error ? error.message : String(error),
          completedAt: new Date(),
          isExternal: true // Function tools are external
        });
      }
    }
  },

  hasPendingToolCalls: () => {
    const state = get();
    return Array.from(state.toolCalls.values()).some(toolCall =>
      toolCall.status === 'pending' || toolCall.status === 'running'
    );
  },

  clearToolResults: () => {
    set((state: ChatState) => {
      const newState = { ...state };
      newState.toolCalls.forEach(toolCall => {
        if (toolCall.status === 'completed' || toolCall.status === 'error') {
          newState.toolCalls.delete(toolCall.tool_call_id);
        }
      });
      return newState;
    });
  },

  getExternalToolResponses: () => {
    const state = get();
    const completedToolCalls = Array.from(state.toolCalls.values()).filter(toolCall =>
      (toolCall.status === 'completed' || toolCall.status === 'error') &&
      toolCall.isExternal &&
      toolCall.result !== undefined // Only return if there's actually a result
    );

    return completedToolCalls.map(toolCall => ({
      tool_call_id: toolCall.tool_call_id,
      tool_name: toolCall.tool_name,
      result: toolCall.result,
      success: toolCall.status === 'completed',
      error: toolCall.error
    }));
  },

  getToolCallById: (toolCallId: string) => {
    const state = get();
    return state.toolCalls.get(toolCallId) || null;
  },

  getPendingToolCalls: () => {
    const state = get();
    return Array.from(state.toolCalls.values()).filter(toolCall =>
      toolCall.status === 'pending' || toolCall.status === 'running'
    );
  },

  getCompletedToolCalls: () => {
    const state = get();
    return Array.from(state.toolCalls.values()).filter(toolCall =>
      toolCall.status === 'completed' || toolCall.status === 'error'
    );
  },

  clearAllStates: () => {
    set({
      messages: [],
      tasks: new Map(),
      plans: new Map(),
      steps: new Map(),
      toolCalls: new Map(),
      currentTaskId: undefined,
      currentPlanId: undefined,
      streamingIndicator: undefined,
    });
  },

  clearTask: (taskId: string) => {
    set((state: ChatState) => {
      const newState = { ...state };
      newState.tasks.delete(taskId);

      // Clear related plans
      for (const [planId, plan] of newState.plans) {
        if (plan.runId === taskId) {
          newState.plans.delete(planId);
        }
      }

      return newState;
    });
  },

  getCurrentTask: () => {
    const state = get();
    if (!state.currentTaskId) return null;
    const task = state.tasks.get(state.currentTaskId);
    return task || null;
  },

  getCurrentPlan: () => {
    const state = get();
    if (!state.currentPlanId) return null;
    return state.plans.get(state.currentPlanId) || null;
  },

  getCurrentTasks: () => {
    const state = get();
    return Array.from(state.tasks.values());
  },

  getTaskById: (taskId: string) => {
    const state = get();
    return state.tasks.get(taskId) || null;
  },

  getPlanById: (planId: string) => {
    const state = get();
    return state.plans.get(planId) || null;
  },

  updateTask: (taskId: string, updates: Partial<TaskState>) => {
    set((state: ChatState) => {
      const newState = { ...state };
      const existingTask = newState.tasks.get(taskId);
      const taskToUpdate = existingTask || ({ id: taskId } as TaskState);
      newState.tasks.set(taskId, { ...taskToUpdate, ...updates });
      return newState;
    });
  },

  updatePlan: (planId: string, updates: Partial<PlanState>) => {
    set((state: ChatState) => {
      const newState = { ...state };
      const existingPlan = newState.plans.get(planId) || ({ id: planId, steps: [], status: 'pending' } as PlanState);
      newState.plans.set(planId, { ...existingPlan, ...updates });
      return newState;
    });
  },

  updateStep: (stepId: string, updates: Partial<StepState>) => {
    set((state: ChatState) => {
      const newState = { ...state };
      const existingStep = newState.steps.get(stepId);
      if (existingStep) {
        newState.steps.set(stepId, { ...existingStep, ...updates });
      }
      return newState;
    });
  },

  // Setup
  setAgent: (agent: Agent) => {
    set({ agent });
  },
  setTools: (tools: DistriAnyTool[]) => {
    set({ tools });
  },
  setOnAllToolsCompleted: (callback: (toolResults: ToolResult[]) => void) => {
    set({ onAllToolsCompleted: callback });
  },
})); 