import { create } from 'zustand';
import {
  DistriEvent,
  DistriMessage,
  isDistriEvent,
  Agent,
  ToolCall,
  ToolResult,
  extractToolResultData,
  DistriFnTool,
  isDistriMessage,
  DistriChatMessage,
  PlanStep,
  RunStartedEvent,
  RunFinishedEvent,
  RunErrorEvent,
  ToolExecutionStartEvent,
  ToolExecutionEndEvent,
  DistriPart,
} from '@distri/core';
import { DistriAnyTool, DistriUiTool, ToolCallStatus } from '../types';
import { StreamingIndicator } from '@/components/renderers/ThinkingRenderer';
import { DefaultToolActions } from '../components/renderers/tools/DefaultToolActions';
import React from 'react';

// Prevent duplicate completion posts when React StrictMode double-invokes handlers
const completingToolCallIds = new Set<string>();

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
  resultSent?: boolean; // Flag to track if result was already sent to agent
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
  currentTaskId?: string;   // From A2A status-update taskId - this is what we send back
  currentPlanId?: string;   // Generated locally
  messages: DistriChatMessage[];

  // Streaming indicator state
  streamingIndicator: StreamingIndicator | undefined;
  currentThought?: string;  // Current thought content from agent_response blocks

  // Tool execution state
  agent?: Agent;

  externalTools?: DistriAnyTool[];
  wrapOptions?: { autoExecute?: boolean };

  // Browser streaming state
  browserFrame?: string;
  browserFrameFormat?: string;
  browserFrameUpdatedAt?: number;
}

