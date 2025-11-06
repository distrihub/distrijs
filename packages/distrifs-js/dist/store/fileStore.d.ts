import { StoreApi } from 'zustand/vanilla';
import { DirectoryTreeNode, ProjectFilesystem } from '../storage/indexedDbFilesystem';
import type { FilesystemChangeEvent } from '../types';
export interface FileTab {
    path: string;
    content: string;
    originalContent: string;
    language: string;
    updatedAt: number;
}
export interface FileWorkspaceState {
    projectId: string;
    filesystem: ProjectFilesystem;
    tree: DirectoryTreeNode | null;
    tabs: FileTab[];
    activePath?: string;
    isLoading: boolean;
    error?: string;
    initialized: boolean;
    pendingSaves: Record<string, boolean>;
    loadTree: () => Promise<void>;
    openFile: (path: string) => Promise<void>;
    closeTab: (path: string) => void;
    setActiveTab: (path: string) => void;
    updateTabContent: (path: string, content: string) => void;
    saveFile: (path: string) => Promise<void>;
    createFile: (path: string, content: string) => Promise<void>;
    createDirectory: (path: string) => Promise<void>;
    deleteEntry: (path: string, recursive: boolean) => Promise<void>;
    refresh: () => Promise<void>;
    setSaveHandler: (handler?: (tab: FileTab, fs: ProjectFilesystem) => Promise<void>) => void;
    reloadFile: (path: string) => Promise<void>;
    handleExternalChange: (event: FilesystemChangeEvent) => Promise<void>;
}
export interface WorkspaceOptions {
    filesystem?: ProjectFilesystem;
    saveHandler?: (tab: FileTab, fs: ProjectFilesystem) => Promise<void>;
}
export type FileWorkspaceStore = StoreApi<FileWorkspaceState>;
export declare const defaultSaveHandler: (_tab: FileTab, _fs: ProjectFilesystem) => Promise<void>;
export declare function createFileWorkspaceStore(projectId: string, options?: WorkspaceOptions): FileWorkspaceStore;
export declare function useFileWorkspaceStore<T>(store: FileWorkspaceStore, selector: (state: FileWorkspaceState) => T): T;
export declare function isTabDirty(tab: FileTab): boolean;
//# sourceMappingURL=fileStore.d.ts.map