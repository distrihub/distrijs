import React from 'react';
import { DistriFnTool } from '@distri/core';
import { DistriUiTool, UiToolProps } from '../types';
import { DefaultToolActions } from '../components/renderers/tools/DefaultToolActions';

export interface WrapToolOptions {
  autoExecute?: boolean;
}

/**
 * Wraps a DistriFnTool as a DistriUiTool with DefaultToolActions component
 */
export function wrapFnToolAsUiTool(
  fnTool: DistriFnTool,
  options: WrapToolOptions = {}
): DistriUiTool {
  const { autoExecute = false } = options;

  return {
    name: fnTool.name,
    type: 'ui',
    description: fnTool.description,
    input_schema: fnTool.input_schema,
    component: (props: UiToolProps) => {
      return React.createElement(DefaultToolActions, {
        ...props,
        toolHandler: fnTool.handler,
        autoExecute
      });
    }
  };
}

/**
 * Automatically wraps an array of tools, converting DistriFnTools to DistriUiTools
 */
export function wrapTools(
  tools: (DistriFnTool | DistriUiTool)[],
  options: WrapToolOptions = {}
): DistriUiTool[] {
  return tools.map(tool => {
    if (tool.type === 'function') {
      return wrapFnToolAsUiTool(tool as DistriFnTool, options);
    }
    return tool as DistriUiTool;
  });
} 