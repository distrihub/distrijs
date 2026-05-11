import { describe, it, expect } from 'vitest';
import { getToolSummary } from '../components/renderers/tools/getToolSummary';
import type { ToolResult } from '@distri/core';

const dataResult = (data: unknown): ToolResult => ({
  parts: [{ part_type: 'data', data } as never],
} as ToolResult);

describe('getToolSummary', () => {
  it('HTTP: extracts method and path', () => {
    const s = getToolSummary('api_request', { method: 'POST', path: '/api/sessions' });
    expect(s.verb).toBe('POST');
    expect(s.subject).toBe('/api/sessions');
  });

  it('HTTP: defaults method to GET', () => {
    const s = getToolSummary('distri_request', { path: '/public/skills' });
    expect(s.verb).toBe('GET');
    expect(s.subject).toBe('/public/skills');
  });

  it('HTTP: falls back to url then endpoint', () => {
    const s = getToolSummary('fetch', { url: 'https://example.com' });
    expect(s.subject).toBe('https://example.com');
  });

  it('HTTP: matches *_request pattern', () => {
    const s = getToolSummary('zippy_request', { method: 'GET', path: '/grade' });
    expect(s.verb).toBe('GET');
    expect(s.subject).toBe('/grade');
  });

  it('Read (server tool): extracts basename', () => {
    const s = getToolSummary('Read', { path: 'src/client_config.rs' });
    expect(s.verb).toBe('Read');
    expect(s.subject).toBe('client_config.rs');
  });

  it('Write (server tool): verb is Write', () => {
    const s = getToolSummary('Write', { path: 'docs/design.md' });
    expect(s.verb).toBe('Write');
    expect(s.subject).toBe('design.md');
  });

  it('Edit (server tool): verb is Edit', () => {
    const s = getToolSummary('Edit', { file_path: 'Cargo.toml' });
    expect(s.verb).toBe('Edit');
    expect(s.subject).toBe('Cargo.toml');
  });

  it('search: extracts query', () => {
    const s = getToolSummary('search', { query: 'bearer token' });
    expect(s.verb).toBe('Search');
    expect(s.subject).toBe('bearer token');
  });

  it('Grep: extracts pattern', () => {
    const s = getToolSummary('Grep', { pattern: '*.rs' });
    expect(s.verb).toBe('Search');
    expect(s.subject).toBe('*.rs');
  });

  it('Bash: verb is Run, truncates long commands', () => {
    const longCmd = 'cargo build --release --target x86_64-unknown-linux-musl-very-long';
    const s = getToolSummary('Bash', { command: longCmd });
    expect(s.verb).toBe('Run');
    expect(s.subject!.length).toBe(41); // 40 chars + ellipsis char
  });

  it('Glob: verb is Find', () => {
    const s = getToolSummary('Glob', { pattern: '**/*.tsx' });
    expect(s.verb).toBe('Find');
    expect(s.subject).toBe('**/*.tsx');
  });

  it('db_get: verb Read, subject is collection, detail from result', () => {
    const s = getToolSummary(
      'db_get',
      { collection: 'imports', id: 'abc' },
      dataResult({ record: { id: 'abc' } })
    );
    expect(s.verb).toBe('Read');
    expect(s.subject).toBe('imports');
    expect(s.detail).toBe('1 record');
  });

  it('db_get: detail is "not found" when record missing', () => {
    const s = getToolSummary(
      'db_get',
      { collection: 'imports', id: 'abc' },
      dataResult({ record: null })
    );
    expect(s.detail).toBe('not found');
  });

  it('db_put: verb Updated when id supplied', () => {
    const s = getToolSummary('db_put', { collection: 'submissions', id: 'x', data: {} });
    expect(s.verb).toBe('Updated');
    expect(s.subject).toBe('submissions');
  });

  it('db_put: verb Saved when no id', () => {
    const s = getToolSummary('db_put', { collection: 'submissions', data: {} });
    expect(s.verb).toBe('Saved');
    expect(s.subject).toBe('submissions');
  });

  it('db_list: detail shows count', () => {
    const s = getToolSummary('db_list', { collection: 'imports' }, dataResult({ count: 3, records: [] }));
    expect(s.verb).toBe('Listed');
    expect(s.subject).toBe('imports');
    expect(s.detail).toBe('3 records');
  });

  it('db_search: subject combines collection and query', () => {
    const s = getToolSummary(
      'db_search',
      { collection: 'imports', query: 'foo' },
      dataResult({ count: 1, records: [{}] })
    );
    expect(s.verb).toBe('Searched');
    expect(s.subject).toBe('imports: foo');
    expect(s.detail).toBe('1 match');
  });

  it('db_delete: verb Deleted', () => {
    const s = getToolSummary('db_delete', { collection: 'imports', id: 'abc' });
    expect(s.verb).toBe('Deleted');
    expect(s.subject).toBe('imports');
  });

  it('db_clear: verb Cleared', () => {
    const s = getToolSummary('db_clear', { collection: 'imports' });
    expect(s.verb).toBe('Cleared');
    expect(s.subject).toBe('imports');
  });

  it('db_collections: list collections', () => {
    const s = getToolSummary('db_collections', {}, dataResult({ count: 2, collections: [] }));
    expect(s.verb).toBe('List collections');
    expect(s.detail).toBe('2 collections');
  });

  it('run_skill: subject is skill_id, detail is mode', () => {
    const s = getToolSummary('run_skill', { skill_id: 'plan-trip', mode: 'fork' });
    expect(s.verb).toBe('Run skill');
    expect(s.subject).toBe('plan-trip');
    expect(s.detail).toBe('fork');
  });

  it('load_skill: subject is skill_id', () => {
    const s = getToolSummary('load_skill', { skill_id: 'plan-trip' });
    expect(s.verb).toBe('Load skill');
    expect(s.subject).toBe('plan-trip');
  });

  it('write_todos: detail shows progress', () => {
    const s = getToolSummary('write_todos', {
      todos: [
        { status: 'completed' },
        { status: 'pending' },
        { status: 'completed' },
      ],
    });
    expect(s.verb).toBe('Update todos');
    expect(s.detail).toBe('2/3');
  });

  it('custom override takes priority', () => {
    const override = () => ({ verb: 'Custom', subject: 'override', detail: undefined });
    const s = getToolSummary('my_tool', { x: 'y' }, undefined, { my_tool: override });
    expect(s.verb).toBe('Custom');
    expect(s.subject).toBe('override');
  });

  it('interactive: verb is the tool name (special rendering handled by InteractiveToolCard)', () => {
    const s = getToolSummary('ask_follow_up', { question: 'What is your name?' });
    expect(s.verb).toBe('ask_follow_up');
    expect(s.subject).toBeUndefined();
  });

  it('fallback: uses tool name as verb, first string value as subject', () => {
    const s = getToolSummary('mystery_tool', { foo: 'bar' });
    expect(s.verb).toBe('mystery_tool');
    expect(s.subject).toBe('bar');
  });
});
