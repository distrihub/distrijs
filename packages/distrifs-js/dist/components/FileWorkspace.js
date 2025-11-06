import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo, useRef, useState } from 'react';
import { Button, Dialog, DialogContent, DialogHeader, DialogTitle, Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Separator, Sheet, SheetContent, SheetHeader, SheetTitle, Textarea, Tooltip, TooltipContent, TooltipProvider, TooltipTrigger, } from '@distri/react';
import { ChevronRight, FileText, Folder, Menu, PanelLeftClose, PanelLeftOpen, Plus, RefreshCw, Save, Trash2, } from 'lucide-react';
import { createFileWorkspaceStore, isTabDirty, useFileWorkspaceStore, } from '../store/fileStore';
import { IndexedDbFilesystem } from '../storage/indexedDbFilesystem';
const normalizePath = (path) => path.replace(/\\/g, '/').replace(/^\/+|\/+$/g, '');
const cls = (...classes) => classes.filter(Boolean).join(' ');
export const FileWorkspace = ({ projectId, initialEntries = [], previewRenderer, onSaveFile, filesystem, selectionMode = 'multiple', className, height = '640px', defaultFilePath, store: externalStore, }) => {
    const fs = useMemo(() => filesystem ?? IndexedDbFilesystem.forProject(projectId), [filesystem, projectId]);
    const saveHandlerRef = useRef(onSaveFile);
    const storeRef = useRef(null);
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
    const store = storeRef.current;
    useEffect(() => {
        saveHandlerRef.current = onSaveFile;
        store.getState().setSaveHandler(onSaveFile
            ? async (tab, activeFs) => {
                await onSaveFile(tab, { filesystem: activeFs, projectId });
            }
            : undefined);
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
    const [expandedPaths, setExpandedPaths] = useState(() => new Set(['']));
    const [newEntryOpen, setNewEntryOpen] = useState(false);
    const [newEntryType, setNewEntryType] = useState('file');
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
                    }
                    else {
                        await fs.readFile(normalizedPath);
                    }
                }
                catch (error) {
                    if (entry.type === 'directory') {
                        await fs.createDirectory(normalizedPath);
                    }
                    else {
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
    const activeTab = useMemo(() => tabs.find((tab) => tab.path === activePath) ?? tabs.at(-1), [tabs, activePath]);
    const handleOpenFile = async (path) => {
        await openFile(path);
        if (selectionMode === 'single') {
            const currentTabs = store.getState().tabs.filter((tab) => tab.path === path);
            store.setState({ tabs: currentTabs, activePath: path });
        }
        ensureParentsExpanded(path);
    };
    const ensureParentsExpanded = (path) => {
        const segments = normalizePath(path).split('/');
        if (segments.length <= 1)
            return;
        const next = new Set(expandedPaths);
        let cursor = '';
        for (const part of segments.slice(0, -1)) {
            cursor = cursor ? `${cursor}/${part}` : part;
            next.add(cursor);
        }
        setExpandedPaths(next);
    };
    const toggleDirectory = (path) => {
        setExpandedPaths((prev) => {
            const next = new Set(prev);
            if (next.has(path)) {
                next.delete(path);
            }
            else {
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
        }
        else {
            await createDirectory(path);
            ensureParentsExpanded(path);
        }
        setNewEntryContent('');
        setNewEntryPath('');
        setNewEntryOpen(false);
    };
    const handleDeleteEntry = async () => {
        if (!deletePath.trim())
            return;
        await deleteEntry(deletePath.trim(), true);
        setDeleteDialogOpen(false);
        setDeletePath('');
    };
    const layoutHeight = typeof height === 'number' ? `${height}px` : height;
    return (_jsx(TooltipProvider, { children: _jsxs("div", { className: cls('flex flex-col overflow-hidden rounded-lg border border-border bg-background text-foreground shadow-sm', className), style: { height: layoutHeight }, children: [_jsxs("div", { className: "flex h-full overflow-hidden", children: [_jsxs("aside", { className: cls('flex h-full flex-col border-r border-border bg-muted/40 transition-all duration-200 ease-in-out', sidebarCollapsed ? 'w-0 min-w-0 translate-x-[-100%] opacity-0' : 'w-64'), "aria-hidden": sidebarCollapsed, children: [_jsxs("div", { className: "flex items-center justify-between border-b border-border px-4 py-3", children: [_jsxs("div", { children: [_jsx("h2", { className: "text-sm font-semibold", children: "Project Files" }), _jsx("p", { className: "text-xs text-muted-foreground", children: projectId })] }), _jsx(Button, { variant: "ghost", size: "icon", onClick: () => setSidebarCollapsed(true), className: "h-8 w-8", "aria-label": "Collapse sidebar", children: _jsx(PanelLeftClose, { className: "h-4 w-4" }) })] }), _jsxs("div", { className: "flex items-center gap-2 px-4 py-3", children: [_jsxs(Dialog, { open: newEntryOpen, onOpenChange: setNewEntryOpen, children: [_jsxs(Button, { size: "sm", className: "gap-2", onClick: () => setNewEntryOpen(true), children: [_jsx(Plus, { className: "h-4 w-4" }), "New\u2026"] }), _jsxs(DialogContent, { className: "sm:max-w-[420px]", children: [_jsx(DialogHeader, { children: _jsxs(DialogTitle, { children: ["Create ", newEntryType === 'file' ? 'File' : 'Folder'] }) }), _jsxs("div", { className: "grid gap-4 py-2", children: [_jsxs("div", { className: "grid gap-2", children: [_jsx("label", { className: "text-xs font-medium uppercase tracking-wide text-muted-foreground", children: "Type" }), _jsxs(Select, { value: newEntryType, onValueChange: (value) => setNewEntryType(value), children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, { placeholder: "Select type" }) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "file", children: "File" }), _jsx(SelectItem, { value: "directory", children: "Folder" })] })] })] }), _jsxs("div", { className: "grid gap-2", children: [_jsx("label", { className: "text-xs font-medium uppercase tracking-wide text-muted-foreground", children: "Relative path" }), _jsx(Input, { autoFocus: true, value: newEntryPath, onChange: (event) => setNewEntryPath(event.target.value), placeholder: "src/components/NewFile.tsx" })] }), newEntryType === 'file' ? (_jsxs("div", { className: "grid gap-2", children: [_jsx("label", { className: "text-xs font-medium uppercase tracking-wide text-muted-foreground", children: "Initial content" }), _jsx(Textarea, { rows: 6, value: newEntryContent, onChange: (event) => setNewEntryContent(event.target.value), placeholder: "// File contents" })] })) : null] }), _jsxs("div", { className: "flex justify-end gap-2", children: [_jsx(Button, { variant: "secondary", onClick: () => setNewEntryOpen(false), children: "Cancel" }), _jsx(Button, { onClick: handleCreateEntry, disabled: !newEntryPath.trim(), children: "Create" })] })] })] }), _jsxs(Tooltip, { children: [_jsx(TooltipTrigger, { asChild: true, children: _jsx(Button, { variant: "ghost", size: "icon", onClick: () => refresh(), className: "h-8 w-8", children: _jsx(RefreshCw, { className: "h-4 w-4" }) }) }), _jsx(TooltipContent, { side: "bottom", children: "Refresh tree" })] })] }), _jsx("div", { className: "flex-1 overflow-y-auto px-2 pb-4", children: tree && tree.children && tree.children.length > 0 ? (_jsx("ul", { className: "space-y-1 text-sm", children: tree.children
                                            .slice()
                                            .sort(sortTree)
                                            .map((child) => (_jsx(ExplorerNode, { node: child, expandedPaths: expandedPaths, onToggle: toggleDirectory, onOpenFile: handleOpenFile, activePath: activeTab?.path }, child.path))) })) : (_jsx("div", { className: "px-2 text-xs text-muted-foreground", children: "No files yet. Create one to get started." })) }), _jsx("div", { className: "border-t border-border px-4 py-3", children: _jsxs(Button, { variant: "outline", size: "sm", className: "w-full gap-2", onClick: () => {
                                            setDeleteDialogOpen(true);
                                            setDeletePath(activeTab?.path ?? '');
                                        }, children: [_jsx(Trash2, { className: "h-4 w-4" }), "Delete path\u2026"] }) })] }), _jsxs("div", { className: "flex flex-1 flex-col overflow-hidden", children: [_jsxs("header", { className: "flex items-center gap-2 border-b border-border bg-muted/30 px-4 py-2", children: [_jsx(Button, { variant: "ghost", size: "icon", className: "h-8 w-8", onClick: () => setSidebarCollapsed((prev) => !prev), "aria-label": sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar', children: sidebarCollapsed ? _jsx(PanelLeftOpen, { className: "h-4 w-4" }) : _jsx(PanelLeftClose, { className: "h-4 w-4" }) }), _jsx("div", { className: "flex flex-1 items-center gap-2 overflow-x-auto", children: tabs.map((tab) => (_jsx(WorkspaceTab, { tab: tab, isActive: activeTab?.path === tab.path, isSaving: Boolean(pendingSaves[tab.path]), onSelect: () => setActiveTab(tab.path), onClose: () => closeTab(tab.path) }, tab.path))) }), activeTab ? (_jsxs(Button, { size: "sm", className: "gap-2", disabled: !isTabDirty(activeTab) || Boolean(pendingSaves[activeTab.path]), onClick: () => saveFile(activeTab.path), children: [_jsx(Save, { className: "h-4 w-4" }), pendingSaves[activeTab.path] ? 'Saving…' : 'Save'] })) : null] }), _jsx("div", { className: "flex items-center gap-2 border-b border-border px-4 py-2 text-xs text-red-500", children: error }), _jsxs("div", { className: "flex flex-1 overflow-hidden", children: [_jsx("main", { className: "flex flex-1 flex-col overflow-hidden px-4 py-3", children: activeTab ? (_jsxs("div", { className: "flex h-full flex-col", children: [_jsxs("div", { className: "mb-2 flex items-center justify-between text-xs text-muted-foreground", children: [_jsx("span", { children: activeTab.path }), isLoading ? _jsx("span", { className: "animate-pulse", children: "Loading\u2026" }) : null] }), _jsx(Textarea, { className: "min-h-0 flex-1 font-mono text-sm", spellCheck: false, value: activeTab.content, onChange: (event) => updateTabContent(activeTab.path, event.target.value) })] })) : (_jsxs("div", { className: "flex h-full flex-col items-center justify-center text-sm text-muted-foreground", children: [_jsx(FileText, { className: "mb-2 h-8 w-8 opacity-60" }), _jsx("p", { children: "Select a file to begin editing." })] })) }), _jsx(Separator, { orientation: "vertical", className: "h-auto" }), _jsxs("aside", { className: "flex w-80 flex-col overflow-hidden", children: [_jsxs("div", { className: "flex items-center justify-between border-b border-border px-4 py-3", children: [_jsx("h3", { className: "text-sm font-semibold", children: "Preview" }), _jsx(Button, { variant: "ghost", size: "icon", className: "h-8 w-8", onClick: () => setPreviewSheetOpen(true), "aria-label": "Open preview", children: _jsx(Menu, { className: "h-4 w-4" }) })] }), _jsx("div", { className: "flex-1 overflow-y-auto px-4 py-3 text-sm text-muted-foreground", children: activeTab ? (previewRenderer ? (_jsx("div", { className: "prose prose-sm dark:prose-invert", children: previewRenderer({ path: activeTab.path, content: activeTab.content, projectId }) })) : (_jsx("pre", { className: "whitespace-pre-wrap break-words text-xs text-foreground", children: activeTab.content }))) : (_jsx("p", { className: "text-xs text-muted-foreground", children: "Nothing to preview." })) })] })] })] })] }), _jsx(Sheet, { open: previewSheetOpen, onOpenChange: setPreviewSheetOpen, children: _jsxs(SheetContent, { side: "right", className: "w-full sm:max-w-3xl", children: [_jsx(SheetHeader, { children: _jsx(SheetTitle, { children: "Preview" }) }), _jsx("div", { className: "mt-4 max-h-[80vh] overflow-y-auto", children: activeTab ? (previewRenderer ? (_jsx("div", { className: "prose dark:prose-invert", children: previewRenderer({ path: activeTab.path, content: activeTab.content, projectId }) })) : (_jsx("pre", { className: "whitespace-pre-wrap break-words text-sm", children: activeTab.content }))) : (_jsx("p", { className: "text-sm text-muted-foreground", children: "Nothing to preview." })) })] }) }), _jsx(Dialog, { open: deleteDialogOpen, onOpenChange: setDeleteDialogOpen, children: _jsxs(DialogContent, { className: "sm:max-w-[420px]", children: [_jsx(DialogHeader, { children: _jsx(DialogTitle, { children: "Delete path" }) }), _jsx("p", { className: "text-sm text-muted-foreground", children: "Enter the path you want to delete. Deletions are recursive for folders." }), _jsx(Input, { value: deletePath, onChange: (event) => setDeletePath(event.target.value), placeholder: "e.g. src/components" }), _jsxs("div", { className: "flex justify-end gap-2", children: [_jsx(Button, { variant: "secondary", onClick: () => setDeleteDialogOpen(false), children: "Cancel" }), _jsx(Button, { variant: "destructive", onClick: handleDeleteEntry, disabled: !deletePath.trim(), children: "Delete" })] })] }) })] }) }));
};
const ExplorerNode = ({ node, expandedPaths, onToggle, onOpenFile, activePath }) => {
    const isDirectory = node.type === 'directory';
    const pathKey = node.path || node.name;
    const isExpanded = expandedPaths.has(pathKey ?? '');
    const isActive = activePath === node.path;
    if (isDirectory) {
        return (_jsxs("li", { children: [_jsxs("button", { type: "button", className: cls('flex w-full items-center gap-2 rounded px-2 py-1 text-left text-sm transition hover:bg-muted', isActive && 'bg-muted'), onClick: () => onToggle(node.path), children: [_jsx(ChevronRight, { className: cls('h-3.5 w-3.5 transition-transform', isExpanded && 'rotate-90') }), _jsx(Folder, { className: "h-4 w-4" }), _jsx("span", { className: "truncate", children: node.name || '(root)' })] }), isExpanded && node.children && node.children.length > 0 ? (_jsx("ul", { className: "ml-3 mt-1 space-y-1 border-l border-border/40 pl-2", children: node.children
                        .slice()
                        .sort(sortTree)
                        .map((child) => (_jsx(ExplorerNode, { node: child, expandedPaths: expandedPaths, onToggle: onToggle, onOpenFile: onOpenFile, activePath: activePath }, child.path))) })) : null] }));
    }
    return (_jsx("li", { children: _jsxs("button", { type: "button", className: cls('flex w-full items-center gap-2 rounded px-2 py-1 text-left text-sm transition hover:bg-muted', isActive && 'bg-primary/10 text-primary'), onClick: () => onOpenFile(node.path), children: [_jsx(FileText, { className: "h-4 w-4" }), _jsx("span", { className: "truncate", children: node.name })] }) }));
};
const WorkspaceTab = ({ tab, isActive, isSaving, onSelect, onClose }) => {
    const dirty = isTabDirty(tab);
    const label = tab.path.split('/').pop();
    return (_jsxs("div", { className: cls('group flex items-center gap-1 truncate rounded-md border border-transparent px-2 py-1 text-xs transition', isActive ? 'bg-primary text-primary-foreground' : 'bg-muted/60 text-muted-foreground hover:bg-muted'), children: [_jsxs("button", { type: "button", onClick: onSelect, className: "truncate text-left", children: [label, dirty ? ' *' : ''] }), _jsx("button", { type: "button", onClick: onClose, className: cls('rounded p-0.5 transition', isActive ? 'hover:bg-primary-foreground/20' : 'hover:bg-muted/80'), "aria-label": `Close ${label}`, children: "\u2715" }), isSaving ? _jsx("span", { className: "text-[10px] opacity-70", children: "\u2026" }) : null] }));
};
const sortTree = (a, b) => {
    if (a.type === b.type) {
        return a.name.localeCompare(b.name);
    }
    return a.type === 'directory' ? -1 : 1;
};
export default FileWorkspace;
