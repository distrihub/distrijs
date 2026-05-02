import React, { useEffect, useState, useCallback, type ReactNode } from 'react';
import {
  Plus,
  Search,
  Star,
  Copy,
  Globe,
  Lock,
  Building2,
  Compass,
  Shield,
  BookOpen,
  Trash2,
  Save,
  AlertTriangle,
} from 'lucide-react';
import { Button, Input, Skeleton } from '@distri/components';
import { useDistriHome } from '../provider/context';
import { useDistriHomeClient } from '../DistriHomeProvider';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type SkillScope = 'workspace' | 'system' | 'starred' | 'discover';

export interface SkillRecord {
  id: string;
  name: string;
  full_name?: string;
  workspace_slug?: string;
  description?: string;
  content?: string;
  tags: string[];
  is_public: boolean;
  is_system: boolean;
  is_owner: boolean;
  is_starred: boolean;
  star_count: number;
  clone_count: number;
  updated_at?: string;
}

// ---------------------------------------------------------------------------
// Slots + props
// ---------------------------------------------------------------------------

export interface SkillBrowserSlots {
  /** Extra actions rendered in the editor toolbar (e.g. cloud publish/share) */
  editorActions?: (skillId: string | null) => ReactNode;
}

export interface SkillBrowserProps {
  slots?: SkillBrowserSlots;
  onSkillSelected?: (skillId: string) => void;
  className?: string;
}

// ---------------------------------------------------------------------------
// SkillListRow
// ---------------------------------------------------------------------------

function SkillListRow({
  skill,
  selected,
  onSelect,
  onStar,
  onClone,
}: {
  skill: SkillRecord;
  selected: boolean;
  onSelect: () => void;
  onStar?: () => void;
  onClone?: () => void;
}) {
  return (
    <div
      className={[
        'group cursor-pointer px-3 py-2.5 transition hover:bg-muted/50',
        selected
          ? 'bg-primary/10 border-l-2 border-l-primary'
          : 'border-l-2 border-l-transparent',
      ].join(' ')}
      onClick={onSelect}
    >
      <p className="text-sm text-foreground leading-tight truncate">
        {skill.workspace_slug && (
          <span className="text-muted-foreground">{skill.workspace_slug}/</span>
        )}
        <span className="font-medium">{skill.name}</span>
        {skill.is_system && <Lock className="inline-block ml-1.5 h-3 w-3 text-amber-500" />}
        {!skill.is_system && skill.is_public && (
          <Globe className="inline-block ml-1.5 h-3 w-3 text-green-500" />
        )}
      </p>
      <div className="mt-1 flex items-center gap-3 text-[11px] text-muted-foreground">
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onStar?.(); }}
          title={skill.is_starred ? 'Unstar' : 'Star'}
          className={[
            'flex items-center gap-1 rounded px-1 -ml-1 transition',
            skill.is_starred ? 'text-amber-500 hover:text-amber-600' : 'hover:text-amber-500',
          ].join(' ')}
        >
          <Star className={`h-3 w-3 ${skill.is_starred ? 'fill-current' : ''}`} />
          {skill.star_count}
        </button>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onClone?.(); }}
          title="Clone"
          className="flex items-center gap-1 rounded px-1 transition hover:text-foreground"
        >
          <Copy className="h-3 w-3" />
          {skill.clone_count}
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main block
// ---------------------------------------------------------------------------

const DEFAULT_CONTENT = `# My Skill\n\nDescribe what this skill does and how to use it.\n\n## Instructions\n\n1. Step one\n2. Step two\n`;

/**
 * SkillBrowser — split-panel skill list + markdown editor.
 * Left: filterable/paged list with workspace/starred/system/discover tabs.
 * Right: editor for name, content (plain textarea; Monaco is cloud-only).
 * Slot `editorActions(skillId)` lets cloud inject publish/clone/delete buttons.
 */
