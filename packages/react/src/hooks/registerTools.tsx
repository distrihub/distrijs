import { useEffect, useRef } from 'react';
import { Agent, ToolsConfig } from '@distri/core';
import { DistriUiTool, UiToolProps } from '@/types';
import { ToastToolCall } from '@/components/renderers/tools';
import { WrapToolOptions } from '../utils/toolWrapper';
import { useChatStateStore } from '../stores/chatStateStore';

export interface UseToolsOptions {
  agent?: Agent;
  tools?: ToolsConfig;
  wrapOptions?: WrapToolOptions;
}

export function registerTools({ agent, tools, wrapOptions = {} }: UseToolsOptions) {
  const lastAgentIdRef = useRef<string | null>(null);
  const setWrapOptions = useChatStateStore(state => state.setWrapOptions);

  useEffect(() => {
    if (!agent || !tools) {
      return;
    }

    // Only register if agent ID changed
    if (lastAgentIdRef.current === agent.id) {
      return;
    }

    // Store wrap options in chat state for use in executeTool
    setWrapOptions(wrapOptions);

    // Set the tools Map on the agent as-is
    agent.setTools(tools);

    lastAgentIdRef.current = agent.id;
    console.log(`✓ Set tools for agent ${agent.id}`);
    console.log(`Tools Map contains ${tools.agent_tools.size} agent(s):`, Array.from(tools.agent_tools.keys()));
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
