import { describe, expect, it } from 'vitest'
import eventStreamFixture from './fixtures/a2a-1.0-event-stream.json'
import standardFixture from './fixtures/a2a-1.0-standard.json'
import { A2AStreamDecoder, convertA2APartToDistri, convertDistriPartToA2A, decodeA2AStreamEvent } from '../encoder'
import { PART_TYPE_KEY, fromWire, fromWirePart, parseA2ATimestamp, toWirePart } from '../a2a'
import type { DistriChatMessage, DistriMessage, DistriPart } from '../types'

/**
 * A2A 1.0 decoding (spec docs/specs/2026-11-20-a2a-wire-contract.md):
 * golden frames for both stream modes, ISO timestamps, part metadata,
 * artifactUpdate handling.
 */

const results = (fixture: { frames: Array<{ result: unknown }> }) => fixture.frames.map((f) => f.result)

function decodeAll(frames: unknown[], eventStream: boolean): DistriChatMessage[] {
  const decoder = new A2AStreamDecoder({ eventStream })
  return frames.flatMap((f) => decoder.decode(f))
}

const typeOf = (m: DistriChatMessage) => ('type' in m ? m.type : `message:${(m as DistriMessage).role}`)

describe('event-stream mode (golden frames)', () => {
  const out = decodeAll(results(eventStreamFixture), true)

  it('feeds the distri event model from the envelopes, in order', () => {
    expect(out.map(typeOf)).toEqual([
      'run_started',
      'step_started',
      'text_message_start',
      'text_message_content',
      'text_message_content',
      'text_message_end',
      'tool_calls',
      'run_parked',
      'step_started',
      'run_started',
      'tool_results',
      'message:assistant', // the file artifactUpdate
      'run_finished',
      'run_finished',
      'message:assistant', // trailing {message}
    ])
  })

  it('stamps step_id on events that have none of their own', () => {
    const parked = out.find((m) => typeOf(m) === 'run_parked') as { stepId?: string; taskId?: string; data: { pending: string[] } }
    expect(parked.stepId).toBe('s1')
    expect(parked.data.pending).toEqual(['c1'])
    const rootEnd = out.filter((m) => typeOf(m) === 'run_finished')[1] as { stepId?: string; attempt?: number }
    expect(rootEnd.stepId).toBe('s2')
    expect(rootEnd.attempt).toBe(1)
  })

  it('marks final only on the root run_finished; the sub-agent end is routed to its parent', () => {
    const [subEnd, rootEnd] = out.filter((m) => typeOf(m) === 'run_finished') as Array<Record<string, unknown>>
    expect(subEnd).toMatchObject({ taskId: 't-sub', parentTaskId: 't-root', parentToolCallId: 'c2', agentId: 'researcher' })
    expect(subEnd.final).toBeUndefined()
    expect(rootEnd).toMatchObject({ taskId: 't-root', final: true })
    expect(rootEnd.parentTaskId).toBeUndefined()
  })

  it('decodes the trailing {message} as the final answer', () => {
    const last = out[out.length - 1] as DistriMessage
    expect(last).toMatchObject({ id: 't-root-final', role: 'assistant', is_final: true, taskId: 't-root' })
    expect(last.parts).toEqual([{ part_type: 'text', data: 'Hello' }])
  })

  it('parses ISO-8601 timestamps onto events', () => {
    const started = out[0] as { timestamp?: number }
    expect(started.timestamp).toBe(Date.parse('2026-11-20T12:00:00.000Z'))
  })

  it('decodes a file artifactUpdate to an artifact message (files always)', () => {
    const file = out.find((m) => typeOf(m) === 'message:assistant') as DistriMessage
    expect(file.id).toBe('f1')
    expect(file.taskId).toBe('t-root')
    expect(file.parts).toEqual([
      { part_type: 'artifact', data: expect.objectContaining({ file_id: 'f1', relative_path: 'out/report.md' }) },
    ])
  })

  it('ignores text artifacts when event-stream is active (text arrives as text_message_* events)', () => {
    const decoder = new A2AStreamDecoder({ eventStream: true })
    expect(decoder.decode(results(standardFixture)[2])).toEqual([])
  })
})

