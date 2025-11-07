import React, { useEffect, useMemo, useRef } from 'react';
import type { Agent } from '@distri/core';
import { Chat, type ChatProps, type DistriAnyTool } from '@distri/react';

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
}

export const FileWorkspaceWithChat: React.FC<FileWorkspaceWithChatProps> = ({
  chat,
  additionalTools = [],
  uiTools = [],
  includeScriptRunner = true,
  className,
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



  return (
    <div
      className={cls(
        'flex h-full flex-row',
        className,
      )}
    >

      <FileWorkspace
        {...workspaceProps}
        filesystem={filesystem}
        store={store}
        height="100%"
        className={cls('border-none shadow-none')}
      />




      <Chat
        agent={chat.agent}
        threadId={chat.threadId}
        externalTools={combinedTools}
        {...(chat.chatProps ?? {})}
      />


    </div>

  );
};

export default FileWorkspaceWithChat;