export function SkillBrowser({ slots, onSkillSelected, className }: SkillBrowserProps) {
  const home = useDistriHome();
  const homeClient = useDistriHomeClient();

  // List state
  const [skills, setSkills] = useState<SkillRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<SkillScope>('workspace');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Editor state
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [name, setName] = useState('');
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!homeClient) { setLoading(false); return; }
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        scope: activeTab,
        page: String(page),
        per_page: '50',
      });
      if (query) params.set('search', query);

      const data = await (homeClient as any).client
        ?.fetch(`/skills?${params}`)
        .then((r: Response) => r.json());

      setSkills(data?.skills ?? data ?? []);
      if (data?.total != null) {
        setTotalItems(data.total);
        setTotalPages(data.total_pages ?? 1);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load skills');
    } finally {
      setLoading(false);
    }
  }, [homeClient, activeTab, query, page]);

  useEffect(() => {
    void load();
  }, [load]);

  const selectSkill = async (skill: SkillRecord) => {
    setSelectedId(skill.id);
    setIsCreating(false);
    setName(skill.name);
    // Fetch full skill with content if not already populated
    if (!skill.content) {
      try {
        const full = await (homeClient as any).client
          ?.fetch(`/skills/${skill.id}`)
          .then((r: Response) => r.json());
        setContent(full?.content ?? '');
      } catch {
        setContent('');
      }
    } else {
      setContent(skill.content);
    }
    onSkillSelected?.(skill.id);
  };

  const startCreate = () => {
    setSelectedId(null);
    setIsCreating(true);
    setName('');
    setContent(DEFAULT_CONTENT);
  };

  const cancelEdit = () => {
    setSelectedId(null);
    setIsCreating(false);
    setName('');
    setContent('');
  };

  const handleSave = async () => {
    if (!name.trim() || !content.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const payload = { name: name.trim(), content };
      if (selectedId && !isCreating) {
        await (homeClient as any).client?.fetch(`/skills/${selectedId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        const created = await (homeClient as any).client
          ?.fetch('/skills', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          })
          .then((r: Response) => r.json());
        setSelectedId(created?.id ?? null);
        setIsCreating(false);
      }
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    const skill = skills.find((s) => s.id === id);
    if (!skill || skill.is_system) return;
    if (!window.confirm(`Delete "${skill.name}"?`)) return;
    try {
      await (homeClient as any).client?.fetch(`/skills/${id}`, { method: 'DELETE' });
      if (selectedId === id) cancelEdit();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete');
    }
  };

  const handleStar = async (skillId: string, currentlyStarred: boolean) => {
    try {
      await (homeClient as any).client?.fetch(
        `/skills/${skillId}/${currentlyStarred ? 'unstar' : 'star'}`,
        { method: 'POST' },
      );
      await load();
    } catch { /* non-fatal */ }
  };

  const handleClone = async (skillId: string) => {
    try {
      const cloned = await (homeClient as any).client
        ?.fetch(`/skills/${skillId}/clone`, { method: 'POST' })
        .then((r: Response) => r.json());
      setActiveTab('workspace');
      setPage(1);
      setTimeout(() => {
        const s = skills.find((x) => x.id === cloned?.id);
        if (s) selectSkill(s);
      }, 300);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to clone');
    }
  };

  const isEditing = selectedId !== null || isCreating;
  const currentSkill = skills.find((s) => s.id === selectedId);
  const canEdit = isCreating || (currentSkill && !currentSkill.is_system && currentSkill.is_owner);

  const TAB_BUTTONS: { value: SkillScope; icon: ReactNode; title: string; activeClass: string }[] = [
    { value: 'workspace', icon: <Building2 className="h-4 w-4" />, title: 'Workspace', activeClass: 'bg-primary text-primary-foreground' },
    { value: 'starred', icon: <Star className="h-4 w-4" />, title: 'Starred', activeClass: 'bg-amber-500 text-white' },
    { value: 'system', icon: <Shield className="h-4 w-4" />, title: 'System', activeClass: 'bg-blue-600 text-white' },
    { value: 'discover', icon: <Compass className="h-4 w-4" />, title: 'Discover', activeClass: 'bg-green-600 text-white' },
  ];

  return (
    <div className={`flex flex-1 h-full overflow-hidden bg-background ${className ?? ''}`}>
      {/* Left: list panel */}
      <div className="w-72 shrink-0 flex flex-col border-r border-border/60 bg-card/30">
        {/* Tabs + New */}
        <div className="border-b border-border/60">
          <div className="flex items-center gap-1 px-3 py-2">
            {TAB_BUTTONS.map((tab) => (
              <button
                key={tab.value}
                type="button"
                onClick={() => { setActiveTab(tab.value); setPage(1); }}
                title={tab.title}
                className={[
                  'flex h-8 w-8 items-center justify-center rounded-md transition',
                  activeTab === tab.value
                    ? tab.activeClass
                    : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground',
                ].join(' ')}
              >
                {tab.icon}
              </button>
            ))}
            <div className="flex-1" />
            <button
              type="button"
              onClick={startCreate}
              title="New skill"
              className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground transition hover:bg-primary/90"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
          {/* Search */}
          <div className="px-3 pb-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <input
                value={query}
                onChange={(e) => { setQuery(e.target.value); setPage(1); }}
                placeholder="Search..."
                className="h-8 w-full rounded-md border border-border/70 bg-background pl-8 pr-2 text-xs text-foreground focus:border-primary focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-3 space-y-2">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-10 w-full rounded" />)}
            </div>
          ) : skills.length === 0 ? (
            <div className="px-3 py-4 text-xs text-muted-foreground text-center">
              {query ? 'No skills match your search.' : 'No skills found.'}
            </div>
          ) : (
            <div className="py-1">
              {skills.map((skill) => (
                <SkillListRow
                  key={skill.id}
                  skill={skill}
                  selected={selectedId === skill.id}
                  onSelect={() => selectSkill(skill)}
                  onStar={() => handleStar(skill.id, skill.is_starred)}
                  onClone={() => handleClone(skill.id)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-border/60 px-3 py-2 text-[10px] text-muted-foreground flex items-center justify-between">
          <span>{totalItems} skill{totalItems !== 1 ? 's' : ''}</span>
          {totalPages > 1 && (
            <span className="flex items-center gap-1">
              <button type="button" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="hover:text-foreground disabled:opacity-40">←</button>
              <span>{page}/{totalPages}</span>
              <button type="button" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} className="hover:text-foreground disabled:opacity-40">→</button>
            </span>
          )}
        </div>
      </div>

      {/* Right: editor panel */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {!isEditing ? (
          <div className="flex flex-1 items-center justify-center">
            <div className="text-center">
              <BookOpen className="mx-auto h-10 w-10 text-muted-foreground/30" />
              <p className="mt-3 text-sm text-muted-foreground">Select a skill or create new</p>
            </div>
          </div>
        ) : (
          <>
            {/* Editor toolbar */}
            <div className="flex items-center gap-2 px-4 py-2 border-b border-border/60">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={!canEdit}
                placeholder="Skill name..."
                className="h-9 flex-1 rounded-md border border-border/60 bg-background px-3 text-sm font-medium text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none disabled:cursor-not-allowed disabled:bg-muted/30"
              />
              {/* Slot-injected extra actions (e.g. cloud publish button) */}
              {slots?.editorActions?.(selectedId)}
              {canEdit && (
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving || !name.trim() || !content.trim()}
                  title="Save"
                  className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground transition hover:bg-primary/90 disabled:opacity-50"
                >
                  <Save className="h-4 w-4" />
                </button>
              )}
              {selectedId && canEdit && (
                <button
                  type="button"
                  onClick={() => handleDelete(selectedId)}
                  disabled={loading || saving}
                  title="Delete"
                  className="flex h-8 w-8 items-center justify-center rounded-md border border-red-400/50 text-red-500 transition hover:bg-red-500/10 disabled:opacity-50"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Error */}
            {error && (
              <div className="mx-4 mt-3 flex items-center gap-2 rounded-md border border-red-400/50 bg-red-500/10 px-3 py-2 text-xs text-red-600 dark:text-red-300">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                {error}
              </div>
            )}

            {/* Markdown textarea — use Monaco in cloud via slot override (Task 16) */}
            <div className="flex flex-1 flex-col overflow-hidden p-2">
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                disabled={!canEdit}
                className="flex-1 resize-none rounded-md border border-border/60 bg-background p-3 font-mono text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none disabled:cursor-not-allowed disabled:bg-muted/30 min-h-0"
                placeholder="Skill content (markdown)..."
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
