import { describe, it, expect } from 'vitest';
import type { Message } from '@a2a-js/sdk';
import { convertA2AMessageToDistri, decodeA2AStreamEvent } from '../encoder';
import type { DistriMessage } from '../types';

/**
 * The server marks a turn's final answer with `metadata.is_final` and carries
 * per-part flags in `metadata.parts`, on both the live trailing frame and the
 * persisted history. The decoder must keep both so renderers can hide
 * developer parts and superseded drafts after a reload, not just live.
 */
describe('encoder final-answer and part metadata', () => {
  it('carries metadata.is_final onto DistriMessage.is_final', () => {
    const a2a = {
      kind: 'message',
      messageId: 'final-1',
      role: 'agent',
      taskId: 't1',
      parts: [{ kind: 'text', text: 'The answer.' }],
      metadata: { is_final: true },
    } as Message;
    const distri = convertA2AMessageToDistri(a2a);
    expect(distri.is_final).toBe(true);
    expect(distri.id).toBe('final-1');
    expect(distri.metadata?.is_final).toBe(true);
  });

  it('leaves is_final unset when the frame is not final', () => {
    const a2a = {
      kind: 'message',
      messageId: 'draft-1',
      role: 'agent',
      parts: [{ kind: 'text', text: 'Draft.' }],
      metadata: { is_final: false },
    } as Message;
    expect(convertA2AMessageToDistri(a2a).is_final).toBeUndefined();
  });

  it('re-keys metadata.parts by numeric index so developer parts survive reload', () => {
    const history = {
      kind: 'message',
      messageId: 'u1',
      role: 'user',
      parts: [
        { kind: 'text', text: '[app context] hidden' },
        { kind: 'text', text: 'Plan my day' },
      ],
      metadata: { parts: { '0': { developer: true, save: true }, bogus: { developer: true }, '1': 'nope' } },
    };
    const distri = decodeA2AStreamEvent(history) as DistriMessage;
    expect(distri.metadata?.parts).toEqual({ 0: { developer: true, save: true } });
    expect(distri.metadata?.parts?.[0]?.developer).toBe(true);
  });

  it('omits metadata entirely when the frame has none', () => {
    const a2a = { kind: 'message', messageId: 'm', role: 'agent', parts: [] } as unknown as Message;
    const distri = convertA2AMessageToDistri(a2a);
    expect('metadata' in distri).toBe(false);
    expect('is_final' in distri).toBe(false);
  });
});
