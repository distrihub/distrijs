/*
  IndexedDB-backed filesystem abstraction used by distrifs-js. Each projectId maps to its own
  database namespace so multiple workspaces can coexist without colliding. The implementation
  mirrors the behaviour of the Rust filesystem tools in a simplified, browser-friendly way.
*/
const DB_PREFIX = 'distri-fs-';
const STORE_NAME = 'entries';
const ARTIFACT_PREFIX = '__artifact__/';
function normalizePath(rawPath) {
    if (!rawPath) {
        return '';
    }
    const replaced = rawPath.replace(/\\/g, '/').replace(/\/+/g, '/');
    const trimmed = replaced.replace(/^\/+|\/+$/g, '');
    return trimmed;
}
function dirname(path) {
    const segments = normalizePath(path).split('/').filter(Boolean);
    if (segments.length <= 1) {
        return '';
    }
    return segments.slice(0, -1).join('/');
}
function basename(path) {
    const segments = normalizePath(path).split('/').filter(Boolean);
    return segments.length ? segments[segments.length - 1] : '';
}
function isParent(parent, child) {
    if (!parent) {
        return true;
    }
    return normalizePath(child).startsWith(`${normalizePath(parent)}/`) || normalizePath(child) === normalizePath(parent);
}
function regexFromPattern(pattern) {
    try {
        return new RegExp(pattern, 'i');
    }
    catch (error) {
        console.warn('[distrifs-js] Invalid regex pattern supplied to filesystem search:', error);
        return undefined;
    }
}
async function requestAsPromise(request) {
    return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error ?? new Error('IndexedDB request failed'));
    });
}
function now() {
    return Date.now();
}
class MemoryAdapter {
    constructor() {
        this.store = new Map();
    }
    async get(path) {
        return this.store.get(path);
    }
    async put(record) {
        this.store.set(record.path, record);
    }
    async delete(path) {
        this.store.delete(path);
    }
    async getAll() {
        return Array.from(this.store.values());
    }
}
export class IndexedDbFilesystem {
    static forProject(projectId) {
        const normalizedId = projectId || 'default';
        if (!this.instances.has(normalizedId)) {
            this.instances.set(normalizedId, new IndexedDbFilesystem(normalizedId));
        }
        return this.instances.get(normalizedId);
    }
    constructor(projectId) {
        this.projectId = projectId;
        this.isIndexedDbAvailable = typeof indexedDB !== 'undefined';
        this.memoryAdapter = new MemoryAdapter();
        if (this.isIndexedDbAvailable) {
            this.dbPromise = this.openDatabase();
        }
    }
    async openDatabase() {
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
    async withStore(mode, cb) {
        if (!this.isIndexedDbAvailable || !this.dbPromise) {
            throw new Error('IndexedDB is not available in this environment');
        }
        const db = await this.dbPromise;
        const tx = db.transaction(STORE_NAME, mode);
        const store = tx.objectStore(STORE_NAME);
        const result = await cb(store);
        await new Promise((resolve, reject) => {
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error ?? new Error('IndexedDB transaction failed'));
        });
        return result;
    }
    async getRecord(path) {
        const normalized = normalizePath(path);
        if (!this.isIndexedDbAvailable || !this.dbPromise) {
            return this.memoryAdapter.get(normalized);
        }
        return this.withStore('readonly', async (store) => {
            const request = store.get(normalized);
            return requestAsPromise(request);
        });
    }
    async putRecord(record) {
        if (!this.isIndexedDbAvailable || !this.dbPromise) {
            return this.memoryAdapter.put(record);
        }
        await this.withStore('readwrite', async (store) => {
            store.put(record);
        });
    }
    async deleteRecord(path) {
        const normalized = normalizePath(path);
        if (!this.isIndexedDbAvailable || !this.dbPromise) {
            return this.memoryAdapter.delete(normalized);
        }
        await this.withStore('readwrite', async (store) => {
            store.delete(normalized);
        });
    }
    async getAllRecords() {
        if (!this.isIndexedDbAvailable || !this.dbPromise) {
            return this.memoryAdapter.getAll();
        }
        return this.withStore('readonly', async (store) => {
            const request = store.getAll();
            return requestAsPromise(request);
        });
    }
    async ensureDirectory(path) {
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
    async ensureParents(path) {
        let parent = dirname(path);
        while (parent) {
            await this.ensureDirectory(parent);
            parent = dirname(parent);
        }
    }
    async writeFile(path, content) {
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
    async readFile(path) {
        const normalized = normalizePath(path);
        const record = await this.getRecord(normalized);
        if (!record || record.type !== 'file') {
            throw new Error(`File not found: ${normalized}`);
        }
        return { path: normalized, content: record.content ?? '' };
    }
    async applyDiff(path, diff) {
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
    parseDiff(diff) {
        const blocks = [];
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
            const search = [];
            while (cursor < lines.length && lines[cursor].trim() !== '=======') {
                search.push(lines[cursor]);
                cursor += 1;
            }
            if (lines[cursor]?.trim() !== '=======') {
                throw new Error('Missing ======= separator in diff block');
            }
            cursor += 1;
            const replace = [];
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
    async listDirectory(path, recursive = false) {
        const normalized = normalizePath(path);
        const records = await this.getAllRecords();
        const results = new Set();
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
    async getFileInfo(path) {
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
    async searchFiles(path, pattern) {
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
    async searchWithinFiles(path, pattern) {
        const regex = regexFromPattern(pattern);
        if (!regex) {
            return [];
        }
        const normalized = normalizePath(path);
        const records = await this.getAllRecords();
        const matches = [];
        for (const record of records) {
            if (record.type !== 'file' || !isParent(normalized, record.path)) {
                continue;
            }
            const lines = (record.content ?? '').split('\n');
            const fileMatches = [];
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
    async copyFile(source, destination) {
        const src = await this.readFile(source);
        await this.writeFile(destination, src.content);
    }
    async moveFile(source, destination) {
        const normalizedSrc = normalizePath(source);
        await this.copyFile(normalizedSrc, destination);
        await this.deleteEntry(normalizedSrc, false);
    }
    async deleteEntry(path, recursive) {
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
            await Promise.all(children
                .filter((entry) => entry.path === normalized || entry.path.startsWith(`${normalized}/`))
                .map((entry) => this.deleteRecord(entry.path)));
        }
        else {
            await this.deleteRecord(normalized);
        }
    }
    async createDirectory(path) {
        const normalized = normalizePath(path);
        await this.ensureParents(normalized);
        await this.ensureDirectory(normalized);
    }
    async tree(path) {
        const normalized = normalizePath(path);
        const records = await this.getAllRecords();
        const root = {
            name: normalized ? basename(normalized) : '',
            path: normalized,
            type: 'directory',
            children: [],
            updatedAt: now(),
        };
        const byPath = new Map();
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
            const node = {
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
    async listArtifacts() {
        const records = await this.getAllRecords();
        return records.filter((record) => record.path.startsWith(ARTIFACT_PREFIX) && record.type === 'artifact');
    }
    async readArtifact(filename, startLine, endLine) {
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
    async searchArtifacts(pattern) {
        const regex = regexFromPattern(pattern);
        if (!regex) {
            return [];
        }
        const artifacts = await this.listArtifacts();
        const matches = [];
        for (const artifact of artifacts) {
            const lines = (artifact.content ?? '').split('\n');
            const fileMatches = [];
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
    async saveArtifact(filename, content) {
        const path = `${ARTIFACT_PREFIX}${normalizePath(filename)}`;
        await this.putRecord({
            path,
            type: 'artifact',
            content,
            createdAt: now(),
            updatedAt: now(),
        });
    }
    async deleteArtifact(filename) {
        const path = `${ARTIFACT_PREFIX}${normalizePath(filename)}`;
        await this.deleteRecord(path);
    }
}
IndexedDbFilesystem.instances = new Map();
