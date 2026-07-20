import type { DistriChatMessage, DistriMessage, DistriPart, TaskSummary, ToolResult } from '@distri/core';
import type { ToolCallState } from '../stores/chatStateStore';
import type { Cassette, ReplayState, ReplayWorkflow, UiMutation } from './types';

/** Stable synthetic timestamp, the reducer must stay pure (no Date.now()). */
const BASE_TS = 0;

function textPart(data: string): DistriPart {
  return { part_type: 'text', data };
}

/**
 * Derive the full renderable state of a run at time `t`.
 *
 * Pure and deterministic: the same (cassette, t) always yields equal state.
 * This is what makes scrubbing, seeking and unit-testing possible.
 */
export function replayStateAt(cassette: Cassette, t: number): ReplayState {
  const messages: DistriChatMessage[] = [];
  const toolCalls = new Map<string, ToolCallState>();
  const uiMutations: UiMutation[] = [];
  const taskSummaries = new Map<string, TaskSummary>();
  let workflow: ReplayWorkflow | null = null;

  /** The assistant message currently being streamed into, if any. */
  let current: DistriMessage | null = null;
  let done = false;

  /**
   * Monotonically increasing id sequence, local to this call. One turn can
   * now span several assistant messages (a `tool_calls` event closes the
   * current one), so `assistant-${turn}` would collide, every id-bearing
   * entry pushed to `messages` gets the next value instead. Derived purely
   * from iteration order over `cassette.events`, so it stays deterministic:
   * the same (cassette, t) always assigns the same ids.
   */
  let seq = 0;
  const nextId = (prefix: string) => `${prefix}-${seq++}`;

  const openAssistant = (): DistriMessage => {
    if (current) return current;
    const msg: DistriMessage = {
      id: nextId('assistant'),
      role: 'assistant',
      parts: [],
      created_at: BASE_TS,
      agent_id: cassette.agentId,
    };
    messages.push(msg);
    current = msg;
    return msg;
  };

  for (const event of cassette.events) {
    if (event.t > t) break;

    switch (event.kind) {
      case 'user_message': {
        current = null;
        messages.push({
          id: nextId('user'),
          role: 'user',
          parts: [textPart(event.text)],
          created_at: BASE_TS,
        });
        break;
      }

      case 'text_delta': {
        const msg = openAssistant();
        const last = msg.parts[msg.parts.length - 1];
        if (last && last.part_type === 'text') {
          msg.parts[msg.parts.length - 1] = textPart(last.data + event.text);
        } else {
          msg.parts.push(textPart(event.text));
        }
        break;
      }

      case 'reasoning_delta':
        // Recorded for Phase 4 (reasoning surfaces); not rendered in Phase 1.
        break;

      case 'tool_call': {
        const msg = openAssistant();
        msg.parts.push({
          part_type: 'tool_call',
          data: { tool_call_id: event.id, tool_name: event.name, input: { ...event.args } },
        });
        toolCalls.set(event.id, {
          tool_call_id: event.id,
          tool_name: event.name,
          input: { ...event.args },
          status: 'running',
        });

        // `AssistantMessageRenderer` only renders text/image parts of a
        // `DistriMessage`, the `tool_call` part above is inert for display.
        // `@distri/react`'s `ToolExecutionRenderer` only paints a card in
        // response to a `tool_calls` `DistriEvent` sitting in the `messages`
        // array (it reads live status from the `toolCalls` map keyed by
        // `tool_call_id`, populated above). Emit one such event per cassette
        // `tool_call`, preserving the interleave of separate calls.
        //
        // `id` isn't part of `ToolCallsEvent`'s shape, so this event carries
        // no id of its own, `ChatMessageList` keys entries by their index
        // in `messages`, not by an id field, so this doesn't affect React
        // key stability.
        messages.push({
          type: 'tool_calls',
          data: {
            tool_calls: [{ tool_call_id: event.id, tool_name: event.name, input: { ...event.args } }],
          },
        });

        // Close the assistant message so a subsequent `text_delta` opens a
        // NEW one after this event, instead of accumulating into the
        // message sitting before it in `messages`, which would re-order
        // narrated text ahead of the tool call it actually followed.
        current = null;
        break;
      }

      case 'tool_result': {
        const existing = toolCalls.get(event.id);
        if (!existing) break;
        const result: ToolResult = {
          tool_call_id: event.id,
          tool_name: existing.tool_name,
          parts: [textPart(event.result)],
        };
        toolCalls.set(event.id, {
          ...existing,
          status: event.error ? 'error' : 'completed',
          result,
          error: event.error,
        });
        break;
      }

      case 'user_tool_input': {
        // Same status-flip mechanism as `tool_result`: `InteractiveToolCard`'s
        // built-in cards (ConfirmCard/FormToolCard/InlineQuestion) gate their
        // "resolved" view purely on `state.status === 'completed'`, so this
        // is enough to make a HITL card visibly resolve at this event's `t`.
        const existing = toolCalls.get(event.id);
        if (!existing) break;
        const result: ToolResult = {
          tool_call_id: event.id,
          tool_name: existing.tool_name,
          parts: [textPart(event.response)],
        };
        toolCalls.set(event.id, {
          ...existing,
          status: 'completed',
          result,
        });
        break;
      }

      case 'ui_mutation':
        uiMutations.push({
          method: event.method,
          args: [...event.args],
          ...(event.target !== undefined ? { target: Array.isArray(event.target) ? [...event.target] : event.target } : {}),
        });
        break;

      case 'task_summary': {
        const existing = taskSummaries.get(event.task.id);
        taskSummaries.set(event.task.id, {
          thread_id: cassette.id,
          parent_task_id: null,
          status: 'running',
          created_at: BASE_TS,
          updated_at: BASE_TS,
          preview: null,
          last_event_at: BASE_TS,
          ...existing,
          ...event.task,
        });
        break;
      }

      case 'workflow_step': {
        if (!workflow) {
          workflow = { id: cassette.id, workflow_type: 'replay', status: 'running', steps: [] };
        }
        const idx = workflow.steps.findIndex((s) => s.id === event.step.id);
        const merged = idx >= 0
          ? { ...workflow.steps[idx], ...event.step }
          : { label: event.step.id, status: 'pending' as const, ...event.step };
        if (idx >= 0) {
          workflow.steps[idx] = merged;
        } else {
          workflow.steps.push(merged);
        }
        break;
      }

      case 'done':
        done = true;
        break;
    }
  }

  return {
    messages,
    toolCalls,
    uiMutations,
    taskSummaries: [...taskSummaries.values()],
    workflow,
    isStreaming: !done && t < cassette.durationMs,
  };
}
