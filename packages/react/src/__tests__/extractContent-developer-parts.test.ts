import { describe, it, expect } from 'vitest'
import { extractContent } from '../components/renderers/utils'
import type { DistriMessage, DistriPart, ImagePart } from '@distri/core'

const text = (data: string): DistriPart => ({ part_type: 'text', data })
const image = (name: string): ImagePart => ({
  part_type: 'image',
  data: { type: 'bytes', mime_type: 'image/png', bytes: 'AAAA', name },
})

function userMessage(parts: DistriPart[], partsMetadata?: Record<number, { developer?: boolean; save?: boolean }>): DistriMessage {
  return {
    id: 'm1',
    role: 'user',
    parts,
    created_at: 0,
    metadata: partsMetadata ? { parts: partsMetadata } : undefined,
  }
}

describe('extractContent — developer-flagged parts are hidden', () => {
  it('renders all parts when no metadata is set', () => {
    const msg = userMessage([
      text('hello'),
      text('world'),
      image('a.png'),
    ])
    const out = extractContent(msg)
    expect(out.text).toBe('hello world')
    expect(out.imageParts).toHaveLength(1)
    expect((out.imageParts[0].data as { name?: string }).name).toBe('a.png')
  })

  it('drops a text part flagged developer:true from the rendered text', () => {
    const msg = userMessage(
      [
        text('Import student submissions for grading.'),
      ],
      { 1: { developer: true, save: false } },
    )
    const out = extractContent(msg)
    expect(out.text).toBe('Import student submissions for grading.')
    expect(out.text).not.toContain('class_id')
    expect(out.imageParts).toHaveLength(0)
  })

  it('drops image parts flagged developer:true from imageParts', () => {
    const msg = userMessage(
      [text('Imported 2 image(s).'), image('p1.png'), image('p2.png')],
      {
        1: { developer: true, save: false },
        2: { developer: true, save: false },
      },
    )
    const out = extractContent(msg)
    expect(out.text).toBe('Imported 2 image(s).')
    expect(out.imageParts).toHaveLength(0)
    expect(out.hasImages).toBe(false)
  })

  it('keeps unflagged parts even when other indices are flagged', () => {
    const msg = userMessage(
      [text('headline'), text('developer-only'), image('a.png'), image('b.png')],
      {
        1: { developer: true, save: false },
        // index 2 not flagged → image stays
        3: { developer: true, save: false },
      },
    )
    const out = extractContent(msg)
    expect(out.text).toBe('headline')
    expect(out.imageParts).toHaveLength(1)
    expect((out.imageParts[0].data as { name?: string }).name).toBe('a.png')
  })

  it('developer flag is independent of save', () => {
    // developer:true with save:true (persisted but hidden) is still hidden
    const msg = userMessage(
      [text('keep'), text('hidden but persisted')],
      { 1: { developer: true, save: true } },
    )
    const out = extractContent(msg)
    expect(out.text).toBe('keep')
  })

  it('treats absent / false developer flag as visible', () => {
    const msg = userMessage(
      [text('a'), text('b')],
      { 1: { developer: false, save: false } },
    )
    const out = extractContent(msg)
    expect(out.text).toBe('a b')
  })
})
