import { describe, it, expect } from 'vitest'
import { SentenceChunker, cleanMarkdown } from '../voice/SentenceChunker'

/** Feed text in fixed-size deltas and collect every emitted sentence (plus flush). */
function chunk(text: string, deltaSize = 7, options?: ConstructorParameters<typeof SentenceChunker>[0]): string[] {
  const chunker = new SentenceChunker(options)
  const out: string[] = []
  for (let i = 0; i < text.length; i += deltaSize) {
    out.push(...chunker.push(text.slice(i, i + deltaSize)))
  }
  out.push(...chunker.flush())
  return out
}

describe('SentenceChunker', () => {
  const table: Array<[name: string, input: string, expected: string[]]> = [
    ['splits at . ! ? followed by whitespace', 'Hello there world. How are you doing? Great to hear!', ['Hello there world.', 'How are you doing?', 'Great to hear!']],
    ['abbreviation guard: Dr.', 'Dr. Smith arrived late. He was tired.', ['Dr. Smith arrived late.', 'He was tired.']],
    ['abbreviation guard: e.g.', 'Use fruit, e.g. apples and pears. Then stop there.', ['Use fruit, e.g. apples and pears.', 'Then stop there.']],
    ['abbreviation guard: vs. and etc.', 'Cats vs. dogs, birds, etc. are pets. Fish too maybe.', ['Cats vs. dogs, birds, etc. are pets.', 'Fish too maybe.']],
    ['decimals are not boundaries', 'Pi is about 3.14 for most uses. Right you are?', ['Pi is about 3.14 for most uses.', 'Right you are?']],
    ['min length merges a short sentence into the next', 'Yes. I think that is right. Okay.', ['Yes. I think that is right.', 'Okay.']],
    ['closing quotes stay with the sentence', 'He said "come here." Then he left the room.', ['He said "come here."', 'Then he left the room.']],
    ['strips emphasis, links and inline code', '**Bold** and _italic_ and [a link](http://x.y/z) and `code` here. Next sentence now.', ['Bold and italic and a link and code here.', 'Next sentence now.']],
    // "Title" alone is under minChars, so it merges into the next chunk.
    ['strips headers and list markers', '# Title\n\n- item one is here.\n- item two is here.', ['Title item one is here.', 'item two is here.']],
    ['paragraph break is a boundary once long enough', '## A longer heading here\n\nBody text follows it.', ['A longer heading here', 'Body text follows it.']],
    ['numbered list markers', '1. First thing to do here.\n2. Second thing to do here.', ['First thing to do here.', 'Second thing to do here.']],
    ['fenced code becomes code omitted', 'Here is code:\n```js\nconsole.log(1);\n```\nThat prints one.', ['Here is code: code omitted.', 'That prints one.']],
    ['thought blocks are dropped', '<thought>Let me think. Hmm.</thought>The answer is four. Done now.', ['The answer is four.', 'Done now.']],
    ['flush emits trailing text without punctuation', 'Hello there. and finally', ['Hello there.', 'and finally']],
    ['ellipsis', 'Well... I am not sure about that. Maybe tomorrow.', ['Well... I am not sure about that.', 'Maybe tomorrow.']],
  ]

  it.each(table)('%s', (_name, input, expected) => {
    expect(chunk(input, 5)).toEqual(expected)
    expect(chunk(input, 1)).toEqual(expected)
    expect(chunk(input, 1000)).toEqual(expected)
  })

  it('splits long text at the last whitespace before 140 chars', () => {
    const words = Array.from({ length: 60 }, (_, i) => `word${i}`)
    const text = words.join(' ')
    const out = chunk(text, 11)
    expect(out.length).toBeGreaterThan(1)
    out.forEach((s) => expect(s.length).toBeLessThanOrEqual(140))
    // no word was cut in half
    expect(out.join(' ')).toBe(text)
  })

  it('does not emit anything shorter than minChars until flush', () => {
    const chunker = new SentenceChunker()
    expect(chunker.push('Hi. ')).toEqual([])
    expect(chunker.push('Ok. ')).toEqual([])
    expect(chunker.flush()).toEqual(['Hi. Ok.'])
  })

  it('holds a partial <thought> tag split across deltas', () => {
    const chunker = new SentenceChunker()
    const out: string[] = []
    out.push(...chunker.push('Sure thing friend. <tho'))
    out.push(...chunker.push('ught>secret plan. more secret.</thou'))
    out.push(...chunker.push('ght>The visible answer. '))
    out.push(...chunker.flush())
    expect(out).toEqual(['Sure thing friend.', 'The visible answer.'])
  })

  it('drops an unclosed thought and closes an unclosed fence at flush', () => {
    expect(chunk('Visible sentence here. <thought>never closed', 4)).toEqual(['Visible sentence here.'])
    expect(chunk('Look at this:\n```py\nprint(1)', 4)).toEqual(['Look at this: code omitted.'])
  })

  it('reset clears buffered state', () => {
    const chunker = new SentenceChunker()
    chunker.push('Partial text that is long enough')
    chunker.reset()
    expect(chunker.flush()).toEqual([])
  })
})

describe('cleanMarkdown', () => {
  it('collapses whitespace and strips markers', () => {
    expect(cleanMarkdown('  ## Heading\n\n> quoted **text**  ')).toBe('Heading quoted text')
    expect(cleanMarkdown('![alt text](img.png) and [x](y)')).toBe('alt text and x')
    expect(cleanMarkdown('snake_case_name stays')).toBe('snake_case_name stays')
  })
})
