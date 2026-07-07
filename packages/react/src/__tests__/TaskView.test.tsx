import { describe, it, expect, vi, afterEach } from 'vitest'
import React from 'react'
import { render, screen, waitFor, cleanup } from '@testing-library/react'
import type { Agent, DistriChatMessage } from '@distri/core'
import { TaskView } from '../components/TaskView'

/**
 * The read-only surface renders streamed messages with the standard renderers
 * and never shows a composer.
 */

const TASK = 't1'

const evt = (type: string, data: Record<string, unknown> = {}): DistriChatMessage =>
  ({ type, taskId: TASK, data } as unknown as DistriChatMessage)

function textStream(text: string): DistriChatMessage[] {
  return [
    evt('run_started', { taskId: TASK }),
    evt('text_message_start', { message_id: 'm1', role: 'assistant' }),
    evt('text_message_content', { message_id: 'm1', delta: text }),
    evt('text_message_end', { message_id: 'm1' }),
    evt('run_finished', { taskId: TASK }),
  ]
}

function makeAgent(log: DistriChatMessage[]): Agent {
  const resubscribe = vi.fn(async function* (_taskId: string) {
    for (const e of log) yield e
  })
  return { resubscribe } as unknown as Agent
}

afterEach(() => cleanup())

describe('<TaskView>', () => {
  it('streams the followed task into the transcript', async () => {
    const agent = makeAgent(textStream('read-only streamed answer'))

    render(<TaskView agent={agent} taskId={TASK} />)

    await waitFor(() => expect(screen.getByText(/read-only streamed answer/)).toBeInTheDocument())
  })

  it('renders no composer / text input (read-only)', async () => {
    const agent = makeAgent(textStream('no composer here'))

    const { container } = render(<TaskView agent={agent} taskId={TASK} />)

    await waitFor(() => expect(screen.getByText(/no composer here/)).toBeInTheDocument())
    expect(container.querySelector('textarea')).toBeNull()
    expect(container.querySelector('input[type="text"]')).toBeNull()
  })

  it('renders the empty state when there is nothing to show and disabled', () => {
    const agent = makeAgent([])
    render(
      <TaskView agent={agent} taskId={null} enabled={false} emptyState={<div>nothing yet</div>} />,
    )
    expect(screen.getByText('nothing yet')).toBeInTheDocument()
  })
})
