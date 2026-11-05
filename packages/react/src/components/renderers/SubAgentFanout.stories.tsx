/**
 * A lead hands three lessons to helpers at once. The same recorded frames,
 * drawn with the chat's defaults and with `groupToolCalls="run"` plus teacher
 * labels. Helper names and times come from the frame fields (`title`,
 * `agent_id`, `status.timestamp`); the card sits under the call that started it.
 */
import { useMemo } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import type { DistriChatMessage, DistriEvent } from '@distri/core';
import { ChatMessageList, ChatStoreContext, createChatStore } from '@distri/react';

const ev = (e: unknown) => e as DistriEvent
// Seven seconds into the run, so the unfinished helper reads as running.
const T0 = Date.now() - 9000
const LABELS = {
  invoke_agent: 'Handing lessons to helpers',
  lookup_reference: 'Looked up references',
  check_game: 'Checked the game',
  edit_lesson: 'Wrote the lesson',
}

function helper(id: string, title: string, start: number, end: number | null, failed = false) {
  const link = { taskId: id, parentTaskId: 'lead', parentToolCallId: 'inv', title, agentId: 'zippy_lesson' }
  const call = (cid: string, name: string, t: number) => ev({
    type: 'tool_calls', ...link, timestamp: T0 + t * 1000,
    data: { tool_calls: [{ tool_call_id: `${id}-${cid}`, tool_name: name, input: {} }] },
  })
  const result = (cid: string, name: string, ok: boolean, t: number) => ev({
    type: 'tool_results', ...link, timestamp: T0 + t * 1000,
    data: { results: [{ tool_call_id: `${id}-${cid}`, tool_name: name, parts: [{ part_type: 'data', data: ok ? { success: true, result: 'ok' } : { success: false, error: 'a blank has no answer' } }] }] },
  })
  return [
    ev({ type: 'run_started', ...link, timestamp: T0 + start * 1000, data: { taskId: id } }),
    call('r1', 'lookup_reference', start + 1), result('r1', 'lookup_reference', true, start + 2),
    call('g1', 'check_game', start + 3), result('g1', 'check_game', !failed, start + 4),
    ...(end === null ? [] : [ev({ type: 'run_finished', ...link, timestamp: T0 + end * 1000, data: { taskId: id, success: !failed } })]),
  ]
}

function seeded() {
  const store = createChatStore()
  const feed: DistriEvent[] = [
    ev({ type: 'run_started', taskId: 'lead', timestamp: T0, data: { taskId: 'lead' } }),
    ev({ type: 'tool_calls', taskId: 'lead', timestamp: T0 + 1000, data: { tool_calls: [
      { tool_call_id: 'inv', tool_name: 'invoke_agent', input: {} },
    ] } }),
    ...helper('a', 'Newton’s first law', 2, 8),
    ...helper('b', 'Force and acceleration', 2, null),
    ...helper('c', 'Friction on a ramp', 2, 7, true),
  ]
  for (const e of feed) store.getState().processMessage(e, true)
  const user = { id: 'u1', role: 'user', parts: [{ part_type: 'text', data: 'Write the Forces and motion course' }], created_at: 1, taskId: 'lead' }
  store.setState({ messages: [user as never, ...store.getState().messages] })
  return store
}

function Column({ title, grouped }: { title: string; grouped: boolean }) {
  const store = useMemo(seeded, [])
  return (
    <ChatStoreContext.Provider value={store}>
      <div className="w-[440px] space-y-3 rounded-lg border border-border p-3">
        <div className="text-[11px] font-semibold uppercase text-muted-foreground">{title}</div>
        <ChatMessageList
          messages={store.getState().messages as DistriChatMessage[]}
          {...(grouped ? { groupToolCalls: 'run' as const, toolLabels: LABELS } : {})}
        />
      </div>
    </ChatStoreContext.Provider>
  )
}

const meta: Meta = { title: 'Tasks/SubAgentFanout', parameters: { layout: 'padded' } }
export default meta

export const Default: StoryObj = { render: () => <Column title="Fan-out run" grouped={false} /> }
export const Grouped: StoryObj = { render: () => <Column title="Fan-out run, grouped with labels" grouped={true} /> }
export const Both: StoryObj = {
  render: () => (
    <div className="flex gap-6">
      <Column title="Defaults" grouped={false} />
      <Column title="groupToolCalls=run + labels" grouped={true} />
    </div>
  ),
}
