import type { Meta, StoryObj } from '@storybook/react';
import { useEffect, useState } from 'react';
import { DeveloperModeComponent } from './DeveloperModeComponent';
import { DeveloperMode, DistriAnyTool } from '@/types';
import { useChatStateStore } from '@/stores/chatStateStore';

// ---------------------------------------------------------------------------
// Helpers & mock data
// ---------------------------------------------------------------------------

const noopHandler = async () => ({ result: 'simulated' });

const mockExternalTools: DistriAnyTool[] = [
  {
    type: 'function',
    handler: noopHandler,
    name: 'web_search',
    description: 'Search the web for information',
    parameters: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'The search query', example: 'latest AI news' },
        num_results: { type: 'integer', description: 'Number of results to return', example: 5 },
      },
      required: ['query'],
    },
  },
  {
    type: 'function',
    handler: noopHandler,
    name: 'read_file',
    description: 'Read the contents of a file from the filesystem',
    parameters: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'Absolute path to the file', example: '/tmp/data.txt' },
      },
      required: ['path'],
    },
  },
  {
    type: 'function',
    handler: noopHandler,
    name: 'execute_bash',
    description: 'Execute a bash command and return the output',
    parameters: {
      type: 'object',
      properties: {
        command: { type: 'string', description: 'The bash command to execute', example: 'ls -la' },
        timeout_ms: { type: 'integer', description: 'Timeout in milliseconds', example: 5000 },
      },
      required: ['command'],
    },
  },
] as unknown as DistriAnyTool[];

function useMockStore(tools: DistriAnyTool[]) {
  useEffect(() => {
    useChatStateStore.getState().setExternalTools(tools);
  }, [tools]);
}

// ---------------------------------------------------------------------------
// DeveloperModeComponent story
// ---------------------------------------------------------------------------

const ToolbarMeta: Meta<typeof DeveloperModeComponent> = {
  title: 'Developer/DeveloperModeComponent',
  component: DeveloperModeComponent,
  parameters: { layout: 'padded' },
};

export default ToolbarMeta;

type ToolbarStory = StoryObj<typeof DeveloperModeComponent>;

function ToolbarWrapper({ developerMode }: { developerMode: DeveloperMode }) {
  const [verbose, setVerbose] = useState(false);
  useMockStore(mockExternalTools);

  return (
    <div className="border border-border rounded-lg p-4 bg-background max-w-xl">
      <div className="text-xs text-muted-foreground mb-3">
        Simulated chat footer area — the developer pane opens inline above the trigger
      </div>
      <DeveloperModeComponent
        developerMode={developerMode}
        threadId="thread-demo-123"
        verbose={verbose}
        onToggleVerbose={() => setVerbose(v => !v)}
        diagnoseEnabled={false}
        onToggleDiagnose={() => undefined}
        onOpenTrace={(threadId) => alert(`Navigate to trace for: ${threadId}`)}
      />
    </div>
  );
}

export const AllControls: ToolbarStory = {
  render: () => (
      <ToolbarWrapper
      developerMode={{
        traces: { open: (threadId) => alert(`Navigate to trace for: ${threadId}`) },
        verbosity: true,
        tools: true,
        diagnose: true,
      }}
    />
  ),
};

export const TracesOnly: ToolbarStory = {
  render: () => (
      <ToolbarWrapper
      developerMode={{
        traces: { open: (threadId) => alert(`Navigate to trace for: ${threadId}`) },
      }}
    />
  ),
};

export const ToolsAndVerbosity: ToolbarStory = {
  render: () => (
    <ToolbarWrapper
      developerMode={{ verbosity: true, tools: true }}
    />
  ),
};
