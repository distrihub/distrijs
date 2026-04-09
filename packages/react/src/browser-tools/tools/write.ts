import type { IndexedDbFilesystem } from '../storage/indexeddb-filesystem'
import type { FilesystemChangeEvent } from '../types'

export interface WriteParams {
  file_path: string
  content: string
}

export const WRITE_TOOL_DEF = {
  name: 'Write',
  description: 'Write a file to the local filesystem.',
  prompt:
    'Writes a file to the local filesystem. This will overwrite the existing file if there is one.\n' +
    '- If this is an existing file, you MUST use `Read` first to read the file\'s contents.\n' +
    '- Prefer the `Edit` tool for modifying existing files — it only changes the specific part. Only use `Write` to create new files or for complete rewrites.\n' +
    '- Creates parent directories automatically.\n' +
    '- NEVER create documentation files (*.md) or README files unless explicitly requested.',
  parameters: {
    type: 'object',
    required: ['file_path', 'content'],
    properties: {
      file_path: { type: 'string', description: 'The path to the file to write' },
      content: { type: 'string', description: 'The content to write to the file' },
    },
  },
} as const

export function createWriteHandler(
  fs: IndexedDbFilesystem,
  emit: (event: FilesystemChangeEvent) => void,
) {
  return async (input: unknown) => {
    const params = input as WriteParams
    const result = await fs.writeFile(params.file_path, params.content)
    emit({ type: 'write', path: result.path })
    return [{ part_type: 'data' as const, data: {
      file_path: params.file_path,
      bytes_written: result.bytes_written,
      success: true,
    } }]
  }
}
