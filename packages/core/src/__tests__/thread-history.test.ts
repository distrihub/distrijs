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
})
