import { describe, expect, it } from 'vitest';
import type { DistriChatMessage, DistriEvent, DistriMessage, DistriPart, PartMetadata } from '@distri/core';
import {
  buildTranscript,
  findSupersededDrafts,
  hideDeveloperParts,
  isFinalAnswerMessage,
  resolveTranscriptMessages,
  summarizeToolRun,
  toolStepLabel,
} from '../chat/transcript';
import { createChatStore } from '../chat/chatStore';

let seq = 0;
function msg(
  role: DistriMessage['role'],
  parts: DistriPart[] | string,
  extra: Partial<DistriMessage> = {},
): DistriMessage {
  seq += 1;
  return {
    id: `m${seq}`,
    role,
    parts: typeof parts === 'string' ? [{ part_type: 'text', data: parts }] : parts,
    created_at: seq,
    ...extra,
  };
}

function toolCalls(names: string[], taskId?: string): DistriEvent {
  seq += 1;
  return {
    type: 'tool_calls',
    taskId,
    data: { tool_calls: names.map((tool_name, i) => ({ tool_call_id: `tc${seq}-${i}`, tool_name, input: {} })) },
  } as DistriEvent;
}

const finalCallPart = (answer: string): DistriPart => ({
  part_type: 'tool_call',
  data: { tool_call_id: `final-${answer.length}`, tool_name: 'final', input: { input: answer } },
});

const texts = (messages: DistriChatMessage[]) =>
  messages
    .filter((m): m is DistriMessage => 'parts' in m)
    .map(m => m.parts.filter(p => p.part_type === 'text').map(p => (p as { data: string }).data).join(''));

describe('isFinalAnswerMessage', () => {
  it('accepts is_final on the message or in metadata', () => {
    expect(isFinalAnswerMessage(msg('assistant', 'a', { is_final: true }))).toBe(true);
    expect(isFinalAnswerMessage(msg('assistant', 'a', { metadata: { is_final: true } }))).toBe(true);
    expect(isFinalAnswerMessage(msg('assistant', 'a'))).toBe(false);
    expect(isFinalAnswerMessage(toolCalls(['search']))).toBe(false);
  });
});

describe('findSupersededDrafts (one answer per turn)', () => {
  it('hides an earlier draft whose text equals the final text after trim', () => {
    const draft = msg('assistant', '  Kyoto has 3 stops. ', { taskId: 't1' });
    const final = msg('assistant', 'Kyoto has 3 stops.', { taskId: 't1', is_final: true });
    expect([...findSupersededDrafts([draft, final])]).toEqual([draft.id]);
  });

  it('hides a reworded draft that also carries a final tool call part', () => {
    const draft = msg('assistant', [{ part_type: 'text', data: 'Here is a rough plan' }, finalCallPart('x')], { taskId: 't1' });
    const final = msg('assistant', 'Here is the plan.', { taskId: 't1', is_final: true });
    expect(findSupersededDrafts([draft, final]).has(draft.id)).toBe(true);
  });

  it('treats the final tool_calls event right after a draft as that draft calling final', () => {
    const draft = msg('assistant', 'Draft wording', { taskId: 't1' });
    const final = msg('assistant', 'Final wording', { taskId: 't1', is_final: true });
    expect(findSupersededDrafts([draft, toolCalls(['final'], 't1'), final]).has(draft.id)).toBe(true);
  });

  it('keeps reworded drafts that did not call final, and the final itself', () => {
    const thinking = msg('assistant', 'Let me search first.', { taskId: 't1' });
    const final = msg('assistant', 'Done.', { taskId: 't1', is_final: true });
    const superseded = findSupersededDrafts([thinking, toolCalls(['search'], 't1'), msg('assistant', 'Found it.', { taskId: 't1' }), toolCalls(['final'], 't1'), final]);
    expect(superseded.has(thinking.id)).toBe(false);
    expect(superseded.has(final.id)).toBe(false);
  });

  it('is scoped per task and ignores messages after the final or without a taskId', () => {
    const otherTask = msg('assistant', 'Same text', { taskId: 't2' });
    const noTask = msg('assistant', 'Same text');
    const final = msg('assistant', 'Same text', { taskId: 't1', is_final: true });
    const after = msg('assistant', 'Same text', { taskId: 't1' });
    expect(findSupersededDrafts([otherTask, noTask, final, after]).size).toBe(0);
  });

  it('returns nothing when no message is final', () => {
    expect(findSupersededDrafts([msg('assistant', 'a', { taskId: 't1' }), msg('assistant', 'a', { taskId: 't1' })]).size).toBe(0);
  });
});

