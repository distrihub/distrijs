import { createStore, StoreApi } from 'zustand/vanilla';
import { useStore } from 'zustand';
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
  TextPart,
  TodoChange,
  TodoItem,
  TodosUpdatedEvent,
  createSuccessfulToolResult,
  createFailedToolResult,
  ContextBudget,
  ContextCompactionEvent,
} from '@distri/core';
import { DistriAnyTool, DistriUiTool, ToolCallStatus, RenderingMode, ChatSessionSettings } from '../types';
import { StreamingIndicator } from '@/components/renderers/ThinkingRenderer';
import { DefaultToolActions } from '../components/renderers/tools/DefaultToolActions';
import React, { createContext, useContext } from 'react';

// State types
export interface TaskState {
  id: string;          // This is the taskId from AgentEvent
  runId?: string;      // This is the runId from AgentEvent
  planId?: string;     // Associated plan ID (generated locally)
  /**
   * Parent task in the dispatch tree. Set when this task was created via
   * a sub-agent dispatch (run_skill / call_agent fork|in_process|offload).
   * `undefined` for the root task. Populated from `event.parentTaskId` on
   * the first event that mentions this task.
   */
  parentTaskId?: string;
  /**
   * Direct children in the dispatch tree, keyed by taskId. Maintained
   * idempotently: each new child task pushes itself in the first time it
   * appears. Used by selectors that need to walk the tree (collapsed
   * sub-agent cards, scoped cleanup, etc.).
   */
  childTaskIds: string[];
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
  /**
   * Task that emitted this tool call. Set from `event.taskId` at insert
   * time. Lets per-task cleanup (run_finished handler) scope itself to
   * the right tool calls instead of wiping every pending entry — which
   * is what was masking sub-agent stuck states (fork-2 db_get pending,
   * fork-1 RunFinished arrives, browser store flips it to completed).
   */
  taskId?: string;
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

  // Verbosity mode for tool display
  verbose: boolean;
  audioEnabled: boolean;
  rendering: RenderingMode;

  // Task/Plan/Step state
  tasks: Map<string, TaskState>;
  plans: Map<string, PlanState>;
  steps: Map<string, StepState>;
  toolCalls: Map<string, ToolCallState>;
  currentRunId?: string;    // From AgentEvent runId
  currentTaskId?: string;   // From A2A status-update taskId - this is what we send back
  currentPlanId?: string;   // Generated locally
  currentAgentId?: string;  // Current executing agent (changes on handover)
  /**
   * **Live** messages only — optimistic user messages from `sendMessage`
   * and assistant messages/events arriving on the current stream. The
   * thread's *persisted* history is NOT loaded here; the server already
   * loads it from its own DB when building the planner's context (see
   * `distri/server/distri-core/src/agent/context.rs::collect_top_level_message_history`),
   * and the client just renders it alongside this live buffer
   * (`useChat` returns `[...initialMessages, ...messages]`). Keeping the
   * two streams separate is what prevents a returning history fetch from
   * clobbering an in-flight optimistic user message.
   */
  messages: DistriChatMessage[];

  // Streaming indicator state
  streamingIndicator: StreamingIndicator | undefined;
  currentThought?: string;  // Current thought content from agent_response blocks

  // Tool execution state
  agent?: Agent;

  externalTools?: DistriAnyTool[];
  wrapOptions?: { autoExecute?: boolean };

  // Browser session state (iframe connects directly to browsr)
  browserSessionId?: string;
  browserViewerUrl?: string;
  browserStreamUrl?: string;

  // Todos state
  todos: TodoItem[];
  /**
   * Per-call diff from the latest `write_todos` invocation. Lets the
   * UI surface "Just changed: X" without re-rendering the whole list.
   * Reset to `[]` whenever todos are cleared.
   */
  lastTodoChanges: TodoChange[];

  /** Latest `ContextBudget` from a `context_budget_update` event. */
  contextBudget?: ContextBudget;
  /** Whether the latest budget update crossed the warning threshold (≥80%). */
  contextWarning?: boolean;
  /** Whether the latest budget update crossed the critical threshold (≥90%). */
  contextCritical?: boolean;
  /**
   * Compaction events received this session, in arrival order. Capped at
   * 50 entries to bound memory on long-lived chats. Used by
   * `<ContextIndicator />` to show "Compacted N times" and surface a recent
   * before/after slot in the breakdown popover.
   */
  compactionEvents: CompactionLogEntry[];
  /**
   * Set while a `compaction_requested` event is in flight; cleared by the
   * matching `context_compaction` arrival or by `useChat().compact()`'s
   * failure handler. Drives the 'Compacting…' UI in `<ContextUsagePanel />`.
   */
  isCompacting?: boolean;
}

