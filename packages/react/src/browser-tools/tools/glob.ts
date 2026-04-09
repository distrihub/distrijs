import type { IndexedDbFilesystem } from '../storage/indexeddb-filesystem'

export interface GlobParams {
  pattern: string
  path?: string
}

export const GLOB_TOOL_DEF = {
  name: 'Glob',
  description: 'Fast file pattern matching tool.',
  prompt:
    'Fast file pattern matching tool that works with any project size.\n' +
    '- Supports glob patterns like `**/*.js` or `src/**/*.ts`.\n' +
    '- Returns matching file paths sorted by modification time.\n' +
    '- Use this tool when you need to find files by name patterns.',
  parameters: {
    type: 'object',
    required: ['pattern'],
    properties: {
      pattern: { type: 'string', description: 'The glob pattern to match files against' },
      path: { type: 'string', description: 'The directory to search in (defaults to project root)' },
    },
  },
} as const

export function createGlobHandler(fs: IndexedDbFilesystem) {
  return async (input: unknown) => {
    const params = input as GlobParams
    const start = Date.now()
    const filenames = await fs.glob(params.pattern, params.path)
    const duration_ms = Date.now() - start
    return [{
      part_type: 'data' as const,
      data: {
        filenames,
        num_files: filenames.length,
        duration_ms,
        truncated: false,
      },
    }]
  }
}
