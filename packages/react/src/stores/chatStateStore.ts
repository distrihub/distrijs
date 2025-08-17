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
  RunStartedEvent,
  RunFinishedEvent,
  ToolsConfig,
} from '@distri/core';
import { DistriAnyTool, DistriUiTool, ToolCallStatus } from '../types';
import { StreamingIndicator } from '@/components/renderers/ThinkingRenderer';
import { DefaultToolActions } from '../components/renderers/tools/DefaultToolActions';
import { MissingTool } from '../components/renderers/tools/MissingTool';
import { extractThoughtContent } from '../utils/extractThought';
import React from 'react';

// State types
export interface TaskState {
  id: string;          // This is the taskId from AgentEvent
  runId?: string;      // This is the runId from AgentEvent  
  planId?: string;     // Associated plan ID (generated locally)
  title: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  startTime?: number;
  endTime?: number;
  toolCalls?: ToolCall[];
  results?: ToolResult[];
  error?: string;
  metadata?: Record<string, unknown>;
}

export interface PlanState {
  id: string;          // Generated locally (plan_${timestamp})
  runId?: string;      // This is the runId from AgentEvent
  taskId?: string;     // This is the taskId from AgentEvent
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
  input: Record<string, unknown>;
  status: ToolCallStatus;
  result?: ToolResult;
  error?: string;
  startTime?: number;
  endTime?: number;
  component?: React.ReactNode;
  isExternal?: boolean; // Flag to distinguish external tool calls
  isLiveStream?: boolean; // Flag to distinguish live streaming vs historical tool calls
}

export interface ChatState {
  // Processing state
  isStreaming: boolean;
  isLoading: boolean;
  error: Error | null;
  debug: boolean; // Debug flag for enhanced logging

  // Task/Plan/Step state
  tasks: Map<string, TaskState>;
  plans: Map<string, PlanState>;
  steps: Map<string, StepState>;
  toolCalls: Map<string, ToolCallState>;
  currentRunId?: string;    // From AgentEvent runId
  currentTaskId?: string;   // From AgentEvent taskId
  currentPlanId?: string;   // Generated locally
  messages: DistriChatMessage[];

  // Streaming indicator state
  streamingIndicator: StreamingIndicator | undefined;
  currentThought?: string;  // Current thought content from agent_response blocks

  // Tool execution state
  agent?: Agent;
  tools?: {
    tools: DistriAnyTool[];
    agent_tools: Map<string, DistriAnyTool[]>;
  };
  wrapOptions?: { autoExecute?: boolean };
  onAllToolsCompleted?: (() => void) | undefined;
  getAllTools: () => DistriAnyTool[];
}

export interface ChatStateStore extends ChatState {
  // State actions
  setStreaming: (isStreaming: boolean) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: Error | null) => void;
  setDebug: (debug: boolean) => void;

  // Streaming indicator actions
  setStreamingIndicator: (indicator: StreamingIndicator | undefined) => void;
  setCurrentThought: (thought: string | undefined) => void;

  // State actions
  addMessage: (message: DistriChatMessage) => void;
  processMessage: (message: DistriChatMessage, isFromStream?: boolean) => void;
  clearAllStates: () => void;
  clearTask: (taskId: string) => void;
  completeRunningSteps: () => void;

  // Tool call management
  initToolCall: (toolCall: ToolCall, timestamp?: number, isFromStream?: boolean) => void;
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
  setTools: (tools: ToolsConfig) => void;
  setWrapOptions: (options: { autoExecute?: boolean }) => void;
  setOnAllToolsCompleted: (callback: (() => void) | undefined) => void;
}