describe('standard mode (no event-stream; golden frames)', () => {
  const out = decodeAll(results(standardFixture), false)

  it('turns standard frames into the same event model', () => {
    expect(out.map(typeOf)).toEqual([
      'run_started',
      'text_message_start',
      'text_message_content',
      'text_message_content',
      'text_message_end',
      'message:assistant', // file artifact
      'message:assistant', // the answer (status.message)
      'run_finished',
    ])
  })

  it('streams text artifacts as text_message_* keyed by the artifact id', () => {
    const start = out[1] as { data: { message_id: string; role: string }; taskId?: string }
    expect(start.data).toMatchObject({ message_id: 'm1', role: 'assistant' })
    expect(start.taskId).toBe('t-root')
    const deltas = out.filter((m) => typeOf(m) === 'text_message_content').map((m) => (m as { data: { delta: string } }).data.delta)
    expect(deltas).toEqual(['Hel', 'lo'])
  })

  it('the terminal status message is the final answer, then run_finished', () => {
    const answer = out[6] as DistriMessage
    expect(answer).toMatchObject({ id: 't-root-final', is_final: true })
    expect(out[7]).toMatchObject({ type: 'run_finished', taskId: 't-root', final: true, timestamp: Date.parse('2026-11-20T12:00:02.000Z') })
  })

  it('failed / canceled / auth-required end the run with run_error', () => {
    const end = (state: string, text: string) => ({
      statusUpdate: {
        taskId: 't', contextId: 'c',
        status: { state, message: { messageId: 'e', role: 'ROLE_AGENT', parts: [{ text }] }, timestamp: '2026-11-20T12:00:00.000Z' },
      },
    })
    const d = new A2AStreamDecoder({ eventStream: false })
    expect(d.decode(end('TASK_STATE_FAILED', 'boom'))).toEqual([expect.objectContaining({ type: 'run_error', data: { message: 'boom', code: 'EXECUTION_ERROR' } })])
    expect(d.decode(end('TASK_STATE_CANCELED', 'stopped'))).toEqual([expect.objectContaining({ type: 'run_error', data: { message: 'stopped', code: 'CANCELLED' } })])
    expect(d.decode(end('TASK_STATE_AUTH_REQUIRED', 'connect github'))).toEqual([expect.objectContaining({ type: 'run_error', data: { message: 'connect github', code: 'AUTH_REQUIRED' } })])
  })

  it('input-required lists the pending tool calls (tool_calls, then run_parked)', () => {
    const d = new A2AStreamDecoder({ eventStream: false })
    const out = d.decode({
      statusUpdate: {
        taskId: 't', contextId: 'c',
        status: {
          state: 'TASK_STATE_INPUT_REQUIRED',
          message: {
            messageId: 'w', role: 'ROLE_AGENT',
            parts: [
              { text: 'Waiting for input: pick_color' },
              { data: { tool_call_id: 'c1', tool_name: 'pick_color', input: {} }, metadata: { [PART_TYPE_KEY]: 'tool_call' } },
            ],
          },
        },
      },
    })
    expect(out.map(typeOf)).toEqual(['tool_calls', 'run_parked'])
    expect(out[0]).toMatchObject({ data: { tool_calls: [{ tool_call_id: 'c1', tool_name: 'pick_color' }] } })
    expect(out[1]).toMatchObject({ data: { pending: ['c1'] } })
  })
})

describe('stateless decodeA2AStreamEvent', () => {
  it('accepts 1.0 frames (history from GET /threads/{id}/messages)', () => {
    const msg = decodeA2AStreamEvent({ message: { messageId: 'u1', role: 'ROLE_USER', parts: [{ text: 'hi' }] } }) as DistriMessage
    expect(msg).toMatchObject({ id: 'u1', role: 'user', parts: [{ part_type: 'text', data: 'hi' }] })
    const evt = decodeA2AStreamEvent(results(eventStreamFixture)[0])
    expect(evt).toMatchObject({ type: 'run_started', taskId: 't-root', agentId: 'assistant' })
  })

  it('still accepts 0.x kind-tagged frames', () => {
    const evt = decodeA2AStreamEvent({ kind: 'status-update', taskId: 't1', status: { state: 'working', timestamp: '1763640000000' }, metadata: { type: 'run_started' } })
    expect(evt).toMatchObject({ type: 'run_started', taskId: 't1', timestamp: 1763640000000 })
  })
})

describe('timestamps', () => {
  it('parses ISO-8601 and 0.x epoch milliseconds', () => {
    expect(parseA2ATimestamp('2026-11-20T12:00:00.000Z')).toBe(Date.UTC(2026, 10, 20, 12))
    expect(parseA2ATimestamp('2026-11-20T12:15:00+00:00')).toBe(Date.UTC(2026, 10, 20, 12, 15))
    expect(parseA2ATimestamp(1763640000000)).toBe(1763640000000)
    expect(parseA2ATimestamp('1763640000000')).toBe(1763640000000)
    expect(parseA2ATimestamp('nope')).toBeUndefined()
    expect(parseA2ATimestamp(undefined)).toBeUndefined()
  })
})

