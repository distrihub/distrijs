import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Agent } from '@distri/core';
import { Chat, type ChatInstance, type ChatProps, type DistriAnyTool } from '@distri/react';
import { Files, MessageSquare } from 'lucide-react';

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
  initialMessage?: string;
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
  const {
    projectId,
    store: providedStore,
    filesystem: providedFilesystem,
    ...restWorkspaceProps
  } = workspaceProps;

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

  const normalizedInitialMessage = useMemo(() => {
    const trimmed = chat.initialMessage?.trim();
    return trimmed ? trimmed : null;
  }, [chat.initialMessage]);

  const hasSeededInitialMessage = useRef(false);

  useEffect(() => {
    hasSeededInitialMessage.current = false;
  }, [chat.threadId, normalizedInitialMessage]);

  const handleChatInstanceReady = useCallback(
    (instance: ChatInstance) => {
      chat.chatProps?.onChatInstanceReady?.(instance);

      if (!normalizedInitialMessage || hasSeededInitialMessage.current) {
        return;
      }

      hasSeededInitialMessage.current = true;
      void instance.sendMessage(normalizedInitialMessage).catch((error: any) => {
        console.warn('Failed to send initial chat message', error);
      });
    },
    [chat.chatProps, normalizedInitialMessage],
  );

  const mergedChatProps = useMemo(
    () => ({
      ...(chat.chatProps ?? {}),
      onChatInstanceReady: handleChatInstanceReady,
    }),
    [chat.chatProps, handleChatInstanceReady],
  );
  const [activeSidebarTab, setActiveSidebarTab] = useState<'files' | 'chat'>('files');

  const chatPanel = (
    <div className="flex h-full flex-col border border-border bg-background p-2 text-foreground">
      <Chat
        agent={chat.agent}
        threadId={chat.threadId}
        externalTools={combinedTools}
        {...mergedChatProps}
      />
    </div>
  );

  const sidebarView = activeSidebarTab === 'chat' ? 'custom' : 'explorer';
  const sidebarCustom = activeSidebarTab === 'chat' ? chatPanel : undefined;

  return (
    <div className={cls('relative flex h-full w-full gap-3 bg-card text-foreground', className)}>
      <div className="flex w-12 flex-col items-center gap-2 border border-border/60 bg-muted/20 py-3">
        {[
          { id: 'files' as const, icon: Files, label: 'Project files' },
          { id: 'chat' as const, icon: MessageSquare, label: 'Chat' },
        ].map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setActiveSidebarTab(item.id)}
            className={cls(
              'flex h-10 w-10 items-center justify-center text-muted-foreground transition hover:text-foreground',
              activeSidebarTab === item.id && 'bg-primary/10 text-primary',
            )}
            aria-label={item.label}
          >
            <item.icon className="h-5 w-5" />
          </button>
        ))}
      </div>
      <div className="flex min-w-0 flex-1 overflow-hidden">
        <FileWorkspace
          {...restWorkspaceProps}
          projectId={projectId}
          filesystem={filesystem}
          store={store}
          className="h-full"
          sidebarView={sidebarView}
          sidebarCustom={sidebarCustom}
        />
      </div>
    </div>
  );
};

export default FileWorkspaceWithChat;
