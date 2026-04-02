import { describe, it, expect } from 'vitest';
import { getToolSummary } from '../components/renderers/tools/getToolSummary';

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

  it('read_file: extracts basename', () => {
    const s = getToolSummary('read_file', { path: 'src/client_config.rs' });
    expect(s.verb).toBe('Read');
    expect(s.subject).toBe('client_config.rs');
  });

  it('write_file: verb is Write', () => {
    const s = getToolSummary('write_file', { path: 'docs/design.md' });
    expect(s.verb).toBe('Write');
    expect(s.subject).toBe('design.md');
  });

  it('edit_file: verb is Edit', () => {
    const s = getToolSummary('edit_file', { path: 'Cargo.toml' });
    expect(s.verb).toBe('Edit');
    expect(s.subject).toBe('Cargo.toml');
  });

  it('search: extracts query', () => {
    const s = getToolSummary('search', { query: 'bearer token' });
    expect(s.verb).toBe('Search');
    expect(s.subject).toBe('bearer token');
  });

  it('grep: extracts pattern', () => {
    const s = getToolSummary('grep', { pattern: '*.rs' });
    expect(s.verb).toBe('Search');
    expect(s.subject).toBe('*.rs');
  });

  it('execute_shell: verb is Run, truncates long commands', () => {
    const longCmd = 'cargo build --release --target x86_64-unknown-linux-musl-very-long';
    const s = getToolSummary('execute_shell', { command: longCmd });
    expect(s.verb).toBe('Run');
    expect(s.subject!.length).toBe(41); // 40 chars + ellipsis char
  });

  it('fallback: uses tool name as verb, first string value as subject', () => {
    const s = getToolSummary('transfer_to_agent', { agent_name: 'coder' });
    expect(s.verb).toBe('transfer_to_agent');
    expect(s.subject).toBe('coder');
  });

  it('delete_file: verb is Delete', () => {
    const s = getToolSummary('delete_file', { path: 'old/file.rs' });
    expect(s.verb).toBe('Delete');
    expect(s.subject).toBe('file.rs');
  });

  it('glob: verb is Find', () => {
    const s = getToolSummary('glob', { pattern: '**/*.tsx' });
    expect(s.verb).toBe('Find');
    expect(s.subject).toBe('**/*.tsx');
  });

  it('custom override takes priority', () => {
    const override = () => ({ verb: 'Custom', subject: 'override', detail: undefined });
    const s = getToolSummary('my_tool', { x: 'y' }, undefined, { my_tool: override });
    expect(s.verb).toBe('Custom');
    expect(s.subject).toBe('override');
  });
});
