import { useEffect, useRef } from 'react';
import { Agent } from '@distri/core';
import { DistriAnyTool, DistriUiTool, UiToolProps } from '@/types';
import { ToastToolCall } from '@/components/renderers/tools';
import { WrapToolOptions } from '../utils/toolWrapper';
import { useChatStateStore } from '../stores/chatStateStore';

export interface UseToolsOptions {
  agent?: Agent;
  tools?: DistriAnyTool[];
  wrapOptions?: WrapToolOptions;
}

export function registerTools({ agent, tools, wrapOptions = {} }: UseToolsOptions) {
  const lastAgentIdRef = useRef<string | null>(null);
  const setWrapOptions = useChatStateStore(state => state.setWrapOptions);

  useEffect(() => {
    if (!agent || !tools || tools.length === 0) {
      return;
    }

    // Only register if agent ID changed
    if (lastAgentIdRef.current === agent.id) {
      return;
    }

    // Store wrap options in chat state for use in executeTool
    setWrapOptions(wrapOptions);

    // For DistriFnTools, register them as-is since DefaultToolActions will be created automatically in executeTool
    // For DistriUiTools, keep them as-is
    const toolsToRegister = [...defaultTools, ...tools];

    // Register each tool
    toolsToRegister.forEach(tool => {
      agent.registerTool(tool);
      console.log(`✓ Registered tool: ${tool.name} (type: ${tool.type})`);
    });

    lastAgentIdRef.current = agent.id;
    console.log(`Successfully registered ${tools.length} tools with agent`);
  }, [agent?.id, tools, wrapOptions, setWrapOptions]);
}

export const defaultTools: DistriUiTool[] = [
  {
    name: 'toast',
    type: 'ui',
    description: 'Show a toast message',
    input_schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        type: { type: 'string', enum: ['success', 'error', 'warning', 'info'] }
      }
    },
    component: (props: UiToolProps) => { return (<ToastToolCall {...props} />) },
  },
]
