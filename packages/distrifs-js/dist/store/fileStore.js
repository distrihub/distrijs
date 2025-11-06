import { createStore } from 'zustand/vanilla';
import { useStore } from 'zustand';
import { IndexedDbFilesystem } from '../storage/indexedDbFilesystem';
export const defaultSaveHandler = async (_tab, _fs) => {
    // The store writes to the filesystem after invoking the handler.
};
export function createFileWorkspaceStore(projectId, options = {}) {
    const filesystem = options.filesystem ?? IndexedDbFilesystem.forProject(projectId);
    let saveHandler = options.saveHandler ?? defaultSaveHandler;
    const store = createStore((set, get) => ({
        projectId,
        filesystem,
        tree: null,
        tabs: [],
        activePath: undefined,
        isLoading: false,
        initialized: false,
        pendingSaves: {},
        async loadTree() {
            set({ isLoading: true, error: undefined });
            try {
                const tree = await filesystem.tree('');
                set({ tree, isLoading: false, initialized: true });
            }
            catch (error) {
                set({ error: error.message, isLoading: false });
            }
        },
        async refresh() {
            await get().loadTree();
        },
        async reloadFile(path) {
            try {
                const file = await filesystem.readFile(path);
                set((state) => ({
                    tabs: state.tabs.map((tab) => tab.path === path
                        ? {
                            ...tab,
                            content: file.content,
                            originalContent: file.content,
                            updatedAt: Date.now(),
                        }
                        : tab),
                }));
            }
            catch (error) {
                console.warn('[distrifs-js] Failed to reload file', path, error);
                set((state) => ({
                    tabs: state.tabs.filter((tab) => tab.path !== path),
                    activePath: state.activePath === path ? undefined : state.activePath,
                }));
            }
        },
        async openFile(path) {
            const normalized = path;
            set({ isLoading: true, error: undefined });
            try {
                const file = await filesystem.readFile(normalized);
                set((state) => {
                    const existing = state.tabs.find((tab) => tab.path === normalized);
                    const updatedTabs = existing
                        ? state.tabs.map((tab) => tab.path === normalized
                            ? { ...tab, content: file.content, originalContent: file.content, updatedAt: Date.now() }
                            : tab)
                        : [
                            ...state.tabs,
                            {
                                path: normalized,
                                content: file.content,
                                originalContent: file.content,
                                language: detectLanguageFromPath(normalized),
                                updatedAt: Date.now(),
                            },
                        ];
                    return {
                        tabs: updatedTabs,
                        activePath: normalized,
                        isLoading: false,
                    };
                });
            }
            catch (error) {
                set({ error: error.message, isLoading: false });
            }
        },
        closeTab(path) {
            set((state) => {
                const filtered = state.tabs.filter((tab) => tab.path !== path);
                const activePath = state.activePath === path ? filtered.at(-1)?.path : state.activePath;
                return { tabs: filtered, activePath };
            });
        },
        setActiveTab(path) {
            set({ activePath: path });
        },
        updateTabContent(path, content) {
            set((state) => ({
                tabs: state.tabs.map((tab) => tab.path === path
                    ? { ...tab, content, updatedAt: Date.now() }
                    : tab),
            }));
        },
        async saveFile(path) {
            const state = get();
            const tab = state.tabs.find((item) => item.path === path);
            if (!tab) {
                throw new Error(`Tab not found for ${path}`);
            }
            set((current) => ({ pendingSaves: { ...current.pendingSaves, [path]: true } }));
            try {
                await saveHandler(tab, filesystem);
                await filesystem.writeFile(tab.path, tab.content);
                set((current) => ({
                    tabs: current.tabs.map((item) => item.path === path
                        ? { ...item, originalContent: tab.content, updatedAt: Date.now() }
                        : item),
                }));
                await get().loadTree();
            }
            finally {
                set((current) => {
                    const next = { ...current.pendingSaves };
                    delete next[path];
                    return { pendingSaves: next };
                });
            }
        },
        async createFile(path, content) {
            await filesystem.writeFile(path, content);
            await get().refresh();
        },
        async createDirectory(path) {
            await filesystem.createDirectory(path);
            await get().refresh();
        },
        async deleteEntry(path, recursive) {
            await filesystem.deleteEntry(path, recursive);
            set((state) => ({
                tabs: state.tabs.filter((tab) => tab.path !== path && !tab.path.startsWith(`${path}/`)),
                activePath: state.activePath && state.activePath.startsWith(path)
                    ? undefined
                    : state.activePath,
            }));
            await get().refresh();
        },
        setSaveHandler(handler) {
            saveHandler = handler ?? defaultSaveHandler;
        },
        async handleExternalChange(event) {
            switch (event.type) {
                case 'delete': {
                    set((state) => ({
                        tabs: state.tabs.filter((tab) => tab.path !== event.path && (!event.destination || tab.path !== event.destination)),
                        activePath: state.activePath === event.path || state.activePath === event.destination
                            ? undefined
                            : state.activePath,
                    }));
                    break;
                }
                case 'move':
                case 'copy': {
                    if (event.destination) {
                        await get().reloadFile(event.destination);
                    }
                    break;
                }
                case 'write':
                case 'create':
                case 'diff': {
                    await get().reloadFile(event.path);
                    break;
                }
                case 'artifact_write':
                case 'artifact_delete':
                default:
                    break;
            }
            await get().refresh();
        },
    }));
    return store;
}
export function useFileWorkspaceStore(store, selector) {
    return useStore(store, selector);
}
export function isTabDirty(tab) {
    return tab.content !== tab.originalContent;
}
function detectLanguageFromPath(path) {
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
            return 'markdown';
        case 'rs':
            return 'rust';
        case 'py':
            return 'python';
        case 'html':
            return 'html';
        case 'css':
            return 'css';
        case 'sql':
            return 'sql';
        case 'sh':
            return 'shell';
        default:
            return 'plaintext';
    }
}
