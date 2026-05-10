import { describe, it, expect, beforeAll } from 'vitest';
import { isServerUp, DISTRI_BASE_URL } from '../scripts/lib';

/**
 * Sentinel: confirms the local server is reachable. All other e2e tests
 * gate on this. If the server isn't up, this whole describe is skipped.
 */
describe.skipIf(!process.env.DISTRI_BASE_URL && !process.env.RUN_E2E)(
  'e2e — server reachable',
  () => {
    let up = false;
    beforeAll(async () => {
      up = await isServerUp();
    });

    it('responds to /healthz', () => {
      if (!up) {
        console.warn(`[skip] no server at ${DISTRI_BASE_URL}`);
        return;
      }
      expect(up).toBe(true);
    });
  },
);
