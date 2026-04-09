import type { IndexedDbFilesystem } from '../storage/indexeddb-filesystem'
import type { FilesystemChangeEvent } from '../types'

export interface EditParams {
  file_path: string
  old_string: string
  new_string: string
  replace_all?: boolean
}

export const EDIT_TOOL_DEF = {
  name: 'Edit',
  description: 'Perform exact string replacements in files.',
  prompt:
    'Performs exact string replacements in files.\n' +
    '- You must use `Read` at least once before editing a file. Read the file first so you know the exact content to match.\n' +
    '- When editing text from `Read` output, preserve the exact indentation (tabs/spaces) as it appears AFTER the line number prefix. The line number prefix format is: line number + tab. Everything after that is the actual file content to match. Never include any part of the line number prefix in `old_string` or `new_string`.\n' +
    '- ALWAYS prefer editing existing files. NEVER write new files unless explicitly required.\n' +
    '- The edit will FAIL if `old_string` is not unique in the file. Either provide a larger string with more surrounding context to make it unique or use `replace_all: true` to change every instance.\n' +
    '- Use `replace_all` for replacing and renaming strings across the file (e.g. renaming a variable).',
  parameters: {
    type: 'object',
    required: ['file_path', 'old_string', 'new_string'],
    properties: {
      file_path: { type: 'string', description: 'The path to the file to edit' },
      old_string: { type: 'string', description: 'The text to replace' },
      new_string: { type: 'string', description: 'The replacement text' },
      replace_all: {
        type: 'boolean',
        description: 'Replace all occurrences (default false)',
        default: false,
      },
    },
  },
} as const

export function createEditHandler(
  fs: IndexedDbFilesystem,
  emit: (event: FilesystemChangeEvent) => void,
) {
  return async (input: unknown) => {
    const params = input as EditParams
    const result = await fs.editFile(
      params.file_path,
      params.old_string,
      params.new_string,
      params.replace_all ?? false,
    )
    emit({ type: 'edit', path: result.path })
    return [{ part_type: 'data' as const, data: {
      file_path: params.file_path,
      replacements: result.replacements,
      success: true,
    } }]
  }
}
