import { describe, it, expect } from 'vitest';
import { createSuccessfulToolResult } from '../types';

/**
 * Concern 3 — early-stop on tool call. The backend's
 * `ExecutionStrategy::should_continue` ends the agent's turn when the last tool
 * result carries a `Part::Data` with `{ should_continue: false }`. These tests
 * lock in that the frontend emits exactly that part when a tool opts into
 * `stopAfterTurn`, and omits it otherwise.
 */
describe('createSuccessfulToolResult stopAfterTurn', () => {
  it('appends a { should_continue: false } data part when stopAfterTurn is set', () => {
    const res = createSuccessfulToolResult('call-1', 'save_content', { ok: true }, undefined, {
      stopAfterTurn: true,
    });

    const control = res.parts.find(
      (p: any) => p.part_type === 'data' && p.data && p.data.should_continue === false,
    );
    expect(control).toBeTruthy();
    // The original result part is still present and untouched.
    const resultPart = res.parts.find(
      (p: any) => p.part_type === 'data' && p.data && 'result' in p.data,
    ) as any;
    expect(resultPart?.data?.result).toEqual({ ok: true });
    expect(resultPart?.data?.success).toBe(true);
  });

  it('does NOT append the control part by default', () => {
    const res = createSuccessfulToolResult('call-2', 'save_content', { ok: true });
    const control = res.parts.find(
      (p: any) => p.part_type === 'data' && p.data && p.data.should_continue === false,
    );
    expect(control).toBeUndefined();
  });

  it('appends the control part even when the result is already DistriPart[]', () => {
    const res = createSuccessfulToolResult(
      'call-3',
      'save_content',
      [{ part_type: 'text', data: 'saved' }] as any,
      undefined,
      { stopAfterTurn: true },
    );
    // text part preserved...
    expect(res.parts.some((p: any) => p.part_type === 'text' && p.data === 'saved')).toBe(true);
    // ...plus the appended control part.
    expect(
      res.parts.some(
        (p: any) => p.part_type === 'data' && p.data && p.data.should_continue === false,
      ),
    ).toBe(true);
  });
});
