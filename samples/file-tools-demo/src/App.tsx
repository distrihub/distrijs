import React, { useMemo } from 'react';
import {
  FileWorkspace,
  FileWorkspaceWithChat,
  IndexedDbFilesystem,
  InitialEntry,
  PreviewRenderer,
  SelectionMode,
} from 'distrifs-js';
import { useAgent, DistriProvider } from '@distri/react';
import { Agent, uuidv4 } from '@distri/core';

const PROJECT_ID = 'demo-project';
const AGENT_ID = import.meta.env.VITE_DISTRI_AGENT_ID as string | undefined;
const DISTRI_API_URL = import.meta.env.VITE_DISTRI_API_URL || 'http://localhost:8080/api/v1';

const initialEntries: InitialEntry[] = [
  {
    path: 'README.md',
    type: 'file',
    content: '# Welcome to the Distri FS demo\n\nEdit files on the left to see a live preview.',
  },
  {
    path: 'src/hello.ts',
    type: 'file',
    content: 'export const greet = (name: string) => `Hello, ${name}!`;\n',
  },
  {
    path: 'notes/ideas.md',
    type: 'file',
    content: '- Offline-first workspaces\n- Tool automation\n- Agent powered refactors\n',
  },
  {
    path: 'config/settings.json',
    type: 'file',
    content: JSON.stringify({ theme: 'light', fontSize: 14 }, null, 2),
  },
  {
    path: 'notes',
    type: 'directory',
  },
];

const renderPreview: PreviewRenderer = ({ path, content }) => {
  if (path.endsWith('.json')) {
    try {
      const json = JSON.parse(content || '{}');
      return <pre>{JSON.stringify(json, null, 2)}</pre>;
    } catch (error) {
      return <pre>{content}</pre>;
    }
  }
  if (path.endsWith('.md')) {
    return (
      <div className="flex flex-col gap-3 text-sm leading-relaxed">
        {content.split(/\n{2,}/).map((block, index) => (
          <p key={index} className="whitespace-pre-wrap">
            {block}
          </p>
        ))}
      </div>
    );
  }
  return <pre className="text-sm whitespace-pre-wrap break-words">{content}</pre>;
};

const getPersistedThreadId = () => {
  const key = 'FileToolsDemo:threadId';
  const cached = localStorage.getItem(key);
  if (cached) return cached;
  const id = uuidv4();
  localStorage.setItem(key, id);
  return id;
};

const selectionMode: SelectionMode = 'multiple';

const WorkspaceOnly: React.FC<{ filesystem: ReturnType<typeof IndexedDbFilesystem.forProject> }> = ({ filesystem }) => (
  <FileWorkspace
    projectId={PROJECT_ID}
    filesystem={filesystem}
    initialEntries={initialEntries}
    previewRenderer={renderPreview}
    onSaveFile={async (tab) => {
      await new Promise((resolve) => setTimeout(resolve, 150));
      await filesystem.writeFile(tab.path, tab.content);
    }}
    selectionMode={selectionMode}
    height="640px"
  />
);

const ChatEnabledWorkspace: React.FC<{ agent: Agent; filesystem: ReturnType<typeof IndexedDbFilesystem.forProject>; threadId: string }> = ({ agent, filesystem, threadId }) => (
  <FileWorkspaceWithChat
    projectId={PROJECT_ID}
    filesystem={filesystem}
    initialEntries={initialEntries}
    previewRenderer={renderPreview}
    onSaveFile={async (tab) => {
      await new Promise((resolve) => setTimeout(resolve, 150));
      await filesystem.writeFile(tab.path, tab.content);
    }}
    selectionMode={selectionMode}
    chat={{ agent, threadId, title: 'Workspace Assistant' }}
    height="720px"
  />
);

const WorkspaceRouter: React.FC<{ filesystem: ReturnType<typeof IndexedDbFilesystem.forProject>; threadId: string }> = ({ filesystem, threadId }) => {
  if (!AGENT_ID) {
    return (
      <div className="flex min-h-screen flex-col gap-6 bg-slate-100 p-6 text-slate-900">
        <header className="space-y-2">
          <h1 className="text-3xl font-semibold">distri file-tools demo</h1>
          <p className="max-w-2xl text-sm text-slate-600">
            This playground showcases the IndexedDB-backed filesystem store and workspace UI. Configure
            <code className="mx-1 rounded bg-slate-200 px-1">VITE_DISTRI_AGENT_ID</code> to enable the chat workflow.
          </p>
        </header>
        <WorkspaceOnly filesystem={filesystem} />
      </div>
    );
  }

  return <AgentWorkspaceLoader filesystem={filesystem} threadId={threadId} />;
};

const AgentWorkspaceLoader: React.FC<{ filesystem: ReturnType<typeof IndexedDbFilesystem.forProject>; threadId: string }> = ({ filesystem, threadId }) => {
  const { agent, loading, error } = useAgent({ agentIdOrDef: AGENT_ID! });

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-200">
        <div className="flex items-center gap-3">
          <span className="h-3 w-3 animate-ping rounded-full bg-sky-400" />
          <span>Loading agent…</span>
        </div>
      </div>
    );
  }

  if (error || !agent) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 text-slate-100">
        <h2 className="text-xl font-semibold">Unable to load agent</h2>
        <p className="mt-2 max-w-md text-center text-sm text-slate-400">
          Check that the Distri backend is running and that <code className="mx-1 rounded bg-slate-800 px-1">VITE_DISTRI_AGENT_ID</code> is set.
        </p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col gap-4 bg-slate-100 p-6">
      <header className="space-y-1">
        <h1 className="text-3xl font-semibold text-slate-900">distri file-tools demo</h1>
        <p className="max-w-3xl text-sm text-slate-600">
          Chat with an agent using filesystem tools, run scripts, and edit files with the ShadCN workspace. All data is
          saved to IndexedDB under the <code className="mx-1 rounded bg-slate-200 px-1">{PROJECT_ID}</code> namespace.
        </p>
      </header>
      <ChatEnabledWorkspace agent={agent} filesystem={filesystem} threadId={threadId} />
    </div>
  );
};

const App: React.FC = () => {
  const filesystem = useMemo(() => IndexedDbFilesystem.forProject(PROJECT_ID), []);
  const threadId = useMemo(() => getPersistedThreadId(), []);
  const config = useMemo(() => ({ baseUrl: DISTRI_API_URL }), []);

  return (
    <DistriProvider config={config}>
      <WorkspaceRouter filesystem={filesystem} threadId={threadId} />
    </DistriProvider>
  );
};

export default App;