export interface CompactionLogEntry {
  ts: number;
  before: number;
  after: number;
  tier: ContextCompactionEvent['tier'];
  source: 'auto' | 'manual';
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
  setVerbose: (verbose: boolean) => void;
  setSessionSettings: (settings: Partial<ChatSessionSettings>) => void;

  // Streaming indicator actions
  setStreamingIndicator: (indicator: StreamingIndicator | undefined) => void;
  setCurrentThought: (thought: string | undefined) => void;
  setBrowserSession: (sessionId: string, viewerUrl?: string, streamUrl?: string) => void;
  clearBrowserSession: () => void;

  // Todos actions
  setTodos: (todos: TodoItem[]) => void;
  /** Replace `lastTodoChanges` with the diff from the latest call. */
  setLastTodoChanges: (changes: TodoChange[]) => void;

  // State actions
  addMessage: (message: DistriChatMessage) => void;
  processMessage: (message: DistriChatMessage, isFromStream?: boolean) => void;
  clearAllStates: () => void;
  clearTask: (taskId: string) => void;
  getToolByName: (toolName: string) => ChatStateTool | undefined;
  completeRunningSteps: () => void;
  resetStreamingStates: () => void;

  // Tool call management
  initToolCall: (toolCall: ToolCall, timestamp?: number, isFromStream?: boolean, taskId?: string) => void;
  updateToolCallStatus: (toolCallId: string, status: Partial<ToolCallState>) => void;
  getToolCallById: (toolCallId: string) => ToolCallState | null;
  getPendingToolCalls: () => ToolCallState[];
  getCompletedToolCalls: () => ToolCallState[];
  completeTool: (toolCall: ToolCall, result: ToolResult) => Promise<void>;
  executeTool: (toolCall: ToolCall, distriTool: DistriAnyTool) => void;
  hasPendingToolCalls: () => boolean;
  failAllPendingToolCalls: (errorMessage: string) => void;
  clearToolResults: () => void;
  getExternalToolResponses: () => ToolResult[];