describe('part metadata round trip', () => {
  const kinds: DistriPart[] = [
    { part_type: 'tool_call', data: { tool_call_id: 'c1', tool_name: 'pick', input: { a: 1 } } },
    { part_type: 'artifact', data: { file_id: 'f1', relative_path: 'out/a.md' } },
    { part_type: 'resource_link', data: { uri: 'ui://app/x', mime_type: 'text/html' } },
  ]

  it.each(kinds)('$part_type travels as DataPart + metadata["distri/part_type"]', (part) => {
    const wire = toWirePart(convertDistriPartToA2A(part))
    expect(wire).toEqual({ data: part.data, metadata: { [PART_TYPE_KEY]: part.part_type } })
    expect(convertA2APartToDistri(fromWirePart(JSON.parse(JSON.stringify(wire))))).toEqual(part)
  })

  it('tool_result carries the ToolResponse body', () => {
    const part: DistriPart = {
      part_type: 'tool_result',
      data: { tool_call_id: 'c1', tool_name: 'pick', parts: [{ part_type: 'data', data: { color: 'red' } }] },
    }
    const wire = toWirePart(convertDistriPartToA2A(part))
    expect(wire).toEqual({
      data: { tool_call_id: 'c1', tool_name: 'pick', parts: [{ part_type: 'data', data: { color: 'red' } }] },
      metadata: { [PART_TYPE_KEY]: 'tool_result' },
    })
    expect(convertA2APartToDistri(fromWirePart(wire))).toEqual(part)
  })

  it('a plain data part has no distri metadata', () => {
    const wire = toWirePart(convertDistriPartToA2A({ part_type: 'data', data: { x: 1 } }))
    expect(wire).toEqual({ data: { x: 1 } })
    expect(convertA2APartToDistri(fromWirePart(wire))).toEqual({ part_type: 'data', data: { x: 1 } })
  })

  it('text and files use the 1.0 field-presence shapes', () => {
    expect(toWirePart(convertDistriPartToA2A({ part_type: 'text', data: 'hi' }))).toEqual({ text: 'hi' })
    expect(toWirePart(convertDistriPartToA2A({ part_type: 'image', data: { type: 'url', url: 'https://x/a.png', mime_type: 'image/png', name: 'a.png' } })))
      .toEqual({ url: 'https://x/a.png', mediaType: 'image/png', filename: 'a.png' })
    expect(toWirePart(convertDistriPartToA2A({ part_type: 'file', data: { type: 'bytes', bytes: 'AAE=', mime_type: 'application/pdf' } })))
      .toEqual({ raw: 'AAE=', mediaType: 'application/pdf' })
    expect(convertA2APartToDistri(fromWirePart({ url: 'https://x/a.png', mediaType: 'image/png', filename: 'a.png' })))
      .toEqual({ part_type: 'image', data: { type: 'url', url: 'https://x/a.png', mime_type: 'image/png', name: 'a.png' } })
    expect(convertA2APartToDistri(fromWirePart({ raw: 'AAE=', mediaType: 'application/pdf' })))
      .toEqual({ part_type: 'file', data: { type: 'bytes', bytes: 'AAE=', mime_type: 'application/pdf', name: undefined } })
  })

  it('the 0.x {part_type, data} wrapper is still decoded, and re-encoded as 1.0', () => {
    const legacy = { kind: 'data', data: { part_type: 'tool_call', data: { tool_call_id: 'c1', tool_name: 'pick', input: {} } } }
    expect(convertA2APartToDistri(legacy as never)).toEqual({ part_type: 'tool_call', data: { tool_call_id: 'c1', tool_name: 'pick', input: {} } })
    expect(toWirePart(legacy)).toEqual({ data: { tool_call_id: 'c1', tool_name: 'pick', input: {} }, metadata: { [PART_TYPE_KEY]: 'tool_call' } })
  })

  it('normalizes roles and states', () => {
    expect(fromWire({ message: { messageId: 'a', role: 'ROLE_AGENT', parts: [] } })).toMatchObject({ kind: 'message', role: 'agent' })
    expect(fromWire({ task: { id: 't', contextId: 'c', status: { state: 'TASK_STATE_INPUT_REQUIRED' } } })).toMatchObject({ kind: 'task', status: { state: 'input-required' } })
  })
})
