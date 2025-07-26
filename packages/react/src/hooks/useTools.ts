import { useEffect, useRef } from 'react';
import { DistriTool, Agent } from '@distri/core';

export interface UseToolsOptions {
  agent?: Agent;
  tools?: DistriTool[];
}

export function useTools({ agent, tools }: UseToolsOptions) {
  const lastAgentIdRef = useRef<string | null>(null);
  const registeredToolsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!agent || !tools || tools.length === 0) {
      return;
    }

    // Only register if agent ID changed
    if (lastAgentIdRef.current === agent.id) {
      return;
    }

    // Register each tool
    tools.forEach(tool => {
      if (!registeredToolsRef.current.has(tool.name)) {
        agent.registerTool(tool);
        registeredToolsRef.current.add(tool.name);
        console.log(`✓ Registered tool: ${tool.name}`);
      }
    });

    lastAgentIdRef.current = agent.id;
    console.log(`Successfully registered ${tools.length} tools with agent`);
  }, [agent?.id, tools]);
}