describe('resolveTranscriptMessages', () => {
  it('drops only the Text parts of a superseded draft; its tool calls still render', () => {
    const draft = msg('assistant', [{ part_type: 'text', data: 'Answer' }, { part_type: 'tool_call', data: { tool_call_id: 'w', tool_name: 'web_search', input: {} } }], { taskId: 't1' });
    const final = msg('assistant', 'Answer', { taskId: 't1', is_final: true });
    const resolved = resolveTranscriptMessages([draft, final]) as DistriMessage[];
    expect(resolved[0].parts.map(p => p.part_type)).toEqual(['tool_call']);
    expect(texts(resolved)).toEqual(['', 'Answer']);
  });

  it('drops a superseded draft that has nothing else to show', () => {
    const draft = msg('assistant', 'Answer', { taskId: 't1' });
    const final = msg('assistant', 'Answer', { taskId: 't1', is_final: true });
    expect(resolveTranscriptMessages([draft, final])).toEqual([final]);
  });

  it('hides developer parts by default and re-indexes metadata.parts', () => {
    const parts: Record<number, PartMetadata> = { 0: { developer: true, save: false }, 2: { save: false } };
    const user = msg('user', [
      { part_type: 'text', data: '[app context] trip=kyoto' },
      { part_type: 'text', data: 'What next?' },
      { part_type: 'text', data: 'ephemeral' },
    ], { metadata: { parts } });
    const [resolved] = resolveTranscriptMessages([user]) as DistriMessage[];
    expect(texts([resolved])).toEqual(['What next?ephemeral']);
    expect(resolved.metadata?.parts).toEqual({ 1: { save: false } });
    // Source untouched.
    expect(user.parts).toHaveLength(3);
  });

  it('drops a message made only of developer parts (history after reload)', () => {
    const contextOnly = msg('user', '[app context]', { metadata: { parts: { 0: { developer: true } } } });
    expect(resolveTranscriptMessages([contextOnly])).toEqual([]);
  });

  it('lets a custom hidePart show developer parts, clearing the flag so renderers keep them', () => {
    const user = msg('user', [{ part_type: 'text', data: 'ctx' }, { part_type: 'text', data: 'q' }], { metadata: { parts: { 0: { developer: true } } } });
    const [resolved] = resolveTranscriptMessages([user], { hidePart: () => false }) as DistriMessage[];
    expect(resolved.parts).toHaveLength(2);
    expect(resolved.metadata?.parts?.[0]?.developer).toBeUndefined();
  });

  it('returns the same object when nothing changes', () => {
    const plain = msg('assistant', 'hi');
    expect(resolveTranscriptMessages([plain])[0]).toBe(plain);
  });

  it('collapses a repeated id (live + trailing frame / history) to one entry with the latest content', () => {
    const streamed = msg('assistant', 'Final', { taskId: 't1' });
    const trailing = { ...streamed, is_final: true };
    const resolved = resolveTranscriptMessages([streamed, toolCalls(['search'], 't1'), trailing]);
    expect(resolved).toHaveLength(2);
    expect(isFinalAnswerMessage(resolved[0])).toBe(true);
  });

  it('exposes the default predicate', () => {
    const m = msg('user', 'x');
    expect(hideDeveloperParts(m.parts[0], { message: m, index: 0, metadata: { developer: true } })).toBe(true);
    expect(hideDeveloperParts(m.parts[0], { message: m, index: 0 })).toBe(false);
  });
});

