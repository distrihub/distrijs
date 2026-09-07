/**
 * Splits streaming assistant text into speakable sentences (spec §2.6).
 *
 * Rules:
 * - split at `. ! ?` (plus any closing quotes/brackets) followed by whitespace,
 *   or at a paragraph break, or at `maxChars` (140) on the last whitespace;
 * - never emit a chunk shorter than `minChars` (12) except on `flush()`;
 * - abbreviation guard (`Mr. Mrs. Dr. e.g. i.e. vs. etc.`) and decimals (`3.14`);
 * - markdown stripped: emphasis, links → their text, headers, list markers,
 *   blockquotes, inline code; fenced code becomes "code omitted";
 * - `<thought>…</thought>` blocks are dropped, even when the tags arrive split
 *   across deltas.
 */
export interface SentenceChunkerOptions {
  maxChars?: number;
  minChars?: number;
  /** Replacement spoken for a fenced code block. */
  codePlaceholder?: string;
}

const ABBREVIATIONS = new Set([
  'mr', 'mrs', 'ms', 'dr', 'prof', 'sr', 'jr', 'st', 'vs', 'etc', 'e.g', 'i.e', 'no', 'fig', 'approx', 'dept', 'inc', 'ltd', 'co',
]);

const THOUGHT_OPEN = /<thought>/i;
const THOUGHT_CLOSE = /<\/thought>/i;
const FENCE = '```';
const BOUNDARY = /[.!?]+["')\]]*(?=\s)|\n\s*\n/g;

export class SentenceChunker {
  private readonly maxChars: number;
  private readonly minChars: number;
  private readonly codePlaceholder: string;

  /** Raw text not yet safe to process (may start an unclosed thought/fence). */
  private raw = '';
  /** Processed text waiting for a sentence boundary. */
  private pending = '';

  constructor(options: SentenceChunkerOptions = {}) {
    this.maxChars = options.maxChars ?? 140;
    this.minChars = options.minChars ?? 12;
    this.codePlaceholder = options.codePlaceholder ?? 'code omitted.';
  }

  /** Feed a streaming delta. Returns the sentences completed by it (already cleaned). */
  push(delta: string): string[] {
    if (!delta) return [];
    this.raw += delta;
    this.pending += this.drainProcessable(false);
    return this.splitPending(false);
  }

  /** End of message: emit whatever is left, dropping unclosed thoughts and closing unclosed fences. */
  flush(): string[] {
    this.pending += this.drainProcessable(true);
    this.raw = '';
    const out = this.splitPending(true);
    this.pending = '';
    return out;
  }

  reset(): void {
    this.raw = '';
    this.pending = '';
  }

  /** Move the prefix of `raw` that contains no unclosed thought/fence into the return value. */
  private drainProcessable(final: boolean): string {
    let out = '';
    for (;;) {
      const thoughtIdx = this.raw.search(THOUGHT_OPEN);
      const fenceIdx = this.raw.indexOf(FENCE);
      const candidates = [thoughtIdx, fenceIdx].filter((i) => i >= 0);
      if (candidates.length === 0) {
        out += this.holdPartialMarker(final);
        return out;
      }
      const idx = Math.min(...candidates);
      out += this.raw.slice(0, idx);
      if (idx === thoughtIdx) {
        const closeMatch = THOUGHT_CLOSE.exec(this.raw.slice(idx));
        if (closeMatch) {
          this.raw = this.raw.slice(idx + closeMatch.index + closeMatch[0].length);
          continue;
        }
        // unclosed thought: hold (or drop at flush)
        this.raw = final ? '' : this.raw.slice(idx);
        return out;
      }
      // fence
      const closeIdx = this.raw.indexOf(FENCE, idx + FENCE.length);
      if (closeIdx >= 0) {
        out += ` ${this.codePlaceholder} `;
        this.raw = this.raw.slice(closeIdx + FENCE.length);
        continue;
      }
      if (final) {
        out += ` ${this.codePlaceholder} `;
        this.raw = '';
      } else {
        this.raw = this.raw.slice(idx);
      }
      return out;
    }
  }

  /**
   * No complete marker in `raw`: everything is processable except a tail that
   * could be the start of `<thought>` or a fence, which stays held until the
   * next delta disambiguates it.
   */
  private holdPartialMarker(final: boolean): string {
    if (final) {
      const all = this.raw;
      this.raw = '';
      return all;
    }
    const partial = /(`{1,2}|<\/?[a-z]*)$/i.exec(this.raw);
    if (partial) {
      const tail = partial[0];
      const lower = tail.toLowerCase();
      if (tail.startsWith('`') || '<thought>'.startsWith(lower) || '</thought>'.startsWith(lower)) {
        const out = this.raw.slice(0, partial.index);
        this.raw = tail;
        return out;
      }
    }
    const all = this.raw;
    this.raw = '';
    return all;
  }

  private splitPending(final: boolean): string[] {
    const out: string[] = [];
    for (;;) {
      const cut = this.findCut();
      if (cut < 0) break;
      const chunk = this.pending.slice(0, cut);
      this.pending = this.pending.slice(cut).replace(/^\s+/, '');
      const cleaned = cleanMarkdown(chunk);
      if (cleaned) out.push(cleaned);
    }
    if (final) {
      const cleaned = cleanMarkdown(this.pending);
      this.pending = '';
      if (cleaned) out.push(cleaned);
    }
    return out;
  }

  /** Index to cut `pending` at, or -1 when nothing is ready. */
  private findCut(): number {
    BOUNDARY.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = BOUNDARY.exec(this.pending)) !== null) {
      const end = m.index + m[0].length;
      if (m[0].startsWith('\n')) {
        if (this.pending.slice(0, m.index).trim().length >= this.minChars) return end;
        continue;
      }
      if (isAbbreviation(this.pending, m.index)) continue;
      if (this.pending.slice(0, end).trim().length < this.minChars) continue;
      return end;
    }
    if (this.pending.length >= this.maxChars) {
      const window = this.pending.slice(0, this.maxChars);
      const ws = window.search(/\s\S*$/);
      if (ws >= this.minChars) return ws + 1;
      return this.maxChars;
    }
    return -1;
  }
}

