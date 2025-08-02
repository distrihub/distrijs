import { useState, useCallback } from 'react';
import { DistriEvent, DistriMessage, DistriArtifact, isDistriEvent, isDistriArtifact } from '@distri/core';

// State types for context-level management
export interface RunState {
  id: string;
  title: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  startTime?: number;
  endTime?: number;
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
}

export interface ChatState {
  runs: Map<string, RunState>;
  plans: Map<string, PlanState>;
  tasks: Map<string, TaskState>;
  currentRunId?: string;
  currentPlanId?: string;
}

export interface ChatStateManager {
  state: ChatState;

  // State getters
  getCurrentRun: () => RunState | null;
  getCurrentPlan: () => PlanState | null;
  getCurrentTasks: () => TaskState[];
  getTaskById: (taskId: string) => TaskState | null;
  getPlanById: (planId: string) => PlanState | null;
  getRunById: (runId: string) => RunState | null;

  // State setters
  updateRun: (runId: string, updates: Partial<RunState>) => void;
  updatePlan: (planId: string, updates: Partial<PlanState>) => void;
  updateTask: (taskId: string, updates: Partial<TaskState>) => void;

  // State management
  processMessage: (message: DistriEvent | DistriMessage | DistriArtifact) => void;
  clearAllStates: () => void;
  clearRun: (runId: string) => void;
}