export const useChatStateStore = create<ChatStateStore>((set, get) => ({
  isStreaming: false,
  isLoading: false,
  error: null,
  debug: false,
  tasks: new Map(),
  plans: new Map(),
  steps: new Map(),
  toolCalls: new Map(),
  currentRunId: undefined,
  currentTaskId: undefined,
  currentPlanId: undefined,
  streamingIndicator: undefined,
  currentThought: undefined,
  messages: [],
  tools: {
    tools: [],
    agent_tools: new Map(),
  },

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
  setDebug: (debug: boolean) => {
    set({ debug });
  },

  setStreamingIndicator: (indicator: StreamingIndicator | undefined) => {
    set({ streamingIndicator: indicator });
  },

  setCurrentThought: (thought: string | undefined) => {
    set({ currentThought: thought });
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
    const isDebugEnabled = get().debug;

    set((state: ChatState) => {
      const messages = [...state.messages]; // Create a shallow copy of the array

      if (isDistriEvent(message)) {
        const event = message as DistriEvent;

        if (event.type === 'text_message_start') {
          // Create a new message with the specified ID and role
          const messageId = event.data.message_id;
          const stepId = event.data.step_id;
          const role = event.data.role;
          const isFinal = event.data.is_final;

          const newDistriMessage: DistriMessage = {
            id: messageId,
            role,
            parts: [{ type: 'text', data: '' }],
            created_at: new Date().toISOString(),
            step_id: stepId,
            is_final: isFinal
          };

          messages.push(newDistriMessage);

          // Update existing step to show it's now generating text (if step exists)
          if (stepId) {
            const existingStep = get().steps.get(stepId);
            if (existingStep) {
              get().updateStep(stepId, {
                // Keep the original title from step_started, just ensure it's running
                status: 'running',
              });
            }
          }

        } else if (event.type === 'text_message_content') {
          // Find existing message and append delta to text part
          const messageId = event.data.message_id;
          const stepId = event.data.step_id;
          const delta = event.data.delta;

          // Silent processing - no logs for content streaming

          const existingIndex = messages.findIndex(
            m => isDistriMessage(m) && (m as DistriMessage).id === messageId
          );

          if (existingIndex >= 0) {
            const existing = messages[existingIndex] as DistriMessage;

            // Build a new parts array immutably and update the text part
            const partsCopy = Array.isArray(existing.parts) ? [...existing.parts] : [];
            let textPartIndex = partsCopy.findIndex(p => p.type === 'text');
            if (textPartIndex === -1) {
              partsCopy.push({ type: 'text', data: '' } as any);
              textPartIndex = partsCopy.length - 1;
            }
            const prevText = (partsCopy[textPartIndex] as any).data || '';
            const newText = prevText + delta;
            partsCopy[textPartIndex] = { ...(partsCopy[textPartIndex] as any), data: newText };

            // Replace the message with a new object so React can detect changes per-row
            const updatedMessage: DistriMessage = { ...existing, parts: partsCopy };
            messages[existingIndex] = updatedMessage;

            // Extract thought content from accumulated text and update current thought
            const thoughtContent = extractThoughtContent(newText);
            if (thoughtContent) {
              get().setCurrentThought(thoughtContent);
            }

            // Update step progress if stepId provided and step exists
            if (stepId) {
              const currentStep = get().steps.get(stepId);
              if (currentStep && currentStep.status === 'running') {
                get().updateStep(stepId, {
                  title: `${currentStep.title || 'Writing'} (${newText.length} chars)`,
                });
              }
            }
          } else {
            // Only log errors for streaming issues
            if (isDebugEnabled) {
              console.warn('❌ Cannot find streaming message to append to:', messageId);
              console.log('📋 Available message IDs:', messages.filter(isDistriMessage).map(m => (m as DistriMessage).id));
            }
          }

        } else if (event.type === 'text_message_end') {
          // Message is complete, mark step as completed if stepId provided and step exists
          const stepId = event.data.step_id;

          if (stepId) {
            const existingStep = get().steps.get(stepId);
            if (existingStep) {
              get().updateStep(stepId, {
                status: 'completed',
                endTime: Date.now(),
              });
            }
          }

          // Clear current thought when message is complete
          get().setCurrentThought(undefined);

        } else {
          // Don't add state-only events to messages (they only update store state)
          const stateOnlyEvents = [
            'run_started', 'run_finished', 'run_error',
            'plan_started', 'plan_finished',
            'step_started', 'step_completed',
            'tool_calls', 'tool_results'
          ];

          if (!stateOnlyEvents.includes(event.type)) {
            // For other event types, just append
            messages.push(message);
          }
        }
      } else {
        // For DistriMessage or DistriArtifact, just add directly
        messages.push(message);
      }
      return { ...state, messages };
    });
  },

  resolveToolCalls: () => {
    const toolCalls = get().getPendingToolCalls();
    toolCalls.forEach(toolCall => {
      get().initializeTool(toolCall);
    });
  },

  // State actions
  processMessage: (message: DistriChatMessage, isFromStream: boolean = false) => {
    const timestamp = Date.now(); // Default fallback
    const isDebugEnabled = get().debug;

    if (isDebugEnabled) {
      console.log("🔧 Processing message:");
      console.log(message);
    }
    get().addMessage(message);

    if (isDistriEvent(message)) {
      const event = message as DistriEvent;

      // Debug store state changes for visual indicators
      if (isDebugEnabled && ['run_started', 'run_finished', 'plan_started', 'plan_finished', 'text_message_start'].includes(event.type)) {
        console.log('🏪 STORE BEFORE:', {
          eventType: event.type,
          streamingIndicator: get().streamingIndicator,
          isStreaming: get().isStreaming,
          currentTaskId: get().currentTaskId,
          currentPlanId: get().currentPlanId
        });
      }

      switch (message.type) {
        case 'run_started':
          const runStartedEvent = event as RunStartedEvent;
          const runId = runStartedEvent.data.runId;
          const taskId = runStartedEvent.data.taskId;

          if (isDebugEnabled) {
            console.log('🏪 run_started with IDs:', { runId, taskId });
          }

          // Create or update task using the actual taskId from the event
          if (taskId) {
            get().updateTask(taskId, {
              id: taskId,
              runId: runId,
              title: 'Agent Run',
              status: 'running',
              startTime: timestamp,
              metadata: event.data,
            });
          }

          // Track current IDs
          set({
            currentRunId: runId,
            currentTaskId: taskId
          });

          // Show "Agent is starting..." indicator
          get().setStreamingIndicator('typing');
          set({ isStreaming: true });

          if (isDebugEnabled) {
            console.log('🏪 STORE AFTER run_started:', {
              streamingIndicator: get().streamingIndicator,
              isStreaming: get().isStreaming,
              currentRunId: get().currentRunId,
              currentTaskId: get().currentTaskId
            });
          }
          break;

        case 'run_finished':
          const runFinishedEvent = event as RunFinishedEvent;
          const finishedRunId = runFinishedEvent.data.runId;
          const finishedTaskId = runFinishedEvent.data.taskId;

          if (isDebugEnabled) {
            console.log('🏪 run_finished with IDs:', { runId: finishedRunId, taskId: finishedTaskId });
          }

          // Update the specific task that finished
          if (finishedTaskId) {
            get().updateTask(finishedTaskId, {
              status: 'completed',
              endTime: timestamp,
            });
          }

          // Tool calls are now resolved immediately when tool_calls event arrives, not here
          console.log('🔧 Run finished - tool calls should already be resolved from tool_calls event');

          // Clear all indicators and stop loading when run is finished
          get().setStreamingIndicator(undefined);
          get().setCurrentThought(undefined);
          set({ isStreaming: false });

          break;

        case 'run_error':
          console.log('🔧 run_error');
          const errorTaskId = get().currentTaskId;
          if (errorTaskId) {
            get().updateTask(errorTaskId, {
              status: 'failed',
              endTime: timestamp,
              error: message.data?.message || 'Unknown error',
            });
          }

          // Tool calls are now resolved immediately when tool_calls event arrives, not here
          console.log('🔧 Run error - tool calls should already be resolved from tool_calls event');

          // Clear all indicators and stop loading when run errors
          get().setStreamingIndicator(undefined);
          get().setCurrentThought(undefined);
          set({ isStreaming: false });
          break;

        case 'plan_started':
          const planId = `plan_${Date.now()}`;
          const currentRunId = get().currentRunId;
          const currentTaskId = get().currentTaskId;

          if (isDebugEnabled) {
            console.log('🏪 plan_started for run/task:', { currentRunId, currentTaskId });
          }

          get().updatePlan(planId, {
            id: planId,
            runId: currentRunId,     // Link to the current run
            taskId: currentTaskId,   // Link to the current task
            steps: [],
            status: 'running',
            startTime: timestamp,
          });
          set({ currentPlanId: planId });
          // Switch to planning indicator and stop streaming
          get().setStreamingIndicator('thinking');

          if (isDebugEnabled) {
            console.log('🏪 STORE AFTER plan_started:', {
              streamingIndicator: get().streamingIndicator,
              currentPlanId: get().currentPlanId,
              currentRunId: get().currentRunId,
              currentTaskId: get().currentTaskId
            });
          }
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
          get().setCurrentThought(undefined);
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
          const finishedToolCallId = message.data.tool_call_id;
          if (finishedToolCallId) {
            get().updateTask(finishedToolCallId, {
              status: 'completed',
              endTime: timestamp,
            });
          }
          break;

        case 'text_message_start':
          // Start generating response indicator and streaming
          get().setStreamingIndicator('typing');

          if (isDebugEnabled) {
            console.log('🏪 STORE AFTER text_message_start:', {
              streamingIndicator: get().streamingIndicator
            });
          }
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

        case 'tool_calls':
          // Handle direct tool calls event
          if (message.data.tool_calls && Array.isArray(message.data.tool_calls)) {
            console.log('🔧 Processing tool_calls event:', message.data.tool_calls);
            message.data.tool_calls.forEach(toolCall => {
              console.log('🔧 Creating tool call:', toolCall.tool_name, toolCall.tool_call_id);
              get().initToolCall({
                tool_call_id: toolCall.tool_call_id,
                tool_name: toolCall.tool_name,
                input: toolCall.input,
              }, timestamp, isFromStream);
            });
            console.log('🔧 Tool calls after init:', Array.from(get().toolCalls.entries()));

            // Immediately resolve/initialize tools when tool_calls event arrives (not on run_finished)
            console.log('🔧 Resolving tool calls immediately on tool_calls event');
            get().resolveToolCalls();
          }
          break;

        case 'tool_results':
          // Handle direct tool results event
          if (message.data.results && Array.isArray(message.data.results)) {
            message.data.results.forEach(result => {
              get().updateToolCallStatus(result.tool_call_id, {
                status: result.success !== false ? 'completed' : 'error',
                result: {
                  tool_call_id: result.tool_call_id,
                  tool_name: result.tool_name,
                  result: result.result,
                  error: result.error,
                  success: result.success !== false,
                },
                error: result.error,
                endTime: timestamp,
              });
            });
          }
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

        case 'plan':
          const planId = message.id;
          if (planId) {
            get().updatePlan(planId, {
              steps: message.steps,
              reasoning: message.reasoning,
              status: 'completed',
              endTime: message.timestamp || timestamp,
            });

            // Extract tool calls from action steps in the plan
            if (message.steps && Array.isArray(message.steps)) {
              message.steps.forEach(step => {
                if (step.type === 'action' && step.action && step.action.tool_name) {
                  // Create a tool call from the action
                  const toolCall = {
                    tool_call_id: step.id || `tool_${Date.now()}`,
                    tool_name: step.action.tool_name,
                    input: step.action.input || {},
                  };

                  get().initToolCall(toolCall, message.timestamp || timestamp, isFromStream);
                }
              });
            }
          }
          get().setStreamingIndicator(undefined);
          break;
      }
    }
  },

  initToolCall: (toolCall: ToolCall, timestamp?: number, isFromStream: boolean = false) => {
    set((state: ChatState) => {
      const newState = { ...state };

      // Determine if tool is external (only if explicitly registered in tools map)
      let distriTool: DistriAnyTool | undefined;

      const tools = state.getAllTools();
      distriTool = tools.find(t => t.name === toolCall.tool_name);
      newState.toolCalls.set(toolCall.tool_call_id, {
        tool_call_id: toolCall.tool_call_id,
        tool_name: toolCall.tool_name || 'Unknown Tool',
        input: toolCall.input || {},
        status: 'pending',
        startTime: timestamp || Date.now(),
        isExternal: !!distriTool,
        isLiveStream: isFromStream,
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

    // Check if all external tools are completed after this completion
    const state = get();
    const pendingExternalTools = Array.from(state.toolCalls.values()).filter(
      tc => tc.isExternal && (tc.status === 'pending' || tc.status === 'running')
    );

    // If no pending external tools and we have an onAllToolsCompleted callback, trigger it
    if (pendingExternalTools.length === 0 && state.onAllToolsCompleted) {
      setTimeout(() => {
        state.onAllToolsCompleted?.();
      }, 0); // Defer to next tick to avoid state update conflicts
    }
  },

  initializeTool: (toolCall: ToolCall) => {
    const state = get();
    let distriTool: DistriAnyTool | undefined;
    if (state.tools) {
      // Search through all agent tools to find the tool
      const tools = state.getAllTools();

      distriTool = tools.find(t => t.name === toolCall.tool_name);
    }
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
        completeTool: completeToolFn,
        tool: {
          name: toolCall.tool_name,
          type: 'function',
          description: 'Unknown tool',
          input_schema: {},
          autoExecute: false,
        } as DistriFnTool,
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
        completeTool: completeToolFn,
        tool: distriTool
      });
    } else if (distriTool?.type === 'function') {
      // For DistriFnTool, automatically create DefaultToolActions component
      let fnTool = distriTool as DistriFnTool;
      // Only auto-execute if explicitly set on the tool itself, not from global wrapOptions
      // This ensures tools show confirmation UI by default and only auto-execute when intended
      fnTool.autoExecute = fnTool.autoExecute === true;

      component = React.createElement(DefaultToolActions, {
        toolCall,
        toolCallState: state.toolCalls.get(toolCall.tool_call_id),
        completeTool: completeToolFn,
        tool: fnTool,
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
      currentRunId: undefined,
      currentTaskId: undefined,
      currentPlanId: undefined,
      streamingIndicator: undefined,
      messages: [],
      isStreaming: false,
      isLoading: false,
      error: null,
    });
  },

  // Helper to complete any running steps (for cleanup)
  completeRunningSteps: () => {
    const state = get();
    const now = Date.now();
    state.steps.forEach((step, stepId) => {
      if (step.status === 'running') {
        get().updateStep(stepId, {
          status: 'completed',
          endTime: now,
        });
      }
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

  getAllTools: (): DistriAnyTool[] => {
    const state = get();
    let tools = state.tools?.tools || [];
    for (const [, toolList] of state.tools?.agent_tools || []) {
      tools.push(...toolList);
    }
    return tools;
  },

  // Setup
  setAgent: (agent: Agent) => {
    set({ agent });
  },
  setTools: (tools: ToolsConfig) => {
    console.log('🔧 Setting tools in store (Map format):', tools);
    set({
      tools: {
        tools: tools.tools as DistriAnyTool[],
        agent_tools: tools.agent_tools as Map<string, DistriAnyTool[]>,
      }
    });
  },
  setWrapOptions: (wrapOptions: { autoExecute?: boolean }) => {
    set({ wrapOptions });
  },
  setOnAllToolsCompleted: (callback: (() => void) | undefined) => {
    set({ onAllToolsCompleted: callback });
  },
})); 