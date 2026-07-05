/**
 * Task-grouped chat rendering — before/after. A parent run forks a background
 * drafter; the stream relays the child's messages onto the same thread. The
 * "flat" column (old behavior) interleaves the fork's activity with the
 * parent's; the "grouped" column (current Chat behavior) filters child-task
 * messages out of the flat flow — they render inside their SubTaskCard via
 * SubTaskTree. Uses the SAME helpers Chat uses (childTaskIdSet /
 * isChildTaskMessage) plus the real MessageRenderer + SubTaskTree.
 */
import { useMemo } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import type { DistriMessage } from '@distri/core';
import { ChatStoreContext, createChatStore, MessageRenderer, SubTaskTree } from '@distri/react';
import { childTaskIdSet, isChildTaskMessage } from './taskGrouping';
import { mergeTaskSummaries } from '../../useBackgroundTasks';

const ROOT = 'root-task'
const FORK = 'fork-scene-s3'

type Stamped = DistriMessage & { taskId?: string }

let seq = 0
const msg = (role: 'user' | 'assistant', text: string, taskId?: string): Stamped => ({
  id: `m${++seq}`,
  role,
  parts: [{ part_type: 'text', data: text }],
  created_at: 1700000000000 + seq * 1000,
  ...(taskId ? { taskId } : {}),
}) as Stamped

// The relayed stream, in arrival order — parent and child interleaved.
const MESSAGES: Stamped[] = [
  msg('user', 'Generate ALL draft scenes now — fan out background drafters per scene.'),
  msg('assistant', 'Forking a drafter for scenes/s3.tsx (mode: background)…', ROOT),
  msg('user', 'Write scenes/s3.tsx. Beat: an entire class graded in minutes.', FORK),
  msg('assistant', "import { useCurrentFrame, useVideoConfig, spring } from 'blinkjs' … // (drafter's final code)", FORK),
  msg('assistant', 'Harvested s3 — writing scenes/s3.tsx, then validating.', ROOT),
  msg('assistant', 'Done: s3 written and validate is clean.', ROOT),
]

function seededStore() {
  const store = createChatStore()
  mergeTaskSummaries(store, [
    { id: ROOT, thread_id: 't', parent_task_id: null, status: 'completed', created_at: 1, updated_at: 2, preview: 'Generate ALL draft scenes', last_event_at: 2 },
    { id: FORK, thread_id: 't', parent_task_id: ROOT, status: 'completed', created_at: 1, updated_at: 2, preview: 'drafter: scenes/s3.tsx', last_event_at: 2 },
  ])
  store.setState({ messages: MESSAGES as never })
  return store
}

function Column({ grouped }: { grouped: boolean }) {
  const store = useMemo(seededStore, [])
  const childIds = childTaskIdSet(store.getState().tasks)
  const shown = grouped ? MESSAGES.filter((m) => !isChildTaskMessage(m, childIds)) : MESSAGES
  return (
    <ChatStoreContext.Provider value={store}>
      <div className="w-[440px] space-y-3 rounded-lg border border-border p-3">
        <div className="text-[11px] font-semibold uppercase text-muted-foreground">
          {grouped ? 'Grouped (current): forks live in their card' : 'Flat (old): fork activity interleaves'}
        </div>
        {shown.map((m, i) => (
          <MessageRenderer key={m.id} message={m} index={i} />
        ))}
        {grouped && <SubTaskTree rootTaskId={ROOT} />}
      </div>
    </ChatStoreContext.Provider>
  )
}

const meta: Meta = { title: 'Tasks/GroupedChatColumn', parameters: { layout: 'padded' } }
export default meta

export const BeforeAndAfter: StoryObj = {
  render: () => (
    <div className="flex gap-6">
      <Column grouped={false} />
      <Column grouped={true} />
    </div>
  ),
}

export const GroupedOnly: StoryObj = {
  render: () => <Column grouped={true} />,
}