type ChatStateTool = DistriAnyTool & {
  executionType: 'backend' | 'external';
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
  setBrowserFrame: (frameSrc: string, format?: string) => void;

  // State actions
  addMessage: (message: DistriChatMessage) => void;
  processMessage: (message: DistriChatMessage, isFromStream?: boolean) => void;
  clearAllStates: () => void;
  clearTask: (taskId: string) => void;
  clearBrowserFrame: () => void;
  getToolByName: (toolName: string) => ChatStateTool | undefined;
  completeRunningSteps: () => void;
  resetStreamingStates: () => void;

  // Tool call management
  initToolCall: (toolCall: ToolCall, timestamp?: number, isFromStream?: boolean) => void;
  updateToolCallStatus: (toolCallId: string, status: Partial<ToolCallState>) => void;
  getToolCallById: (toolCallId: string) => ToolCallState | null;
  getPendingToolCalls: () => ToolCallState[];
  getCompletedToolCalls: () => ToolCallState[];
  completeTool: (toolCall: ToolCall, result: ToolResult) => Promise<void>;
  executeTool: (toolCall: ToolCall, distriTool: DistriAnyTool) => void;
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
  setExternalTools: (tools: DistriAnyTool[]) => void;
  setWrapOptions: (options: { autoExecute?: boolean }) => void;

  // Main task management
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
  browserFrame: undefined,
  browserFrameFormat: undefined,
  browserFrameUpdatedAt: undefined,
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

  setBrowserFrame: (frameSrc: string, format?: string) => {
    set({
      browserFrame: frameSrc,
      browserFrameFormat: format ?? 'png',
      browserFrameUpdatedAt: Date.now(),
    });
  },

  getToolByName: (toolName: string): ChatStateTool | undefined => {
    const state = get();
    const externalTool = state.externalTools?.find(t => t.name === toolName);
    if (externalTool) {
      return { ...externalTool, executionType: 'external' };
    }

    return undefined;
  },

  addMessage: (message: DistriChatMessage) => {
    set((state: ChatState) => {
      if (isDistriEvent(message)) {
        const event = message as DistriEvent;

        if (event.type === 'browser_screenshot') {
          if (event.data.image) {
            const format = event.data.format || 'png';
            const frameSrc = `data:image/${format};base64,${event.data.image}`;
            return {
              ...state,
              browserFrame: frameSrc,
              browserFrameFormat: format,
              browserFrameUpdatedAt: event.data.timestamp_ms || Date.now(),
            };
          }
          return state;
        }

        if (event.type === 'text_message_start') {
          // Create a new message with the specified ID and role
          const messageId = event.data.message_id;
          const stepId = event.data.step_id;
          const role = event.data.role;
          const isFinal = event.data.is_final;

          const newDistriMessage: DistriMessage = {
            id: messageId,
            role,
            parts: [{ part_type: 'text', data: '' }],
            created_at: new Date().toISOString(),
            step_id: stepId,
            is_final: isFinal
          };

          // Create new messages array with the new message
          const messages = [...state.messages, newDistriMessage];

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

          return { ...state, messages };

        } else if (event.type === 'text_message_content') {
          // Find existing message and append delta to text part
          const messageId = event.data.message_id;
          const delta = event.data.delta;

          // Silent processing - no logs for content streaming

          const existingIndex = state.messages.findIndex(
            m => isDistriMessage(m) && (m as DistriMessage).id === messageId
          );

          if (existingIndex >= 0) {
            const existingMessage = state.messages[existingIndex] as DistriMessage;
            let textPart = existingMessage.parts.find(p => p.part_type === 'text') as { part_type: 'text'; data: string } | undefined;
            textPart = { part_type: 'text', data: delta };
            // Create new parts array with the new text part
            const updatedMessage = {
              ...existingMessage,
              parts: [...existingMessage.parts, textPart]
            };
            // Create new messages array with only the updated message replaced
            const messages = state.messages.map((msg, idx) =>
              idx === existingIndex ? updatedMessage : msg
            );

            return { ...state, messages };

          } else {
            // Only log errors for streaming issues
            // For DistriMessage or DistriArtifact, just add directly
            console.log('🔧 text message content sent without existing message. This should not happen.', message);
            return state;
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

          return state; // No message array change needed

        } else {
          // Don't add state-only events to messages (they only update store state)
          const stateOnlyEvents = [
            'run_started', 'run_finished', 'run_error',
            'plan_started', 'plan_finished',
            'step_started', 'step_completed',
            'tool_results'
          ];

          if (!stateOnlyEvents.includes(event.type)) {
            // For other event types, just append
            const messages = [...state.messages, message];
            return { ...state, messages };
          }
          return state; // No change needed for state-only events
        }
      } else {
        // For DistriMessage or DistriArtifact, just add directly
        const messages = [...state.messages, message];
        return { ...state, messages };
      }
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
      if (isDebugEnabled && message.type !== 'text_message_content') {
        console.log('🏪 EVENT:', message);
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

          // **FIX**: Don't overwrite currentTaskId if it's already set (preserve main task ID)
          // Only set currentTaskId if it hasn't been set yet (for backward compatibility)
          const shouldUpdateTaskId = !get().currentTaskId;

          set({
            currentRunId: runId,
            currentTaskId: shouldUpdateTaskId ? taskId : get().currentTaskId
          });
          get().setStreamingIndicator('typing');
          set({ isStreaming: true });
          break;

        case 'run_finished':
          const runFinishedEvent = event as RunFinishedEvent;
          const finishedTaskId = runFinishedEvent.data.taskId;

          // Update the specific task that finished
          if (finishedTaskId) {
            get().updateTask(finishedTaskId, {
              status: 'completed',
              endTime: timestamp,
            });
          }
          set({ isStreaming: false, isLoading: false });
          get().setStreamingIndicator(undefined);
          get().setCurrentThought(undefined);
          break;

        case 'run_error':
          const runErrorEvent = event as RunErrorEvent;
          const errorTaskId = runErrorEvent.data.code ? 'subtask' : get().currentTaskId; // Basic heuristic for now
          const currentMainTaskIdForError = get().currentTaskId;

          if (errorTaskId) {
            get().updateTask(errorTaskId, {
              status: 'failed',
              endTime: timestamp,
              error: runErrorEvent.data.message || 'Unknown error',
            });
          }

          // Only clear indicators and stop streaming if this is the main task error
          if (errorTaskId === currentMainTaskIdForError) {
            console.log('🛑 Stopping streaming - main task errored');
            get().setStreamingIndicator(undefined);
            get().setCurrentThought(undefined);
            set({ isStreaming: false, isLoading: false });
          } else {
            console.log('📝 Sub-task errored, continuing stream');
          }
          break;

        case 'plan_started':
          const planId = `plan_${Date.now()}`;
          const currentRunId = get().currentRunId;
          const currentTaskId = get().currentTaskId;

          get().updatePlan(planId, {
            id: planId,
            runId: currentRunId,     // Link to the current run
            taskId: currentTaskId,   // Link to the current task
            steps: [],
            status: 'running',
            startTime: timestamp,
          });
          set({ currentPlanId: planId });
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
          break;

        case 'tool_execution_start':
          const toolExecutionStartEvent = event as ToolExecutionStartEvent;
          if (get().getToolCallById(toolExecutionStartEvent.data.tool_call_id)) {
            get().updateToolCallStatus(toolExecutionStartEvent.data.tool_call_id, {
              status: 'running',
              startTime: timestamp,
            });
          } else {
            get().toolCalls.set(toolExecutionStartEvent.data.tool_call_id, {
              tool_call_id: toolExecutionStartEvent.data.tool_call_id,
              tool_name: toolExecutionStartEvent.data.tool_call_name,
              input: toolExecutionStartEvent.data.input,
              status: 'running',
              startTime: timestamp,
              isExternal: false,
              isLiveStream: isFromStream,
            });
          }
          break;

        case 'tool_execution_end':
          const toolExecutionEndEvent = event as ToolExecutionEndEvent;
          const finishedToolCallId = toolExecutionEndEvent.data.tool_call_id;
          if (finishedToolCallId) {
            get().updateToolCallStatus(finishedToolCallId, {
              status: 'completed',
              endTime: timestamp,
            });

          }
          break;

        case 'text_message_start':
          break;

        case 'text_message_content':
          // Don't clear typing indicator here - let it remain visible while content is streaming
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
          break;

        case 'step_completed':
          const completedStepId = message.data.step_id;
          get().updateStep(completedStepId, {
            status: 'completed',
            endTime: timestamp,
          });
          break;

        case 'tool_calls':
          // Handle direct tool calls event
          if (message.data.tool_calls && Array.isArray(message.data.tool_calls)) {
            message.data.tool_calls.forEach(async (toolCall: ToolCall) => {
              if (get().toolCalls.has(toolCall.tool_call_id)) {
                console.log('🔁 Ignoring duplicate tool_call event', toolCall.tool_call_id);
                return;
              }
              // Initialize tool call in UI
              get().initToolCall({
                tool_call_id: toolCall.tool_call_id,
                tool_name: toolCall.tool_name,
                input: toolCall.input,
              }, timestamp, isFromStream);
            });
          }
          break;

        case 'tool_results':
          // Handle direct tool results event
          if (message.data.results && Array.isArray(message.data.results)) {
            message.data.results.forEach((result: ToolResult) => {
              get().updateToolCallStatus(result.tool_call_id, {
                status: 'completed',
                result,
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
  },

  initToolCall: (toolCall: ToolCall, timestamp?: number, isFromStream: boolean = false) => {
    // Find tool in configured tools (both external and backend)
    const externalTools = get().externalTools || [];
    const externalTool = externalTools.find(t => t.name === toolCall.tool_name);
    const existingToolCall = get().toolCalls.get(toolCall.tool_call_id);
    if (existingToolCall) {
      console.log('🔁 initToolCall skipped duplicate', toolCall.tool_call_id);
      return;
    }

    set((state: ChatState) => {
      const newState = { ...state };
      newState.toolCalls.set(toolCall.tool_call_id, {
        tool_call_id: toolCall.tool_call_id,
        tool_name: toolCall.tool_name || 'Unknown Tool',
        input: toolCall.input || {},
        status: 'pending',
        startTime: timestamp || Date.now(),
        isExternal: !!externalTool,
        isLiveStream: isFromStream,
      });
      return newState;
    });
    if (externalTool) {
      console.log('🔧 Tool found:', {
        externalTool,
        toolName: toolCall.tool_name
      });
      get().executeTool(toolCall, externalTool);
    } else {
      console.log('🔧 Tool not external:', {
        toolName: toolCall.tool_name
      });
    }
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
    console.log('completeTool', toolCall, result);

    if (completingToolCallIds.has(toolCall.tool_call_id)) {
      console.warn(`Skipping duplicate completeTool for ${toolCall.tool_call_id}`);
      return;
    }
    completingToolCallIds.add(toolCall.tool_call_id);

    const toolResultData = extractToolResultData(result);
    const resultIndicatesError = toolResultData?.success === false || Boolean(toolResultData?.error);
    const resultErrorMessage = toolResultData?.error ?? (toolResultData?.success === false ? 'Tool execution failed' : undefined);

    get().updateToolCallStatus(toolCall.tool_call_id, {
      status: resultIndicatesError ? 'error' : 'completed',
      result,
      error: resultIndicatesError ? resultErrorMessage : undefined,
      endTime: Date.now(),
    });

    const state = get();
    const agent = state.agent;
    if (!agent) {
      console.error('❌ Agent not found');
      get().updateToolCallStatus(toolCall.tool_call_id, {
        status: 'error',
        error: resultErrorMessage ?? 'Agent not available to complete tool',
        endTime: Date.now(),
      });
      completingToolCallIds.delete(toolCall.tool_call_id);
      return;
    }
    console.log('state.toolCalls', state.toolCalls);
    try {
      console.log(`🔧 Executing external function tool: ${toolCall.tool_name}`);
      console.log(`✅ Tool ${toolCall.tool_name} executed successfully:`, result);

      // Call agent's completeTool API
      await agent.completeTool(result);
      console.log(`✅ Tool completion sent to agent via API`);

    } catch (error) {
      console.error(`❌ Error executing tool ${toolCall.tool_name}:`, error);
      get().updateToolCallStatus(toolCall.tool_call_id, {
        status: 'error',
        error: error instanceof Error ? error.message : 'Tool completion failed',
        endTime: Date.now(),
      });
    } finally {
      completingToolCallIds.delete(toolCall.tool_call_id);
    }
  },

  executeTool: (toolCall: ToolCall, distriTool: DistriAnyTool) => {
    try {
      const commonProps = {
        tool_name: toolCall.tool_name,
        input: toolCall.input,
        startTime: Date.now(),
        isExternal: !!distriTool, // Only mark as external if it's actually an external tool
        status: 'running' as ToolCallStatus,
      };
      const completeToolFn = (result: ToolResult) => {
        try {
          get().completeTool(toolCall, result);
        } catch (error) {
          console.error(`❌ Error completing tool ${toolCall.tool_name}:`, error);
          // Update tool call with error status
          get().updateToolCallStatus(toolCall.tool_call_id, {
            status: 'error',
            error: error instanceof Error ? error.message : 'Tool completion failed',
            endTime: Date.now(),
          });
        }
      }
      const toolCallState = get().toolCalls.get(toolCall.tool_call_id);

      console.log('distriTool', distriTool);
      let component: React.ReactNode | undefined;

      try {
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
          const fnTool = distriTool as DistriFnTool;
          // Only auto-execute if explicitly set on the tool itself, not from global wrapOptions
          // This ensures tools show confirmation UI by default and only auto-execute when intended
          fnTool.autoExecute = fnTool.autoExecute === true;

          const error = validateToolCallInput(toolCall);
          if (error) {
            completeToolFn({
              tool_call_id: toolCall.tool_call_id,
              tool_name: toolCall.tool_name,
              parts: [{ part_type: 'data', data: { result: null, error: error, success: false } }]
            });
            return;
          }
          component = React.createElement(DefaultToolActions, {
            toolCall,
            toolCallState: get().toolCalls.get(toolCall.tool_call_id),
            completeTool: completeToolFn,
            tool: fnTool,
          });
        }
      } catch (componentError) {
        console.error(`❌ Error creating component for tool ${toolCall.tool_name}:`, componentError);
        // Create error component to display the issue
        component = React.createElement('div', {
          className: 'text-red-500 p-2 border border-red-200 rounded bg-red-50'
        }, `Error loading tool: ${componentError instanceof Error ? componentError.message : 'Unknown component error'}`);

        // Mark tool as errored
        get().updateToolCallStatus(toolCall.tool_call_id, {
          ...commonProps,
          status: 'error',
          error: `Component creation failed: ${componentError instanceof Error ? componentError.message : 'Unknown error'}`,
          component,
          endTime: Date.now(),
        });
        return;
      }

      get().updateToolCallStatus(toolCall.tool_call_id, {
        ...commonProps,
        component,
      });
    } catch (error) {
      console.error(`❌ Critical error in executeTool for ${toolCall.tool_name}:`, error);
      // Fallback: create minimal error state
      get().updateToolCallStatus(toolCall.tool_call_id, {
        tool_name: toolCall.tool_name,
        input: toolCall.input,
        status: 'error',
        error: `Tool execution failed: ${error instanceof Error ? error.message : 'Critical error'}`,
        startTime: Date.now(),
        endTime: Date.now(),
        isExternal: true,
        component: React.createElement('div', {
          className: 'text-red-500 p-2 border border-red-200 rounded bg-red-50'
        }, `Critical tool error: ${error instanceof Error ? error.message : 'Unknown error'}`),
      });
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
      // **FIX**: Don't delete tool calls - they should remain visible in chat history
      // Just mark them as processed so they don't get sent again
      newState.toolCalls.forEach(toolCall => {
        if (toolCall.status === 'completed' || toolCall.status === 'error') {
          // Mark as processed but keep in the UI
          toolCall.resultSent = true;
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
      toolCall.result !== undefined && // Only return if there's actually a result
      !toolCall.resultSent // **FIX**: Don't return results that were already sent
    );

    return completedToolCalls.map((toolCallState): ToolResult => {
      const fallbackPart: DistriPart = {
        part_type: 'data',
        data: { result: null, error: 'No result', success: false },
      };

      return {
        tool_call_id: toolCallState.tool_call_id,
        tool_name: toolCallState.tool_name,
        parts: toolCallState.result?.parts ?? [fallbackPart],
      };
    });
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
      browserFrame: undefined,
      browserFrameFormat: undefined,
      browserFrameUpdatedAt: undefined,
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

  // Reset streaming and thinking states when streaming is stopped
  resetStreamingStates: () => {
    console.log('🔄 Resetting streaming states');
    set({
      isStreaming: false,
      streamingIndicator: undefined,
      currentThought: undefined,
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

  clearBrowserFrame: () => {
    set({
      browserFrame: undefined,
      browserFrameFormat: undefined,
      browserFrameUpdatedAt: undefined,
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
      const taskToUpdate: TaskState = existingTask || {
        id: taskId,
        title: updates.title ?? 'Task',
        status: updates.status ?? 'pending',
        toolCalls: [],
        results: [],
      };
      newState.tasks.set(taskId, { ...taskToUpdate, ...updates });
      return newState;
    });
  },

  updatePlan: (planId: string, updates: Partial<PlanState>) => {
    set((state: ChatState) => {
      const newState = { ...state };
      const existingPlan = newState.plans.get(planId);
      const planToUpdate: PlanState = existingPlan || {
        id: planId,
        steps: [],
        status: updates.status ?? 'pending',
      };
      newState.plans.set(planId, { ...planToUpdate, ...updates });
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

  getAllExternalTools: (): DistriAnyTool[] => {
    const state = get();
    return state.externalTools || [];
  },

  // Setup
  setAgent: (agent: Agent) => {
    set({ agent });
  },
  setExternalTools: (tools: DistriAnyTool[]) => {
    set({ externalTools: tools });
  },
  setWrapOptions: (wrapOptions: { autoExecute?: boolean }) => {
    set({ wrapOptions });
  },
}));


const validateToolCallInput = (toolCall: ToolCall): string | null => {
  const notValidJson = 'Input is not a valid JSON string or object';
  if (typeof toolCall.input === 'string') {
    try {
      JSON.parse(toolCall.input);
      return null;
    } catch {
      return notValidJson;
    }
  }
  return typeof toolCall.input === 'object' ? null : notValidJson;
}
