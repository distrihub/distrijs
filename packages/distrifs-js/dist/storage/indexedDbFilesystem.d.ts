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
    matches: Array<{
        line: number;
        content: string;
    }>;
}
export interface ReadFileResult {
    path: string;
    content: string;
}
export declare class IndexedDbFilesystem {
    private static instances;
    static forProject(projectId: string): IndexedDbFilesystem;
    readonly projectId: string;
    private readonly isIndexedDbAvailable;
    private readonly memoryAdapter;
    private dbPromise?;
    private constructor();
    private openDatabase;
    private withStore;
    private getRecord;
    private putRecord;
    private deleteRecord;
    private getAllRecords;
    private ensureDirectory;
    private ensureParents;
    writeFile(path: string, content: string): Promise<ReadFileResult>;
    readFile(path: string): Promise<ReadFileResult>;
    applyDiff(path: string, diff: string): Promise<ReadFileResult>;
    private parseDiff;
    listDirectory(path: string, recursive?: boolean): Promise<string[]>;
    getFileInfo(path: string): Promise<FileInfo>;
    searchFiles(path: string, pattern: string): Promise<string[]>;
    searchWithinFiles(path: string, pattern: string): Promise<SearchWithinMatch[]>;
    copyFile(source: string, destination: string): Promise<void>;
    moveFile(source: string, destination: string): Promise<void>;
    deleteEntry(path: string, recursive: boolean): Promise<void>;
    createDirectory(path: string): Promise<void>;
    tree(path: string): Promise<DirectoryTreeNode>;
    listArtifacts(): Promise<FileRecord[]>;
    readArtifact(filename: string, startLine?: number, endLine?: number): Promise<{
        content: string;
        start_line: number;
        end_line: number;
        total_lines: number;
        artifact_id: string;
    }>;
    searchArtifacts(pattern: string): Promise<SearchWithinMatch[]>;
    saveArtifact(filename: string, content: string): Promise<void>;
    deleteArtifact(filename: string): Promise<void>;
}
export type ProjectFilesystem = IndexedDbFilesystem;
//# sourceMappingURL=indexedDbFilesystem.d.ts.map