describe('buildTranscript', () => {
  it('emits user / assistant / steps blocks with drafts resolved and final hidden', () => {
    const user = msg('user', 'Plan Kyoto');
    const draft = msg('assistant', 'Kyoto plan', { taskId: 't1' });
    const final = msg('assistant', 'Kyoto plan', { taskId: 't1', is_final: true });
    const blocks = buildTranscript([user, toolCalls(['web_search'], 't1'), draft, toolCalls(['final'], 't1'), final]);
    expect(blocks.map(b => b.kind)).toEqual(['user', 'steps', 'assistant']);
    const answer = blocks[2];
    expect(answer.kind === 'assistant' && answer.isFinal).toBe(true);
    expect(answer.index).toBe(4);
  });

  it("keeps one steps block per tool_calls event with groupToolCalls='none'", () => {
    const blocks = buildTranscript([toolCalls(['a']), toolCalls(['b', 'c'])]);
    expect(blocks.map(b => (b.kind === 'steps' ? b.toolCalls.length : -1))).toEqual([1, 2]);
  });

  it("folds consecutive tool calls into one run with groupToolCalls='run'", () => {
    const first = toolCalls(['read_itinerary']);
    const blocks = buildTranscript([
      msg('user', 'go'),
      first,
      { type: 'run_started', data: {} } as DistriEvent,
      msg('assistant', ''), // empty streaming shell does not break the run
      toolCalls(['web_search', 'final']),
      toolCalls(['web_search']),
      msg('assistant', 'Here you go'),
      toolCalls(['map_pin']),
    ], { groupToolCalls: 'run' });
    expect(blocks.map(b => b.kind)).toEqual(['user', 'steps', 'assistant', 'steps']);
    const run = blocks[1];
    if (run.kind !== 'steps') throw new Error('expected steps');
    expect(run.toolCalls.map(c => c.tool_name)).toEqual(['read_itinerary', 'web_search', 'web_search']);
    expect(run.events).toHaveLength(3);
    expect(run.startIndex).toBe(1);
    expect(run.index).toBe(5);
    expect(run.key).toBe(`steps-${first.type === 'tool_calls' ? first.data.tool_calls[0].tool_call_id : ''}`);
  });

  it('a visible event breaks a run; hidden events and final-only calls do not', () => {
    const blocks = buildTranscript([
      toolCalls(['a']),
      toolCalls(['final']),
      { type: 'run_error', data: { message: 'boom' } } as DistriEvent,
      toolCalls(['b']),
    ], { groupToolCalls: 'run' });
    expect(blocks.map(b => b.kind)).toEqual(['steps', 'event', 'steps']);
  });

  it('honours isVisibleEvent, excludeMessage and developer-role messages', () => {
    const child = msg('assistant', 'from fork', { taskId: 'child' });
    const dev = msg('developer', 'debug ctx');
    const todos = { type: 'todos_updated', data: { todos: [] } } as unknown as DistriEvent;
    const messages = [child, dev, todos, msg('assistant', 'root')];
    const blocks = buildTranscript(messages, {
      excludeMessage: m => (m as DistriMessage).taskId === 'child',
      isVisibleEvent: e => e.type !== 'todos_updated',
      includeDeveloperMessages: true,
    });
    expect(blocks.map(b => [b.kind, b.index])).toEqual([['event', 1], ['assistant', 3]]);
  });

  it('skips user messages that only carried developer parts', () => {
    const blocks = buildTranscript([msg('user', 'ctx', { metadata: { parts: { 0: { developer: true } } } })]);
    expect(blocks).toEqual([]);
  });
});

describe('tool step labels', () => {
  it('prefers host labels, then the tool summary', () => {
    const call = { tool_call_id: '1', tool_name: 'web_search', input: { query: 'kyoto' } };
    expect(toolStepLabel(call, { toolLabels: { web_search: 'Searched the web' } })).toBe('Searched the web');
    expect(toolStepLabel(call, { summaryOverrides: { web_search: () => ({ verb: 'Looked up', subject: 'kyoto' }) } })).toBe('Looked up kyoto');
    expect(typeof toolStepLabel(call)).toBe('string');
  });

  it('summarizes a run as "N steps · labels…" with repeats collapsed', () => {
    expect(summarizeToolRun(['Read itinerary'])).toBe('1 step · Read itinerary');
    expect(summarizeToolRun(['A', 'B', 'A'])).toBe('3 steps · A, B');
    expect(summarizeToolRun(['A', 'B', 'C', 'D'])).toBe('4 steps · A, B, C…');
    expect(summarizeToolRun([])).toBe('0 steps');
  });
});

describe('chatStore converges a repeated message id', () => {
  it('keeps streamed text non-final and merges the final answer delivered twice', () => {
    const store = createChatStore();
    // Streamed draft: text_message_start never marks a message final.
    store.getState().addMessage({ type: 'text_message_start', taskId: 't1', data: { message_id: 'draft', step_id: 's1', role: 'assistant' } } as DistriEvent);
    store.getState().addMessage({ type: 'text_message_content', data: { message_id: 'draft', step_id: 's1', delta: 'Thinking it over.' } } as DistriEvent);
    // Final answer: its own id (derived from the task), live trailing frame then history replay.
    const final = msg('assistant', 'The answer.', { id: 'final-t1', is_final: true, taskId: 't1', metadata: { is_final: true } });
    store.getState().addMessage(final);
    store.getState().addMessage({ ...final });

    const messages = store.getState().messages as DistriMessage[];
    expect(messages).toHaveLength(2);
    expect(messages[0].id).toBe('draft');
    expect(messages[0].is_final).toBeUndefined();
    expect(messages[1]).toMatchObject({ id: 'final-t1', is_final: true, taskId: 't1' });
    expect(texts(messages)).toEqual(['Thinking it over.', 'The answer.']);
  });
});
