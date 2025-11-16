import React, { useMemo } from 'react'
import { ChevronRight, FileText, Folder, MoreVertical } from 'lucide-react'
import type { DirectoryTreeNode } from '../storage/indexedDbFilesystem'

const cls = (...classes: Array<string | false | null | undefined>) =>
  classes.filter(Boolean).join(' ')

export interface FileListProps {
  tree: DirectoryTreeNode | null
  expandedPaths: Set<string>
  activePath?: string
  onToggle: (path: string) => void
  onOpenFile: (path: string) => void
  onDeleteEntry: (path: string, isDirectory?: boolean) => void
}

export const FileList: React.FC<FileListProps> = ({ tree, expandedPaths, activePath, onToggle, onOpenFile, onDeleteEntry }) => {
  const sortedRoots = useMemo(() => tree?.children?.slice().sort(sortTree) ?? [], [tree])
  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-auto px-2 py-1">
        {sortedRoots.length ? (
          <ul className="space-y-0.5">
            {sortedRoots.map((child) => (
              <ExplorerNode
                key={child.path}
                node={child}
                expandedPaths={expandedPaths}
                onToggle={onToggle}
                onOpenFile={onOpenFile}
                onDeleteEntry={onDeleteEntry}
                activePath={activePath}
              />
            ))}
          </ul>
        ) : (
          <div className="px-2 text-xs text-muted-foreground">No files yet. Create one to get started.</div>
        )}
      </div>
    </div>
  )
}

interface ExplorerNodeProps {
  node: DirectoryTreeNode
  expandedPaths: Set<string>
  onToggle: (path: string) => void
  onOpenFile: (path: string) => void
  onDeleteEntry: (path: string, isDirectory?: boolean) => void
  activePath?: string
}

const ExplorerNode: React.FC<ExplorerNodeProps> = ({
  node,
  expandedPaths,
  onToggle,
  onOpenFile,
  onDeleteEntry,
  activePath,
}) => {
  const isDirectory = node.type === 'directory'
  const isExpanded = expandedPaths.has(node.path)
  const isActive = activePath === node.path

  return (
    <li>
      <div
        className={cls(
          'group flex w-full items-center rounded-md px-1 py-1 text-sm hover:bg-muted/50',
          isActive && 'bg-primary/10 text-primary',
        )}
      >
        <button
          type="button"
          className="flex flex-1 items-center gap-2 text-left text-muted-foreground transition group-hover:text-foreground"
          onClick={() => (isDirectory ? onToggle(node.path) : onOpenFile(node.path))}
        >
          {isDirectory ? (
            <ChevronRight className={cls('h-3.5 w-3.5 transition-transform', isExpanded && 'rotate-90')} />
          ) : (
            <span className="w-3.5" />
          )}
          {isDirectory ? (
            <Folder className="h-4 w-4" />
          ) : (
            <FileText className="h-4 w-4" />
          )}
          <span className="truncate text-xs font-medium text-foreground">{node.name || '(root)'}</span>
        </button>
        <NodeMenu node={node} onDeleteEntry={onDeleteEntry} />
      </div>
      {isDirectory && isExpanded && node.children && node.children.length > 0 ? (
        <ul className="ml-4 border-l border-border/40 pl-2">
          {node.children
            .slice()
            .sort(sortTree)
            .map((child) => (
              <ExplorerNode
                key={child.path}
                node={child}
                expandedPaths={expandedPaths}
                onToggle={onToggle}
                onOpenFile={onOpenFile}
                onDeleteEntry={onDeleteEntry}
                activePath={activePath}
              />
            ))}
        </ul>
      ) : null}
    </li>
  )
}

interface NodeMenuProps {
  node: DirectoryTreeNode
  onDeleteEntry: (path: string, isDirectory?: boolean) => void
}

const NodeMenu: React.FC<NodeMenuProps> = ({ node, onDeleteEntry }) => {
  if (!node.path) {
    return null
  }
  return (
    <button
      type="button"
      className="rounded p-1 text-muted-foreground opacity-0 transition hover:bg-muted group-hover:opacity-100"
      onClick={(event) => {
        event.stopPropagation()
        onDeleteEntry(node.path, node.type === 'directory')
      }}
      aria-label={`Remove ${node.name}`}
    >
      <MoreVertical className="h-3.5 w-3.5" />
    </button>
  )
}

function sortTree(a: DirectoryTreeNode, b: DirectoryTreeNode) {
  if (a.type === b.type) {
    return a.name.localeCompare(b.name)
  }
  return a.type === 'directory' ? -1 : 1
}

export default FileList