/** True when the punctuation at `index` ends an abbreviation or a decimal, not a sentence. */
function isAbbreviation(text: string, index: number): boolean {
  if (text[index] !== '.') return false;
  const before = text.slice(0, index);
  const word = /([A-Za-z][A-Za-z.]*)$/.exec(before)?.[1];
  if (word && ABBREVIATIONS.has(word.toLowerCase().replace(/\.$/, ''))) return true;
  // single capital initial: "J. Smith"
  if (word && word.length === 1 && word === word.toUpperCase()) return true;
  return false;
}

/** Strip markdown to speakable text and collapse whitespace. */
export function cleanMarkdown(text: string): string {
  let t = text;
  t = t.replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1');
  t = t.replace(/\[([^\]]*)\]\([^)]*\)/g, '$1');
  t = t.replace(/^[ \t]{0,3}#{1,6}[ \t]+/gm, '');
  t = t.replace(/^[ \t]*(?:[-*+]|\d+[.)])[ \t]+/gm, '');
  t = t.replace(/^[ \t]*>[ \t]?/gm, '');
  t = t.replace(/^[ \t]*([-*_])\1{2,}[ \t]*$/gm, '');
  t = t.replace(/`([^`]*)`/g, '$1');
  t = t.replace(/\*\*|__|~~/g, '');
  t = t.replace(/\*/g, '');
  t = t.replace(/(^|[^\w])_+(?=\w)/g, '$1');
  t = t.replace(/(\w)_+(?=[^\w]|$)/g, '$1');
  t = t.replace(/\s+/g, ' ').trim();
  return t;
}
