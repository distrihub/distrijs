import { create } from 'zustand';
import {
  DistriEvent,
  DistriMessage,
  isDistriEvent,
  isDistriArtifact,
  Agent,
  ToolCall,
  ToolResult,
  DistriFnTool,
  isDistriMessage,
  DistriChatMessage,
  PlanStep,
} from '@distri/core';
import { DistriAnyTool, DistriUiTool, ToolCallStatus } from '../types';
import { StreamingIndicator } from '@/components/renderers/ThinkingRenderer';
import { DefaultToolActions } from '../components/renderers/tools/DefaultToolActions';
import { MissingTool } from '../components/renderers/tools/MissingTool';
import React from 'react';

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
  steps: PlanStep[];
  status: 'pending' | 'running' | 'completed' | 'failed';
  startTime?: number;
  endTime?: number;
  reasoning?: string;
  thinkingDuration?: number; // Duration in milliseconds for "Thought for X seconds"
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
  input: any;
  status: ToolCallStatus;
  result?: ToolResult;
  error?: string;
  startTime?: number;
  endTime?: number;
  component?: React.ReactNode;
  isExternal?: boolean; // Flag to distinguish external tool calls
}

export interface ChatState {
  // Processing state
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
  messages: DistriChatMessage[];

  // Streaming indicator state
  streamingIndicator: StreamingIndicator | undefined;

  // Tool execution state
  agent?: Agent;
  tools?: DistriAnyTool[];
  wrapOptions?: { autoExecute?: boolean };
  onAllToolsCompleted?: (toolResults: ToolResult[]) => void;
}

export interface ChatStateStore extends ChatState {
  // State actions
  setStreaming: (isStreaming: boolean) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: Error | null) => void;

  // Streaming indicator actions
  setStreamingIndicator: (indicator: StreamingIndicator | undefined) => void;

  // State actions
  addMessage: (message: DistriChatMessage) => void;
  processMessage: (message: DistriChatMessage) => void;
  clearAllStates: () => void;
  clearTask: (taskId: string) => void;

  // Tool call management
  initToolCall: (toolCall: ToolCall, timestamp?: number) => void;
  updateToolCallStatus: (toolCallId: string, status: Partial<ToolCallState>) => void;
  getToolCallById: (toolCallId: string) => ToolCallState | null;
  getPendingToolCalls: () => ToolCallState[];
  getCompletedToolCalls: () => ToolCallState[];
  completeTool: (toolCall: ToolCall, result: ToolResult) => Promise<void>;
  initializeTool: (toolCall: ToolCall) => void;
  hasPendingToolCalls: () => boolean;
  clearToolResults: () => void;
  getExternalToolResponses: () => ToolResult[];

  // Getters
  getCurrentTask: () => TaskState | null;
  getCurrentPlan: () => PlanState | null;
  getCurrentTasks: () => TaskState[];
  getTaskById: (taskId: string) => TaskState | null;
  getPlanById: (planId: string) => PlanState | null;
  resolveToolCalls: () => void;

  // Updates
  updateTask: (taskId: string, updates: Partial<TaskState>) => void;
  updatePlan: (planId: string, updates: Partial<PlanState>) => void;
  updateStep: (stepId: string, updates: Partial<StepState>) => void;

  triggerTools: () => void;

  // Setup
  setAgent: (agent: Agent) => void;
  setTools: (tools: DistriAnyTool[]) => void;
  setWrapOptions: (options: { autoExecute?: boolean }) => void;
  setOnAllToolsCompleted: (callback: (toolResults: ToolResult[]) => void) => void;
}

