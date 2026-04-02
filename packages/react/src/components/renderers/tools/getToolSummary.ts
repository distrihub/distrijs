import { ToolSummary, SummaryFn } from '@/types';
import { ToolResult } from '@distri/core';

function basename(path: string): string {
  return path.split('/').pop() ?? path;
}

function truncate(s: string, max: number): string {
  return s.length > max ? `${s.slice(0, max)}…` : s;
}

export function getToolSummary(
  toolName: string,
  input: Record<string, unknown>,
  result?: ToolResult,
  overrides?: Record<string, SummaryFn>
): ToolSummary {
  if (overrides?.[toolName]) {
    return overrides[toolName](input, result);
  }

  const name = toolName.toLowerCase();

  // HTTP tools
  if (
    name.endsWith('_request') || name === 'fetch' ||
    name.startsWith('http_') || name === 'api_call' ||
    name === 'api_request' || name === 'distri_request'
  ) {
    const method = ((input.method as string) ?? 'GET').toUpperCase();
    const subject = (input.path as string) ?? (input.url as string) ?? (input.endpoint as string);
    return { verb: method, subject, detail: undefined };
  }

  // File: read
  // 'read' covers the capitalized 'Read' tool name (lowercased above)
  if (name === 'read_file' || name === 'read') {
    const path = (input.path as string) ?? (input.file_path as string);
    return { verb: 'Read', subject: path ? basename(path) : undefined, detail: undefined };
  }

  // File: write/create
  // 'write' covers the capitalized 'Write' tool name (lowercased above)
  if (name === 'write_file' || name === 'write' || name === 'create_file') {
    const path = (input.path as string) ?? (input.file_path as string);
    return { verb: 'Write', subject: path ? basename(path) : undefined, detail: undefined };
  }

  // File: edit/patch
  // 'edit' covers the capitalized 'Edit' tool name (lowercased above)
  if (name === 'edit_file' || name === 'edit' || name === 'patch_file') {
    const path = (input.path as string) ?? (input.file_path as string);
    return { verb: 'Edit', subject: path ? basename(path) : undefined, detail: undefined };
  }

  // File: delete
  if (name === 'delete_file' || name === 'remove_file') {
    const path = (input.path as string) ?? (input.file_path as string);
    return { verb: 'Delete', subject: path ? basename(path) : undefined, detail: undefined };
  }

  // Search/grep
  if (name === 'search' || name === 'grep' || name === 'tool_search') {
    const subject = (input.query as string) ?? (input.pattern as string);
    return { verb: 'Search', subject, detail: undefined };
  }

  // Glob/find
  if (name === 'glob' || name === 'find_files') {
    return { verb: 'Find', subject: input.pattern as string, detail: undefined };
  }

  // Shell/bash
  if (
    name === 'bash' || name === 'shell' || name === 'execute' ||
    name === 'run_command' || name === 'execute_shell'
  ) {
    const cmd = (input.command as string) ?? (input.cmd as string);
    return { verb: 'Run', subject: cmd ? truncate(cmd, 40) : undefined, detail: undefined };
  }

  // Interactive — handled separately
  if (
    name === 'ask_follow_up' || name === 'confirm' ||
    name === 'input' || name.startsWith('approval_')
  ) {
    return { verb: toolName, subject: undefined, detail: undefined };
  }

  // Fallback
  const firstString = Object.values(input).find((v) => typeof v === 'string') as string | undefined;
  return { verb: toolName, subject: firstString, detail: undefined };
}
