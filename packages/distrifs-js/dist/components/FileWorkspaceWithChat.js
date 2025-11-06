import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo, useRef } from 'react';
import { Chat, Separator } from '@distri/react';
import { createFileWorkspaceStore } from '../store/fileStore';
import { IndexedDbFilesystem } from '../storage/indexedDbFilesystem';
import { createFilesystemTools } from '../tools/fileTools';
import { ScriptRunnerTool } from '../tools/scriptRunnerTool';
import { FileWorkspace } from './FileWorkspace';
const cls = (...classes) => classes.filter(Boolean).join(' ');
export const FileWorkspaceWithChat = ({ chat, additionalTools = [], uiTools = [], includeScriptRunner = true, workspacePanelClassName, chatPanelClassName, className, height = '720px', ...workspaceProps }) => {
    const { projectId } = workspaceProps;
    const providedStore = workspaceProps.store;
    const providedFilesystem = workspaceProps.filesystem;
    const filesystem = useMemo(() => providedFilesystem ?? IndexedDbFilesystem.forProject(projectId), [providedFilesystem, projectId]);
    const storeRef = useRef(providedStore ?? null);
    if (!storeRef.current) {
        storeRef.current = createFileWorkspaceStore(projectId, { filesystem });
    }
    useEffect(() => {
        if (providedStore && storeRef.current !== providedStore) {
            storeRef.current = providedStore;
        }
    }, [providedStore]);
    const store = storeRef.current;
    const filesystemTools = useMemo(() => createFilesystemTools(projectId, {
        filesystem,
        onChange: (event) => {
            void store.getState().handleExternalChange(event);
        },
    }), [filesystem, projectId, store]);
    const uiToolList = useMemo(() => {
        const list = [];
        if (includeScriptRunner) {
            list.push(ScriptRunnerTool);
        }
        if (uiTools.length) {
            list.push(...uiTools);
        }
        return list;
    }, [includeScriptRunner, uiTools]);
    const combinedTools = useMemo(() => [...filesystemTools, ...additionalTools, ...uiToolList], [filesystemTools, additionalTools, uiToolList]);
    const containerHeight = typeof height === 'number' ? `${height}px` : height;
    return (_jsxs("div", { className: cls('flex flex-col overflow-hidden rounded-lg border border-border bg-background md:flex-row', className), style: { height: containerHeight }, children: [_jsx("div", { className: "flex min-w-0 flex-1", children: _jsx(FileWorkspace, { ...workspaceProps, filesystem: filesystem, store: store, height: "100%", className: cls('border-none shadow-none', workspacePanelClassName) }) }), _jsx(Separator, { orientation: "vertical", className: "hidden md:block" }), _jsxs("div", { className: cls('flex w-full max-w-xl flex-col border-t border-border bg-muted/20 md:max-w-sm md:border-t-0 md:border-l', chatPanelClassName), children: [_jsx("div", { className: "flex items-center justify-between border-b border-border px-4 py-3", children: _jsx("h3", { className: "text-sm font-semibold", children: chat.title ?? 'Workspace Chat' }) }), _jsx("div", { className: "flex-1 overflow-hidden", children: _jsx(Chat, { agent: chat.agent, threadId: chat.threadId, externalTools: combinedTools, ...(chat.chatProps ?? {}) }) })] })] }));
};
export default FileWorkspaceWithChat;
