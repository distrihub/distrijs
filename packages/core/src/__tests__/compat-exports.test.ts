import { describe, expect, it } from 'vitest';
import * as core from '../index';

// Names @distri/core 0.4.6 exported that apps still import. Removing one
// breaks their build on upgrade; deprecate first, remove in a minor with a note.
describe('0.4.x export compatibility', () => {
  it('still exports uuidv4 as an alias of uuid', () => {
    expect(typeof core.uuidv4).toBe('function');
    expect(core.uuidv4()).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  });
});
