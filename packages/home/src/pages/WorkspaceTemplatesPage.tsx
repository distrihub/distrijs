import { BookOpen } from 'lucide-react';
import { TemplateBrowser } from '../blocks/TemplateBrowser';

/**
 * WorkspaceTemplatesPage — prompt templates for the current workspace.
 * Mounted at /workspace/templates.
 */
export function WorkspaceTemplatesPage() {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex items-center gap-2 border-b border-border/60 px-4 py-3 sm:px-6">
        <BookOpen className="h-4 w-4 text-cyan-400" />
        <h1 className="text-base font-semibold sm:text-lg">Templates</h1>
      </div>
      <div className="flex-1 min-h-0 overflow-hidden">
        <TemplateBrowser />
      </div>
    </div>
  );
}
