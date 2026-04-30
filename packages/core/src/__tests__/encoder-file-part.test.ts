import { describe, it, expect } from 'vitest';
import { convertA2APartToDistri, convertDistriPartToA2A } from '../encoder';
import type { Part as A2APart } from '@a2a-js/sdk';

describe('encoder file-part MIME routing', () => {
  it('routes A2A pdf file → distri part_type:file', () => {
    const a2a: A2APart = {
      kind: 'file',
      file: {
        bytes: 'JVBERi0xLjQK',
        mimeType: 'application/pdf',
        name: 'r.pdf',
      },
    };
    const distri = convertA2APartToDistri(a2a);
    expect(distri.part_type).toBe('file');
    expect(distri.data).toMatchObject({
      type: 'bytes',
      mime_type: 'application/pdf',
      bytes: 'JVBERi0xLjQK',
    });
  });

  it('routes A2A image file → distri part_type:image (unchanged)', () => {
    const a2a: A2APart = {
      kind: 'file',
      file: {
        uri: 'https://example.com/cat.png',
        mimeType: 'image/png',
      },
    };
    const distri = convertA2APartToDistri(a2a);
    expect(distri.part_type).toBe('image');
  });

  it('routes A2A unknown-mime file → distri part_type:file', () => {
    const a2a: A2APart = {
      kind: 'file',
      file: { bytes: 'AAA', mimeType: 'application/octet-stream' },
    };
    expect(convertA2APartToDistri(a2a).part_type).toBe('file');
  });

  it('round-trips distri file → A2A file', () => {
    const distri = {
      part_type: 'file' as const,
      data: { type: 'url' as const, mime_type: 'application/pdf', url: 'https://e.com/d.pdf' },
    };
    const a2a = convertDistriPartToA2A(distri);
    expect(a2a.kind).toBe('file');
    expect((a2a as any).file).toMatchObject({
      uri: 'https://e.com/d.pdf',
      mimeType: 'application/pdf',
    });
  });
});
