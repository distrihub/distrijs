import { ToolResult, DistriPart } from '@distri/core';

export interface ToolSummary {
  verb: string;         // "GET", "Read", "Search", "Run", …
  subject?: string;     // filename, path, query — derived from input
  detail?: string;      // result hint — derived from result
}

export type SummaryFn = (
  input: Record<string, unknown>,
  result?: ToolResult
) => ToolSummary;

function basename(path: string): string {
  return path.split('/').pop() ?? path;
}

function truncate(s: string, max: number): string {
  return s.length > max ? `${s.slice(0, max)}…` : s;
}

function pluralize(n: number, singular: string, plural = `${singular}s`): string {
  return `${n} ${n === 1 ? singular : plural}`;
}

function dataFromResult(result?: ToolResult): Record<string, unknown> | undefined {
  if (!result?.parts?.length) return undefined;
  for (const p of result.parts) {
    const part = p as DistriPart;
    if (part.part_type === 'data' && part.data && typeof part.data === 'object') {
      return part.data as Record<string, unknown>;
    }
  }
  return undefined;
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
    name.startsWith('http_') || name === 'api_call'
  ) {
    const method = ((input.method as string) ?? 'GET').toUpperCase();
    const subject = (input.path as string) ?? (input.url as string) ?? (input.endpoint as string);
    return { verb: method, subject, detail: undefined };
  }

  // Browser-tools / IndexedDB collection toolset
  if (name === 'db_get') {
    const collection = input.collection as string | undefined;
    const data = dataFromResult(result);
    const detail = data
      ? data.record == null ? 'not found' : '1 record'
      : undefined;
    return { verb: 'Read', subject: collection, detail };
  }

  if (name === 'db_put') {
    const collection = input.collection as string | undefined;
    const id = input.id as string | undefined;
    return { verb: id ? 'Updated' : 'Saved', subject: collection, detail: undefined };
  }

  if (name === 'db_list') {
    const collection = input.collection as string | undefined;
    const data = dataFromResult(result);
    const count = typeof data?.count === 'number' ? (data.count as number) : undefined;
    return {
      verb: 'Listed',
      subject: collection,
      detail: count != null ? pluralize(count, 'record') : undefined,
    };
  }

  if (name === 'db_search') {
    const collection = input.collection as string | undefined;
    const query = input.query as string | undefined;
    const data = dataFromResult(result);
    const count = typeof data?.count === 'number' ? (data.count as number) : undefined;
    const subject = collection && query
      ? `${collection}: ${truncate(query, 30)}`
      : (collection ?? query);
    return {
      verb: 'Searched',
      subject,
      detail: count != null ? pluralize(count, 'match', 'matches') : undefined,
    };
  }

  if (name === 'db_delete') {
    return { verb: 'Deleted', subject: input.collection as string | undefined, detail: undefined };
  }

  if (name === 'db_clear') {
    return { verb: 'Cleared', subject: input.collection as string | undefined, detail: undefined };
  }

  if (name === 'db_collections') {
    const data = dataFromResult(result);
    const count = typeof data?.count === 'number' ? (data.count as number) : undefined;
    return {
      verb: 'List collections',
      subject: undefined,
      detail: count != null ? pluralize(count, 'collection') : undefined,
    };
  }

  // Skills
  if (name === 'run_skill') {
    const skill = (input.skill_id as string) ?? (input.skill_name as string);
    const mode = input.mode as string | undefined;
    return { verb: 'Run skill', subject: skill, detail: mode };
  }
  if (name === 'load_skill') {
    const skill = (input.skill_id as string) ?? (input.skill_name as string);
    return { verb: 'Load skill', subject: skill, detail: undefined };
  }

  // Agent transfer / sub-agent calls
  if (name === 'transfer_to_agent') {
    return { verb: 'Hand off', subject: input.agent_name as string | undefined, detail: undefined };
  }
  if (name === 'call_agent') {
    const agent = (input.agent as string) ?? 'sub-agent';
    const mode = input.mode as string | undefined;
    return { verb: 'Call agent', subject: agent, detail: mode };
  }

  // Todos
  if (name === 'write_todos') {
    const todos = (input.todos as Array<{ status?: string }> | undefined) ?? [];
    const total = todos.length;
    const done = todos.filter((t) => t?.status === 'completed').length;
    return {
      verb: 'Update todos',
      subject: undefined,
      detail: total > 0 ? `${done}/${total}` : undefined,
    };
  }

  // Browsr / scraping
  if (name === 'browsr_scrape') {
    const url = (input.url as string) ?? '';
    const host = url ? url.replace(/^https?:\/\//, '').split('/')[0] : undefined;
    return { verb: 'Browse', subject: host, detail: undefined };
  }

  // File: read (server-side `Read` tool)
  if (name === 'read') {
    const path = (input.path as string) ?? (input.file_path as string);
    return { verb: 'Read', subject: path ? basename(path) : undefined, detail: undefined };
  }

  // File: write (server-side `Write` tool)
  if (name === 'write') {
    const path = (input.path as string) ?? (input.file_path as string);
    return { verb: 'Write', subject: path ? basename(path) : undefined, detail: undefined };
  }

  // File: edit (server-side `Edit` tool)
  if (name === 'edit') {
    const path = (input.path as string) ?? (input.file_path as string);
    return { verb: 'Edit', subject: path ? basename(path) : undefined, detail: undefined };
  }

  // Search/grep — server-side `Grep`
  if (name === 'search' || name === 'grep') {
    const subject = (input.query as string) ?? (input.pattern as string);
    return { verb: 'Search', subject, detail: undefined };
  }

  // Glob — server-side `Glob`
  if (name === 'glob') {
    return { verb: 'Find', subject: input.pattern as string, detail: undefined };
  }

  // Shell — server-side `Bash`
  if (name === 'bash') {
    const cmd = (input.command as string) ?? (input.cmd as string);
    return { verb: 'Run', subject: cmd ? truncate(cmd, 40) : undefined, detail: undefined };
  }

  // Interactive — verb is the tool name; rendered separately by InteractiveToolCard
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
