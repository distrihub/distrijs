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
import {
  ChevronRight,
  FileText,
  FlaskConical,
  Folder,
  Loader2,
  MoreVertical,
  Plus,
  RefreshCw,
  Save,
  Sparkles,
  Files,
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
import { FileList } from './FileList';

const normalizePath = (path: string) => path.replace(/\\/g, '/').replace(/^\/+|\/+$/g, '');

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

export interface TestingPanelConfig {
  title?: string;
  description?: string;
  defaultPayload?: string;
  generateButtonLabel?: string;
  runButtonLabel?: string;
  onGenerate?: (currentPayload: string) => Promise<string | void> | string | void;
  onRun?: (payload: string) => Promise<string | void> | string | void;
  resultPlaceholder?: string;
}

export interface WorkspaceActivityItem {
  id: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  mode?: 'explorer' | 'custom';
  content?: ReactNode;
}

export interface WorkspaceStaticTab {
  id: string;
  title: string;
  content: ReactNode;
}

export interface WorkspaceSidePanel {
  id: string;
  content: ReactNode;
  width?: number | string;
  className?: string;
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
  testing?: TestingPanelConfig;
  activityBarItems?: WorkspaceActivityItem[];
  defaultActivityId?: string;
  onSyncWorkspace?: () => void | Promise<void>;
  isSyncingWorkspace?: boolean;
  sidePanels?: WorkspaceSidePanel[];
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
  testing,
  activityBarItems = [],
  defaultActivityId,
  onSyncWorkspace,
  isSyncingWorkspace,
  sidePanels = [],
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
  const [testPayload, setTestPayload] = useState<string>(() => testing?.defaultPayload ?? '{\n  "input": "sample"\n}');
  const [testOutput, setTestOutput] = useState<string>(testing?.resultPlaceholder ?? 'No tests have been executed yet.');
  const [testStatus, setTestStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [isRunningTest, setIsRunningTest] = useState(false);
  const [isGeneratingTest, setIsGeneratingTest] = useState(false);
  const [testError, setTestError] = useState<string | null>(null);
  const resultPlaceholder = testing?.resultPlaceholder ?? 'No tests have been executed yet.';
  const [newEntryOpen, setNewEntryOpen] = useState(false);
  const [newEntryType, setNewEntryType] = useState<'file' | 'directory'>('file');
  const [newEntryPath, setNewEntryPath] = useState('');
  const [newEntryContent, setNewEntryContent] = useState('');
  const hasTestingPanel = Boolean(testing);


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

  useEffect(() => {
    setTestPayload(testing?.defaultPayload ?? '{\n  "input": "sample"\n}');
    setTestOutput(resultPlaceholder);
    setTestStatus('idle');
    setTestError(null);
  }, [testing?.defaultPayload, resultPlaceholder]);

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


  const handleGenerateTestPayload = useCallback(async () => {
    if (!testing?.onGenerate) {
      return;
    }
    setIsGeneratingTest(true);
    setTestError(null);
    try {
      const generated = await testing.onGenerate(testPayload);
      if (typeof generated === 'string') {
        setTestPayload(generated);
      }
      setTestStatus('idle');
    } catch (err) {
      setTestError(err instanceof Error ? err.message : 'Failed to generate test payload.');
    } finally {
      setIsGeneratingTest(false);
    }
  }, [testing, testPayload]);

  const handleRunTestPayload = useCallback(async () => {
    if (!testing?.onRun) {
      setTestStatus('error');
      setTestOutput('Connect a test runner to enable this panel.');
      return;
    }
    setIsRunningTest(true);
    setTestError(null);
    try {
      const result = await testing.onRun(testPayload);
      if (typeof result === 'string') {
        setTestOutput(result);
      } else if (result === undefined) {
        setTestOutput('Test run completed.');
      }
      setTestStatus('success');
    } catch (err) {
      setTestStatus('error');
      setTestOutput('');
      setTestError(err instanceof Error ? err.message : 'Failed to run test.');
    } finally {
      setIsRunningTest(false);
    }
  }, [testing, testPayload]);

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
      onRefresh={() => void refresh()}
      onCreateEntry={({ type, path, content }) => handleCreateEntry(type, path, content)}
    />
  ), [tree, expandedPaths, activeTab?.path, toggleDirectory, handleOpenFile, handleDeleteEntry, refresh, handleCreateEntry]);

  const workspaceActivities = useMemo<WorkspaceActivityItem[]>(() => {
    const explorerItem: WorkspaceActivityItem = {
      id: 'explorer',
      label: 'Explorer',
      icon: Files,
      content: explorerPanel,
    }
    if (!activityBarItems.length) {
      return [explorerItem]
    }
    return [explorerItem, ...activityBarItems]
  }, [activityBarItems, explorerPanel])

  const [activeActivityId, setActiveActivityId] = useState<string>(() => {
    if (defaultActivityId && workspaceActivities.some((item) => item.id === defaultActivityId)) {
      return defaultActivityId
    }
    return workspaceActivities[0]?.id ?? 'explorer'
  })

  useEffect(() => {
    if (!workspaceActivities.length) {
      return
    }
    if (workspaceActivities.some((item) => item.id === activeActivityId)) {
      return
    }
    const fallback =
      (defaultActivityId && workspaceActivities.some((item) => item.id === defaultActivityId)
        ? defaultActivityId
        : workspaceActivities[0]?.id) ?? 'explorer'
    setActiveActivityId(fallback)
  }, [workspaceActivities, activeActivityId, defaultActivityId])

  const resolvedActivityItem = workspaceActivities.find((item) => item.id === activeActivityId) ?? workspaceActivities[0]
  const isExplorerSidebar = resolvedActivityItem?.mode !== 'custom'
  const resolvedSidebarCustom = !isExplorerSidebar ? resolvedActivityItem?.content : null
  const hasActivityBar = workspaceActivities.length > 1

  const testingPanelContent = hasTestingPanel ? (
    <div className="flex h-full flex-col gap-4 text-foreground">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-[0.35em] text-muted-foreground">
            {testing?.description ?? 'Parameters (JSON)'}
          </p>
          <h3 className="text-base font-semibold">{testing?.title ?? 'Testing'}</h3>
        </div>
        <FlaskConical className="h-5 w-5 text-muted-foreground" />
      </div>

      <div className="flex flex-col gap-3">
        <div className="overflow-hidden border border-border/70 bg-background">
          {isBrowser ? (
            <Editor
              value={testPayload}
              language="json"
              theme={editorTheme}
              onChange={(value) => setTestPayload(value ?? '')}
              beforeMount={handleEditorBeforeMount}
              onMount={handleEditorDidMount}
              height="220px"
              options={{
                minimap: { enabled: false },
                fontSize: 12,
                scrollBeyondLastLine: false,
                lineNumbers: 'off',
                wordWrap: 'on',
                padding: { top: 12, bottom: 12 },
              }}
            />
          ) : (
            <Textarea
              value={testPayload}
              onChange={(event: React.ChangeEvent<HTMLTextAreaElement>) => setTestPayload(event.target.value)}
              rows={10}
              className="bg-transparent font-mono text-xs text-foreground"
              onKeyDown={(event) => {
                if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 's') {
                  event.preventDefault()
                  handleSaveActiveTab()
                }
              }}
            />
          )}
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            className="flex-1 gap-2"
            disabled={!testing?.onGenerate || isGeneratingTest}
            onClick={handleGenerateTestPayload}
          >
            <Sparkles className="h-4 w-4" />
            {isGeneratingTest ? 'Generating…' : testing?.generateButtonLabel ?? 'Generate test'}
          </Button>
          <Button className="flex-1 gap-2" disabled={isRunningTest} onClick={handleRunTestPayload}>
            {isRunningTest ? 'Running…' : testing?.runButtonLabel ?? 'Run test'}
          </Button>
        </div>

        {testError ? (
          <div className="border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
            {testError}
          </div>
        ) : null}

        <div className="space-y-2">
          <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.25em] text-muted-foreground">
            <span>Output</span>
            <span
              className={cls(
                'rounded-full px-2 py-0.5 text-[10px] font-semibold',
                testStatus === 'success'
                  ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                  : testStatus === 'error'
                    ? 'bg-red-500/20 text-red-700 dark:text-red-200'
                    : 'bg-muted/40 text-muted-foreground'
              )}
            >
              {testStatus === 'success' ? 'Ready' : testStatus === 'error' ? 'Error' : 'Idle'}
            </span>
          </div>
          <div className="max-h-40 overflow-y-auto border border-border/70 bg-background p-3 text-[11px] text-muted-foreground">
            <pre className="whitespace-pre-wrap break-words font-mono text-xs">
              {testOutput || resultPlaceholder}
            </pre>
          </div>
        </div>
      </div>
    </div>
  ) : null

  const resolvedSidePanels = useMemo(() => {
    const panels = [...sidePanels]
    if (testingPanelContent) {
      panels.push({
        id: 'testing',
        content: testingPanelContent,
        width: 320,
        className: 'border-l border-border/80 bg-muted/10 px-4 py-4 backdrop-blur dark:bg-muted/20',
      })
    }
    return panels
  }, [sidePanels, testingPanelContent])

  return (
    <TooltipProvider>
      <div
        className={cls(
          'flex flex-1 flex-col overflow-hidden bg-card text-foreground',
          'supports-[backdrop-filter]:bg-card/85',
          className,
        )}
      >
        <div className="flex h-full overflow-hidden">
          {hasActivityBar ? (
            <div className="flex h-full">
              <nav className="flex w-12 flex-col items-center gap-2 border-r border-border/80 bg-muted/5 py-3">
                {activityBarItems.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    aria-label={item.label}
                    onClick={() => setActiveActivityId(item.id)}
                    className={cls(
                      'flex h-10 w-10 items-center justify-center rounded-lg text-muted-foreground transition',
                      resolvedActivityItem?.id === item.id
                        ? 'bg-primary/15 text-primary'
                        : 'hover:text-foreground'
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                  </button>
                ))}
              </nav>
              <aside
                className={cls(
                  'flex h-full flex-col border-r border-border/80 bg-muted/10 transition-all duration-200 ease-in-out dark:bg-muted/20',
                  'w-64'
                )}
              >
                {isExplorerSidebar ? (
                  <>
                    <div className="flex items-center gap-2 px-3 pt-3">
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
                              <Select
                                value={newEntryType}
                                onValueChange={(value: 'file' | 'directory') => setNewEntryType(value)}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="file">File</SelectItem>
                                  <SelectItem value="directory">Folder</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="grid gap-2">
                              <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                Path
                              </label>
                              <Input
                                placeholder="src/index.ts"
                                value={newEntryPath}
                                onChange={(event) => setNewEntryPath(event.target.value)}
                              />
                            </div>
                            {newEntryType === 'file' ? (
                              <div className="grid gap-2">
                                <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                  Initial content
                                </label>
                                <Textarea
                                  rows={4}
                                  value={newEntryContent}
                                  onChange={(event: React.ChangeEvent<HTMLTextAreaElement>) =>
                                    setNewEntryContent(event.target.value)
                                  }
                                  placeholder="// Optional starting content"
                                />
                              </div>
                            ) : null}
                          </div>
                          <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={() => setNewEntryOpen(false)}>
                              Cancel
                            </Button>
                            <Button onClick={() => void handleDialogCreate()} disabled={!newEntryPath.trim()}>
                              Create
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => void refresh()}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex-1 overflow-auto">
                      {tree ? (
                        <ul className="space-y-1 px-2">
                          {tree.children
                            ?.slice()
                            .sort(sortTree)
                            .map((child) => (
                              <ExplorerNode
                                key={child.path}
                                node={child}
                                expandedPaths={expandedPaths}
                                onToggle={toggleDirectory}
                                onOpenFile={handleOpenFile}
                                onDeleteEntry={handleDeleteEntry}
                                activePath={activeTab?.path}
                              />
                            ))}
                        </ul>
                      ) : (
                        <div className="px-2 text-xs text-muted-foreground">No files yet. Create one to get started.</div>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="flex h-full flex-col overflow-hidden">
                    {resolvedSidebarCustom}
                  </div>
                )}
              </aside>
            </div>
          ) : (
            <aside
              className={cls(
                'flex h-full flex-col border-r border-border/80 bg-muted/10 transition-all duration-200 ease-in-out dark:bg-muted/20',
                'w-64'
              )}
              aria-hidden={isExplorerSidebar}
            >
              {isExplorerSidebar ? (
                <>
                  <div className="flex items-center gap-2 px-3 pt-3">
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
                          <Button onClick={() => void handleDialogCreate()} disabled={!newEntryPath.trim()}>
                            Create
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            void refresh();
                            void onSyncWorkspace?.();
                          }}
                          disabled={isSyncingWorkspace}
                          className="text-muted-foreground hover:text-foreground"
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
                  </div>

                  <div className="mt-2 flex-1 overflow-y-auto px-2 pb-4">
                    {tree && tree.children && tree.children.length > 0 ? (
                      <ul className="space-y-1 text-sm text-foreground/80">
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
                              onDeleteEntry={handleDeleteEntry}
                              activePath={activeTab?.path}
                            />
                          ))}
                      </ul>
                    ) : (
                      <div className="px-2 text-xs text-muted-foreground">No files yet. Create one to get started.</div>
                    )}
                  </div>
                </>
              ) : (
                <div className="flex h-full flex-col overflow-hidden">
                  {resolvedSidebarCustom}
                </div>
              )}
            </aside>
          )}

          <div className="flex flex-1 flex-col overflow-hidden bg-muted/10 dark:bg-muted/20">
            <header className="flex items-center gap-2 border-b border-border/80 bg-background/80 px-3 py-2 backdrop-blur supports-[backdrop-filter]:bg-background/60">
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

              <div className="ml-auto flex items-center gap-1">
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

                {activeTab ? (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        disabled={!isTabDirty(activeTab) || Boolean(pendingSaves[activeTab.path])}
                        onClick={handleSaveActiveTab}
                        className="text-muted-foreground hover:text-foreground"
                        aria-label="Save file"
                      >
                        {pendingSaves[activeTab.path] ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Save className="h-4 w-4" />
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">Save file</TooltipContent>
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

              {resolvedSidePanels.map((panel) => (
                <aside
                  key={panel.id}
                  className={cls(
                    'border-l border-border/80 bg-muted/10 px-4 py-4 backdrop-blur dark:bg-muted/20',
                    panel.className,
                  )}
                  style={panel.width ? { width: typeof panel.width === 'number' ? `${panel.width}px` : panel.width } : undefined}
                >
                  {panel.content}
                </aside>
              ))}
            </div>
          </div>
        </div>
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
  onDeleteEntry: (path: string, isDirectory: boolean) => void;
}

const ExplorerNode: React.FC<ExplorerNodeProps> = ({ node, expandedPaths, onToggle, onOpenFile, activePath, onDeleteEntry }) => {
  const isDirectory = node.type === 'directory';
  const pathKey = node.path || node.name;
  const nodePath = node.path ?? '';
  const canDelete = Boolean(nodePath);
  const isExpanded = expandedPaths.has(pathKey ?? '');
  const isActive = activePath === node.path;

  const NodeMenu = () => {
    if (!canDelete) {
      return null;
    }
    return (
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          onDeleteEntry(nodePath, isDirectory);
        }}
        className="ml-auto rounded px-1 py-0.5 text-muted-foreground opacity-0 transition hover:bg-muted hover:text-foreground group-hover:opacity-100"
        aria-label={`Delete ${node.name}`}
      >
        <MoreVertical className="h-4 w-4" />
      </button>
    );
  };

  if (isDirectory) {
    return (
      <li>
        <div className="group flex w-full items-center gap-2 rounded px-2 py-1 text-sm">
          <button
            type="button"
            className={cls(
              'flex flex-1 items-center gap-2 rounded text-left text-muted-foreground transition hover:text-foreground',
              isActive && 'text-foreground'
            )}
            onClick={() => onToggle(node.path)}
          >
            <ChevronRight className={cls('h-3.5 w-3.5 transition-transform', isExpanded && 'rotate-90')} />
            <Folder className="h-4 w-4" />
            <span className="truncate">{node.name || '(root)'}</span>
          </button>
          <NodeMenu />
        </div>
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
                  onDeleteEntry={onDeleteEntry}
                />
              ))}
          </ul>
        ) : null}
      </li>
    );
  }

  return (
    <li>
      <div className="group flex w-full items-center gap-2 rounded px-2 py-1 text-sm">
        <button
          type="button"
          className={cls(
            'flex flex-1 items-center gap-2 rounded text-left text-muted-foreground transition hover:text-foreground',
            isActive && 'text-primary'
          )}
          onClick={() => onOpenFile(node.path)}
        >
          <FileText className="h-4 w-4" />
          <span className="truncate">{node.name}</span>
        </button>
        <NodeMenu />
      </div>
    </li>
  );
};

interface WorkspaceStaticTabProps {
  title: string;
  isActive: boolean;
  onSelect: () => void;
}

const WorkspaceStaticTab: React.FC<WorkspaceStaticTabProps> = ({ title, isActive, onSelect }) => (
  <div
    className={cls(
      'flex items-center gap-1 truncate rounded border px-3 py-1 text-xs transition',
      isActive
        ? 'border-primary/50 bg-primary/10 text-foreground'
        : 'border-border/70 text-muted-foreground hover:border-border hover:text-foreground'
    )}
  >
    <button type="button" onClick={onSelect} className="truncate text-left">
      {title}
    </button>
  </div>
);

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
