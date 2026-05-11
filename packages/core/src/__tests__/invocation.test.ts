import { describe, it, expect } from 'vitest';
import {
  Invocations,
  targetNamed,
  targetAdHoc,
  validateInvocation,
  type Invocation,
  type InvocationResult,
} from '../invocation';

describe('Invocation builders', () => {
  it('Invocations.single produces join=single with one target', () => {
    const inv = Invocations.single(targetNamed('worker', 'go'));
    expect(inv.join).toBe('single');
    expect(inv.targets).toHaveLength(1);
    expect(inv.targets[0].agent).toEqual({ type: 'named', agent_id: 'worker' });
  });

  it('Invocations.all preserves N targets in input order', () => {
    const inv = Invocations.all([
      targetNamed('a', 'one'),
      targetNamed('b', 'two'),
      targetNamed('c', 'three'),
    ]);
    expect(inv.join).toBe('all');
    expect(inv.targets.map(t => (t.agent as any).agent_id)).toEqual(['a', 'b', 'c']);
  });

  it('Invocations.detached produces join=detached', () => {
    const inv = Invocations.detached([targetNamed('bg', 'fire and forget')]);
    expect(inv.join).toBe('detached');
  });

  it('targetAdHoc carries system_prompt and tools through', () => {
    const tgt = targetAdHoc('Be a code reviewer.', 'review the diff', {
      builtin: ['final'],
    });
    expect(tgt.agent.type).toBe('ad_hoc');
    if (tgt.agent.type === 'ad_hoc') {
      expect(tgt.agent.system_prompt).toBe('Be a code reviewer.');
      expect(tgt.agent.tools).toEqual({ builtin: ['final'] });
    }
  });
});

describe('validateInvocation', () => {
  it('rejects zero targets', () => {
    const err = validateInvocation({ targets: [] });
    expect(err?.code).toBe('no_targets');
  });

  it('rejects Single with multiple targets', () => {
    const err = validateInvocation({
      targets: [targetNamed('a', 'x'), targetNamed('b', 'y')],
      join: 'single',
    });
    expect(err?.code).toBe('single_needs_one_target');
    expect(err?.message).toContain('2');
  });

  it('rejects AdHoc with empty system_prompt', () => {
    const err = validateInvocation({
      targets: [targetAdHoc('   ', 'msg')],
      join: 'single',
    });
    expect(err?.code).toBe('adhoc_empty_prompt');
  });

  it('rejects Named with empty agent_id', () => {
    const inv: Invocation = {
      targets: [
        {
          agent: { type: 'named', agent_id: '' },
          message: {
            id: 'test',
            role: 'user',
            parts: [{ part_type: 'text', data: 'hi' } as any],
            created_at: 0,
          } as any,
        },
      ],
      join: 'single',
    };
    const err = validateInvocation(inv);
    expect(err?.code).toBe('named_empty_agent_id');
  });

  it('passes a well-formed Single invocation', () => {
    const inv = Invocations.single(targetNamed('w', 'go'));
    expect(validateInvocation(inv)).toBeNull();
  });

  it('passes Detached with N targets', () => {
    const inv = Invocations.detached([
      targetNamed('a', 'go-a'),
      targetNamed('b', 'go-b'),
    ]);
    expect(validateInvocation(inv)).toBeNull();
  });
});

describe('serialization shape', () => {
  it('Single + Local + Independent matches the Rust JSON the orchestrator expects', () => {
    const inv = Invocations.single(targetNamed('worker', 'compute'));
    const json = JSON.parse(JSON.stringify(inv));
    expect(json.join).toBe('single');
    expect(json.targets).toHaveLength(1);
    expect(json.targets[0].agent.type).toBe('named');
    expect(json.targets[0].agent.agent_id).toBe('worker');
    // ContextScope/ExecutorHint default at the orchestrator side; the
    // wire shape is allowed to omit them.
    expect(json.context).toBeUndefined();
    expect(json.executor).toBeUndefined();
  });

  it('Force(Remote) carries RunnerConfig in the JSON', () => {
    const inv: Invocation = Invocations.single(targetNamed('w', 'go'));
    inv.executor = {
      kind: 'force',
      type: 'remote',
      runner: { kind: 'sandbox', config: { image: 'distri-cli:latest' } },
    };
    const json = JSON.parse(JSON.stringify(inv));
    expect(json.executor.kind).toBe('force');
    expect(json.executor.type).toBe('remote');
    expect(json.executor.runner.kind).toBe('sandbox');
    expect(json.executor.runner.config.image).toBe('distri-cli:latest');
  });
});

describe('InvocationResult discriminated union', () => {
  it('narrows on `kind`', () => {
    const scalar: InvocationResult = {
      kind: 'scalar',
      result: { content: 'ok', task_id: 't1', status: 'completed' },
    };
    const taskIds: InvocationResult = { kind: 'task_ids', task_ids: ['a', 'b'] };

    expect(scalar.kind).toBe('scalar');
    if (scalar.kind === 'scalar') {
      expect(scalar.result.task_id).toBe('t1');
    }
    if (taskIds.kind === 'task_ids') {
      expect(taskIds.task_ids).toHaveLength(2);
    }
  });
});
