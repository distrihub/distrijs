import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { DistriClient } from '@distri/core';
import { stubFetch } from '../scripts/lib';
import { helloWorldStream } from '../fixtures/streams';

describe('DistriClient — smoke', () => {
  let restore: () => void;

  beforeEach(() => {
    ({ restore } = stubFetch(helloWorldStream));
  });
  afterEach(() => restore());

  it('initializes against a stubbed agent.json', async () => {
    const client = new DistriClient({
      baseUrl: 'http://localhost:1341/v1',
      apiKey: 'dak_test',
    });
    expect(client).toBeTruthy();
  });
});