export const useChatStateStore = create<ChatStateStore>((set, get) => ({
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
  messages: [],

  // State actions
  setStreaming: (isStreaming: boolean) => {
    set({ isStreaming });
  },
  setLoading: (isLoading: boolean) => {
    set({ isLoading });
  },
  setError: (error: Error | null) => {
    set({ error });
  },

  setStreamingIndicator: (indicator: StreamingIndicator | undefined) => {
    set({ streamingIndicator: indicator });
  },

  triggerTools: () => {
    set({ isLoading: true });
    // Check if all tool calls are completed
    const pendingToolCalls = get().getPendingToolCalls();
    if (pendingToolCalls.length === 0) {
      // All tool calls completed, agent can continue
      set({ isLoading: false });
    }

  },

  addMessage: (message: DistriChatMessage) => {
    set((state: ChatState) => {
      const prev = state.messages;
      if (isDistriEvent(message)) {
        const event = message as DistriEvent;
        if (event.type === 'text_message_start') {
          // Create a new message with the specified ID and role
          const messageId = event.data.message_id;
          const role = event.data.role;

          const newDistriMessage: DistriMessage = {
            id: messageId,
            role,
            parts: [{ type: 'text', text: '' }]
          };

          prev.push(newDistriMessage);
        } else if (event.type === 'text_message_content') {
          // Find existing message and append delta to text part
          const messageId = event.data.message_id;
          const delta = event.data.delta;

          const existingIndex = prev.findIndex(
            m => isDistriMessage(m) && (m as DistriMessage).id === messageId
          );

          if (existingIndex >= 0) {
            const existing = prev[existingIndex] as DistriMessage;
            let textPart = existing.parts.find(p => p.type === 'text') as any;
            if (!textPart) {
              textPart = { type: 'text', text: '' };
              existing.parts.push(textPart);
            }
            textPart.text += delta;
          }
        } else if (event.type === 'text_message_end') {
          // Message is complete, no additional action needed
          // The message already exists and has been updated with content
        } else {
          // For other event types, just append
          prev.push(message);
        }
      } else {
        prev.push(message);
      }
      return { ...state, messages: prev };
    });
  },

  resolveToolCalls: () => {
    const toolCalls = get().getPendingToolCalls();
    toolCalls.forEach(toolCall => {
      get().initializeTool(toolCall);
    });
  },

  // State actions
  processMessage: (message: DistriChatMessage) => {
    const timestamp = Date.now(); // Default fallback
    get().addMessage(message);

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
          get().setStreamingIndicator('typing');
          set({ isStreaming: true });
          break;

        case 'run_finished':
          const currentTaskId = get().currentTaskId;
          if (currentTaskId) {
            get().updateTask(currentTaskId, {
              status: 'completed',
              endTime: timestamp,
            });
          }
          get().resolveToolCalls();
          // Clear all indicators and stop loading when run is finished
          get().setStreamingIndicator(undefined);
          set({ isStreaming: false });

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
          get().resolveToolCalls();
          // Clear all indicators and stop loading when run errors
          get().setStreamingIndicator(undefined);
          set({ isStreaming: false });
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
          get().setStreamingIndicator('thinking');
          break;

        case 'plan_finished':
          const currentPlanId = get().currentPlanId;
          if (currentPlanId) {
            const plan = get().getPlanById(currentPlanId);
            const thinkingDuration = plan?.startTime ? timestamp - plan.startTime : 0;
            get().updatePlan(currentPlanId, {
              status: 'completed',
              endTime: timestamp,
              thinkingDuration,
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
          break;

        case 'tool_call_end':
          const finishedTaskId = message.data.tool_call_id;
          if (finishedTaskId) {
            get().updateTask(finishedTaskId, {
              status: 'completed',
              endTime: timestamp,
            });
          }
          break;

        case 'text_message_start':
          // Start generating response indicator and streaming
          get().setStreamingIndicator('typing');
          break;

        case 'text_message_content':
          get().setStreamingIndicator(undefined);
          break;

        case 'text_message_end':
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
          get().setStreamingIndicator('generating');
          break;

        case 'step_completed':
          const completedStepId = message.data.step_id;
          get().updateStep(completedStepId, {
            status: 'completed',
            endTime: timestamp,
          });
          get().setStreamingIndicator(undefined);
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
              message.tool_calls.forEach(async toolCall => {
                get().initToolCall({
                  tool_call_id: toolCall.tool_call_id,
                  tool_name: toolCall.tool_name,
                  input: toolCall.input || {},
                }, message.timestamp || timestamp);
              });
            }
          }
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
              reasoning: message.reasoning,
              status: 'completed',
              endTime: message.timestamp || timestamp,
            });
          }
          get().setStreamingIndicator(undefined);
          break;
      }
    }
  },

  initToolCall: (toolCall: ToolCall, timestamp?: number) => {
    set((state: ChatState) => {
      const newState = { ...state };

      // Determine if tool is external (only if explicitly registered in tools array)

      // Only tools explicitly registered in the tools array are considered external
      const distriTool = state.tools?.find(t => t.name === toolCall.tool_name);



      newState.toolCalls.set(toolCall.tool_call_id, {
        tool_call_id: toolCall.tool_call_id,
        tool_name: toolCall.tool_name || 'Unknown Tool',
        input: toolCall.input || {},
        status: 'pending',
        startTime: timestamp || Date.now(),
        isExternal: !!distriTool,
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

  completeTool: async (toolCall: ToolCall, result: ToolResult) => {
    get().updateToolCallStatus(toolCall.tool_call_id, {
      status: result.success ? 'completed' : 'error',
      result: result,
      endTime: Date.now(),
      error: result.error || undefined,
    });
  },

  initializeTool: (toolCall: ToolCall) => {
    const state = get();
    const distriTool = state.tools?.find(t => t.name === toolCall.tool_name);
    const commonProps = {
      tool_name: toolCall.tool_name,
      input: toolCall.input,
      startTime: Date.now(),
      isExternal: true,
      status: 'running' as ToolCallStatus,
    };

    const completeToolFn = (result: ToolResult) => {
      get().completeTool(toolCall, result);
    }
    const toolCallState = state.toolCalls.get(toolCall.tool_call_id);

    if (!distriTool) {
      console.log(`Tool ${toolCall.tool_name} not found in registered tools - creating MissingTool component`);
      // Create MissingTool component for unknown tools
      const component = React.createElement(MissingTool, {
        toolCall,
        toolCallState,
        completeTool: completeToolFn
      });

      get().updateToolCallStatus(toolCall.tool_call_id, {
        ...commonProps,
        component,
        status: 'error',
        error: 'Tool not found',
        endTime: Date.now(),
      });
      return;
    }

    console.log('distriTool', distriTool);
    let component: React.ReactNode | undefined;
    if (distriTool?.type === 'ui') {
      const uiTool = distriTool as DistriUiTool;
      component = uiTool.component({
        toolCall,
        toolCallState,
        completeTool: completeToolFn
      });
    } else if (distriTool?.type === 'function') {
      // For DistriFnTool, automatically create DefaultToolActions component
      const fnTool = distriTool as DistriFnTool;
      component = React.createElement(DefaultToolActions, {
        toolCall,
        toolCallState: state.toolCalls.get(toolCall.tool_call_id),
        completeTool: completeToolFn,
        toolHandler: fnTool.handler,
        autoExecute: state.wrapOptions?.autoExecute ?? false
      });
    }
    get().updateToolCallStatus(toolCall.tool_call_id, {
      ...commonProps,
      component,
    });
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

    return completedToolCalls.map(toolCallState => ({
      tool_call_id: toolCallState.tool_call_id,
      tool_name: toolCallState.tool_name,
      result: toolCallState.result?.result,
      error: toolCallState.result?.error,
      success: toolCallState.result?.success,
    } as ToolResult));
  },

  getToolCallById: (toolCallId: string) => {
    const state = get();
    return state.toolCalls.get(toolCallId) || null;
  },

  getPendingToolCalls: () => {
    const state = get();
    return Array.from(state.toolCalls.values()).filter(toolCall =>
      toolCall.status === 'pending'
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
      tasks: new Map(),
      plans: new Map(),
      steps: new Map(),
      toolCalls: new Map(),
      currentTaskId: undefined,
      currentPlanId: undefined,
      streamingIndicator: undefined,
      messages: [],
      isStreaming: false,
      isLoading: false,
      error: null,
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
  setWrapOptions: (wrapOptions: { autoExecute?: boolean }) => {
    set({ wrapOptions });
  },
  setOnAllToolsCompleted: (callback: (toolResults: ToolResult[]) => void) => {
    set({ onAllToolsCompleted: callback });
  },
})); 