import React, { useEffect, useMemo, useRef } from 'react';
import type { Agent } from '@distri/core';
import { Chat, type ChatProps, type DistriAnyTool, Separator } from '@distri/react';

import { createFileWorkspaceStore, type FileWorkspaceStore } from '../store/fileStore';
import { IndexedDbFilesystem } from '../storage/indexedDbFilesystem';
import { createFilesystemTools } from '../tools/fileTools';
import { ScriptRunnerTool } from '../tools/scriptRunnerTool';
import type { FileWorkspaceProps } from './FileWorkspace';
import { FileWorkspace } from './FileWorkspace';

const cls = (...classes: Array<string | false | undefined | null>) =>
  classes.filter(Boolean).join(' ');

export interface WorkspaceChatConfig {
  agent: Agent;
  threadId: string;
  title?: string;
  chatProps?: Partial<Omit<ChatProps, 'agent' | 'threadId' | 'externalTools'>>;
}

export interface FileWorkspaceWithChatProps extends FileWorkspaceProps {
  chat: WorkspaceChatConfig;
  additionalTools?: DistriAnyTool[];
  uiTools?: DistriAnyTool[];
  includeScriptRunner?: boolean;
  workspacePanelClassName?: string;
  chatPanelClassName?: string;
}

export const FileWorkspaceWithChat: React.FC<FileWorkspaceWithChatProps> = ({
  chat,
  additionalTools = [],
  uiTools = [],
  includeScriptRunner = true,
  workspacePanelClassName,
  chatPanelClassName,
  className,
  height = '720px',
  ...workspaceProps
}) => {
  const { projectId } = workspaceProps;
  const providedStore = workspaceProps.store;
  const providedFilesystem = workspaceProps.filesystem;

  const filesystem = useMemo(
    () => providedFilesystem ?? IndexedDbFilesystem.forProject(projectId),
    [providedFilesystem, projectId],
  );

  const storeRef = useRef<FileWorkspaceStore | null>(providedStore ?? null);

  if (!storeRef.current) {
    storeRef.current = createFileWorkspaceStore(projectId, { filesystem });
  }

  useEffect(() => {
    if (providedStore && storeRef.current !== providedStore) {
      storeRef.current = providedStore;
    }
  }, [providedStore]);

  const store = storeRef.current!;

  const filesystemTools = useMemo(
    () =>
      createFilesystemTools(projectId, {
        filesystem,
        onChange: (event) => {
          void store.getState().handleExternalChange(event);
        },
      }),
    [filesystem, projectId, store],
  );

  const uiToolList = useMemo(() => {
    const list: DistriAnyTool[] = [];
    if (includeScriptRunner) {
      list.push(ScriptRunnerTool);
    }
    if (uiTools.length) {
      list.push(...uiTools);
    }
    return list;
  }, [includeScriptRunner, uiTools]);

  const combinedTools = useMemo(
    () => [...filesystemTools, ...additionalTools, ...uiToolList],
    [filesystemTools, additionalTools, uiToolList],
  );

  const containerHeight = typeof height === 'number' ? `${height}px` : height;

  return (
    <div
      className={cls(
        'flex flex-col overflow-hidden rounded-lg border border-border bg-background md:flex-row',
        className,
      )}
      style={{ height: containerHeight }}
    >
      <div className="flex min-w-0 flex-1">
        <FileWorkspace
          {...workspaceProps}
          filesystem={filesystem}
          store={store}
          height="100%"
          className={cls('border-none shadow-none', workspacePanelClassName)}
        />
      </div>
      <Separator orientation="vertical" className="hidden md:block" />
      <div
        className={cls(
          'flex w-full max-w-xl flex-col border-t border-border bg-muted/20 md:max-w-sm md:border-t-0 md:border-l',
          chatPanelClassName,
        )}
      >
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h3 className="text-sm font-semibold">{chat.title ?? 'Workspace Chat'}</h3>
        </div>
        <div className="flex-1 overflow-hidden">
          <Chat
            agent={chat.agent}
            threadId={chat.threadId}
            externalTools={combinedTools}
            {...(chat.chatProps ?? {})}
          />
        </div>
      </div>
    </div>
  );
};

export default FileWorkspaceWithChat;
