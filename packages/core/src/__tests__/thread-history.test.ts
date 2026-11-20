import { describe, it, expect, vi } from 'vitest'
import { DistriClient } from '../distri-client'

describe('getThreadMessagesAsDistri', () => {
  it('converts the messages in a stored thread and skips status and task records', async () => {
    const history = [
      { kind: 'message', messageId: 'u1', role: 'user', parts: [{ kind: 'text', text: 'Why are leaves green?' }] },
      { kind: 'status-update', taskId: 't1', contextId: 'c1', status: { state: 'working' }, final: false },
      { kind: 'task', id: 't1', contextId: 'c1', status: { state: 'completed' } },
      { kind: 'message', messageId: 'a1', role: 'agent', parts: [{ kind: 'text', text: 'Chlorophyll.' }] },
    ]
    const fetchImpl = vi.fn(async () => new Response(JSON.stringify(history), { status: 200, headers: { 'Content-Type': 'application/json' } }))
    const client = new DistriClient({ baseUrl: 'https://api.example.test/v1', accessToken: 't', fetchImpl, retryAttempts: 0 })

    const messages = await client.getThreadMessagesAsDistri('c1')

    expect(messages.map(m => m.role)).toEqual(['user', 'assistant'])
    expect(messages[1].parts[0]).toEqual({ part_type: 'text', data: 'Chlorophyll.' })
  })

  it('reads the A2A 1.0 history the server returns ({message} / {statusUpdate})', async () => {
    const history = [
      { message: { messageId: 'u1', contextId: 'c1', role: 'ROLE_USER', parts: [{ text: 'Pick one' }] } },
      { statusUpdate: { taskId: 't1', contextId: 'c1', status: { state: 'TASK_STATE_WORKING', timestamp: '2026-11-20T12:00:00.000Z' }, metadata: { type: 'run_started', agent_id: '' } } },
      { message: { messageId: 'a1', contextId: 'c1', taskId: 't1', role: 'ROLE_AGENT', parts: [
        { text: 'Calling' },
        { data: { tool_call_id: 'c1', tool_name: 'pick', input: {} }, metadata: { 'distri/part_type': 'tool_call' } },
      ], metadata: { is_final: true } } },
    ]
    const fetchImpl = vi.fn(async () => new Response(JSON.stringify(history), { status: 200, headers: { 'Content-Type': 'application/json' } }))
    const client = new DistriClient({ baseUrl: 'https://api.example.test/v1', accessToken: 't', fetchImpl, retryAttempts: 0 })

    const messages = await client.getThreadMessagesAsDistri('c1')
    expect(messages.map(m => m.role)).toEqual(['user', 'assistant'])
    expect(messages[1]).toMatchObject({ is_final: true, taskId: 't1' })
    expect(messages[1].parts[1]).toEqual({ part_type: 'tool_call', data: { tool_call_id: 'c1', tool_name: 'pick', input: {} } })

    const raw = await client.getThreadMessages('c1')
    expect(raw.map((r) => (r as { kind: string }).kind)).toEqual(['message', 'status-update', 'message'])
  })
})
