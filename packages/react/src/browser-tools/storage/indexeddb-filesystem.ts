/**
 * IndexedDB-backed filesystem for browser-tools.
 *
 * Provides the storage layer for Read/Write/Edit/Grep/Glob tools running
 * in the browser. Each projectId maps to its own IndexedDB database.
 */

import type { FileRecord, FileInfo, DirectoryTreeNode, SearchMatch } from '../types'

const DB_PREFIX = 'browser-tools-'
const STORE_NAME = 'entries'

// ── Path utilities ──────────────────────────────────────────────────────────

function normalizePath(rawPath: string): string {
  if (!rawPath) return ''
  return rawPath.replace(/\\/g, '/').replace(/\/+/g, '/').replace(/^\/+|\/+$/g, '')
}

function dirname(path: string): string {
  const segments = normalizePath(path).split('/').filter(Boolean)
  if (segments.length <= 1) return ''
  return segments.slice(0, -1).join('/')
}

function basename(path: string): string {
  const segments = normalizePath(path).split('/').filter(Boolean)
  return segments.length ? segments[segments.length - 1] : ''
}

function isChildOf(parent: string, child: string): boolean {
  if (!parent) return true
  const p = normalizePath(parent)
  const c = normalizePath(child)
  return c.startsWith(`${p}/`)
}

function isDirectChildOf(parent: string, child: string): boolean {
  const p = normalizePath(parent)
  const c = normalizePath(child)
  if (!p) return !c.includes('/')
  if (!c.startsWith(`${p}/`)) return false
  const rest = c.slice(p.length + 1)
  return !rest.includes('/')
}

function requestAsPromise<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error ?? new Error('IndexedDB request failed'))
  })
}

// ── Glob matching ───────────────────────────────────────────────────────────

function globToRegex(pattern: string): RegExp {
  let regex = ''
  let i = 0
  while (i < pattern.length) {
    const c = pattern[i]
    if (c === '*' && pattern[i + 1] === '*') {
      // ** matches any path segments
      regex += '.*'
      i += 2
      if (pattern[i] === '/') i++ // skip trailing slash after **
    } else if (c === '*') {
      // * matches anything except /
      regex += '[^/]*'
      i++
    } else if (c === '?') {
      regex += '[^/]'
      i++
    } else if (c === '{') {
      regex += '('
      i++
    } else if (c === '}') {
      regex += ')'
      i++
    } else if (c === ',') {
      regex += '|'
      i++
    } else if ('.+^$|()[]\\'.includes(c)) {
      regex += '\\' + c
      i++
    } else {
      regex += c
      i++
    }
  }
  return new RegExp(`^${regex}$`)
}

// ── Memory fallback ─────────────────────────────────────────────────────────

class MemoryAdapter {
  private store = new Map<string, FileRecord>()

  async get(path: string): Promise<FileRecord | undefined> {
    return this.store.get(path)
  }
  async put(record: FileRecord): Promise<void> {
    this.store.set(record.path, record)
  }
  async delete(path: string): Promise<void> {
    this.store.delete(path)
  }
  async getAll(): Promise<FileRecord[]> {
    return Array.from(this.store.values())
  }
}

// ── IndexedDbFilesystem ─────────────────────────────────────────────────────

export class IndexedDbFilesystem {
  private static instances = new Map<string, IndexedDbFilesystem>()

  static forProject(projectId: string): IndexedDbFilesystem {
    const id = projectId || 'default'
    if (!this.instances.has(id)) {
      this.instances.set(id, new IndexedDbFilesystem(id))
    }
    return this.instances.get(id)!
  }

  readonly projectId: string
  private readonly hasIndexedDb: boolean
  private readonly memory: MemoryAdapter
  private dbPromise?: Promise<IDBDatabase>

  private constructor(projectId: string) {
    this.projectId = projectId
    this.hasIndexedDb = typeof indexedDB !== 'undefined'
    this.memory = new MemoryAdapter()
    if (this.hasIndexedDb) {
      this.dbPromise = this.openDatabase()
    }
  }

