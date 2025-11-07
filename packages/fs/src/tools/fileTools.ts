import { DistriFnTool } from '@distri/core';
import {
  IndexedDbFilesystem,
  ProjectFilesystem,
  ReadFileResult,
} from '../storage/indexedDbFilesystem';
import type { FilesystemChangeEvent, FilesystemToolsOptions } from '../types';

interface ReadFileParams {
  path: string;
  start_line?: number;
  end_line?: number;
}

interface WriteFileParams {
  path: string;
  content: string;
}

interface CopyFileParams {
  source: string;
  destination: string;
}

interface DeleteFileParams {
  path: string;
  recursive?: boolean;
}

interface ListDirectoryParams {
  path: string;
  recursive?: boolean;
}

interface TreeParams {
  path: string;
}

interface SearchParams {
  path: string;
  pattern: string;
}

interface ArtifactListParams {
  namespace?: string;
  limit?: number;
  include_preview?: boolean;
}

interface ArtifactReadParams {
  filename: string;
  start_line?: number;
  end_line?: number;
}

interface ArtifactSearchParams {
  pattern: string;
}

interface SaveArtifactParams {
  filename: string;
  content: string;
}

export const createFilesystemTools = (
  projectId: string,
  options: FilesystemToolsOptions & { filesystem?: ProjectFilesystem } = {},
): DistriFnTool[] => {
  const filesystem = options.filesystem ?? IndexedDbFilesystem.forProject(projectId);
  const emitChange = (event: FilesystemChangeEvent) => {
    options.onChange?.(event);
  };

  const basePathDescription = `Path relative to the project namespace: ${projectId}`;

  const tools: DistriFnTool[] = [
    {
      name: 'fs_read_file',
      description: 'Read the contents of a file stored in the project namespace',
      type: 'function',
      parameters: {
        type: 'object',
        properties: {
          path: { type: 'string', description: basePathDescription },
          start_line: { type: 'integer', minimum: 1, description: 'Optional 1-based start line' },
          end_line: { type: 'integer', minimum: 1, description: 'Optional 1-based end line (inclusive)' },
        },
        required: ['path'],
      },
      handler: async (input: ReadFileParams) => {
        const result = await filesystem.readFile(input.path);
        return sliceFile(result, input.start_line, input.end_line);
      },
    },
    {
      name: 'fs_write_file',
      description: 'Write full content to a file',
      type: 'function',
      parameters: {
        type: 'object',
        properties: {
          path: { type: 'string', description: basePathDescription },
          content: { type: 'string', description: 'Full file contents to store' },
        },
        required: ['path', 'content'],
      },
      handler: async (input: WriteFileParams) => {
        await filesystem.writeFile(input.path, input.content);
        emitChange({ type: 'write', path: input.path });
        return { success: true, path: input.path };
      },
    },
    {
      name: 'apply_diff',
      description: 'Apply SEARCH/REPLACE diff blocks to a file',
      type: 'function',
      parameters: {
        type: 'object',
        properties: {
          path: { type: 'string', description: basePathDescription },
          diff: { type: 'string', description: 'Diff formatted with <<<<<<< SEARCH blocks' },
        },
        required: ['path', 'diff'],
      },
      handler: async (input: { path: string; diff: string }) => {
        const result = await filesystem.applyDiff(input.path, input.diff);
        emitChange({ type: 'diff', path: input.path });
        return result;
      },
    },
    {
      name: 'fs_list_directory',
      description: 'List the contents of a directory',
      type: 'function',
      parameters: {
        type: 'object',
        properties: {
          path: { type: 'string', description: basePathDescription },
          recursive: { type: 'boolean', description: 'When true, include nested entries', default: false },
        },
        required: ['path'],
      },
      handler: async (input: ListDirectoryParams) => {
        const contents = await filesystem.listDirectory(input.path, input.recursive);
        return { path: input.path, contents };
      },
    },
    {
      name: 'fs_get_file_info',
      description: 'Get metadata for a file or directory',
      type: 'function',
      parameters: {
        type: 'object',
        properties: {
          path: { type: 'string', description: basePathDescription },
        },
        required: ['path'],
      },
      handler: async (input: { path: string }) => filesystem.getFileInfo(input.path),
    },
    {
      name: 'fs_search_files',
      description: 'Search for files by regex pattern',
      type: 'function',
      parameters: {
        type: 'object',
        properties: {
          path: { type: 'string', description: basePathDescription },
          pattern: { type: 'string', description: 'Regex applied to file paths' },
        },
        required: ['path', 'pattern'],
      },
      handler: async (input: SearchParams) => {
        const results = await filesystem.searchFiles(input.path, input.pattern);
        return { path: input.path, pattern: input.pattern, results };
      },
    },
    {
      name: 'fs_search_within_files',
      description: 'Search within file contents using a regex',
      type: 'function',
      parameters: {
        type: 'object',
        properties: {
          path: { type: 'string', description: basePathDescription },
          pattern: { type: 'string', description: 'Regex applied to file contents' },
        },
        required: ['path', 'pattern'],
      },
      handler: async (input: SearchParams) => {
        const matches = await filesystem.searchWithinFiles(input.path, input.pattern);
        return {
          matches: matches.map((match) => ({
            path: match.path,
            matches: match.matches.map((line) => ({
              line_number: line.line,
              line_content: line.content,
            })),
          })),
          pattern: input.pattern,
        };
      },
    },
    {
      name: 'fs_copy_file',
      description: 'Copy a file',
      type: 'function',
      parameters: {
        type: 'object',
        properties: {
          source: { type: 'string', description: 'Source file path' },
          destination: { type: 'string', description: 'Destination file path' },
        },
        required: ['source', 'destination'],
      },
      handler: async (input: CopyFileParams) => {
        await filesystem.copyFile(input.source, input.destination);
        emitChange({ type: 'copy', path: input.source, destination: input.destination });
        return { success: true, source: input.source, destination: input.destination };
      },
    },
    {
      name: 'fs_move_file',
      description: 'Move a file',
      type: 'function',
      parameters: {
        type: 'object',
        properties: {
          source: { type: 'string', description: 'Source file path' },
          destination: { type: 'string', description: 'Destination file path' },
        },
        required: ['source', 'destination'],
      },
      handler: async (input: CopyFileParams) => {
        await filesystem.moveFile(input.source, input.destination);
        emitChange({ type: 'move', path: input.source, destination: input.destination });
        return { success: true, source: input.source, destination: input.destination };
      },
    },
    {
      name: 'fs_delete_file',
      description: 'Delete a file or directory',
      type: 'function',
      parameters: {
        type: 'object',
        properties: {
          path: { type: 'string', description: basePathDescription },
          recursive: { type: 'boolean', description: 'Delete directories recursively', default: false },
        },
        required: ['path'],
      },
      handler: async (input: DeleteFileParams) => {
        await filesystem.deleteEntry(input.path, Boolean(input.recursive));
        emitChange({ type: 'delete', path: input.path });
        return { success: true, path: input.path };
      },
    },
    {
      name: 'fs_create_directory',
      description: 'Create a directory',
      type: 'function',
      parameters: {
        type: 'object',
        properties: {
          path: { type: 'string', description: basePathDescription },
        },
        required: ['path'],
      },
      handler: async (input: { path: string }) => {
        await filesystem.createDirectory(input.path);
        emitChange({ type: 'create', path: input.path });
        return { success: true, path: input.path };
      },
    },
    {
      name: 'fs_tree',
      description: 'Return the directory tree',
      type: 'function',
      parameters: {
        type: 'object',
        properties: {
          path: { type: 'string', description: basePathDescription },
        },
        required: ['path'],
      },
      handler: async (input: TreeParams) => filesystem.tree(input.path),
    },
    {
      name: 'list_artifacts',
      description: 'List stored artifacts for the project',
      type: 'function',
      parameters: {
        type: 'object',
        properties: {
          namespace: { type: 'string', description: 'Optional namespace override' },
          limit: { type: 'integer', description: 'Optional limit on results' },
          include_preview: { type: 'boolean', description: 'Return content previews', default: false },
        },
        required: [],
      },
      handler: async (input: ArtifactListParams) => {
        const artifacts = await filesystem.listArtifacts();
        const limited = typeof input.limit === 'number' ? artifacts.slice(0, input.limit) : artifacts;
        return {
          artifacts: limited.map((artifact) => ({
            artifact_id: artifact.path,
            path: artifact.path,
            size: artifact.content?.length ?? 0,
            preview: input.include_preview ? artifact.content?.slice(0, 200) : undefined,
          })),
          total: artifacts.length,
        };
      },
    },
    {
      name: 'read_artifact',
      description: 'Read an artifact by filename',
      type: 'function',
      parameters: {
        type: 'object',
        properties: {
          filename: { type: 'string', description: 'Stored artifact filename' },
          start_line: { type: 'integer', minimum: 1 },
          end_line: { type: 'integer', minimum: 1 },
        },
        required: ['filename'],
      },
      handler: async (input: ArtifactReadParams) => filesystem.readArtifact(input.filename, input.start_line, input.end_line),
    },
    {
      name: 'search_artifacts',
      description: 'Search within all artifacts using a regex',
      type: 'function',
      parameters: {
        type: 'object',
        properties: {
          pattern: { type: 'string', description: 'Regex applied to artifact contents' },
        },
        required: ['pattern'],
      },
      handler: async (input: ArtifactSearchParams) => {
        const matches = await filesystem.searchArtifacts(input.pattern);
        return {
          matches: matches.map((match) => ({
            path: match.path,
            matches: match.matches.map((line) => ({
              line_number: line.line,
              line_content: line.content,
            })),
          })),
          pattern: input.pattern,
        };
      },
    },
    {
      name: 'delete_artifact',
      description: 'Delete an artifact by filename',
      type: 'function',
      parameters: {
        type: 'object',
        properties: {
          filename: { type: 'string', description: 'Stored artifact filename' },
        },
        required: ['filename'],
      },
      handler: async (input: { filename: string }) => {
        await filesystem.deleteArtifact(input.filename);
        emitChange({ type: 'artifact_delete', path: input.filename });
        return { success: true, filename: input.filename };
      },
    },
    {
      name: 'save_artifact',
      description: 'Save content as an artifact',
      type: 'function',
      parameters: {
        type: 'object',
        properties: {
          filename: { type: 'string', description: 'Destination artifact filename' },
          content: { type: 'string', description: 'Artifact content' },
        },
        required: ['filename', 'content'],
      },
      handler: async (input: SaveArtifactParams) => {
        await filesystem.saveArtifact(input.filename, input.content);
        emitChange({ type: 'artifact_write', path: input.filename });
        return { success: true, filename: input.filename };
      },
    },
  ];

  return tools;
};

function sliceFile(result: ReadFileResult, start?: number, end?: number): ReadFileResult {
  if (!start && !end) {
    return result;
  }
  const lines = result.content.split('\n');
  const startIndex = Math.max(0, (start ?? 1) - 1);
  const endIndex = Math.min(lines.length, end ?? lines.length);
  const content = lines.slice(startIndex, endIndex).join('\n');
  return { path: result.path, content };
}
