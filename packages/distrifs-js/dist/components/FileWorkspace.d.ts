import React from 'react';
import { FileWorkspaceStore } from '../store/fileStore';
import { ProjectFilesystem } from '../storage/indexedDbFilesystem';
import type { FileSaveHandler, InitialEntry, PreviewRenderer, SelectionMode } from '../types';
export interface FileWorkspaceProps {
    projectId: string;
    initialEntries?: InitialEntry[];
    previewRenderer?: PreviewRenderer;
    onSaveFile?: FileSaveHandler;
    filesystem?: ProjectFilesystem;
    selectionMode?: SelectionMode;
    className?: string;
    height?: number | string;
    defaultFilePath?: string;
    store?: FileWorkspaceStore;
}
export declare const FileWorkspace: React.FC<FileWorkspaceProps>;
export default FileWorkspace;
//# sourceMappingURL=FileWorkspace.d.ts.map