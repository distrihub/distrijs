import type { IndexedDbFilesystem } from '../storage/indexeddb-filesystem'

export interface GrepParams {
  pattern: string
  path?: string
  glob?: string
  output_mode?: 'content' | 'files_with_matches' | 'count'
  '-A'?: number
  '-B'?: number
  '-C'?: number
  '-i'?: boolean
  '-n'?: boolean
  head_limit?: number
}

export const GREP_TOOL_DEF = {
  name: 'Grep',
  description: 'Search file contents with regex.',
  prompt:
    'Powerful regex search tool for file contents.\n' +
    '- ALWAYS use Grep for content search tasks.\n' +
    '- Supports full regex syntax (e.g., `log.*Error`, `function\\s+\\w+`).\n' +
    '- Filter files with `glob` parameter (e.g., `*.js`).\n' +
    '- Output modes: `content` shows matching lines, `files_with_matches` shows only file paths (default), `count` shows match counts.\n' +
    '- Use `-A`, `-B`, `-C` for context lines around matches.',
  parameters: {
    type: 'object',
    required: ['pattern'],
    properties: {
      pattern: { type: 'string', description: 'The regex pattern to search for' },
      path: { type: 'string', description: 'File or directory to search in' },
      glob: { type: 'string', description: 'Glob pattern to filter files' },
      output_mode: {
        type: 'string',
        enum: ['content', 'files_with_matches', 'count'],
        description: 'Output mode (default: files_with_matches)',
      },
      '-A': { type: 'number', description: 'Lines after match' },
      '-B': { type: 'number', description: 'Lines before match' },
      '-C': { type: 'number', description: 'Context lines' },
      '-i': { type: 'boolean', description: 'Case insensitive' },
      '-n': { type: 'boolean', description: 'Show line numbers' },
      head_limit: { type: 'number', description: 'Limit output lines (default 250)' },
    },
  },
} as const

export function createGrepHandler(fs: IndexedDbFilesystem) {
  return async (input: unknown) => {
    const params = input as GrepParams
    const context = params['-C'] ?? 0
    const headLimit = params.head_limit ?? 250
    const result = await fs.grep(params.pattern, {
      path: params.path,
      glob: params.glob,
      caseInsensitive: params['-i'] ?? false,
      outputMode: params.output_mode ?? 'files_with_matches',
      beforeContext: params['-B'] ?? context,
      afterContext: params['-A'] ?? context,
      headLimit,
    })
    return [{ part_type: 'data' as const, data: {
      output: result.output,
      total_lines: result.total_matches,
      truncated: result.total_matches > headLimit,
      exit_code: result.total_matches > 0 ? 0 : 1,
      stderr: null,
    } }]
  }
}
