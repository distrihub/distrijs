import { defaultUrlTransform } from 'react-markdown';
import type { UrlTransform } from 'react-markdown';
import { defaultSchema } from 'rehype-sanitize';
import type { Options as RehypeSanitizeOptions } from 'rehype-sanitize';

/**
 * Sanitize schema shared by every markdown renderer. `className` survives on
 * code/span/div for syntax highlighting; `href` protocols are left to
 * {@link markdownUrlTransform} so hosts can use app schemes like
 * `[Fushimi Inari](stop:123)` and handle them in a `markdown.a` override.
 */
export const markdownSanitizeOptions: RehypeSanitizeOptions = {
  ...defaultSchema,
  protocols: {
    ...defaultSchema.protocols,
    href: null,
  },
  attributes: {
    ...defaultSchema.attributes,
    code: [
      ...(defaultSchema.attributes?.code ?? []),
      ['className']
    ],
    span: [
      ...(defaultSchema.attributes?.span ?? []),
      ['className']
    ],
    div: [
      ...(defaultSchema.attributes?.div ?? []),
      ['className']
    ]
  }
};

const BLOCKED_LINK_SCHEMES = new Set(['javascript', 'vbscript', 'data', 'file']);

/**
 * react-markdown's default transform, except that links (`href`) may also use
 * custom app schemes (`stop:`, `place:`, …). Script-capable schemes stay blocked.
 */
export const markdownUrlTransform: UrlTransform = (url, key) => {
  const safe = defaultUrlTransform(url);
  if (safe || key !== 'href') return safe;
  const scheme = /^([a-z][a-z0-9+.-]*):/i.exec(url.trim())?.[1]?.toLowerCase();
  return scheme && !BLOCKED_LINK_SCHEMES.has(scheme) ? url : '';
};
