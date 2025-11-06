import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Separator,
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  Textarea,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@distri/react';
import {
  ChevronRight,
  FileText,
  Folder,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  RefreshCw,
  Save,
  Trash2,
} from 'lucide-react';

import {
  FileWorkspaceStore,
  createFileWorkspaceStore,
  isTabDirty,
  useFileWorkspaceStore,
} from '../store/fileStore';
import type { FileTab } from '../store/fileStore';
import { IndexedDbFilesystem, ProjectFilesystem } from '../storage/indexedDbFilesystem';
import type { DirectoryTreeNode } from '../storage/indexedDbFilesystem';
import type { FileSaveHandler, InitialEntry, PreviewRenderer, SelectionMode } from '../types';

const normalizePath = (path: string) => path.replace(/\\/g, '/').replace(/^\/+|\/+$/g, '');

const cls = (...classes: Array<string | false | undefined | null>) =>
  classes.filter(Boolean).join(' ');

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

export const FileWorkspace: React.FC<FileWorkspaceProps> = ({
  projectId,
  initialEntries = [],
  previewRenderer,
  onSaveFile,
  filesystem,
  selectionMode = 'multiple',
  className,
  height = '640px',
  defaultFilePath,
  store: externalStore,
}) => {
  const fs = useMemo(
    () => filesystem ?? IndexedDbFilesystem.forProject(projectId),
    [filesystem, projectId],
  );

  const saveHandlerRef = useRef<FileSaveHandler | undefined>(onSaveFile);
  const storeRef = useRef<FileWorkspaceStore | null>(null);

  if (!storeRef.current) {
    storeRef.current =
      externalStore ??
      createFileWorkspaceStore(projectId, {
        filesystem: fs,
        saveHandler: onSaveFile
          ? async (tab, activeFs) => {
              await onSaveFile(tab, { filesystem: activeFs, projectId });
            }
          : undefined,
      });
  }

  useEffect(() => {
    if (externalStore && storeRef.current !== externalStore) {
      storeRef.current = externalStore;
    }
  }, [externalStore]);

  const store = storeRef.current!;

  useEffect(() => {
    saveHandlerRef.current = onSaveFile;
    store.getState().setSaveHandler(
      onSaveFile
        ? async (tab, activeFs) => {
            await onSaveFile(tab, { filesystem: activeFs, projectId });
          }
        : undefined,
    );
  }, [onSaveFile, projectId, store]);

  const tabs = useFileWorkspaceStore(store, (state) => state.tabs);
  const tree = useFileWorkspaceStore(store, (state) => state.tree);
  const activePath = useFileWorkspaceStore(store, (state) => state.activePath);
  const isLoading = useFileWorkspaceStore(store, (state) => state.isLoading);
  const error = useFileWorkspaceStore(store, (state) => state.error);
  const pendingSaves = useFileWorkspaceStore(store, (state) => state.pendingSaves);

  const openFile = useFileWorkspaceStore(store, (state) => state.openFile);
  const setActiveTab = useFileWorkspaceStore(store, (state) => state.setActiveTab);
  const updateTabContent = useFileWorkspaceStore(store, (state) => state.updateTabContent);
  const saveFile = useFileWorkspaceStore(store, (state) => state.saveFile);
  const closeTab = useFileWorkspaceStore(store, (state) => state.closeTab);
  const createDirectory = useFileWorkspaceStore(store, (state) => state.createDirectory);
  const createFile = useFileWorkspaceStore(store, (state) => state.createFile);
  const deleteEntry = useFileWorkspaceStore(store, (state) => state.deleteEntry);
  const refresh = useFileWorkspaceStore(store, (state) => state.refresh);

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(() => new Set(['']));
  const [newEntryOpen, setNewEntryOpen] = useState(false);
  const [newEntryType, setNewEntryType] = useState<'file' | 'directory'>('file');
  const [newEntryPath, setNewEntryPath] = useState('');
  const [newEntryContent, setNewEntryContent] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletePath, setDeletePath] = useState('');
  const [previewSheetOpen, setPreviewSheetOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      for (const entry of initialEntries) {
        if (cancelled) {
          break;
        }
        const normalizedPath = normalizePath(entry.path);
        try {
          if (entry.type === 'directory') {
            await fs.createDirectory(normalizedPath);
          } else {
            await fs.readFile(normalizedPath);
          }
        } catch (error) {
          if (entry.type === 'directory') {
            await fs.createDirectory(normalizedPath);
          } else {
            await fs.writeFile(normalizedPath, entry.content ?? '');
          }
        }
      }
      if (!cancelled) {
        await store.getState().refresh();
        if (defaultFilePath) {
          await store.getState().openFile(defaultFilePath);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [defaultFilePath, fs, initialEntries, store]);

  useEffect(() => {
    store.getState().loadTree();
  }, [store]);

  const activeTab = useMemo(
    () => tabs.find((tab) => tab.path === activePath) ?? tabs.at(-1),
    [tabs, activePath],
  );

  const handleOpenFile = async (path: string) => {
    await openFile(path);
    if (selectionMode === 'single') {
      const currentTabs = store.getState().tabs.filter((tab) => tab.path === path);
      store.setState({ tabs: currentTabs, activePath: path });
    }
    ensureParentsExpanded(path);
  };

  const ensureParentsExpanded = (path: string) => {
    const segments = normalizePath(path).split('/');
    if (segments.length <= 1) return;
    const next = new Set(expandedPaths);
    let cursor = '';
    for (const part of segments.slice(0, -1)) {
      cursor = cursor ? `${cursor}/${part}` : part;
      next.add(cursor);
    }
    setExpandedPaths(next);
  };

  const toggleDirectory = (path: string) => {
    setExpandedPaths((prev) => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  };

  const handleCreateEntry = async () => {
    const path = normalizePath(newEntryPath);
    if (!path) {
      return;
    }
    if (newEntryType === 'file') {
      await createFile(path, newEntryContent ?? '');
      await handleOpenFile(path);
    } else {
      await createDirectory(path);
      ensureParentsExpanded(path);
    }
    setNewEntryContent('');
    setNewEntryPath('');
    setNewEntryOpen(false);
  };

  const handleDeleteEntry = async () => {
    if (!deletePath.trim()) return;
    await deleteEntry(deletePath.trim(), true);
    setDeleteDialogOpen(false);
    setDeletePath('');
  };

  const layoutHeight = typeof height === 'number' ? `${height}px` : height;

  return (
    <TooltipProvider>
      <div
        className={cls(
          'flex flex-col overflow-hidden rounded-lg border border-border bg-background text-foreground shadow-sm',
          className,
        )}
        style={{ height: layoutHeight }}
      >
        <div className="flex h-full overflow-hidden">
          <aside
            className={cls(
              'flex h-full flex-col border-r border-border bg-muted/40 transition-all duration-200 ease-in-out',
              sidebarCollapsed ? 'w-0 min-w-0 translate-x-[-100%] opacity-0' : 'w-64'
            )}
            aria-hidden={sidebarCollapsed}
          >
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <div>
                <h2 className="text-sm font-semibold">Project Files</h2>
                <p className="text-xs text-muted-foreground">{projectId}</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarCollapsed(true)}
                className="h-8 w-8"
                aria-label="Collapse sidebar"
              >
                <PanelLeftClose className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex items-center gap-2 px-4 py-3">
              <Dialog open={newEntryOpen} onOpenChange={setNewEntryOpen}>
                <Button size="sm" className="gap-2" onClick={() => setNewEntryOpen(true)}>
                  <Plus className="h-4 w-4" />
                  New…
                </Button>
                <DialogContent className="sm:max-w-[420px]">
                  <DialogHeader>
                    <DialogTitle>Create {newEntryType === 'file' ? 'File' : 'Folder'}</DialogTitle>
                  </DialogHeader>
                  <div className="grid gap-4 py-2">
                    <div className="grid gap-2">
                      <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Type
                      </label>
                      <Select
                        value={newEntryType}
                        onValueChange={(value: 'file' | 'directory') => setNewEntryType(value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="file">File</SelectItem>
                          <SelectItem value="directory">Folder</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Relative path
                      </label>
                      <Input
                        autoFocus
                        value={newEntryPath}
                        onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                          setNewEntryPath(event.target.value)
                        }
                        placeholder="src/components/NewFile.tsx"
                      />
                    </div>
                    {newEntryType === 'file' ? (
                      <div className="grid gap-2">
                        <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                          Initial content
                        </label>
                        <Textarea
                          rows={6}
                          value={newEntryContent}
                          onChange={(event: React.ChangeEvent<HTMLTextAreaElement>) =>
                            setNewEntryContent(event.target.value)
                          }
                          placeholder="// File contents"
                        />
                      </div>
                    ) : null}
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="secondary" onClick={() => setNewEntryOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreateEntry} disabled={!newEntryPath.trim()}>
                      Create
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={() => refresh()} className="h-8 w-8">
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">Refresh tree</TooltipContent>
              </Tooltip>
            </div>

            <div className="flex-1 overflow-y-auto px-2 pb-4">
              {tree && tree.children && tree.children.length > 0 ? (
                <ul className="space-y-1 text-sm">
                  {tree.children
                    .slice()
                    .sort(sortTree)
                    .map((child) => (
                      <ExplorerNode
                        key={child.path}
                        node={child}
                        expandedPaths={expandedPaths}
                        onToggle={toggleDirectory}
                        onOpenFile={handleOpenFile}
                        activePath={activeTab?.path}
                      />
                    ))}
                </ul>
              ) : (
                <div className="px-2 text-xs text-muted-foreground">No files yet. Create one to get started.</div>
              )}
            </div>

            <div className="border-t border-border px-4 py-3">
              <Button
                variant="outline"
                size="sm"
                className="w-full gap-2"
                onClick={() => {
                  setDeleteDialogOpen(true);
                  setDeletePath(activeTab?.path ?? '');
                }}
              >
                <Trash2 className="h-4 w-4" />
                Delete path…
              </Button>
            </div>
          </aside>

          <div className="flex flex-1 flex-col overflow-hidden">
            <header className="flex items-center gap-2 border-b border-border bg-muted/30 px-4 py-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setSidebarCollapsed((prev) => !prev)}
                aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              >
                {sidebarCollapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
              </Button>

              <div className="flex flex-1 items-center gap-2 overflow-x-auto">
                {tabs.map((tab) => (
                  <WorkspaceTab
                    key={tab.path}
                    tab={tab}
                    isActive={activeTab?.path === tab.path}
                    isSaving={Boolean(pendingSaves[tab.path])}
                    onSelect={() => setActiveTab(tab.path)}
                    onClose={() => closeTab(tab.path)}
                  />
                ))}
              </div>

              {activeTab ? (
                <Button
                  size="sm"
                  className="gap-2"
                  disabled={!isTabDirty(activeTab) || Boolean(pendingSaves[activeTab.path])}
                  onClick={() => saveFile(activeTab.path)}
                >
                  <Save className="h-4 w-4" />
                  {pendingSaves[activeTab.path] ? 'Saving…' : 'Save'}
                </Button>
              ) : null}
            </header>

            <div className="flex items-center gap-2 border-b border-border px-4 py-2 text-xs text-red-500">
              {error}
            </div>

            <div className="flex flex-1 overflow-hidden">
              <main className="flex flex-1 flex-col overflow-hidden px-4 py-3">
                {activeTab ? (
                  <div className="flex h-full flex-col">
                    <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
                      <span>{activeTab.path}</span>
                      {isLoading ? <span className="animate-pulse">Loading…</span> : null}
                    </div>
                    <Textarea
                      className="min-h-0 flex-1 font-mono text-sm"
                      spellCheck={false}
                      value={activeTab.content}
                      onChange={(event: React.ChangeEvent<HTMLTextAreaElement>) =>
                        updateTabContent(activeTab.path, event.target.value)
                      }
                    />
                  </div>
                ) : (
                  <div className="flex h-full flex-col items-center justify-center text-sm text-muted-foreground">
                    <FileText className="mb-2 h-8 w-8 opacity-60" />
                    <p>Select a file to begin editing.</p>
                  </div>
                )}
              </main>

              <Separator orientation="vertical" className="h-auto" />

              <aside className="flex w-80 flex-col overflow-hidden">
                <div className="flex items-center justify-between border-b border-border px-4 py-3">
                  <h3 className="text-sm font-semibold">Preview</h3>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setPreviewSheetOpen(true)}
                    aria-label="Open preview"
                  >
                    <Menu className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex-1 overflow-y-auto px-4 py-3 text-sm text-muted-foreground">
                  {activeTab ? (
                    previewRenderer ? (
                      <div className="prose prose-sm dark:prose-invert">
                        {previewRenderer({ path: activeTab.path, content: activeTab.content, projectId })}
                      </div>
                    ) : (
                      <pre className="whitespace-pre-wrap break-words text-xs text-foreground">
                        {activeTab.content}
                      </pre>
                    )
                  ) : (
                    <p className="text-xs text-muted-foreground">Nothing to preview.</p>
                  )}
                </div>
              </aside>
            </div>
          </div>
        </div>

        <Sheet open={previewSheetOpen} onOpenChange={setPreviewSheetOpen}>
          <SheetContent side="right" className="w-full sm:max-w-3xl">
            <SheetHeader>
              <SheetTitle>Preview</SheetTitle>
            </SheetHeader>
            <div className="mt-4 max-h-[80vh] overflow-y-auto">
              {activeTab ? (
                previewRenderer ? (
                  <div className="prose dark:prose-invert">
                    {previewRenderer({ path: activeTab.path, content: activeTab.content, projectId })}
                  </div>
                ) : (
                  <pre className="whitespace-pre-wrap break-words text-sm">
                    {activeTab.content}
                  </pre>
                )
              ) : (
                <p className="text-sm text-muted-foreground">Nothing to preview.</p>
              )}
            </div>
          </SheetContent>
        </Sheet>

        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent className="sm:max-w-[420px]">
            <DialogHeader>
              <DialogTitle>Delete path</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground">
              Enter the path you want to delete. Deletions are recursive for folders.
            </p>
            <Input
              value={deletePath}
              onChange={(event: React.ChangeEvent<HTMLInputElement>) => setDeletePath(event.target.value)}
              placeholder="e.g. src/components"
            />
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setDeleteDialogOpen(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDeleteEntry} disabled={!deletePath.trim()}>
                Delete
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
};

interface ExplorerNodeProps {
  node: DirectoryTreeNode;
  expandedPaths: Set<string>;
  onToggle: (path: string) => void;
  onOpenFile: (path: string) => Promise<void>;
  activePath?: string;
}

const ExplorerNode: React.FC<ExplorerNodeProps> = ({ node, expandedPaths, onToggle, onOpenFile, activePath }) => {
  const isDirectory = node.type === 'directory';
  const pathKey = node.path || node.name;
  const isExpanded = expandedPaths.has(pathKey ?? '');
  const isActive = activePath === node.path;

  if (isDirectory) {
    return (
      <li>
        <button
          type="button"
          className={cls(
            'flex w-full items-center gap-2 rounded px-2 py-1 text-left text-sm transition hover:bg-muted',
            isActive && 'bg-muted'
          )}
          onClick={() => onToggle(node.path)}
        >
          <ChevronRight className={cls('h-3.5 w-3.5 transition-transform', isExpanded && 'rotate-90')} />
          <Folder className="h-4 w-4" />
          <span className="truncate">{node.name || '(root)'}</span>
        </button>
        {isExpanded && node.children && node.children.length > 0 ? (
          <ul className="ml-3 mt-1 space-y-1 border-l border-border/40 pl-2">
            {node.children
              .slice()
              .sort(sortTree)
              .map((child) => (
                <ExplorerNode
                  key={child.path}
                  node={child}
                  expandedPaths={expandedPaths}
                  onToggle={onToggle}
                  onOpenFile={onOpenFile}
                  activePath={activePath}
                />
              ))}
          </ul>
        ) : null}
      </li>
    );
  }

  return (
    <li>
      <button
        type="button"
        className={cls(
          'flex w-full items-center gap-2 rounded px-2 py-1 text-left text-sm transition hover:bg-muted',
          isActive && 'bg-primary/10 text-primary'
        )}
        onClick={() => onOpenFile(node.path)}
      >
        <FileText className="h-4 w-4" />
        <span className="truncate">{node.name}</span>
      </button>
    </li>
  );
};

interface WorkspaceTabProps {
  tab: FileTab;
  isActive: boolean;
  isSaving: boolean;
  onSelect: () => void;
  onClose: () => void;
}

const WorkspaceTab: React.FC<WorkspaceTabProps> = ({ tab, isActive, isSaving, onSelect, onClose }) => {
  const dirty = isTabDirty(tab);
  const label = tab.path.split('/').pop();

  return (
    <div
      className={cls(
        'group flex items-center gap-1 truncate rounded-md border border-transparent px-2 py-1 text-xs transition',
        isActive ? 'bg-primary text-primary-foreground' : 'bg-muted/60 text-muted-foreground hover:bg-muted'
      )}
    >
      <button
        type="button"
        onClick={onSelect}
        className="truncate text-left"
      >
        {label}
        {dirty ? ' *' : ''}
      </button>
      <button
        type="button"
        onClick={onClose}
        className={cls(
          'rounded p-0.5 transition',
          isActive ? 'hover:bg-primary-foreground/20' : 'hover:bg-muted/80'
        )}
        aria-label={`Close ${label}`}
      >
        ✕
      </button>
      {isSaving ? <span className="text-[10px] opacity-70">…</span> : null}
    </div>
  );
};

const sortTree = (a: DirectoryTreeNode, b: DirectoryTreeNode) => {
  if (a.type === b.type) {
    return a.name.localeCompare(b.name);
  }
  return a.type === 'directory' ? -1 : 1;
};

export default FileWorkspace;
