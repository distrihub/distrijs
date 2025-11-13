/*
  IndexedDB-backed filesystem abstraction used by distrifs-js. Each projectId maps to its own
  database namespace so multiple workspaces can coexist without colliding. The implementation
  mirrors the behaviour of the Rust filesystem tools in a simplified, browser-friendly way.
*/

export type EntryType = 'file' | 'directory' | 'artifact';

export interface FileRecord {
  path: string;
  type: EntryType;
  content?: string;
  createdAt: number;
  updatedAt: number;
}

export interface FileInfo {
  path: string;
  size: number;
  is_file: boolean;
  is_dir: boolean;
  modified: number;
  created: number;
}

export interface DirectoryTreeNode {
  name: string;
  path: string;
  type: EntryType;
  children?: DirectoryTreeNode[];
  updatedAt: number;
}

export interface SearchWithinMatch {
  path: string;
  matches: Array<{ line: number; content: string }>;
}

export interface ReadFileResult {
  path: string;
  content: string;
}

const DB_PREFIX = 'distri-fs-';
const STORE_NAME = 'entries';
const ARTIFACT_PREFIX = '__artifact__/';

function normalizePath(rawPath: string): string {
  if (!rawPath) {
    return '';
  }
  const replaced = rawPath.replace(/\\/g, '/').replace(/\/+/g, '/');
  const trimmed = replaced.replace(/^\/+|\/+$/g, '');
  return trimmed;
}

function dirname(path: string): string {
  const segments = normalizePath(path).split('/').filter(Boolean);
  if (segments.length <= 1) {
    return '';
  }
  return segments.slice(0, -1).join('/');
}

function basename(path: string): string {
  const segments = normalizePath(path).split('/').filter(Boolean);
  return segments.length ? segments[segments.length - 1] : '';
}

function isParent(parent: string, child: string): boolean {
  if (!parent) {
    return true;
  }
  return normalizePath(child).startsWith(`${normalizePath(parent)}/`) || normalizePath(child) === normalizePath(parent);
}

function regexFromPattern(pattern: string): RegExp | undefined {
  try {
    return new RegExp(pattern, 'i');
  } catch (error) {
    console.warn('[distrifs-js] Invalid regex pattern supplied to filesystem search:', error);
    return undefined;
  }
}

async function requestAsPromise<T = unknown>(request: IDBRequest<T>): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    request.onsuccess = () => resolve(request.result as T);
    request.onerror = () => reject(request.error ?? new Error('IndexedDB request failed'));
  });
}

function now(): number {
  return Date.now();
}

class MemoryAdapter {
  private store = new Map<string, FileRecord>();

  async get(path: string): Promise<FileRecord | undefined> {
    return this.store.get(path);
  }

  async put(record: FileRecord): Promise<void> {
    this.store.set(record.path, record);
  }

  async delete(path: string): Promise<void> {
    this.store.delete(path);
  }

  async getAll(): Promise<FileRecord[]> {
    return Array.from(this.store.values());
  }
}

export class IndexedDbFilesystem {
  private static instances = new Map<string, IndexedDbFilesystem>();

  static forProject(projectId: string): IndexedDbFilesystem {
    const normalizedId = projectId || 'default';
    if (!this.instances.has(normalizedId)) {
      this.instances.set(normalizedId, new IndexedDbFilesystem(normalizedId));
    }
    return this.instances.get(normalizedId)!;
  }

  readonly projectId: string;
  private readonly isIndexedDbAvailable: boolean;
  private readonly memoryAdapter: MemoryAdapter;
  private dbPromise?: Promise<IDBDatabase>;
  private remoteFetcher?: (path: string, currentVersion?: number) => Promise<{ content: string; updatedAt?: number } | null>;

  private constructor(projectId: string) {
    this.projectId = projectId;
    this.isIndexedDbAvailable = typeof indexedDB !== 'undefined';
    this.memoryAdapter = new MemoryAdapter();

    if (this.isIndexedDbAvailable) {
      this.dbPromise = this.openDatabase();
    }
  }

