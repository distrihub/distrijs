import { describe, it, expect } from 'vitest';
import { Agent } from '../agent';
import { Invocations, targetNamed } from '../invocation';
import type { ExecutorContextMetadata } from '../types';

// Minimal Agent with a stub client — enhanceParamsWithTools never touches the
// client, so a bare object is enough to exercise metadata serialization.
function makeAgent(): Agent {
  const def: any = { name: 'test-agent' };
  const client: any = {};
  return new Agent(def, client);
}

describe('fork + load_skills metadata pass-through', () => {
  it('preserves load_skills and fork through enhanceParamsWithTools', () => {
    const agent = makeAgent();
    const fork = Invocations.detached([targetNamed('worker', 'do the thing')]);
    const params: any = {
      message: { messageId: 'm1', role: 'user', parts: [], kind: 'message' },
      metadata: { load_skills: ['zippy_lesson'], fork } as ExecutorContextMetadata,
    };

    const out = (agent as any).enhanceParamsWithTools(params);
    const meta = out.metadata as ExecutorContextMetadata;

    // Both new fields survive the spread (they reach metadata.* on the wire).
    expect(meta.load_skills).toEqual(['zippy_lesson']);
    expect(meta.fork).toBeDefined();
    expect(meta.fork?.join).toBe('detached');
    expect(meta.fork?.targets?.[0]).toMatchObject({
      agent: { type: 'named', agent_id: 'worker' },
    });

    // Existing behaviour is not clobbered: runtime_mode is still forced to
    // 'browser' and external_tools is initialised.
    expect(meta.runtime_mode).toBe('browser');
    expect(Array.isArray(meta.external_tools)).toBe(true);
  });

  it('leaves metadata without fork/load_skills untouched', () => {
    const agent = makeAgent();
    const params: any = {
      message: { messageId: 'm2', role: 'user', parts: [], kind: 'message' },
      metadata: { tags: { surface: 'editor' } } as ExecutorContextMetadata,
    };

    const out = (agent as any).enhanceParamsWithTools(params);
    const meta = out.metadata as ExecutorContextMetadata;

    expect(meta.load_skills).toBeUndefined();
    expect(meta.fork).toBeUndefined();
    expect(meta.tags).toEqual({ surface: 'editor' });
  });
});
