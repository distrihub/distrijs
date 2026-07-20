import { InteractiveToolCard } from '../components/renderers/tools/InteractiveToolCard';
import type { RenderingMode, ToolRendererMap } from '../types';
import type { ToolCallState } from '../stores/chatStateStore';
import type { Cassette } from './types';
import type { Checkpoint } from './useReplay';

/**
 * Builds `toolRenderers` entries that route the given tool names to the real
 * `InteractiveToolCard` (the component the live product actually renders for
 * `confirm`/`approval_*`/field-based tools), wired with a working `onComplete`.
 *
 * `ChatMessageList`'s default `ToolExecutionRenderer` never receives a real
 * `onToolComplete` (there's no backend to send a result to), so a bare
 * `InteractiveToolCard` reached through the built-in dispatch would have its
 * Approve/Submit/Answer buttons silently do nothing. Here `onComplete` instead
 * resolves the matching checkpoint — seeking the replay to this tool call's
 * scripted `user_tool_input.t` and resuming playback — so a real click
 * resolves the card exactly like letting the scrubber pass that timestamp
 * does, and (when `autoAccept` is off) also un-pauses a run that was
 * blocked waiting for exactly this click. One code path for both the
 * scripted and the interactive resolution, and the reducer stays the single
 * source of truth for `ToolCallState` (no local override state to keep in sync).
 */
export function makeInteractiveToolRenderers(
  toolNames: string[],
  cassette: Cassette,
  resolveCheckpoint: (checkpoint: Checkpoint) => void,
  rendering: RenderingMode = 'rich',
): ToolRendererMap {
  const resolveAt = new Map<string, number>();
  for (const event of cassette.events) {
    if (event.kind === 'user_tool_input') resolveAt.set(event.id, event.t);
  }

  const map: ToolRendererMap = {};
  for (const name of toolNames) {
    map[name] = ({ toolCall, state }) => {
      const resolvedState: ToolCallState = state ?? {
        tool_call_id: toolCall.tool_call_id,
        tool_name: toolCall.tool_name,
        input: toolCall.input,
        status: 'running',
      };
      return (
        <InteractiveToolCard
          toolCall={toolCall}
          state={resolvedState}
          rendering={rendering}
          onComplete={() => {
            const t = resolveAt.get(toolCall.tool_call_id);
            if (t !== undefined) resolveCheckpoint({ toolCallId: toolCall.tool_call_id, appearsAt: t, resolveAt: t });
          }}
        />
      );
    };
  }
  return map;
}
