import { useEffect, useRef } from 'react';
import { Agent } from '@distri/core';
import { DistriAnyTool, UiToolProps } from '@/types';
import { ToastToolCall } from '@/components/toolcalls';
// import { ApprovalToolCall } from '@/components/toolcalls';

export interface UseToolsOptions {
  agent?: Agent;
  tools?: DistriAnyTool[];
}

export function registerTools({ agent, tools }: UseToolsOptions) {
  const lastAgentIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!agent || !tools || tools.length === 0) {
      return;
    }

    // Only register if agent ID changed
    if (lastAgentIdRef.current === agent.id) {
      return;
    }

    // Register each tool
    [...defaultTools, ...tools].forEach(tool => {
      agent.registerTool(tool);
      console.log(`✓ Registered tool: ${tool.name}`);
    });

    lastAgentIdRef.current = agent.id;
    console.log(`Successfully registered ${tools.length} tools with agent`);
  }, [agent?.id, tools]);
}


export const defaultTools: DistriAnyTool[] = [
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
  // {
  //   name: 'approval_request',
  //   type: 'ui',
  //   description: 'Request approval from the user',
  //   parameters: {
  //     type: 'object',
  //     properties: {
  //       message: { type: 'string' }
  //     }
  //   },
  //   component: (props: UiToolProps) => { return (<ApprovalToolCall {...props} />) },
  // }
]
