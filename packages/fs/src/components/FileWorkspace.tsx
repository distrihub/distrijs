import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
  type ReactNode,
  type ComponentType,
} from 'react';
import Editor from '@monaco-editor/react';
import type { editor as MonacoEditorNS } from 'monaco-editor';
import { TOML_LANGUAGE, TOML_LANGUAGE_CONFIGURATION } from '../monaco/tomlLanguage';
type MonacoType = typeof import('monaco-editor');
type MonacoEditorInstance = MonacoEditorNS.IStandaloneCodeEditor;
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
  Textarea,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
  useTheme,
} from '@distri/react';
import { FileText, Loader2, Plus, RefreshCw, Save, Files, FlaskConical, X } from 'lucide-react';

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
import { FileList } from './FileList';

const normalizePath = (path: string) => path.replace(/\\/g, '/').replace(/^\/+|\/+$/g, '');

const pickDefaultPanelId = (stack: WorkspacePanel[]): string | null => {
  if (!stack.length) {
    return null
  }
  const explicit = stack.find((panel) => panel.defaultCollapsed === false)
  return explicit?.id ?? null
}

const cls = (...classes: Array<string | false | undefined | null>) =>
  classes.filter(Boolean).join(' ');

const detectLanguage = (path?: string) => {
  if (!path) return 'plaintext';
  const extension = path.split('.').pop()?.toLowerCase();
  switch (extension) {
    case 'ts':
    case 'tsx':
      return 'typescript';
    case 'js':
    case 'jsx':
      return 'javascript';
    case 'json':
      return 'json';
    case 'md':
    case 'mdx':
      return 'markdown';
    case 'py':
      return 'python';
    case 'rs':
      return 'rust';
    case 'toml':
      return 'toml';
    case 'yaml':
    case 'yml':
      return 'yaml';
    case 'sh':
    case 'bash':
      return 'shell';
    default:
      return 'plaintext';
  }
};

const resolveActivityItemType = (item: WorkspaceActivityItem): WorkspaceActivityItemType => {
  if (item.type) {
    return item.type
  }
  if (item.panelId) {
    return 'panel'
  }
  if (item.onSelect) {
    return 'action'
  }
  return 'sidebar'
}

export type WorkspaceActivityItemType = 'sidebar' | 'panel' | 'action';

export interface WorkspaceActivityItem {
  id: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  mode?: 'explorer' | 'custom';
  content?: ReactNode;
  position?: WorkspacePanelPosition;
  type?: WorkspaceActivityItemType;
  panelId?: string;
  panelPosition?: WorkspacePanelPosition;
  onSelect?: () => void;
  renderActionBar?: ReactNode | (() => ReactNode);
  order?: number;
}

export type WorkspacePanelPosition = 'left' | 'right';

const SIDEBAR_WIDTH: Record<WorkspacePanelPosition, number> = {
  left: 280,
  right: 360,
};

export interface WorkspacePanel {
  id: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  content: ReactNode;
  position?: WorkspacePanelPosition;
  defaultCollapsed?: boolean;
  allowCollapse?: boolean;
}

export interface FileActionContext {
  tab: FileTab;
  save: () => void;
  store: FileWorkspaceStore;
  projectId: string;
}

export interface FileActionItem {
  id: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  onSelect: (context: FileActionContext) => void;
  isVisible?: (context: FileActionContext) => boolean;
  disabled?: (context: FileActionContext) => boolean;
}

export interface FileActionRenderer {
  id: string;
  label: string;
  match: (context: FileActionContext) => boolean;
  render: (context: FileActionContext) => ReactNode;
  icon?: ComponentType<{ className?: string }>;
}

export interface FileWorkspaceProps {
  projectId: string;
  initialEntries?: InitialEntry[];
  previewRenderer?: PreviewRenderer;
  onSaveFile?: FileSaveHandler;
  filesystem?: ProjectFilesystem;
  selectionMode?: SelectionMode;
  className?: string;
  defaultFilePath?: string;
  store?: FileWorkspaceStore;
  activityBarItems?: WorkspaceActivityItem[];
  defaultActivityId?: string;
  onSyncWorkspace?: () => void | Promise<void>;
  isSyncingWorkspace?: boolean;
  panels?: WorkspacePanel[];
  initialLeftPanelWidth?: number;
  initialRightPanelWidth?: number;
  fileActionItems?: FileActionItem[];
  fileActionRenderers?: FileActionRenderer[];
}

