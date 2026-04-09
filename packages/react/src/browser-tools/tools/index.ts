/**
 * createBrowserTools — factory that returns DistriFnTool[] backed by IndexedDB.
 *
 * Tool names and schemas match distri-cli (Read, Write, Edit, Grep, Glob)
 * so the same agent prompt works in both browser and CLI environments.
 * ExecJs is browser-specific (replaces CLI's Bash tool).
 */

import type { DistriFnTool } from '@distri/core'
import { IndexedDbFilesystem } from '../storage/indexeddb-filesystem'
import type { BrowserToolsOptions, FilesystemChangeEvent } from '../types'

import { READ_TOOL_DEF, createReadHandler } from './read'
import { WRITE_TOOL_DEF, createWriteHandler } from './write'
import { EDIT_TOOL_DEF, createEditHandler } from './edit'
import { GREP_TOOL_DEF, createGrepHandler } from './grep'
import { GLOB_TOOL_DEF, createGlobHandler } from './glob'
import { EXEC_JS_TOOL_DEF, createExecJsHandler } from './exec'

export function createBrowserTools(
  projectId: string,
  options: BrowserToolsOptions = {},
): DistriFnTool[] {
  const fs = IndexedDbFilesystem.forProject(projectId)
  const emit = (event: FilesystemChangeEvent) => options.onChange?.(event)

  const base = {
    type: 'function' as const,
    isExternal: true,
    autoExecute: true,
  }

  return [
    {
      ...base,
      name: READ_TOOL_DEF.name,
      description: READ_TOOL_DEF.description,
      parameters: READ_TOOL_DEF.parameters as Record<string, unknown>,
      handler: createReadHandler(fs),
    },
    {
      ...base,
      name: WRITE_TOOL_DEF.name,
      description: WRITE_TOOL_DEF.description,
      parameters: WRITE_TOOL_DEF.parameters as Record<string, unknown>,
      handler: createWriteHandler(fs, emit),
    },
    {
      ...base,
      name: EDIT_TOOL_DEF.name,
      description: EDIT_TOOL_DEF.description,
      parameters: EDIT_TOOL_DEF.parameters as Record<string, unknown>,
      handler: createEditHandler(fs, emit),
    },
    {
      ...base,
      name: GREP_TOOL_DEF.name,
      description: GREP_TOOL_DEF.description,
      parameters: GREP_TOOL_DEF.parameters as Record<string, unknown>,
      handler: createGrepHandler(fs),
    },
    {
      ...base,
      name: GLOB_TOOL_DEF.name,
      description: GLOB_TOOL_DEF.description,
      parameters: GLOB_TOOL_DEF.parameters as Record<string, unknown>,
      handler: createGlobHandler(fs),
    },
    {
      ...base,
      name: EXEC_JS_TOOL_DEF.name,
      description: EXEC_JS_TOOL_DEF.description,
      parameters: EXEC_JS_TOOL_DEF.parameters as Record<string, unknown>,
      handler: createExecJsHandler(fs),
    },
  ]
}

export {
  READ_TOOL_DEF,
  WRITE_TOOL_DEF,
  EDIT_TOOL_DEF,
  GREP_TOOL_DEF,
  GLOB_TOOL_DEF,
  EXEC_JS_TOOL_DEF,
}
