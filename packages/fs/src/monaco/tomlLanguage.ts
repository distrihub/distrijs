// Derived from monaco-editor's TOML definition (MIT License).

export const TOML_LANGUAGE_CONFIGURATION = {
  comments: {
    lineComment: '#',
  },
  brackets: [
    ['{', '}'],
    ['[', ']'],
  ],
  autoClosingPairs: [
    { open: '{', close: '}' },
    { open: '[', close: ']' },
    { open: '"', close: '"', notIn: ['string'] },
    { open: "'", close: "'", notIn: ['string', 'comment'] },
  ],
  surroundingPairs: [
    { open: '{', close: '}' },
    { open: '[', close: ']' },
    { open: '"', close: '"' },
    { open: "'", close: "'" },
  ],
};

export const TOML_LANGUAGE = {
  defaultToken: '',
  tokenPostfix: '.toml',
  brackets: [
    { token: 'delimiter.bracket', open: '[', close: ']' },
    { token: 'delimiter.bracket', open: '{', close: '}' },
  ],
  keywords: ['true', 'false', 'nan', 'inf'],
  numberFloat: /[+-]?(?:\d[_\d]*)?(?:\.[\d_]+)?(?:[eE][+-]?[\d_]+)?/, // cspell:disable-line
  escapes: /\\(?:[btnfr"'\\\/]|u[0-9A-Fa-f]{4}|U[0-9A-Fa-f]{8})/,
  tokenizer: {
    root: [
      [/^[ \t]*([a-zA-Z0-9_-]+)(?=\s*=)/, ['key']],
      [/^[ \t]*(\[[^\]\r\n]+\])/, 'table'],
      { include: '@whitespace' },
      { include: '@numbers' },
      { include: '@strings' },
      [/[{}\[\]]/, '@brackets'],
      [/([a-zA-Z0-9_-]+)(?=\s*\=)/, 'key'],
    ],
    numbers: [
      [/@numberFloat(?=\s*[#\n\r])/i, 'number.float'],
      [/0x[0-9a-fA-F][0-9a-fA-F_]*(?=\s*[#\n\r])/, 'number.hex'],
      [/0o[0-7][0-7_]*(?=\s*[#\n\r])/, 'number.oct'],
      [/0b[0-1][0-1_]*(?=\s*[#\n\r])/, 'number.bin'],
    ],
    strings: [
      [/'{3}/, 'string', '@multistring'],
      [/"{3}/, 'string', '@multistringDouble'],
      [/"/, 'string', '@stringDouble'],
      [/'/, 'string', '@string'],
    ],
    multistring: [
      [/[^']+/, 'string'],
      [/'''+/, 'string', '@pop'],
    ],
    multistringDouble: [
      [/[^"\\]+/, 'string'],
      [/"""+/, 'string', '@pop'],
      [/\\./, 'string.escape'],
    ],
    string: [
      [/[^'\\]+/, 'string'],
      [/\\./, 'string.escape'],
      [/'/, 'string', '@pop'],
    ],
    stringDouble: [
      [/[^"\\]+/, 'string'],
      [/\\./, 'string.escape'],
      [/"/, 'string', '@pop'],
    ],
    whitespace: [
      [/[ \t\r\n]+/, 'white'],
      [/#.*$/, 'comment'],
    ],
  },
};
