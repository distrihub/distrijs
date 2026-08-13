import { describe, it, expect, afterEach } from 'vitest';
import { Agent } from '../agent';
import { ClientToolRegistry, clientToolRegistry } from '../tool-registry';
import type { DistriBaseTool, ExecutorContextMetadata } from '../types';

function makeAgent(tools?: Record<string, unknown>): Agent {
  const def: any = { name: 'test-agent', ...(tools ? { tools } : {}) };
  const client: any = {};
  return new Agent(def, client);
}

function tool(name: string): DistriBaseTool {
  return { name, description: `desc for ${name}`, parameters: {}, type: 'function' };
}

describe('ClientToolRegistry', () => {
  it('registers, lists, and unregisters namespaces independently', () => {
    const registry = new ClientToolRegistry();
    expect(registry.getTools()).toEqual([]);

    registry.register('browser', [tool('db_get'), tool('db_put')]);
    registry.register('other', [tool('some_tool')]);

    expect(registry.has('browser')).toBe(true);
    expect(registry.listNamespaces().sort()).toEqual(['browser', 'other']);
    expect(registry.getTools('browser').map((t) => t.name)).toEqual(['db_get', 'db_put']);
    expect(registry.getTools().map((t) => t.name).sort()).toEqual(['db_get', 'db_put', 'some_tool']);

    registry.unregister('browser');
    expect(registry.has('browser')).toBe(false);
    expect(registry.getTools().map((t) => t.name)).toEqual(['some_tool']);
  });

  it('replaces a namespace on re-registration rather than appending', () => {
    const registry = new ClientToolRegistry();
    registry.register('browser', [tool('db_get')]);
    registry.register('browser', [tool('exec_js')]);
    expect(registry.getTools('browser').map((t) => t.name)).toEqual(['exec_js']);
  });
});

describe('Agent tool merging with clientToolRegistry', () => {
  afterEach(() => {
    // The singleton is process-wide — never leak a registration across tests.
    clientToolRegistry.unregister('browser');
  });

  it('merges registered tools into external_tools when no explicit tools are passed', () => {
    clientToolRegistry.register('browser', [tool('db_get'), tool('exec_js')]);
    const agent = makeAgent();
    const params: any = {
      message: { messageId: 'm1', role: 'user', parts: [], kind: 'message' },
    };

    const out = (agent as any).enhanceParamsWithTools(params);
    const meta = out.metadata as ExecutorContextMetadata;
    const names = meta.external_tools?.map((t) => t.name) ?? [];
    expect(names.sort()).toEqual(['db_get', 'exec_js']);
  });

  it('lets an explicit tool with the same name win over a registered one', () => {
    clientToolRegistry.register('browser', [tool('db_get')]);
    const agent = makeAgent();
    const explicitDbGet: DistriBaseTool = {
      name: 'db_get',
      description: 'caller-supplied override',
      parameters: {},
      type: 'function',
    };
    const params: any = {
      message: { messageId: 'm2', role: 'user', parts: [], kind: 'message' },
    };

    const out = (agent as any).enhanceParamsWithTools(params, [explicitDbGet]);
    const meta = out.metadata as ExecutorContextMetadata;
    expect(meta.external_tools).toHaveLength(1);
    expect(meta.external_tools?.[0]).toMatchObject({
      name: 'db_get',
      description: 'caller-supplied override',
    });
  });

  it('satisfies a required external tool via the registry alone, with no explicit tools passed', () => {
    clientToolRegistry.register('browser', [tool('db_get'), tool('exec_js')]);
    const agent = makeAgent({ external: ['db_get', 'exec_js'] });
    const params: any = {
      message: { messageId: 'm3', role: 'user', parts: [], kind: 'message' },
    };

    // Would throw ExternalToolValidationError if the registry weren't merged in.
    expect(() => (agent as any).enhanceParamsWithTools(params)).not.toThrow();
  });

  it('does nothing when no namespace is registered', () => {
    const agent = makeAgent();
    const params: any = {
      message: { messageId: 'm4', role: 'user', parts: [], kind: 'message' },
    };
    const out = (agent as any).enhanceParamsWithTools(params);
    const meta = out.metadata as ExecutorContextMetadata;
    expect(meta.external_tools).toEqual([]);
  });
});