  private async openDatabase(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(`${DB_PREFIX}${this.projectId}`, 1)
      req.onupgradeneeded = () => {
        const db = req.result
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'path' })
          store.createIndex('byType', 'type', { unique: false })
        }
      }
      req.onsuccess = () => resolve(req.result)
      req.onerror = () => reject(req.error ?? new Error('Failed to open IndexedDB'))
    })
  }

  private async withStore<T>(mode: IDBTransactionMode, cb: (store: IDBObjectStore) => Promise<T> | T): Promise<T> {
    if (!this.hasIndexedDb || !this.dbPromise) {
      throw new Error('IndexedDB not available')
    }
    const db = await this.dbPromise
    const tx = db.transaction(STORE_NAME, mode)
    const store = tx.objectStore(STORE_NAME)
    const result = await cb(store)
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error ?? new Error('Transaction failed'))
    })
    return result
  }

  private async getRecord(path: string): Promise<FileRecord | undefined> {
    const p = normalizePath(path)
    if (!this.hasIndexedDb || !this.dbPromise) return this.memory.get(p)
    return this.withStore('readonly', (store) => requestAsPromise<FileRecord | undefined>(store.get(p)))
  }

  private async putRecord(record: FileRecord): Promise<void> {
    if (!this.hasIndexedDb || !this.dbPromise) return this.memory.put(record)
    await this.withStore('readwrite', (store) => { store.put(record) })
  }

  private async deleteRecord(path: string): Promise<void> {
    const p = normalizePath(path)
    if (!this.hasIndexedDb || !this.dbPromise) return this.memory.delete(p)
    await this.withStore('readwrite', (store) => { store.delete(p) })
  }

  private async getAllRecords(): Promise<FileRecord[]> {
    if (!this.hasIndexedDb || !this.dbPromise) return this.memory.getAll()
    return this.withStore('readonly', (store) => requestAsPromise<FileRecord[]>(store.getAll()))
  }

  private async ensureParents(path: string): Promise<void> {
    let parent = dirname(path)
    while (parent) {
      const existing = await this.getRecord(parent)
      if (existing?.type === 'directory') break
      await this.putRecord({
        path: parent,
        type: 'directory',
        createdAt: existing?.createdAt ?? Date.now(),
        updatedAt: Date.now(),
      })
      parent = dirname(parent)
    }
  }

  // ── Public API ──────────────────────────────────────────────────────────

  async writeFile(path: string, content: string): Promise<{ path: string; bytes_written: number }> {
    const p = normalizePath(path)
    await this.ensureParents(p)
    const existing = await this.getRecord(p)
    await this.putRecord({
      path: p,
      type: 'file',
      content,
      createdAt: existing?.createdAt ?? Date.now(),
      updatedAt: Date.now(),
    })
    return { path: p, bytes_written: new TextEncoder().encode(content).length }
  }

  async readFile(path: string): Promise<{ path: string; content: string }> {
    const p = normalizePath(path)
    const record = await this.getRecord(p)
    if (!record || record.type !== 'file') {
      throw new Error(`File not found: ${p}`)
    }
    return { path: p, content: record.content ?? '' }
  }

  async readFileWithLines(path: string, offset = 0, limit = 2000): Promise<{
    content: string
    total_lines: number
    lines_read: number
    truncated: boolean
  }> {
    const { content } = await this.readFile(path)
    const allLines = content.split('\n')
    const total_lines = allLines.length
    const slice = allLines.slice(offset, offset + limit)
    const formatted = slice.map((line, i) => {
      const num = String(offset + i + 1).padStart(4, ' ')
      return `${num}\t${line}`
    }).join('\n')
    return {
      content: formatted,
      total_lines,
      lines_read: slice.length,
      truncated: offset + limit < total_lines,
    }
  }

  async editFile(
    path: string,
    oldString: string,
    newString: string,
    replaceAll = false,
  ): Promise<{ path: string; replacements: number }> {
    const { content } = await this.readFile(path)

    if (!replaceAll) {
      const first = content.indexOf(oldString)
      if (first === -1) throw new Error(`old_string not found in ${path}`)
      const second = content.indexOf(oldString, first + 1)
      if (second !== -1) throw new Error(`old_string is not unique in ${path}. Use replace_all or provide more context.`)
      const updated = content.slice(0, first) + newString + content.slice(first + oldString.length)
      await this.writeFile(path, updated)
      return { path: normalizePath(path), replacements: 1 }
    }

    let count = 0
    let updated = content
    while (updated.includes(oldString)) {
      updated = updated.replace(oldString, newString)
      count++
    }
    if (count === 0) throw new Error(`old_string not found in ${path}`)
    await this.writeFile(path, updated)
    return { path: normalizePath(path), replacements: count }
  }

  async deleteEntry(path: string, recursive = false): Promise<void> {
    const p = normalizePath(path)
    const record = await this.getRecord(p)
    if (!record) throw new Error(`Not found: ${p}`)

    if (record.type === 'directory' && !recursive) {
      const all = await this.getAllRecords()
      const children = all.filter((r) => isChildOf(p, r.path) && r.path !== p)
      if (children.length > 0) throw new Error(`Directory not empty: ${p}. Use recursive delete.`)
    }

    if (record.type === 'directory' && recursive) {
      const all = await this.getAllRecords()
      for (const r of all) {
        if (isChildOf(p, r.path) || r.path === p) {
          await this.deleteRecord(r.path)
        }
      }
    } else {
      await this.deleteRecord(p)
    }
  }

  async createDirectory(path: string): Promise<void> {
    const p = normalizePath(path)
    await this.ensureParents(p)
    const existing = await this.getRecord(p)
    if (existing?.type === 'directory') return
    await this.putRecord({
      path: p,
      type: 'directory',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    })
  }

  async listDirectory(path: string, recursive = false): Promise<string[]> {
    const p = normalizePath(path)
    const all = await this.getAllRecords()
    return all
      .filter((r) => {
        if (r.path === p) return false
        return recursive ? isChildOf(p, r.path) : isDirectChildOf(p, r.path)
      })
      .map((r) => r.path)
      .sort()
  }

  async getFileInfo(path: string): Promise<FileInfo> {
    const p = normalizePath(path)
    const record = await this.getRecord(p)
    if (!record) throw new Error(`Not found: ${p}`)
    const size = record.content ? new TextEncoder().encode(record.content).length : 0
    return {
      path: p,
      size,
      is_file: record.type === 'file',
      is_dir: record.type === 'directory',
      modified: record.updatedAt,
      created: record.createdAt,
    }
  }

  async glob(pattern: string, basePath?: string): Promise<string[]> {
    const all = await this.getAllRecords()
    const files = all.filter((r) => r.type === 'file')
    const regex = globToRegex(pattern)

    return files
      .filter((r) => {
        const testPath = basePath ? (isChildOf(basePath, r.path) ? r.path.slice(normalizePath(basePath).length + 1) : null) : r.path
        if (testPath === null) return false
        return regex.test(testPath)
      })
      .sort((a, b) => b.updatedAt - a.updatedAt)
      .map((r) => r.path)
  }

  async grep(
    pattern: string,
    options: {
      path?: string
      glob?: string
      caseInsensitive?: boolean
      outputMode?: 'content' | 'files_with_matches' | 'count'
      beforeContext?: number
      afterContext?: number
      headLimit?: number
    } = {},
  ): Promise<{
    matches: SearchMatch[]
    output: string
    total_matches: number
  }> {
    const {
      path: basePath,
      glob: globPattern,
      caseInsensitive = false,
      outputMode = 'files_with_matches',
      beforeContext = 0,
      afterContext = 0,
      headLimit = 250,
    } = options

    const flags = caseInsensitive ? 'gi' : 'g'
    let regex: RegExp
    try {
      regex = new RegExp(pattern, flags)
    } catch {
      throw new Error(`Invalid regex pattern: ${pattern}`)
    }

    const all = await this.getAllRecords()
    let files = all.filter((r) => r.type === 'file')

    if (basePath) {
      const bp = normalizePath(basePath)
      files = files.filter((r) => isChildOf(bp, r.path) || r.path === bp)
    }
    if (globPattern) {
      const gr = globToRegex(globPattern)
      files = files.filter((r) => gr.test(basename(r.path)))
    }

    const matches: SearchMatch[] = []
    let totalMatches = 0

    for (const file of files) {
      if (totalMatches >= headLimit) break
      const content = file.content ?? ''
      const lines = content.split('\n')
      const fileMatches: Array<{ line_number: number; line_content: string }> = []

      for (let i = 0; i < lines.length; i++) {
        regex.lastIndex = 0
        if (regex.test(lines[i])) {
          const start = Math.max(0, i - beforeContext)
          for (let j = start; j < i; j++) {
            if (!fileMatches.some((m) => m.line_number === j + 1)) {
              fileMatches.push({ line_number: j + 1, line_content: lines[j] })
            }
          }
          fileMatches.push({ line_number: i + 1, line_content: lines[i] })
          const end = Math.min(lines.length - 1, i + afterContext)
          for (let j = i + 1; j <= end; j++) {
            if (!fileMatches.some((m) => m.line_number === j + 1)) {
              fileMatches.push({ line_number: j + 1, line_content: lines[j] })
            }
          }
          totalMatches++
        }
      }

      if (fileMatches.length > 0) {
        fileMatches.sort((a, b) => a.line_number - b.line_number)
        matches.push({ path: file.path, matches: fileMatches })
      }
    }

    let output = ''
    if (outputMode === 'files_with_matches') {
      output = matches.map((m) => m.path).join('\n')
    } else if (outputMode === 'count') {
      output = matches.map((m) => `${m.path}:${m.matches.length}`).join('\n')
    } else {
      const lines: string[] = []
      for (const m of matches) {
        for (const hit of m.matches) {
          lines.push(`${m.path}:${hit.line_number}:${hit.line_content}`)
        }
      }
      output = lines.slice(0, headLimit).join('\n')
    }

    return { matches, output, total_matches: totalMatches }
  }

  async tree(path?: string): Promise<DirectoryTreeNode> {
    const p = normalizePath(path ?? '')
    const all = await this.getAllRecords()
    const relevant = all.filter((r) => p ? (isChildOf(p, r.path) || r.path === p) : true)

    const root: DirectoryTreeNode = {
      name: p ? basename(p) : '.',
      path: p || '.',
      type: 'directory',
      children: [],
    }

    const nodeMap = new Map<string, DirectoryTreeNode>()
    nodeMap.set(p || '.', root)

    const sorted = relevant
      .filter((r) => r.path !== p)
      .sort((a, b) => a.path.split('/').length - b.path.split('/').length)

    for (const record of sorted) {
      const node: DirectoryTreeNode = {
        name: basename(record.path),
        path: record.path,
        type: record.type,
        children: record.type === 'directory' ? [] : undefined,
      }
      nodeMap.set(record.path, node)

      const parentPath = dirname(record.path) || p || '.'
      const parent = nodeMap.get(parentPath)
      if (parent?.children) {
        parent.children.push(node)
      }
    }

    return root
  }
}

export { normalizePath, basename, dirname, globToRegex }
