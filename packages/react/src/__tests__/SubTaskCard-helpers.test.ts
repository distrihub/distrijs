import { describe, it, expect } from 'vitest';
import { countDescendants, deriveGist } from '../components/renderers/SubTaskCard';
import type { TaskState } from '../stores/chatStateStore';

/**
 * Concern 4 — child-task visualization polish. The collapsed sub-task header
 * shows a descendant count and a one-line gist (the "one gist out" contract).
 * These cover the two pure helpers that drive that header.
 */

function task(id: string, childTaskIds: string[] = []): TaskState {
  return {
    id,
    childTaskIds,
    title: id,
    status: 'completed',
  } as TaskState;
}

describe('countDescendants', () => {
  it('counts children, grandchildren, and deeper', () => {
    const tasks = new Map<string, TaskState>([
      ['root', task('root', ['a', 'b'])],
      ['a', task('a', ['a1'])],
      ['a1', task('a1', [])],
      ['b', task('b', [])],
    ]);
    // a, a1, b == 3
    expect(countDescendants(tasks.get('root')!, tasks)).toBe(3);
    expect(countDescendants(tasks.get('a')!, tasks)).toBe(1);
    expect(countDescendants(tasks.get('b')!, tasks)).toBe(0);
  });

  it('ignores missing children and tolerates cycles', () => {
    const tasks = new Map<string, TaskState>([
      ['root', task('root', ['a', 'ghost'])],
      // a points back at root → cycle; must not infinite-loop.
      ['a', task('a', ['root'])],
    ]);
    const n = countDescendants(tasks.get('root')!, tasks);
    // root → a (counted), a → root (counted once via seen-set), ghost missing.
    expect(n).toBeGreaterThanOrEqual(1);
    expect(Number.isFinite(n)).toBe(true);
  });
});

describe('deriveGist', () => {
  const msg = (taskId: string, text: string) =>
    ({
      id: `${taskId}-${text.slice(0, 4)}`,
      role: 'assistant',
      taskId,
      parts: [{ part_type: 'text', data: text }],
    }) as any;

  it('returns the last assistant text, collapsed and truncated', () => {
    const out = deriveGist([msg('t', 'first line'), msg('t', '  second   line  ')]);
    expect(out).toBe('second line');
  });

  it('truncates to 120 chars', () => {
    const long = 'x'.repeat(300);
    expect(deriveGist([msg('t', long)]).length).toBe(120);
  });

  it('returns empty when there is no text', () => {
    expect(deriveGist([])).toBe('');
    expect(deriveGist([{ type: 'run_started', taskId: 't' } as any])).toBe('');
  });
});