  // Getters
  getCurrentTask: () => TaskState | null;
  getCurrentPlan: () => PlanState | null;
  getCurrentTasks: () => TaskState[];
  getTaskById: (taskId: string) => TaskState | null;
  /**
   * Walk the dispatch tree rooted at `rootId` (depth-first, parent before
   * children). Returns the root + all descendants in encounter order.
   * Used by sub-agent renderers and any state-snapshot view.
   */
  getTaskTree: (rootId: string) => TaskState[];
  getToolCallsByTaskId: (taskId: string) => ToolCallState[];
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

/**
 * The vanilla store instance type. Each `<Chat>` / `useChat` owns its own
 * instance (see `createChatStore`), so conversation state never leaks across
 * threads, remounts, or sibling chats.
 */
export type ChatStore = StoreApi<ChatStateStore>;

/**
 * Factory for a fresh, isolated chat-state store. Replaces the old
 * module-level singleton: state (messages, streaming flags, tasks, todos,
 * browser session, …) now lives for exactly as long as the owning chat
 * instance. Remounting `<Chat key={threadId}>` constructs a new store, so the
 * previous thread's messages and `isStreaming`/`isLoading` flags are gone by
 * construction — no manual `clearAllStates()` required by consumers.
 */
export function createChatStore(): ChatStore {
  // Per-instance dedup guard: prevents duplicate completion posts when React
  // StrictMode double-invokes handlers. Scoped to this store so two chats
  // can't suppress each other's tool completions.
  const completingToolCallIds = new Set<string>();

  return createStore<ChatStateStore>((set, get) => ({
  isStreaming: false,
  isLoading: false,
  error: null,
  debug: false,
  verbose: false,
  audioEnabled: false,
  rendering: 'minimal' as RenderingMode,
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
  browserSessionId: undefined,
  browserViewerUrl: undefined,
  browserStreamUrl: undefined,
  todos: [],
  lastTodoChanges: [],
  contextBudget: undefined,
  contextWarning: false,
  contextCritical: false,
  compactionEvents: [],
  isCompacting: false,
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
  setVerbose: (verbose: boolean) => {
    set({ verbose });
  },

  setSessionSettings: (settings) =>
    set((state) => {
      const updates: Partial<typeof state> = {};
      if (settings.verbose !== undefined) {
        updates.verbose = settings.verbose;
        updates.rendering = settings.verbose ? 'rich' : 'minimal';
      }
      if (settings.rendering !== undefined) {
        updates.rendering = settings.rendering;
      }
      if (settings.audioEnabled !== undefined) {
        updates.audioEnabled = settings.audioEnabled;
      }
      return updates;
    }),

  setStreamingIndicator: (indicator: StreamingIndicator | undefined) => {
    set({ streamingIndicator: indicator });
  },

  setCurrentThought: (thought: string | undefined) => {
    set({ currentThought: thought });
  },

  setBrowserSession: (sessionId: string, viewerUrl?: string, streamUrl?: string) => {
    set({
      browserSessionId: sessionId,
      browserViewerUrl: viewerUrl,
      browserStreamUrl: streamUrl,
    });
  },

  clearBrowserSession: () => {
    set({
      browserSessionId: undefined,
      browserViewerUrl: undefined,
      browserStreamUrl: undefined,
    });
  },

  setTodos: (todos: TodoItem[]) => {
    set({ todos });
  },

  setLastTodoChanges: (changes: TodoChange[]) => {
    set({ lastTodoChanges: changes });
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

        if (event.type === 'browser_session_started') {
          return {
            ...state,
            browserSessionId: event.data.session_id,
            browserViewerUrl: event.data.viewer_url,
            browserStreamUrl: event.data.stream_url,
          };
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
            created_at: new Date().getTime(),
            step_id: stepId,
            is_final: isFinal,
            metadata: (event.data as { metadata?: Record<string, unknown> }).metadata,
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
            const textPartIndex = existingMessage.parts.findIndex(p => p.part_type === 'text');

            let updatedParts: DistriPart[];
            if (textPartIndex >= 0) {
              // Append delta to existing text part
              const existingTextPart = existingMessage.parts[textPartIndex] as TextPart;
              updatedParts = existingMessage.parts.map((part, idx) =>
                idx === textPartIndex
                  ? { part_type: 'text' as const, data: existingTextPart.data + delta }
                  : part
              );
            } else {
              // No existing text part, create one
              updatedParts = [...existingMessage.parts, { part_type: 'text' as const, data: delta }];
            }

            const updatedMessage = {
              ...existingMessage,
              parts: updatedParts
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
            'run_started', 'run_finished',
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

      // Maintain the parent ↔ child task tree on EVERY event that names a
      // task. Each AgentEvent envelope carries `taskId` and `parentTaskId`
      // (sub-agents include a parent; root tasks don't). The reducer is
      // idempotent — replays and live deliveries both converge to the
      // same shape.
      const eventTaskId = event.taskId;
      const eventParentTaskId = event.parentTaskId;
      if (eventTaskId) {
        const existingTask = get().tasks.get(eventTaskId);
        if (!existingTask) {
          get().updateTask(eventTaskId, {
            id: eventTaskId,
            parentTaskId: eventParentTaskId,
            childTaskIds: [],
            title: 'Agent Run',
            status: 'running',
            startTime: timestamp,
          });
        } else if (eventParentTaskId && !existingTask.parentTaskId) {
          // Backfill linkage if first event seen lacked parent info.
          get().updateTask(eventTaskId, { parentTaskId: eventParentTaskId });
        }
        if (eventParentTaskId) {
          const parent = get().tasks.get(eventParentTaskId);
          if (parent && !parent.childTaskIds.includes(eventTaskId)) {
            get().updateTask(eventParentTaskId, {
              childTaskIds: [...parent.childTaskIds, eventTaskId],
            });
          }
        }
      }

      switch (message.type) {
        case 'run_started':
          const runStartedEvent = event as RunStartedEvent;
          const runId = runStartedEvent.data.runId;
          const taskId = runStartedEvent.data.taskId ?? eventTaskId;

          if (isDebugEnabled) {
            console.log('🏪 run_started with IDs:', { runId, taskId, parent: eventParentTaskId });
          }

          if (taskId) {
            get().updateTask(taskId, {
              id: taskId,
              runId: runId,
              parentTaskId: eventParentTaskId ?? get().tasks.get(taskId)?.parentTaskId,
              title: 'Agent Run',
              status: 'running',
              startTime: timestamp,
              metadata: event.data,
            });
          }

          // currentTaskId is the ROOT task only. Sub-agent run_starts (with
          // parentTaskId set) MUST NOT overwrite it — otherwise the chat
          // input "send" routes to a fork's task and the fork's
          // run_finished closes streaming on the wrong task.
          const isRootRunStart = !eventParentTaskId;
          const shouldUpdateTaskId = isRootRunStart && !get().currentTaskId;

          set({
            currentRunId: runId,
            currentTaskId: shouldUpdateTaskId ? taskId : get().currentTaskId,
            currentAgentId: runStartedEvent.data.agentId || get().currentAgentId,
          });
          get().setStreamingIndicator('typing');
          set({ isStreaming: true });
          break;

        case 'run_finished':
          const runFinishedEvent = event as RunFinishedEvent;
          const finishedTaskId = runFinishedEvent.data.taskId ?? eventTaskId;
          const finishedIsRoot = !eventParentTaskId;

          // Update the specific task that finished
          if (finishedTaskId) {
            get().updateTask(finishedTaskId, {
              status: 'completed',
              endTime: timestamp,
            });
          }

          // Scope cleanup to THIS task's pending/running tool calls. Without
          // scoping, a sub-agent's run_finished would mark unrelated calls
          // (sibling forks, root-task pending external tools) as completed
          // — masking real waits and racing with the late ToolResult that
          // eventually arrives.
          if (finishedTaskId) {
            const currentToolCalls = get().toolCalls;
            let toolCallsChanged = false;
            currentToolCalls.forEach((tc) => {
              if (
                tc.taskId === finishedTaskId &&
                (tc.status === 'pending' || tc.status === 'running')
              ) {
                tc.status = 'completed';
                tc.endTime = Date.now();
                toolCallsChanged = true;
              }
            });
            if (toolCallsChanged) {
              set({ toolCalls: new Map(currentToolCalls) });
            }
          }

          // Only the ROOT run finishing means the wire stream is done and
          // the chat input should unlock. Sub-agent finishes are
          // intermediate — the parent is still running.
          if (finishedIsRoot) {
            // Flip any leftover `in_progress` todos to `done`. The run
            // is over, so no work is in flight — but agents don't always
            // emit a final write_todos closing the loop, so the
            // TodosCompact spinner would otherwise keep spinning forever
            // above the chat input.
            const finalTodos = get().todos.map(todo =>
              todo.status === 'in_progress' ? { ...todo, status: 'done' as const } : todo
            );

            // Clear the current run/task/plan IDs so the NEXT user message
            // is sent without a stale `task_id`. With a stale id the server
            // resumes the prior task — re-loading its scratchpad (full of
            // old `Action: …` lines) and re-driving any timed-out external
            // tool calls. distri-cli avoids this by always sending
            // task_id=None per turn (see distri-cli/src/chat.rs); useChat
            // now matches that contract by clearing here so the next
            // sendMessage hits the server with no task_id.
            set({
              isStreaming: false,
              isLoading: false,
              currentTaskId: undefined,
              currentRunId: undefined,
              currentPlanId: undefined,
              todos: finalTodos,
            });
            get().setStreamingIndicator(undefined);
            get().setCurrentThought(undefined);
          }
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

            // Clean up orphaned tool calls so the input unlocks
            const errorToolCalls = get().toolCalls;
            let errorToolCallsChanged = false;
            errorToolCalls.forEach((tc) => {
              if (tc.status === 'pending' || tc.status === 'running') {
                tc.status = 'error';
                tc.endTime = Date.now();
                errorToolCallsChanged = true;
              }
            });
            if (errorToolCallsChanged) {
              set({ toolCalls: new Map(errorToolCalls) });
            }

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
              taskId: eventTaskId,
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
            // Every tool_call belongs to the task that emitted the
            // event. Stamp `taskId` on the tool-call state at insert
            // time so per-task scoped operations (run_finished cleanup,
            // pending-call counts, sub-agent UIs) don't have to guess.
            const callsTaskId = eventTaskId;
            message.data.tool_calls.forEach(async (toolCall: ToolCall) => {
              if (get().toolCalls.has(toolCall.tool_call_id)) {
                console.log('🔁 Ignoring duplicate tool_call event', toolCall.tool_call_id);
                return;
              }
              get().initToolCall({
                tool_call_id: toolCall.tool_call_id,
                tool_name: toolCall.tool_name,
                input: toolCall.input,
              }, timestamp, isFromStream, callsTaskId);
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

        case 'agent_handover': {
          const handoverEvent = event as import('../../../core/src/events').AgentHandoverEvent;
          set({ currentAgentId: handoverEvent.data.to_agent });
          // Add a system-style message showing the handover
          const handoverMsg: DistriMessage = {
            id: `handover-${Date.now()}`,
            role: 'system',
            parts: [{
              part_type: 'text',
              data: `Transferring to **${handoverEvent.data.to_agent}**${handoverEvent.data.reason ? ` — ${handoverEvent.data.reason}` : ''}`,
            }],
            created_at: timestamp,
          };
          set((state) => ({ messages: [...state.messages, handoverMsg] }));
          break;
        }

        case 'todos_updated': {
          const todosEvent = event as TodosUpdatedEvent;
          if (todosEvent.data.todos) {
            get().setTodos(todosEvent.data.todos);
          }
          // `changes` is what UIs surface as "just changed". Empty
          // on the very first write_todos call (no prior list to
          // diff against). Always write — even an empty array is
          // meaningful, since it clears stale change indicators
          // from a previous turn.
          get().setLastTodoChanges(todosEvent.data.changes ?? []);
          break;
        }

        case 'context_budget_update': {
          const data: any = (event as any).data || {};
          set({
            contextBudget: data.budget as ContextBudget | undefined,
            contextWarning: !!data.is_warning,
            contextCritical: !!data.is_critical,
          });
          break;
        }

        case 'context_compaction': {
          const data: any = (event as any).data || {};
          // Prefer the wire-level timestamp so the badge reflects when
          // compaction ran on the server, not when the SSE event was
          // decoded on the client. Falls back to Date.now() for offline
          // / replay scenarios where the envelope is missing.
          const wireTs = Number((event as any).timestamp);
          const entry: CompactionLogEntry = {
            ts: Number.isFinite(wireTs) && wireTs > 0 ? wireTs : Date.now(),
            before: Number(data.tokens_before ?? 0),
            after: Number(data.tokens_after ?? 0),
            tier: (data.tier as ContextCompactionEvent['tier']) ?? 'trim',
            source: (data.source as 'auto' | 'manual') ?? 'auto',
          };
          set(state => ({
            // Cap the log to the last 50 entries — long-lived sessions
            // would otherwise grow it unboundedly and fan re-renders out
            // to every subscriber on each compaction.
            compactionEvents: [...state.compactionEvents, entry].slice(-50),
            // The compaction event also carries the post-compact budget snapshot.
            contextBudget: (data.context_budget as ContextBudget | undefined) ?? state.contextBudget,
            // A new compaction event resolves any in-flight 'compacting…' state.
            isCompacting: false,
          }));
          break;
        }

        case 'compaction_requested' as any: {
          // Pre-compaction signal — flip the in-flight flag so UIs can
          // render a 'compacting…' indicator until the matching
          // context_compaction event arrives.
          set({ isCompacting: true });
          break;
        }

        default:
          // Handle any other events
          break;
      }
    }
  },

  initToolCall: (toolCall: ToolCall, timestamp?: number, isFromStream: boolean = false, taskId?: string) => {
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
        taskId,
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
    const ownerTaskId = get().toolCalls.get(toolCall.tool_call_id)?.taskId;
    console.log('completeTool', toolCall.tool_call_id, { ownerTaskId, tool: toolCall.tool_name });

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
      console.error(`❌ Error completing tool ${toolCall.tool_name}:`, error);
      const errorMessage = error instanceof Error ? error.message : 'Tool completion failed';


      // Both attempts failed - mark as error and stop streaming
      get().updateToolCallStatus(toolCall.tool_call_id, {
        status: 'error',
        error: errorMessage,
        endTime: Date.now(),
      });

      // Fail all pending tool calls and stop the run
      get().failAllPendingToolCalls(`Tool completion failed: ${errorMessage}`);
      set({ isStreaming: false, isLoading: false, streamingIndicator: undefined });
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
          // Use React.createElement to properly render the component within React's context
          // Direct function calls (component({...})) break React hooks
          component = React.createElement(uiTool.component, {
            toolCall,
            toolCallState,
            completeTool: completeToolFn,
            tool: distriTool
          });
        } else if (distriTool?.type === 'function') {
          const fnTool = distriTool as DistriFnTool;
          // `autoExecute` flag is per-tool, not from global wrapOptions.
          fnTool.autoExecute = fnTool.autoExecute === true;

          const error = validateToolCallInput(toolCall);
          if (error) {
            throw new Error(error);
          }

          if (fnTool.autoExecute) {
            // Auto-executing fn tools (e.g. `db_put`, `init_content`,
            // `save_content`) should NOT attach a component — they
            // have nothing interactive to show, and pinning them to
            // `state.component` makes `ToolExecutionRenderer` defer
            // to `renderExternalToolCalls`, which then drops the row
            // once the call completes (status filter). The user
            // ends up seeing nothing in the chat even though the
            // trace recorded the call.
            //
            // Run the handler directly and feed the result back
            // through `completeTool` — this mirrors the logic that
            // used to live inside `DefaultToolActions`. With no
            // component attached, `ToolExecutionRenderer` falls
            // through to `MinimalToolRow` which renders the call
            // inline (and keeps rendering it after completion via
            // the persistent message in the messages array).
            //
            // GUARDS (these used to live in DefaultToolActions's
            // useEffects — preserving them here is the whole point of
            // not letting handlers fire on history replay or remount):
            //   1. `isLiveStream` — set on the state by `initToolCall`
            //      from the caller's `isFromStream` flag. Historical
            //      `tool_calls` events (page reload, navigating into
            //      an old thread) have `isLiveStream=false`. The handler
            //      already ran when the tool was originally streamed;
            //      re-firing it now POSTs a duplicate complete-tool the
            //      server rejects with 400 (the slot is already filled).
            //   2. status already settled — defends against any other
            //      path that calls `executeTool` after the store has
            //      a result. If the call is `running`/`completed`/`error`,
            //      the handler has either run or is in flight.
            const justInitedState = get().toolCalls.get(toolCall.tool_call_id);
            const isLive = !!justInitedState?.isLiveStream;
            const settled =
              justInitedState?.status === 'running' ||
              justInitedState?.status === 'completed' ||
              justInitedState?.status === 'error';
            if (!isLive || settled) {
              // Skip handler. Do NOT attach a component — the call
              // still renders via MinimalToolRow because the
              // `tool_calls` event lives in `messages` regardless.
            } else {
              (async () => {
                try {
                  const handlerResult = await fnTool.handler(toolCall.input);
                  if (!fnTool.is_final) {
                    completeToolFn(
                      createSuccessfulToolResult(
                        toolCall.tool_call_id,
                        toolCall.tool_name,
                        handlerResult,
                        undefined,
                        { stopAfterTurn: fnTool.stopAfterTurn },
                      ),
                    );
                  }
                } catch (handlerError) {
                  const errMsg = handlerError instanceof Error
                    ? handlerError.message
                    : String(handlerError);
                  completeToolFn(
                    createFailedToolResult(
                      toolCall.tool_call_id,
                      toolCall.tool_name,
                      errMsg,
                      'Tool execution failed',
                    ),
                  );
                }
              })();
            }
          } else {
            // Confirm-required fn tool — show the actions UI.
            // DefaultToolActions handles its own pending → running →
            // completed lifecycle and remount semantics.
            component = React.createElement(DefaultToolActions, {
              toolCall,
              toolCallState: get().toolCalls.get(toolCall.tool_call_id),
              completeTool: completeToolFn,
              tool: fnTool,
            });
          }
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

  failAllPendingToolCalls: (errorMessage: string) => {
    set((state: ChatState) => {
      const newToolCalls = new Map(state.toolCalls);
      newToolCalls.forEach((toolCall, id) => {
        if (toolCall.status === 'pending' || toolCall.status === 'running') {
          newToolCalls.set(id, {
            ...toolCall,
            status: 'error',
            error: errorMessage,
            resultSent: true, // Mark as processed so it doesn't block
          });
        }
      });
      return { ...state, toolCalls: newToolCalls };
    });
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
      browserSessionId: undefined,
      browserViewerUrl: undefined,
      browserStreamUrl: undefined,
      todos: [],
      lastTodoChanges: [],
      contextBudget: undefined,
      contextWarning: false,
      contextCritical: false,
      compactionEvents: [],
      isCompacting: false,
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

      // If we're clearing the currently-tracked task, also drop its
      // context-budget snapshot and compaction log — leaving them would
      // render stale numbers for the next task on the same thread.
      if (state.currentTaskId === taskId) {
        newState.contextBudget = undefined;
        newState.contextWarning = false;
        newState.contextCritical = false;
        newState.compactionEvents = [];
        newState.isCompacting = false;
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

  getTaskTree: (rootId: string) => {
    const state = get();
    const out: TaskState[] = [];
    const seen = new Set<string>();
    const walk = (id: string) => {
      if (seen.has(id)) return;
      seen.add(id);
      const t = state.tasks.get(id);
      if (!t) return;
      out.push(t);
      for (const childId of t.childTaskIds) walk(childId);
    };
    walk(rootId);
    return out;
  },

  getToolCallsByTaskId: (taskId: string) => {
    const state = get();
    const out: ToolCallState[] = [];
    state.toolCalls.forEach((tc) => {
      if (tc.taskId === taskId) out.push(tc);
    });
    return out;
  },

  getPlanById: (planId: string) => {
    const state = get();
    return state.plans.get(planId) || null;
  },

  updateTask: (taskId: string, updates: Partial<TaskState>) => {
    set((state: ChatState) => {
      const existingTask = state.tasks.get(taskId);
      const taskToUpdate: TaskState = existingTask || {
        id: taskId,
        title: updates.title ?? 'Task',
        status: updates.status ?? 'pending',
        childTaskIds: [],
        toolCalls: [],
        results: [],
      };
      // Copy-on-write: mutating the Map in place kept the same reference, so
      // zustand selectors (SubTaskTree, task monitors) never re-rendered on
      // live task updates — sub-task cards stayed frozen at mount.
      const tasks = new Map(state.tasks);
      tasks.set(taskId, { ...taskToUpdate, ...updates });
      return { ...state, tasks };
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
}

// ---------------------------------------------------------------------------
// Per-instance store wiring (React context)
//
// The store is no longer a module singleton. `useChat` creates one via
// `createChatStore()` and publishes it through this context; `<Chat>` wraps its
// renderer subtree in the provider. Components read reactive slices through the
// `useChatStateStore(selector)` hook below — same call signature as before, so
// every existing `useChatStateStore(s => s.x)` call site is unchanged; only the
// source (module global → nearest provider) differs.
// ---------------------------------------------------------------------------

export const ChatStoreContext = createContext<ChatStore | null>(null);

/**
 * Returns the raw vanilla store for the nearest `<Chat>` / `useChat`. Use for
 * imperative access (`getState()`, `setState()`, `subscribe()`). Throws when
 * called outside a chat subtree — there is no global fallback by design.
 */
export function useChatStoreApi(): ChatStore {
  const store = useContext(ChatStoreContext);
  if (!store) {
    throw new Error('useChatStoreApi must be used within a <Chat> / useChat subtree (ChatStoreContext is missing).');
  }
  return store;
}

/**
 * Reactive selector hook bound to the nearest chat store. Drop-in replacement
 * for the former global `useChatStateStore` — identical `(selector) => slice`
 * signature.
 */
export function useChatStateStore<T>(selector: (state: ChatStateStore) => T): T {
  const store = useChatStoreApi();
  return useStore(store, selector);
}


const validateToolCallInput = (toolCall: ToolCall): string | null => {
  const notValidJson = 'Input is not a valid JSON string or object';
  if (toolCall.input === undefined || toolCall.input === null) {
    toolCall.input = {};
    return null;
  }
  if (typeof toolCall.input === 'string') {
    if (toolCall.input.trim() === '') {
      toolCall.input = {};
      return null;
    }
    try {
      JSON.parse(toolCall.input);
      return null;
    } catch {
      return notValidJson;
    }
  }
  return typeof toolCall.input === 'object' ? null : notValidJson;
}
