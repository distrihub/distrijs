export type EntryType = 'file' | 'directory'

export interface FileRecord {
  path: string
  type: EntryType
  content?: string
  createdAt: number
  updatedAt: number
}

export interface FileInfo {
  path: string
  size: number
  is_file: boolean
  is_dir: boolean
  modified: number
  created: number
}

export interface DirectoryTreeNode {
  name: string
  path: string
  type: EntryType
  children?: DirectoryTreeNode[]
}

export interface SearchMatch {
  path: string
  matches: Array<{ line_number: number; line_content: string }>
}

export type FilesystemChangeType = 'write' | 'edit' | 'delete' | 'create_directory'

export interface FilesystemChangeEvent {
  type: FilesystemChangeType
  path: string
  metadata?: Record<string, unknown>
}

export interface BrowserToolsOptions {
  onChange?: (event: FilesystemChangeEvent) => void
}
