import { Sparkles } from 'lucide-react';
import { SkillBrowser } from '../blocks/SkillBrowser';

/**
 * WorkspaceSkillsPage — skill browser/editor for the current workspace.
 * Mounted at /workspace/skills.
 */
export function WorkspaceSkillsPage() {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex items-center gap-2 border-b border-border/60 px-4 py-3 sm:px-6">
        <Sparkles className="h-4 w-4 text-violet-400" />
        <h1 className="text-base font-semibold sm:text-lg">Skills</h1>
      </div>
      <div className="flex-1 min-h-0 overflow-hidden">
        <SkillBrowser />
      </div>
    </div>
  );
}
