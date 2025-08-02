import { create } from 'zustand';
import { DistriEvent, DistriMessage, DistriArtifact, isDistriEvent, isDistriArtifact } from '@distri/core';

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

export interface ToolCallState {
  tool_call_id: string;
  tool_name: string;
  input: any;
  status: 'pending' | 'running' | 'completed' | 'failed';
  result?: any;
  error?: string;
  startTime?: number;
  endTime?: number;
}

export interface ChatState {
  tasks: Map<string, TaskState>;
  plans: Map<string, PlanState>;
  toolCalls: Map<string, ToolCallState>;
  currentTaskId?: string;
  currentPlanId?: string;
}

interface ChatStateStore extends ChatState {
  // Actions
  processMessage: (message: DistriEvent | DistriMessage | DistriArtifact) => void;
  clearAllStates: () => void;
  clearTask: (taskId: string) => void;

  // Tool call management
  initToolCall: (toolCall: any, timestamp?: number) => void;
  updateToolCallStatus: (toolCallId: string, status: Partial<ToolCallState>) => void;
  getToolCallById: (toolCallId: string) => ToolCallState | null;
  getPendingToolCalls: () => ToolCallState[];
  getCompletedToolCalls: () => ToolCallState[];

  // Getters
  getCurrentTask: () => TaskState | null;
  getCurrentPlan: () => PlanState | null;
  getCurrentTasks: () => TaskState[];
  getTaskById: (taskId: string) => TaskState | null;
  getPlanById: (planId: string) => PlanState | null;

  // Updates
  updateTask: (taskId: string, updates: Partial<TaskState>) => void;
  updatePlan: (planId: string, updates: Partial<PlanState>) => void;
}

export const useChatStateStore = create<ChatStateStore>((set, get) => ({
  tasks: new Map(),
  plans: new Map(),
  toolCalls: new Map(),
  currentTaskId: undefined,
  currentPlanId: undefined,

  processMessage: (message: DistriEvent | DistriMessage | DistriArtifact) => {
    const timestamp = Date.now(); // Default fallback

    // Process events
    if (isDistriEvent(message)) {
      switch (message.type) {
        case 'run_started':
          const taskId = `task_${Date.now()}`;
          get().updateTask(taskId, {
            id: taskId,
            title: 'Agent Run',
            status: 'running',
            startTime: timestamp,
            metadata: message.data,
          });
          set({ currentTaskId: taskId });
          break;

        case 'run_finished':
          const currentTaskId = get().currentTaskId;
          if (currentTaskId) {
            get().updateTask(currentTaskId, {
              status: 'completed',
              endTime: timestamp,
            });
          }
          break;

        case 'plan_started':
          const planId = `plan_${Date.now()}`;
          get().updatePlan(planId, {
            id: planId,
            runId: get().currentTaskId,
            steps: [],
            status: 'running',
            startTime: timestamp,
          });
          set({ currentPlanId: planId });
          break;

        case 'plan_finished':
          const currentPlanId = get().currentPlanId;
          if (currentPlanId) {
            get().updatePlan(currentPlanId, {
              status: 'completed',
              endTime: timestamp,
            });
          }
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
                  status: message.success ? 'completed' : 'failed',
                  result: result.result,
                  error: message.reason || undefined,
                  endTime: message.timestamp || timestamp,
                });
              });
            }
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

  initToolCall: (toolCall: any, timestamp?: number) => {
    set((state: ChatState) => {
      const newState = { ...state };
      newState.toolCalls.set(toolCall.tool_call_id, {
        tool_call_id: toolCall.tool_call_id,
        tool_name: toolCall.tool_name || 'Unknown Tool',
        input: toolCall.input || {},
        status: 'pending',
        startTime: timestamp || Date.now(),
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
          endTime: status.status === 'completed' || status.status === 'failed' ? Date.now() : existingToolCall.endTime,
        });
      }
      return newState;
    });
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
      toolCall.status === 'completed' || toolCall.status === 'failed'
    );
  },

  clearAllStates: () => {
    set({
      tasks: new Map(),
      plans: new Map(),
      toolCalls: new Map(),
      currentTaskId: undefined,
      currentPlanId: undefined,
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
    return state.tasks.get(state.currentTaskId) || null;
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
      if (existingTask) {
        newState.tasks.set(taskId, { ...existingTask, ...updates });
      }
      return newState;
    });
  },

  updatePlan: (planId: string, updates: Partial<PlanState>) => {
    set((state: ChatState) => {
      const newState = { ...state };
      const existingPlan = newState.plans.get(planId);
      if (existingPlan) {
        newState.plans.set(planId, { ...existingPlan, ...updates });
      }
      return newState;
    });
  },
})); 