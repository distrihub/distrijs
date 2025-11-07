import type { ReactNode } from 'react';
import type { FileTab } from './store/fileStore';
import type { ProjectFilesystem } from './storage/indexedDbFilesystem';

export interface InitialEntry {
  path: string;
  type?: 'file' | 'directory';
  content?: string;
}

export type PreviewRenderer = (args: { path: string; content: string; projectId: string }) => ReactNode;

export type FileSaveHandler = (
  tab: FileTab,
  context: { filesystem: ProjectFilesystem; projectId: string }
) => Promise<void> | void;

export type FilesystemChangeType =
  | 'write'
  | 'create'
  | 'diff'
  | 'delete'
  | 'move'
  | 'copy'
  | 'artifact_write'
  | 'artifact_delete';

export interface FilesystemChangeEvent {
  type: FilesystemChangeType;
  path: string;
  destination?: string;
  metadata?: Record<string, unknown>;
}

export interface FilesystemToolsOptions {
  onChange?: (event: FilesystemChangeEvent) => void;
}

export type SelectionMode = 'single' | 'multiple';
