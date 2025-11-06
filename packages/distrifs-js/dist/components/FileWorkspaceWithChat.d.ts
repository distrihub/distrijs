import React from 'react';
import type { Agent } from '@distri/core';
import { type ChatProps, type DistriAnyTool } from '@distri/react';
import type { FileWorkspaceProps } from './FileWorkspace';
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
export declare const FileWorkspaceWithChat: React.FC<FileWorkspaceWithChatProps>;
export default FileWorkspaceWithChat;
//# sourceMappingURL=FileWorkspaceWithChat.d.ts.map