  private async openDatabase(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(`${DB_PREFIX}${this.projectId}`, 1);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'path' });
          store.createIndex('byType', 'type', { unique: false });
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error ?? new Error('Failed to open IndexedDB'));
    });
  }

  private async withStore<T>(mode: IDBTransactionMode, cb: (store: IDBObjectStore) => Promise<T> | T): Promise<T> {
    if (!this.isIndexedDbAvailable || !this.dbPromise) {
      throw new Error('IndexedDB is not available in this environment');
    }
    const db = await this.dbPromise;
    const tx = db.transaction(STORE_NAME, mode);
    const store = tx.objectStore(STORE_NAME);
    const result = await cb(store);
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error ?? new Error('IndexedDB transaction failed'));
    });
    return result;
  }

  private async getRecord(path: string): Promise<FileRecord | undefined> {
    const normalized = normalizePath(path);
    if (!this.isIndexedDbAvailable || !this.dbPromise) {
      return this.memoryAdapter.get(normalized);
    }
    return this.withStore('readonly', async (store) => {
      const request = store.get(normalized);
      return requestAsPromise<FileRecord | undefined>(request);
    });
  }

  private async putRecord(record: FileRecord): Promise<void> {
    if (!this.isIndexedDbAvailable || !this.dbPromise) {
      return this.memoryAdapter.put(record);
    }
    await this.withStore('readwrite', async (store) => {
      store.put(record);
    });
  }

  private async deleteRecord(path: string): Promise<void> {
    const normalized = normalizePath(path);
    if (!this.isIndexedDbAvailable || !this.dbPromise) {
      return this.memoryAdapter.delete(normalized);
    }
    await this.withStore('readwrite', async (store) => {
      store.delete(normalized);
    });
  }

  private async getAllRecords(): Promise<FileRecord[]> {
    if (!this.isIndexedDbAvailable || !this.dbPromise) {
      return this.memoryAdapter.getAll();
    }
    return this.withStore('readonly', async (store) => {
      const request = store.getAll();
      return requestAsPromise<FileRecord[]>(request);
    });
  }

  private async ensureDirectory(path: string): Promise<void> {
    const normalized = normalizePath(path);
    if (!normalized) {
      return;
    }
    const existing = await this.getRecord(normalized);
    if (existing && existing.type === 'directory') {
      return;
    }
    const timestamp = now();
    await this.putRecord({
      path: normalized,
      type: 'directory',
      createdAt: existing?.createdAt ?? timestamp,
      updatedAt: timestamp,
    });
  }

  private async ensureParents(path: string): Promise<void> {
    let parent = dirname(path);
    while (parent) {
      await this.ensureDirectory(parent);
      parent = dirname(parent);
    }
  }

  async writeFile(path: string, content: string): Promise<ReadFileResult> {
    const normalized = normalizePath(path);
    await this.ensureParents(normalized);
    const timestamp = now();
    const existing = await this.getRecord(normalized);
    await this.putRecord({
      path: normalized,
      type: 'file',
      content,
      createdAt: existing?.createdAt ?? timestamp,
      updatedAt: timestamp,
    });
    return { path: normalized, content };
  }

  async readFile(path: string): Promise<ReadFileResult> {
    const normalized = normalizePath(path);
    let record = await this.getRecord(normalized);

    if (this.remoteFetcher) {
      const versionHint = record?.content !== undefined ? record.updatedAt : undefined;
      const remote = await this.remoteFetcher(normalized, versionHint);
      if (remote) {
        const nextRecord: FileRecord = {
          path: normalized,
          type: 'file',
          content: remote.content,
          createdAt: record?.createdAt ?? now(),
          updatedAt: remote.updatedAt ?? now(),
        };
        await this.putRecord(nextRecord);
        record = nextRecord;
      }
    }

    if (!record || record.type !== 'file') {
      throw new Error(`File not found: ${normalized}`);
    }
    return { path: normalized, content: record.content ?? '' };
  }

  async applyDiff(path: string, diff: string): Promise<ReadFileResult> {
    const current = await this.readFile(path);
    const blocks = this.parseDiff(diff);
    const lines = current.content.split('\n');

    for (const block of blocks) {
      const startIndex = block.startLine - 1;
      if (startIndex < 0 || startIndex > lines.length) {
        throw new Error(`Invalid start_line ${block.startLine} in diff block`);
      }
      const searchSegment = block.search.join('\n');
      const targetSegment = lines.slice(startIndex, startIndex + block.search.length).join('\n');
      if (block.search.length > 0 && searchSegment !== targetSegment) {
        throw new Error('SEARCH segment did not match target content');
      }
      lines.splice(startIndex, block.search.length, ...block.replace);
    }

    const updated = lines.join('\n');
    await this.writeFile(path, updated);
    return { path: normalizePath(path), content: updated };
  }

  private parseDiff(diff: string): DiffBlock[] {
    const blocks: DiffBlock[] = [];
    const lines = diff.split('\n');
    let cursor = 0;

    while (cursor < lines.length) {
      const line = lines[cursor]?.trim();
      if (!line) {
        cursor += 1;
        continue;
      }
      if (line !== '<<<<<<< SEARCH') {
        throw new Error(`Expected <<<<<<< SEARCH but found "${lines[cursor]}"`);
      }
      cursor += 1;
      const startDirective = lines[cursor];
      if (!startDirective?.startsWith(':start_line:')) {
        throw new Error('Missing :start_line directive in diff block');
      }
      const startLine = Number(startDirective.replace(':start_line:', '').trim());
      if (Number.isNaN(startLine) || startLine < 1) {
        throw new Error('Invalid :start_line value in diff block');
      }
      cursor += 1;
      if (lines[cursor]?.trim() !== '-------') {
        throw new Error('Missing ------- separator in diff block');
      }
      cursor += 1;

      const search: string[] = [];
      while (cursor < lines.length && lines[cursor].trim() !== '=======') {
        search.push(lines[cursor]);
        cursor += 1;
      }
      if (lines[cursor]?.trim() !== '=======') {
        throw new Error('Missing ======= separator in diff block');
      }
      cursor += 1;
      const replace: string[] = [];
      while (cursor < lines.length && lines[cursor].trim() !== '>>>>>>> REPLACE') {
        replace.push(lines[cursor]);
        cursor += 1;
      }
      if (lines[cursor]?.trim() !== '>>>>>>> REPLACE') {
        throw new Error('Missing >>>>>>> REPLACE terminator in diff block');
      }
      cursor += 1;
      blocks.push({ startLine, search, replace });
    }

    if (!blocks.length) {
      throw new Error('No diff blocks found');
    }
    return blocks;
  }

  async listDirectory(path: string, recursive = false): Promise<string[]> {
    const normalized = normalizePath(path);
    const records = await this.getAllRecords();
    const results = new Set<string>();

    for (const record of records) {
      if (!isParent(normalized, record.path)) {
        continue;
      }
      const relative = normalized
        ? record.path.slice(normalized.length ? normalized.length + 1 : 0)
        : record.path;
      if (!relative) {
        continue;
      }
      if (!recursive && relative.includes('/')) {
        continue;
      }
      results.add(relative);
    }

    return Array.from(results).sort();
  }

  async getFileInfo(path: string): Promise<FileInfo> {
    const normalized = normalizePath(path);
    const record = await this.getRecord(normalized);
    if (!record) {
      throw new Error(`Path not found: ${normalized}`);
    }
    const contentLength = record.content?.length ?? 0;
    return {
      path: normalized,
      size: contentLength,
      is_file: record.type === 'file',
      is_dir: record.type === 'directory',
      modified: record.updatedAt,
      created: record.createdAt,
    };
  }

  async searchFiles(path: string, pattern: string): Promise<string[]> {
    const regex = regexFromPattern(pattern);
    if (!regex) {
      return [];
    }
    const normalized = normalizePath(path);
    const records = await this.getAllRecords();
    return records
      .filter((record) => record.type !== 'directory' && isParent(normalized, record.path) && regex.test(record.path))
      .map((record) => record.path);
  }

  async searchWithinFiles(path: string, pattern: string): Promise<SearchWithinMatch[]> {
    const regex = regexFromPattern(pattern);
    if (!regex) {
      return [];
    }
    const normalized = normalizePath(path);
    const records = await this.getAllRecords();
    const matches: SearchWithinMatch[] = [];

    for (const record of records) {
      if (record.type !== 'file' || !isParent(normalized, record.path)) {
        continue;
      }
      const lines = (record.content ?? '').split('\n');
      const fileMatches: Array<{ line: number; content: string }> = [];
      lines.forEach((line, index) => {
        if (regex.test(line)) {
          fileMatches.push({ line: index + 1, content: line });
        }
      });
      if (fileMatches.length) {
        matches.push({ path: record.path, matches: fileMatches });
      }
    }
    return matches;
  }

  setRemoteFetcher(
    fetcher?: (path: string, currentVersion?: number) => Promise<{ content: string; updatedAt?: number } | null>,
  ) {
    this.remoteFetcher = fetcher;
  }

  async upsertMetadata(path: string, type: EntryType, updatedAt?: number) {
    const normalized = normalizePath(path);
    const existing = await this.getRecord(normalized);
    const record: FileRecord = {
      path: normalized,
      type,
      content: existing?.content,
      createdAt: existing?.createdAt ?? now(),
      updatedAt: updatedAt ?? existing?.updatedAt ?? now(),
    };
    await this.putRecord(record);
  }

  async copyFile(source: string, destination: string): Promise<void> {
    const src = await this.readFile(source);
    await this.writeFile(destination, src.content);
  }

  async moveFile(source: string, destination: string): Promise<void> {
    const normalizedSrc = normalizePath(source);
    await this.copyFile(normalizedSrc, destination);
    await this.deleteEntry(normalizedSrc, false);
  }

  async deleteEntry(path: string, recursive: boolean): Promise<void> {
    const normalized = normalizePath(path);
    const record = await this.getRecord(normalized);
    if (!record) {
      return;
    }
    if (record.type === 'directory' && !recursive) {
      const children = await this.getAllRecords();
      const hasChildren = children.some((entry) => entry.path !== normalized && isParent(normalized, entry.path));
      if (hasChildren) {
        throw new Error('Directory is not empty. Pass recursive=true to delete.');
      }
    }
    if (record.type === 'directory') {
      const children = await this.getAllRecords();
      await Promise.all(
        children
          .filter((entry) => entry.path === normalized || entry.path.startsWith(`${normalized}/`))
          .map((entry) => this.deleteRecord(entry.path))
      );
    } else {
      await this.deleteRecord(normalized);
    }
  }

  async createDirectory(path: string): Promise<void> {
    const normalized = normalizePath(path);
    await this.ensureParents(normalized);
    await this.ensureDirectory(normalized);
  }

  async tree(path: string): Promise<DirectoryTreeNode> {
    const normalized = normalizePath(path);
    const records = await this.getAllRecords();
    const root: DirectoryTreeNode = {
      name: normalized ? basename(normalized) : '',
      path: normalized,
      type: 'directory',
      children: [],
      updatedAt: now(),
    };
    const byPath = new Map<string, DirectoryTreeNode>();
    byPath.set(normalized, root);

    const sortedRecords = records
      .filter((record) => isParent(normalized, record.path) && record.path !== normalized)
      .sort((a, b) => a.path.localeCompare(b.path));

    for (const record of sortedRecords) {
      const parentPath = dirname(record.path);
      const parentNode = byPath.get(parentPath || normalized);
      if (!parentNode) {
        continue;
      }
      const node: DirectoryTreeNode = {
        name: basename(record.path),
        path: record.path,
        type: record.type,
        updatedAt: record.updatedAt,
      };
      if (record.type !== 'file') {
        node.children = [];
      }
      parentNode.children = parentNode.children ?? [];
      parentNode.children.push(node);
      byPath.set(record.path, node);
    }

    return root;
  }

  async listArtifacts(): Promise<FileRecord[]> {
    const records = await this.getAllRecords();
    return records.filter((record) => record.path.startsWith(ARTIFACT_PREFIX) && record.type === 'artifact');
  }

  async readArtifact(filename: string, startLine?: number, endLine?: number): Promise<{ content: string; start_line: number; end_line: number; total_lines: number; artifact_id: string; }> {
    const record = await this.getRecord(`${ARTIFACT_PREFIX}${normalizePath(filename)}`);
    if (!record) {
      throw new Error(`Artifact not found: ${filename}`);
    }
    const lines = (record.content ?? '').split('\n');
    const total = lines.length;
    const start = Math.max(1, startLine ?? 1);
    const end = Math.min(total, endLine ?? total);
    const slice = lines.slice(start - 1, end).join('\n');
    return {
      content: slice,
      artifact_id: record.path,
      start_line: start,
      end_line: end,
      total_lines: total,
    };
  }

  async searchArtifacts(pattern: string): Promise<SearchWithinMatch[]> {
    const regex = regexFromPattern(pattern);
    if (!regex) {
      return [];
    }
    const artifacts = await this.listArtifacts();
    const matches: SearchWithinMatch[] = [];
    for (const artifact of artifacts) {
      const lines = (artifact.content ?? '').split('\n');
      const fileMatches: Array<{ line: number; content: string }> = [];
      lines.forEach((line, index) => {
        if (regex.test(line)) {
          fileMatches.push({ line: index + 1, content: line });
        }
      });
      if (fileMatches.length) {
        matches.push({ path: artifact.path, matches: fileMatches });
      }
    }
    return matches;
  }

  async saveArtifact(filename: string, content: string): Promise<void> {
    const path = `${ARTIFACT_PREFIX}${normalizePath(filename)}`;
    await this.putRecord({
      path,
      type: 'artifact',
      content,
      createdAt: now(),
      updatedAt: now(),
    });
  }

  async deleteArtifact(filename: string): Promise<void> {
    const path = `${ARTIFACT_PREFIX}${normalizePath(filename)}`;
    await this.deleteRecord(path);
  }
}

interface DiffBlock {
  startLine: number;
  search: string[];
  replace: string[];
}

export type ProjectFilesystem = IndexedDbFilesystem;