export function useChatState(): ChatStateManager {
  const [state, setState] = useState<ChatState>({
    runs: new Map(),
    plans: new Map(),
    tasks: new Map(),
  });

  const processMessage = useCallback((message: DistriEvent | DistriMessage | DistriArtifact) => {
    setState(prevState => {
      const newState = { ...prevState };

      // Process events
      if (isDistriEvent(message)) {
        switch (message.type) {
          case 'run_started':
            const runId = `run_${Date.now()}`;
            newState.runs.set(runId, {
              id: runId,
              title: 'Agent Run',
              status: 'running',
              startTime: Date.now(),
              metadata: message.data,
            });
            newState.currentRunId = runId;
            break;

          case 'run_finished':
            if (newState.currentRunId && newState.runs.has(newState.currentRunId)) {
              const run = newState.runs.get(newState.currentRunId)!;
              newState.runs.set(newState.currentRunId, {
                ...run,
                status: 'completed',
                endTime: Date.now(),
              });
            }
            break;

          case 'plan_started':
            const planId = `plan_${Date.now()}`;
            newState.plans.set(planId, {
              id: planId,
              runId: newState.currentRunId,
              steps: [],
              status: 'running',
              startTime: Date.now(),
            });
            newState.currentPlanId = planId;
            break;

          case 'plan_finished':
            if (newState.currentPlanId && newState.plans.has(newState.currentPlanId)) {
              const plan = newState.plans.get(newState.currentPlanId)!;
              newState.plans.set(newState.currentPlanId, {
                ...plan,
                status: 'completed',
                endTime: Date.now(),
              });
            }
            break;

          case 'tool_call_start':
            const taskId = message.data.tool_call_id;
            const existingTask = newState.tasks.get(taskId);
            if (existingTask) {
              newState.tasks.set(taskId, {
                ...existingTask,
                status: 'running',
                startTime: Date.now(),
              });
            } else {
              newState.tasks.set(taskId, {
                id: taskId,
                runId: newState.currentRunId,
                planId: newState.currentPlanId,
                title: message.data.tool_call_name || 'Processing',
                status: 'running',
                startTime: Date.now(),
              });
            }
            break;

          case 'tool_call_end':
            const finishedTaskId = message.data.tool_call_id;
            if (finishedTaskId && newState.tasks.has(finishedTaskId)) {
              const task = newState.tasks.get(finishedTaskId)!;
              newState.tasks.set(finishedTaskId, {
                ...task,
                status: 'completed',
                endTime: Date.now(),
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
            if (taskId && newState.tasks.has(taskId)) {
              const task = newState.tasks.get(taskId)!;
              newState.tasks.set(taskId, {
                ...task,
                toolCalls: message.tool_calls || [],
                status: message.success ? 'completed' : 'failed',
                error: message.reason || undefined,
              });
            }
            break;

          case 'tool_results':
            const resultsTaskId = message.step_id || message.id;
            if (resultsTaskId && newState.tasks.has(resultsTaskId)) {
              const task = newState.tasks.get(resultsTaskId)!;
              newState.tasks.set(resultsTaskId, {
                ...task,
                results: message.results || [],
                status: message.success ? 'completed' : 'failed',
                error: message.reason || undefined,
              });
            }
            break;

          case 'plan':
            const planId = message.id;
            if (planId && newState.plans.has(planId)) {
              const plan = newState.plans.get(planId)!;
              newState.plans.set(planId, {
                ...plan,
                steps: message.steps,
                status: 'completed',
                endTime: Date.now(),
              });
            }
            break;
        }
      }

      return newState;
    });
  }, []);

  const getCurrentRun = useCallback(() => {
    if (!state.currentRunId) return null;
    return state.runs.get(state.currentRunId) || null;
  }, [state.currentRunId, state.runs]);

  const getCurrentPlan = useCallback(() => {
    if (!state.currentPlanId) return null;
    return state.plans.get(state.currentPlanId) || null;
  }, [state.currentPlanId, state.plans]);

  const getCurrentTasks = useCallback(() => {
    return Array.from(state.tasks.values()).filter(task =>
      task.runId === state.currentRunId
    );
  }, [state.tasks, state.currentRunId]);

  const getTaskById = useCallback((taskId: string) => {
    return state.tasks.get(taskId) || null;
  }, [state.tasks]);

  const getPlanById = useCallback((planId: string) => {
    return state.plans.get(planId) || null;
  }, [state.plans]);

  const getRunById = useCallback((runId: string) => {
    return state.runs.get(runId) || null;
  }, [state.runs]);

  const updateRun = useCallback((runId: string, updates: Partial<RunState>) => {
    setState(prevState => {
      const newState = { ...prevState };
      const existingRun = newState.runs.get(runId);
      if (existingRun) {
        newState.runs.set(runId, { ...existingRun, ...updates });
      }
      return newState;
    });
  }, []);

  const updatePlan = useCallback((planId: string, updates: Partial<PlanState>) => {
    setState(prevState => {
      const newState = { ...prevState };
      const existingPlan = newState.plans.get(planId);
      if (existingPlan) {
        newState.plans.set(planId, { ...existingPlan, ...updates });
      }
      return newState;
    });
  }, []);

  const updateTask = useCallback((taskId: string, updates: Partial<TaskState>) => {
    setState(prevState => {
      const newState = { ...prevState };
      const existingTask = newState.tasks.get(taskId);
      if (existingTask) {
        newState.tasks.set(taskId, { ...existingTask, ...updates });
      }
      return newState;
    });
  }, []);

  const clearAllStates = useCallback(() => {
    setState({
      runs: new Map(),
      plans: new Map(),
      tasks: new Map(),
    });
  }, []);

  const clearRun = useCallback((runId: string) => {
    setState(prevState => {
      const newState = { ...prevState };
      newState.runs.delete(runId);

      // Clear related plans and tasks
      for (const [planId, plan] of newState.plans) {
        if (plan.runId === runId) {
          newState.plans.delete(planId);
        }
      }

      for (const [taskId, task] of newState.tasks) {
        if (task.runId === runId) {
          newState.tasks.delete(taskId);
        }
      }

      return newState;
    });
  }, []);

  return {
    state,
    getCurrentRun,
    getCurrentPlan,
    getCurrentTasks,
    getTaskById,
    getPlanById,
    getRunById,
    updateRun,
    updatePlan,
    updateTask,
    processMessage,
    clearAllStates,
    clearRun,
  };
} 