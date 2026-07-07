import { describe, it, expect, vi } from 'vitest'
import { Agent } from '../agent'
import { DistriClient } from '../distri-client'
import type { DistriChatMessage } from '../types'

/**
 * Read-only task following (Phase 1).
 *   - Agent.resubscribe(taskId)        → decodes A2A frames into DistriChatMessages
 *   - DistriClient.resubscribeTask(..) → wraps A2AClient.resubscribeTask (tasks/resubscribe)
 *
 * Agent.resubscribe is tested with an injected fake client so we exercise the
 * decode/error path directly, without the A2AClient's agent-card fetch.
 */

function makeAgent(client: unknown): Agent {
  const def: unknown = { name: 'test-agent' }
  return new Agent(def as never, client as DistriClient)
}

async function collect(gen: AsyncGenerator<DistriChatMessage>): Promise<DistriChatMessage[]> {
  const out: DistriChatMessage[] = []
  for await (const m of gen) out.push(m)
  return out
}

describe('Agent.resubscribe', () => {
  it('decodes A2A frames into DistriChatMessages and yields in order', async () => {
    const frames = [
      { kind: 'status-update', taskId: 't1', metadata: { type: 'run_started' } },
      { kind: 'message', messageId: 'm1', role: 'agent', parts: [{ kind: 'text', text: 'hi' }], taskId: 't1' },
      { kind: 'status-update', taskId: 't1', metadata: { type: 'run_finished' } },
    ]
    const resubscribeTask = vi.fn(async function* () { for (const f of frames) yield f })
    const agent = makeAgent({ resubscribeTask })

    const result = await collect(agent.resubscribe('t1'))

    expect(resubscribeTask).toHaveBeenCalledWith('test-agent', 't1', undefined)
    expect(result.map((r) => (r as { type?: string; role?: string }).type ?? (r as { role?: string }).role))
      .toEqual(['run_started', 'assistant', 'run_finished'])
    expect((result[0] as { taskId?: string }).taskId).toBe('t1')
  })

  it('skips frames that decode to null', async () => {
    const frames = [
      { kind: 'status-update', taskId: 't1', metadata: {} }, // no type → decodes to null
      { kind: 'status-update', taskId: 't1', metadata: { type: 'run_finished' } },
    ]
    const agent = makeAgent({ resubscribeTask: async function* () { for (const f of frames) yield f } })

    const result = await collect(agent.resubscribe('t1'))

    expect(result).toHaveLength(1)
    expect((result[0] as { type?: string }).type).toBe('run_finished')
  })

  it('converts a mid-stream error into a run_error event', async () => {
    const agent = makeAgent({
      resubscribeTask: async function* () {
        yield { kind: 'status-update', taskId: 't1', metadata: { type: 'run_started' } }
        throw new Error('boom')
      },
    })

    const result = await collect(agent.resubscribe('t1'))

    expect((result[0] as { type?: string }).type).toBe('run_started')
    expect((result[1] as { type?: string }).type).toBe('run_error')
    expect((result[1] as { data?: { message?: string } }).data?.message).toBe('boom')
  })
})

describe('DistriClient.resubscribeTask', () => {
  it('delegates to the agent A2A client with { id } and yields raw frames', async () => {
    const client = new DistriClient({
      baseUrl: 'http://localhost:9999/v1',
      headers: { Authorization: 'Bearer test-token' },
      retryAttempts: 0,
    })
    const frames = [{ kind: 'status-update', taskId: 't1', metadata: { type: 'run_started' } }]
    const a2aResubscribe = vi.fn(async function* () { for (const f of frames) yield f })
    vi.spyOn(client as unknown as { getA2AClient: (id: string) => unknown }, 'getA2AClient')
      .mockReturnValue({ resubscribeTask: a2aResubscribe })

    const out: unknown[] = []
    for await (const f of client.resubscribeTask('agent-x', 't1')) out.push(f)

    expect((client as unknown as { getA2AClient: unknown }).getA2AClient).toHaveBeenCalledWith('agent-x')
    expect(a2aResubscribe).toHaveBeenCalledWith({ id: 't1' })
    expect(out).toEqual(frames)
  })
})
