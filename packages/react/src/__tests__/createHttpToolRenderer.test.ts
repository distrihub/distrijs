import { describe, it, expect } from 'vitest';
import { matchPath } from '../components/renderers/tools/HttpToolCard';
import { createHttpToolRenderer } from '../utils/createHttpToolRenderer';

describe('matchPath', () => {
  it('matches exact path', () => {
    expect(matchPath('/api/users', '/api/users')).toBe(true);
  });

  it('matches path with :param wildcard', () => {
    expect(matchPath('/api/users/42', '/api/users/:id')).toBe(true);
  });

  it('matches multiple wildcards', () => {
    expect(matchPath('/api/users/42/posts/7', '/api/users/:id/posts/:postId')).toBe(true);
  });

  it('rejects different segment count', () => {
    expect(matchPath('/api/users/42/extra', '/api/users/:id')).toBe(false);
  });

  it('rejects mismatched literal segment', () => {
    expect(matchPath('/api/posts/42', '/api/users/:id')).toBe(false);
  });

  it('handles leading/trailing slashes', () => {
    expect(matchPath('/api/users/', '/api/users')).toBe(true);
    expect(matchPath('api/users', '/api/users/')).toBe(true);
  });

  it('matches root path', () => {
    expect(matchPath('/', '/')).toBe(true);
  });
});

describe('createHttpToolRenderer', () => {
  it('returns a ToolRendererMap with entries for each tool name', () => {
    const map = createHttpToolRenderer({
      toolNames: ['distri_request', 'api_request'],
      paths: [{ pattern: '/api/users', label: 'Users' }],
    });

    expect(map).toHaveProperty('distri_request');
    expect(map).toHaveProperty('api_request');
    expect(typeof map['distri_request']).toBe('function');
    expect(typeof map['api_request']).toBe('function');
  });

  it('returns empty map for empty toolNames', () => {
    const map = createHttpToolRenderer({ toolNames: [] });
    expect(Object.keys(map)).toHaveLength(0);
  });

  it('works without paths option', () => {
    const map = createHttpToolRenderer({ toolNames: ['fetch'] });
    expect(typeof map['fetch']).toBe('function');
  });
});
