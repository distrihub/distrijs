import type { IndexedDbFilesystem } from '../storage/indexeddb-filesystem'

export interface ReadParams {
  file_path: string
  offset?: number
  limit?: number
}

export const READ_TOOL_DEF = {
  name: 'Read',
  description: 'Read a file from the local filesystem.',
  prompt:
    'Reads a file from the local filesystem.\n' +
    '- Results are returned using `cat -n` format, with line numbers starting at 1.\n' +
    '- By default reads up to 2000 lines from the beginning of the file.\n' +
    '- When you already know which part of the file you need, only read that part using `offset` and `limit`.\n' +
    '- The `file_path` can be absolute or relative to the project root.',
  parameters: {
    type: 'object',
    required: ['file_path'],
    properties: {
      file_path: { type: 'string', description: 'The path to the file to read' },
      offset: { type: 'number', description: 'The line number to start reading from (0-based)' },
      limit: { type: 'number', description: 'The number of lines to read' },
    },
  },
} as const

export function createReadHandler(fs: IndexedDbFilesystem) {
  return async (input: unknown) => {
    const params = input as ReadParams
    const result = await fs.readFileWithLines(
      params.file_path,
      params.offset ?? 0,
      params.limit ?? 2000,
    )
    return [{ part_type: 'data' as const, data: {
      content: result.content,
      file_path: params.file_path,
      total_lines: result.total_lines,
      lines_read: result.lines_read,
      truncated: result.truncated,
    } }]
  }
}
