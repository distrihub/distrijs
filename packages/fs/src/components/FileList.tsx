import React, { useState, useCallback } from 'react'
import {
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@distri/react'
import { Plus, RefreshCw } from 'lucide-react'
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
  onRefresh?: () => void
  onCreateEntry?: (input: { type: 'file' | 'directory'; path: string; content?: string }) => Promise<void> | void
}

export const FileList: React.FC<FileListProps> = ({
  tree,
  expandedPaths,
  activePath,
  onToggle,
  onOpenFile,
  onDeleteEntry,
  onRefresh,
  onCreateEntry,
}) => {
  const [newEntryOpen, setNewEntryOpen] = useState(false)
  const [newEntryType, setNewEntryType] = useState<'file' | 'directory'>('file')
  const [newEntryPath, setNewEntryPath] = useState('')
  const [newEntryContent, setNewEntryContent] = useState('')

  const handleCreateEntry = useCallback(async () => {
    if (!onCreateEntry) {
      setNewEntryOpen(false)
      return
    }
    const path = newEntryPath.trim()
    if (!path) {
      return
    }
    await onCreateEntry({ type: newEntryType, path, content: newEntryContent })
    setNewEntryContent('')
    setNewEntryPath('')
    setNewEntryOpen(false)
  }, [newEntryContent, newEntryPath, newEntryType, onCreateEntry])

  return (
    <TooltipProvider>
      <div className="flex h-full flex-col">
        <div className="flex items-center gap-2 px-3 pt-3">
          {onCreateEntry ? (
            <Dialog open={newEntryOpen} onOpenChange={setNewEntryOpen}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => setNewEntryOpen(true)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">New file or folder</TooltipContent>
              </Tooltip>
              <DialogContent className="sm:max-w-[420px]">
                <DialogHeader>
                  <DialogTitle>Create {newEntryType === 'file' ? 'File' : 'Folder'}</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-2">
                  <div className="grid gap-2">
                    <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Type
                    </label>
                    <Select value={newEntryType} onValueChange={(value: 'file' | 'directory') => setNewEntryType(value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="file">File</SelectItem>
                        <SelectItem value="directory">Folder</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Path
                    </label>
                    <Input
                      placeholder="src/index.ts"
                      value={newEntryPath}
                      onChange={(event) => setNewEntryPath(event.target.value)}
                    />
                  </div>
                  {newEntryType === 'file' ? (
                    <div className="grid gap-2">
                      <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Initial content
                      </label>
                      <Textarea
                        rows={4}
                        value={newEntryContent}
                        onChange={(event: React.ChangeEvent<HTMLTextAreaElement>) =>
                          setNewEntryContent(event.target.value)
                        }
                        placeholder="// Optional starting content"
                      />
                    </div>
                  ) : null}
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setNewEntryOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateEntry}>Create</Button>
                </div>
              </DialogContent>
            </Dialog>
          ) : null}
          {onRefresh ? (
            <Button
              size="icon"
              variant="ghost"
              onClick={() => void onRefresh()}
              className="text-muted-foreground hover:text-foreground"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          ) : null}
        </div>
        <div className="flex-1 overflow-auto">
          {tree ? (
            <ul className="space-y-1 px-2">
              {tree.children
                ?.slice()
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
          ) : (
            <div className="px-2 text-xs text-muted-foreground">No files yet. Create one to get started.</div>
          )}
        </div>
      </div>
    </TooltipProvider>
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
      <div className="group flex w-full items-center gap-2 rounded px-2 py-1 text-sm">
        <button
          type="button"
          className={cls(
            'flex flex-1 items-center gap-2 rounded text-left text-muted-foreground transition hover:text-foreground',
            isActive && 'text-primary',
          )}
          onClick={() => (isDirectory ? onToggle(node.path) : onOpenFile(node.path))}
        >
          {isDirectory ? <FolderIcon expanded={isExpanded} /> : <FileIcon />}
          <span className="truncate">{node.name}</span>
        </button>
        <NodeMenu
          node={node}
          onToggle={() => onToggle(node.path)}
          isExpanded={isExpanded}
          onDeleteEntry={onDeleteEntry}
        />
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
  onToggle: () => void
  isExpanded: boolean
  onDeleteEntry: (path: string, isDirectory?: boolean) => void
}

const NodeMenu: React.FC<NodeMenuProps> = ({ node, onToggle, isExpanded, onDeleteEntry }) => {
  if (node.type === 'directory') {
    return (
      <button
        type="button"
        className="rounded p-1 text-muted-foreground hover:bg-muted"
        onClick={onToggle}
      >
        {isExpanded ? '−' : '+'}
      </button>
    )
  }

  return (
    <button
      type="button"
      className="rounded p-1 text-muted-foreground hover:bg-muted"
      onClick={() => onDeleteEntry(node.path)}
    >
      Remove
    </button>
  )
}

const FolderIcon: React.FC<{ expanded: boolean }> = ({ expanded }) => (
  <span className="text-xs text-muted-foreground">{expanded ? '▾' : '▸'}</span>
)

const FileIcon = () => <span className="text-xs text-muted-foreground">•</span>

function sortTree(a: DirectoryTreeNode, b: DirectoryTreeNode) {
  if (a.type === b.type) {
    return a.name.localeCompare(b.name)
  }
  return a.type === 'directory' ? -1 : 1
}

export default FileList
