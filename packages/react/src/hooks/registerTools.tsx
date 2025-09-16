import { useEffect, useRef } from 'react';
import { Agent, DistriBaseTool } from '@distri/core';
import { DistriUiTool, UiToolProps } from '@/types';
import { ToastToolCall } from '@/components/renderers/tools';
import { WrapToolOptions } from '../utils/toolWrapper';
import { useChatStateStore } from '../stores/chatStateStore';

export interface UseToolsOptions {
  agent?: Agent;
  externalTools?: DistriBaseTool[];
  wrapOptions?: WrapToolOptions;
}

export function useRegisterTools({ agent, externalTools, wrapOptions = {} }: UseToolsOptions) {
  const lastAgentIdRef = useRef<string | null>(null);
  const setWrapOptions = useChatStateStore(state => state.setWrapOptions);

  useEffect(() => {
    if (!agent || !externalTools) {
      return;
    }

    // Only register if agent ID changed
    if (lastAgentIdRef.current === agent.id) {
      return;
    }

    // Store wrap options in chat state for use in executeTool
    setWrapOptions(wrapOptions);

    // Set the tools Map on the agent as-is
    agent.setExternalTools(externalTools);

    lastAgentIdRef.current = agent.id;
  }, [agent?.id, externalTools, wrapOptions, setWrapOptions]);
}

export const defaultTools: DistriUiTool[] = [
  {
    name: 'toast',
    type: 'ui',
    description: 'Show a toast message',
    parameters: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        type: { type: 'string', enum: ['success', 'error', 'warning', 'info'] }
      }
    },
    component: (props: UiToolProps) => { return (<ToastToolCall {...props} />) },
  },
]
