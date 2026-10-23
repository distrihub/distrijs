import { afterEach, describe, expect, it, vi } from 'vitest';
import { uuid } from '../uuid';

const V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

describe('uuid', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('uses crypto.randomUUID when present', () => {
    expect(uuid()).toMatch(V4);
  });

  it('works without crypto.randomUUID (plain-http origins)', () => {
    // Insecure contexts expose getRandomValues but not randomUUID.
    const real = globalThis.crypto;
    const getRandomValues = (a: Uint8Array) => real.getRandomValues(a);
    vi.stubGlobal('crypto', { getRandomValues });
    const ids = new Set(Array.from({ length: 100 }, () => uuid()));
    expect(ids.size).toBe(100);
    for (const id of ids) expect(id).toMatch(V4);
  });
});