export const FileWorkspace: React.FC<FileWorkspaceProps> = ({
  projectId,
  initialEntries = [],
  previewRenderer: _previewRenderer,
  onSaveFile,
  filesystem,
  selectionMode = 'multiple',
  className,
  defaultFilePath,
  store: externalStore,
  activityBarItems = [],
  defaultActivityId,
  onSyncWorkspace,
  isSyncingWorkspace,
  panels = [],
  initialLeftPanelWidth = 280,
  initialRightPanelWidth = 360,
  fileActionItems = [],
  fileActionRenderers = [],
}) => {
  const fs = useMemo(
    () => filesystem ?? IndexedDbFilesystem.forProject(projectId),
    [filesystem, projectId],
  );

  const themeContext = useTheme();

  const themeSetting = themeContext?.theme ?? 'system';

  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>(() =>
    themeSetting === 'light' ? 'light' : 'dark',
  );

  useEffect(() => {
    if (themeSetting === 'system') {
      if (typeof window === 'undefined') {
        setResolvedTheme('dark');
        return;
      }
      const media = window.matchMedia('(prefers-color-scheme: dark)');
      const update = () => setResolvedTheme(media.matches ? 'dark' : 'light');
      update();
      media.addEventListener('change', update);
      return () => media.removeEventListener('change', update);
    }
    setResolvedTheme(themeSetting === 'light' ? 'light' : 'dark');
  }, [themeSetting]);

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

  const isBrowser = typeof window !== 'undefined';
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(() => new Set(['']));
  const autoOpenAttemptedRef = useRef(false);
  const [newEntryOpen, setNewEntryOpen] = useState(false);
  const [newEntryType, setNewEntryType] = useState<'file' | 'directory'>('file');
  const [newEntryPath, setNewEntryPath] = useState('');
  const [newEntryContent, setNewEntryContent] = useState('');
  const [leftPanelWidth, setLeftPanelWidth] = useState(() => initialLeftPanelWidth);
  const [rightPanelWidth, setRightPanelWidth] = useState(() => initialRightPanelWidth);
  const resizeStateRef = useRef<{ position: WorkspacePanelPosition; startX: number; startWidth: number } | null>(null);

  const monacoTomlRegistered = useRef(false);


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

  useEffect(() => {
    autoOpenAttemptedRef.current = false;
  }, [projectId]);

  const activeTab = useMemo(
    () => (activePath ? tabs.find((tab) => tab.path === activePath) : undefined),
    [tabs, activePath],
  );



  const ensureParentsExpanded = useCallback(async (path: string) => {
    const segments = normalizePath(path).split('/');
    if (segments.length <= 1) return;
    const next = new Set(expandedPaths);
    let cursor = '';
    for (const part of segments.slice(0, -1)) {
      cursor = cursor ? `${cursor}/${part}` : part;
      next.add(cursor);
    }
    setExpandedPaths(next);
  }, []);

  const handleOpenFile = useCallback(async (path: string) => {
    await openFile(path);
    if (selectionMode === 'single') {
      const currentTabs = store.getState().tabs.filter((tab) => tab.path === path);
      store.setState({ tabs: currentTabs, activePath: path });
    }
    ensureParentsExpanded(path);
  }, [ensureParentsExpanded, openFile, selectionMode, store]);

  const handleSaveActiveTab = useCallback(() => {
    if (!activeTab) {
      return;
    }
    if (pendingSaves[activeTab.path]) {
      return;
    }
    if (!isTabDirty(activeTab)) {
      return;
    }
    void saveFile(activeTab.path);
  }, [activeTab, pendingSaves, saveFile]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 's') {
        event.preventDefault();
        handleSaveActiveTab();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSaveActiveTab]);

  const fileActionContext = useMemo<FileActionContext | null>(() => {
    if (!activeTab) {
      return null
    }
    return {
      tab: activeTab,
      save: handleSaveActiveTab,
      store,
      projectId,
    }
  }, [activeTab, handleSaveActiveTab, projectId, store])

  const matchedFileActionRenderer = useMemo(() => {
    if (!fileActionContext) {
      return null
    }
    return fileActionRenderers.find((renderer) => renderer.match(fileActionContext)) ?? null
  }, [fileActionContext, fileActionRenderers])


  const fileActionPanelKey = fileActionContext && matchedFileActionRenderer ? `${matchedFileActionRenderer.id}:${fileActionContext.tab.path}` : null

  const computedPanels = useMemo(() => {
    if (fileActionContext && matchedFileActionRenderer) {
      const dynamicPanel: WorkspacePanel = {
        id: '__file-action-panel',
        label: matchedFileActionRenderer.label,
        icon: matchedFileActionRenderer.icon ?? FlaskConical,
        position: 'right',
        allowCollapse: true,
        content: matchedFileActionRenderer.render(fileActionContext),
      }
      return [...panels, dynamicPanel]
    }
    return panels
  }, [fileActionContext, matchedFileActionRenderer, panels])

  const leftPanels = useMemo(() => computedPanels.filter((panel) => (panel.position ?? 'right') === 'left'), [computedPanels])
  const rightPanels = useMemo(() => computedPanels.filter((panel) => (panel.position ?? 'right') === 'right'), [computedPanels])

  const [activePanels, setActivePanels] = useState<{ left: string | null; right: string | null }>(() => ({
    left: pickDefaultPanelId(leftPanels),
    right: pickDefaultPanelId(rightPanels),
  }))

  useEffect(() => {
    setActivePanels((prev) => {
      let nextLeft = prev.left
      let nextRight = prev.right
      if (nextLeft && !leftPanels.some((panel) => panel.id === nextLeft)) {
        nextLeft = pickDefaultPanelId(leftPanels)
      }
      if (nextRight && !rightPanels.some((panel) => panel.id === nextRight)) {
        nextRight = pickDefaultPanelId(rightPanels)
      }
      if (nextLeft === prev.left && nextRight === prev.right) {
        return prev
      }
      return { left: nextLeft, right: nextRight }
    })
  }, [leftPanels, rightPanels])

  const lastFileActionKeyRef = useRef<string | null>(null)
  useEffect(() => {
    if (!fileActionPanelKey) {
      lastFileActionKeyRef.current = null
      return
    }
    if (lastFileActionKeyRef.current === fileActionPanelKey) {
      return
    }
    lastFileActionKeyRef.current = fileActionPanelKey
    setActivePanels((prev) => ({ ...prev, right: '__file-action-panel' }))
  }, [fileActionPanelKey])


  const registerTomlLanguage = useCallback((monaco: MonacoType) => {
    if (monacoTomlRegistered.current) {
      return;
    }
    const alreadyRegistered = monaco.languages.getLanguages().some((lang) => lang.id === 'toml');
    if (!alreadyRegistered) {
      monaco.languages.register({ id: 'toml' });
    }
    monaco.languages.setMonarchTokensProvider('toml', TOML_LANGUAGE as any);
    monaco.languages.setLanguageConfiguration('toml', TOML_LANGUAGE_CONFIGURATION as any);
    monacoTomlRegistered.current = true;
  }, []);

  const handleEditorBeforeMount = useCallback((monaco: MonacoType) => {
    registerTomlLanguage(monaco);
  }, [registerTomlLanguage]);

  const handleEditorDidMount = useCallback(
    (editor: MonacoEditorInstance, monacoInstance: MonacoType) => {
      editor.addCommand(monacoInstance.KeyMod.CtrlCmd | monacoInstance.KeyCode.KeyS, () => {
        handleSaveActiveTab();
      });
      editor.onKeyDown((event) => {
        if ((event.metaKey || event.ctrlKey) && event.code === 'KeyS') {
          event.preventDefault();
          handleSaveActiveTab();
        }
      });
    },
    [handleSaveActiveTab],
  );

  const firstAvailableFile = useMemo(() => findFirstFilePath(tree), [tree]);

  useEffect(() => {
    if (defaultFilePath) {
      return;
    }
    if (autoOpenAttemptedRef.current) {
      return;
    }
    if (tabs.length > 0) {
      return;
    }
    if (!firstAvailableFile) {
      return;
    }
    autoOpenAttemptedRef.current = true;
    void handleOpenFile(firstAvailableFile);
  }, [defaultFilePath, firstAvailableFile, tabs.length, handleOpenFile]);


  const toggleDirectory = useCallback((path: string) => {
    setExpandedPaths((prev) => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  }, []);

  const handleCreateEntry = useCallback(
    async (type: 'file' | 'directory', rawPath: string, content?: string) => {
      const path = normalizePath(rawPath)
      if (!path) {
        return
      }
      if (type === 'file') {
        await createFile(path, content ?? '')
        await handleOpenFile(path)
      } else {
        await createDirectory(path)
        ensureParentsExpanded(path)
      }
    },
    [createFile, createDirectory, handleOpenFile, ensureParentsExpanded],
  )

  const handleDialogCreate = useCallback(async () => {
    await handleCreateEntry(newEntryType, newEntryPath, newEntryType === 'file' ? newEntryContent : undefined)
    setNewEntryOpen(false)
    setNewEntryPath('')
    setNewEntryContent('')
  }, [handleCreateEntry, newEntryContent, newEntryPath, newEntryType])

  const handlePanelResizeMove = useCallback((event: MouseEvent) => {
    if (!resizeStateRef.current) {
      return
    }
    const { position, startX, startWidth } = resizeStateRef.current
    const delta = position === 'right' ? startX - event.clientX : event.clientX - startX
    const nextWidth = Math.min(Math.max(startWidth + delta, 220), 640)
    if (position === 'right') {
      setRightPanelWidth(nextWidth)
    } else {
      setLeftPanelWidth(nextWidth)
    }
  }, [])

  const handlePanelResizeEnd = useCallback(() => {
    resizeStateRef.current = null
    window.removeEventListener('mousemove', handlePanelResizeMove)
    window.removeEventListener('mouseup', handlePanelResizeEnd)
  }, [handlePanelResizeMove])

  const handlePanelResizeStart = useCallback((position: WorkspacePanelPosition, event: React.MouseEvent<HTMLDivElement>) => {
    event.preventDefault()
    const startWidth = position === 'right' ? rightPanelWidth : leftPanelWidth
    resizeStateRef.current = {
      position,
      startX: event.clientX,
      startWidth,
    }
    window.addEventListener('mousemove', handlePanelResizeMove)
    window.addEventListener('mouseup', handlePanelResizeEnd)
  }, [rightPanelWidth, leftPanelWidth, handlePanelResizeEnd, handlePanelResizeMove])

  useEffect(() => () => {
    window.removeEventListener('mousemove', handlePanelResizeMove)
    window.removeEventListener('mouseup', handlePanelResizeEnd)
  }, [handlePanelResizeEnd, handlePanelResizeMove])

  const handleDeleteEntry = useCallback(
    async (path: string, _isDirectory?: boolean) => {
      if (!path) return;
      const confirmed =
        typeof window === 'undefined'
          ? true
          : window.confirm(`Delete "${path}"?\nThis action cannot be undone.`);
      if (!confirmed) return;
      await deleteEntry(path, true);
      if (activeTab?.path === path) {
        closeTab(path);
      }
    },
    [deleteEntry, activeTab?.path, closeTab],
  );
  const editorTheme = resolvedTheme === 'light' ? 'vs-light' : 'vs-dark';

  const explorerPanel = useMemo(() => (
    <FileList
      tree={tree}
      expandedPaths={expandedPaths}
      activePath={activeTab?.path}
      onToggle={toggleDirectory}
      onOpenFile={(path) => {
        void handleOpenFile(path)
      }}
      onDeleteEntry={(path, isDirectory) => {
        void handleDeleteEntry(path, Boolean(isDirectory))
      }}
    />
  ), [tree, expandedPaths, activeTab?.path, toggleDirectory, handleOpenFile, handleDeleteEntry]);

  const explorerActionBar = useMemo(() => (
    <div className="flex items-center gap-2 px-3 py-2">
      <Dialog open={newEntryOpen} onOpenChange={setNewEntryOpen}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setNewEntryOpen(true)}
              className="text-muted-foreground hover:text-foreground"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">New file or folder</TooltipContent>
        </Tooltip>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Create {newEntryType === 'file' ? 'File' : 'Folder'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Type
              </label>
              <Select value={newEntryType} onValueChange={(value: 'file' | 'directory') => setNewEntryType(value)}>
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
            <Button onClick={() => void handleDialogCreate()} disabled={!newEntryPath.trim()}>
              Create
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => void refresh()}
            className="text-muted-foreground hover:text-foreground"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">Refresh workspace</TooltipContent>
      </Tooltip>
    </div>
  ), [handleDialogCreate, newEntryContent, newEntryOpen, newEntryPath, newEntryType, refresh])
  const headerFileActions = useMemo(() => {
    const actions: ReactNode[] = []
    const isSaving = activeTab ? Boolean(pendingSaves[activeTab.path]) : false
    const saveDisabled = !activeTab || !isTabDirty(activeTab) || isSaving

    actions.push(
      <Tooltip key="save">
        <TooltipTrigger asChild>
          <Button
            variant="secondary"
            size="sm"
            disabled={saveDisabled}
            onClick={handleSaveActiveTab}
            className="gap-2"
          >
            {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            Save
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">Save file (⌘/Ctrl+S)</TooltipContent>
      </Tooltip>,
    )

    if (fileActionContext) {
      fileActionItems
        .filter((action) => !action.isVisible || action.isVisible(fileActionContext))
        .forEach((action) => {
          const actionDisabled = action.disabled?.(fileActionContext) ?? false
          actions.push(
            <Tooltip key={action.id}>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-2"
                  disabled={actionDisabled}
                  onClick={() => action.onSelect(fileActionContext)}
                >
                  <action.icon className="h-3.5 w-3.5" />
                  {action.label}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">{action.label}</TooltipContent>
            </Tooltip>,
          )
        })
    }

    return actions
  }, [activeTab, fileActionContext, fileActionItems, handleSaveActiveTab, pendingSaves])

  const workspaceActivities = useMemo<WorkspaceActivityItem[]>(() => {
    const explorerItem: WorkspaceActivityItem = {
      id: 'explorer',
      label: 'Explorer',
      icon: Files,
      mode: 'explorer',
      content: explorerPanel,
      renderActionBar: explorerActionBar,
      position: 'left',
      type: 'sidebar',
      order: -1000,
    }

    const merged = [explorerItem, ...activityBarItems.map((item) => ({ ...item, position: item.position ?? 'left' }))]
    const seen = new Set<string>()
    return merged
      .map((item, index) => ({ item, index }))
      .filter(({ item }) => {
        if (seen.has(item.id)) {
          return false
        }
        seen.add(item.id)
        return true
      })
      .sort((a, b) => {
        const orderA = a.item.order ?? 0
        const orderB = b.item.order ?? 0
        if (orderA !== orderB) {
          return orderA - orderB
        }
        return a.index - b.index
      })
      .map(({ item }) => item)
  }, [activityBarItems, explorerActionBar, explorerPanel])

  const [activeSidebars, setActiveSidebars] = useState<{ left: string | null; right: string | null }>(() => {
    const defaults: { left: string | null; right: string | null } = { left: null, right: null }
    workspaceActivities.forEach((item) => {
      const pos = item.position ?? 'left'
      if (resolveActivityItemType(item) === 'sidebar' && !defaults[pos]) {
        defaults[pos] = item.id
      }
    })
    return defaults
  })

  const activitiesByPosition = useMemo<{ left: WorkspaceActivityItem[]; right: WorkspaceActivityItem[] }>(() => {
    const grouped = { left: [] as WorkspaceActivityItem[], right: [] as WorkspaceActivityItem[] }
    for (const item of workspaceActivities) {
      const target = item.position ?? 'left'
      grouped[target].push(item)
    }
    return grouped
  }, [workspaceActivities])

  const panelPositionMap = useMemo(() => {
    const map = new Map<string, WorkspacePanelPosition>()
    for (const panel of computedPanels) {
      map.set(panel.id, panel.position ?? 'right')
    }
    return map
  }, [computedPanels])


  useEffect(() => {
    setActiveSidebars((prev) => {
      const next: { left: string | null; right: string | null } = { ...prev }
      let changed = false
        ; (['left', 'right'] as const).forEach((position) => {
          const sidebarItems = activitiesByPosition[position].filter((item) => resolveActivityItemType(item) === 'sidebar')
          if (!sidebarItems.length) {
            if (next[position] !== null) {
              next[position] = null
              changed = true
            }
            return
          }
          const current = next[position]
          if (current) {
            const stillValid = sidebarItems.some((item) => item.id === current)
            if (!stillValid) {
              let defaultMatch: WorkspaceActivityItem | null = null
              if (defaultActivityId) {
                defaultMatch = sidebarItems.find((item) => item.id === defaultActivityId) ?? null
              }
              if (!defaultMatch) {
                defaultMatch = sidebarItems[0] ?? null
              }
              const nextId = defaultMatch ? defaultMatch.id : null
              if (current !== nextId) {
                next[position] = nextId
                changed = true
              }
            }
          }
        })
      return changed ? next : prev
    })
  }, [activitiesByPosition, defaultActivityId])

  const renderActionBar = useCallback((item?: WorkspaceActivityItem) => {
    if (!item?.renderActionBar) {
      return null
    }
    return typeof item.renderActionBar === 'function' ? item.renderActionBar() : item.renderActionBar
  }, [])

  const renderActivitySidebar = useCallback((position: WorkspacePanelPosition) => {
    const items = activitiesByPosition[position]
    const panelStack = position === 'left' ? leftPanels : rightPanels
    if (!items.length && !panelStack.length) {
      return null
    }

    const sidebarItems = items.filter((item) => resolveActivityItemType(item) === 'sidebar')
    const activeSidebarId = activeSidebars[position]
    const activeSidebarItem = sidebarItems.find((item) => item.id === activeSidebarId) ?? null
    const actionBarContent = activeSidebarItem ? renderActionBar(activeSidebarItem) : null

    const activePanelId = activePanels[position]
    const activePanel = panelStack.find((panel) => panel.id === activePanelId) ?? null
    const showPanel = Boolean(activePanel)
    const sidebarOpen = Boolean(activeSidebarItem)

    const handleActivityClick = (item: WorkspaceActivityItem) => {
      const type = resolveActivityItemType(item)
      if (type === 'sidebar') {
        setActiveSidebars((prev) => {
          const current = prev[position]
          const nextId = current === item.id ? null : item.id
          if (current === nextId) {
            return prev
          }
          return { ...prev, [position]: nextId }
        })
        return
      }

      if (type === 'panel' && item.panelId) {
        const panel = computedPanels.find((candidate) => candidate.id === item.panelId)
        if (panel) {
          const panelPosition = item.panelPosition ?? panel.position ?? panelPositionMap.get(panel.id) ?? 'right'
          setActivePanels((prev) => {
            const current = prev[panelPosition]
            const nextId = current === panel.id ? null : panel.id
            if (current === nextId) {
              return prev
            }
            return { ...prev, [panelPosition]: nextId }
          })
        }
        return
      }

      if (type === 'action') {
        item.onSelect?.()
      }
    }

    const nav = items.length ? (
      <nav
        className={cls(
          'flex h-full w-12 flex-col items-center gap-2 border-border/70 bg-muted/20 py-3 dark:bg-muted/30',
          position === 'left' ? 'border-r' : 'border-l',
        )}
      >
        {items.map((item) => {
          const type = resolveActivityItemType(item)
          const targetPanelId = item.panelId
          const targetPanelPosition = targetPanelId ? item.panelPosition ?? panelPositionMap.get(targetPanelId) ?? 'right' : position
          const isActive =
            type === 'sidebar'
              ? activeSidebars[position] === item.id
              : type === 'panel' && targetPanelId
                ? activePanels[targetPanelPosition] === targetPanelId
                : false
          return (
            <Tooltip key={item.id}>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  aria-label={item.label}
                  aria-pressed={isActive}
                  onClick={() => handleActivityClick(item)}
                  className={cls(
                    'flex h-10 w-10 items-center justify-center rounded-lg text-muted-foreground transition',
                    isActive ? 'bg-primary/15 text-primary' : 'hover:text-foreground',
                  )}
                >
                  <item.icon className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent side={position === 'left' ? 'right' : 'left'}>{item.label}</TooltipContent>
            </Tooltip>
          )
        })}
      </nav>
    ) : null

    const width = showPanel
      ? position === 'left' ? leftPanelWidth : rightPanelWidth
      : sidebarOpen
        ? SIDEBAR_WIDTH[position]
        : 0
    const contentLabel = showPanel ? activePanel?.label : activeSidebarItem?.label
    const contentNode = showPanel ? activePanel?.content : activeSidebarItem?.content ?? null
    const shouldRenderBody = showPanel || sidebarOpen

    const handleCloseView = () => {
      if (showPanel) {
        setActivePanels((prev) => ({ ...prev, [position]: null }))
        return
      }
      setActiveSidebars((prev) => ({ ...prev, [position]: null }))
    }

    const header = contentLabel ? (
      <div className="flex items-center justify-between px-3 py-2">
        <span className="text-[11px] font-semibold uppercase tracking-[0.25em] text-muted-foreground">{contentLabel}</span>
        <Button
          size="icon"
          variant="ghost"
          className="text-muted-foreground hover:text-foreground"
          onClick={handleCloseView}
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>
    ) : null

    const actionBarNode = actionBarContent && !showPanel ? (
      <div className="border-b border-border/60 bg-background/70">{actionBarContent}</div>
    ) : null

    const body = shouldRenderBody ? (
      <div
        className={cls(
          'flex h-full min-w-0 flex-col border-border/70 bg-muted/10 dark:bg-muted/20',
          position === 'left' ? 'border-r' : 'border-l',
        )}
        style={{ width }}
      >
        {header}
        {actionBarNode}
        <div className="flex-1 overflow-auto">
          {contentNode ?? <div className="text-xs text-muted-foreground">Select a tool to get started.</div>}
        </div>
      </div>
    ) : null

    const resizeHandle = showPanel ? (
      <div
        role="presentation"
        className={cls(
          'w-1 cursor-col-resize bg-transparent',
          position === 'left' ? 'border-r border-border/60' : 'border-l border-border/60',
        )}
        onMouseDown={(event: React.MouseEvent<HTMLDivElement>) => handlePanelResizeStart(position, event)}
      />
    ) : null

    if (position === 'left') {
      return (
        <div className="flex h-full border-border/70" key="left-sidebar">
          {nav}
          {body}
          {resizeHandle}
        </div>
      )
    }

    return (
      <div className="flex h-full border-border/70" key="right-sidebar">
        {resizeHandle}
        {body}
        {nav}
      </div>
    )
  }, [activitiesByPosition, activePanels, activeSidebars, computedPanels, handlePanelResizeStart, leftPanelWidth, panelPositionMap, renderActionBar, rightPanelWidth])


  const leftSidebarElement = renderActivitySidebar('left')
  const rightSidebarElement = renderActivitySidebar('right')

  return (
    <TooltipProvider>
      <div
        className={cls(
          'flex flex-1 min-h-0 flex-col overflow-hidden bg-card text-foreground',
          'supports-[backdrop-filter]:bg-card/85',
          className,
        )}
      >
        <div className="flex h-full overflow-hidden">
          {leftSidebarElement}

          <div className="flex flex-1 flex-col overflow-hidden bg-muted/10 dark:bg-muted/20">
            <header className="flex items-center justify-between gap-4 px-3 py-2 backdrop-blur supports-[backdrop-filter]:bg-background/60">
              <div className="flex flex-1 items-center gap-2 overflow-x-auto">

                {tabs.map((tab) => (
                  <WorkspaceTab
                    key={tab.path}
                    tab={tab}
                    isActive={activeTab?.path === tab.path}
                    isSaving={Boolean(pendingSaves[tab.path])}
                    onSelect={() => {
                      setActiveTab(tab.path);
                    }}
                    onClose={() => closeTab(tab.path)}
                  />
                ))}
              </div>

              <div className="flex items-center gap-2">
                {headerFileActions}
                {onSyncWorkspace ? (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => void onSyncWorkspace()}
                        disabled={Boolean(isSyncingWorkspace)}
                        className="text-muted-foreground hover:text-foreground"
                        aria-label="Sync workspace"
                      >
                        {isSyncingWorkspace ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <RefreshCw className="h-4 w-4" />
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">Sync workspace</TooltipContent>
                  </Tooltip>
                ) : null}
              </div>
            </header>

            {error ? (
              <div className="border-b border-destructive/30 bg-destructive/10 px-4 py-2 text-xs text-destructive">
                {error}
              </div>
            ) : null}

            <div className="flex flex-1 overflow-hidden">
              <main className={cls('flex flex-1 flex-col overflow-hidden')}>
                {activeTab ? (
                  <div className="flex h-full flex-col gap-3">

                    <div className="relative flex-1 overflow-hidden border border-border/70 bg-background">
                      {isBrowser ? (
                        <Editor
                          key={activeTab.path}
                          value={activeTab.content}
                          language={detectLanguage(activeTab.path)}
                          theme={editorTheme}
                          onChange={(value) => updateTabContent(activeTab.path, value ?? '')}
                          beforeMount={handleEditorBeforeMount}
                          onMount={handleEditorDidMount}
                          options={{
                            fontSize: 14,
                            minimap: { enabled: false },
                            scrollBeyondLastLine: false,
                            smoothScrolling: true,
                            padding: { top: 16, bottom: 16 },
                          }}
                          loading={<div className="flex h-full items-center justify-center text-xs text-muted-foreground">Loading editor…</div>}
                          height="100%"
                        />
                      ) : (
                        <Textarea
                          className="min-h-0 h-full w-full flex-1 resize-none rounded-none border-none bg-transparent font-mono text-sm text-foreground"
                          spellCheck={false}
                          value={activeTab.content}
                          onChange={(event: React.ChangeEvent<HTMLTextAreaElement>) =>
                            updateTabContent(activeTab.path, event.target.value)
                          }
                          onKeyDown={(event) => {
                            if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 's') {
                              event.preventDefault();
                              handleSaveActiveTab();
                            }
                          }}
                        />
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex h-full flex-col items-center justify-center text-sm text-muted-foreground">
                    <FileText className="mb-2 h-8 w-8 opacity-60" />
                    <p>Select a file to begin editing.</p>
                  </div>
                )}
              </main>
              {rightSidebarElement}
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
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
        'group flex items-center gap-1 truncate rounded border px-3 py-1 text-xs transition',
        isActive
          ? 'border-primary/50 bg-primary/10 text-foreground'
          : 'border-border/70 text-muted-foreground hover:border-border hover:text-foreground'
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
        className="rounded-full p-0.5 opacity-0 transition group-hover:opacity-100 hover:bg-muted"
        aria-label={`Close ${label}`}
      >
        ✕
      </button>
      {isSaving ? <span className="text-[10px] opacity-70">…</span> : null}
    </div>
  );
};

function sortTree(a: DirectoryTreeNode, b: DirectoryTreeNode) {
  if (a.type === b.type) {
    return a.name.localeCompare(b.name);
  }
  return a.type === 'directory' ? -1 : 1;
}

function findFirstFilePath(node: DirectoryTreeNode | null): string | null {
  if (!node) {
    return null;
  }
  if (node.type === 'file' && node.path) {
    return node.path;
  }
  if (!node.children || node.children.length === 0) {
    return null;
  }
  const sorted = node.children.slice().sort(sortTree);
  for (const child of sorted) {
    const match = findFirstFilePath(child);
    if (match) {
      return match;
    }
  }
  return null;
}

export default FileWorkspace;
