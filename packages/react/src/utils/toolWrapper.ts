import React from 'react';
import { DistriFnTool, ToolExecutionOptions } from '@distri/core';
import { DistriUiTool, UiToolProps } from '../types';
import { DefaultToolActions } from '../components/renderers/tools/DefaultToolActions';


/**
 * Wraps a DistriFnTool as a DistriUiTool with DefaultToolActions component
 */
export function wrapFnToolAsUiTool(
  fnTool: DistriFnTool,
  options: ToolExecutionOptions = {}
): DistriUiTool {
  const { autoExecute = false } = options;

  return {
    name: fnTool.name,
    type: 'ui',
    description: fnTool.description,
    parameters: fnTool.parameters,
    component: (props: UiToolProps) => {
      return React.createElement(DefaultToolActions, {
        ...props,
        tool: { ...fnTool, autoExecute: fnTool.autoExecute || autoExecute },
      });
    }
  };
}

/**
 * Automatically wraps an array of tools, converting DistriFnTools to DistriUiTools
 */
export function wrapTools(
  tools: (DistriFnTool | DistriUiTool)[],
  options: ToolExecutionOptions = {}
): DistriUiTool[] {
  return tools.map(tool => {
    if (tool.type === 'function') {
      return wrapFnToolAsUiTool(tool as DistriFnTool, options);
    }
    return tool as DistriUiTool;
  });
} 