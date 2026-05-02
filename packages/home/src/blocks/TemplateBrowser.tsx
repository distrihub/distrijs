import React, { useEffect, useState, useCallback, type ReactNode } from 'react';
import { Plus, Trash2, Copy, Save, FileText, AlertTriangle } from 'lucide-react';
import { Button, Skeleton } from '@distri/components';
import { useDistriHome } from '../provider/context';
import { useDistriHomeClient } from '../DistriHomeProvider';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PromptTemplate {
  id: string;
  name: string;
  template: string;
  is_system?: boolean;
  is_owner?: boolean;
  created_at?: string;
  updated_at?: string;
}

// ---------------------------------------------------------------------------
// Slots + props
// ---------------------------------------------------------------------------

export interface TemplateBrowserSlots {
  /** Extra toolbar actions per selected template */
  templateActions?: (templateId: string | null) => ReactNode;
}

export interface TemplateBrowserProps {
  slots?: TemplateBrowserSlots;
  onTemplateSelected?: (templateId: string) => void;
  className?: string;
}

// ---------------------------------------------------------------------------
// TemplateListRow
// ---------------------------------------------------------------------------

function TemplateListRow({
  template,
  selected,
  onSelect,
}: {
  template: PromptTemplate;
  selected: boolean;
  onSelect: () => void;
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
      <div className="flex items-center gap-2">
        <FileText className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        <p className="text-sm font-medium text-foreground truncate flex-1">{template.name}</p>
        {template.is_system && (
          <span className="text-[9px] bg-amber-500/10 text-amber-600 px-1.5 py-0.5 rounded font-semibold">
            SYSTEM
          </span>
        )}
      </div>
      {template.updated_at && (
        <p className="mt-0.5 pl-5.5 text-[10px] text-muted-foreground truncate">
          {new Date(template.updated_at).toLocaleDateString()}
        </p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main block
// ---------------------------------------------------------------------------

/**
 * TemplateBrowser — list + editor for prompt templates.
 * Left: scrollable list with create button.
 * Right: name + template content editor.
 * Slot `templateActions(id)` lets cloud inject extra actions (e.g. share).
 */
export function TemplateBrowser({ slots, onTemplateSelected, className }: TemplateBrowserProps) {
  const home = useDistriHome();
  const homeClient = useDistriHomeClient();

  const [templates, setTemplates] = useState<PromptTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Editor state
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [name, setName] = useState('');
  const [templateContent, setTemplateContent] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!homeClient) { setLoading(false); return; }
    setLoading(true);
    setError(null);
    try {
      const data = await homeClient.listPromptTemplates();
      setTemplates(data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load templates');
    } finally {
      setLoading(false);
    }
  }, [homeClient]);

  useEffect(() => {
    void load();
  }, [load]);

  const selectTemplate = (template: PromptTemplate) => {
    setSelectedId(template.id);
    setIsCreating(false);
    setName(template.name);
    setTemplateContent(template.template);
    onTemplateSelected?.(template.id);
  };

  const startCreate = () => {
    setSelectedId(null);
    setIsCreating(true);
    setName('');
    setTemplateContent('');
  };

  const cancelEdit = () => {
    setSelectedId(null);
    setIsCreating(false);
    setName('');
    setTemplateContent('');
  };

  const handleSave = async () => {
    if (!name.trim() || !templateContent.trim()) return;
    setSaving(true);
    setError(null);
    try {
      if (selectedId && !isCreating) {
        await homeClient?.updatePromptTemplate(selectedId, name.trim(), templateContent);
      } else {
        const created = await homeClient?.createPromptTemplate(name.trim(), templateContent);
        if (created) {
          setSelectedId(created.id);
          setIsCreating(false);
        }
      }
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    const t = templates.find((x) => x.id === id);
    if (!t) return;
    if (!window.confirm(`Delete template "${t.name}"?`)) return;
    try {
      await homeClient?.deletePromptTemplate(id);
      if (selectedId === id) cancelEdit();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete');
    }
  };

  const handleClone = async (id: string) => {
    try {
      const cloned = await homeClient?.clonePromptTemplate(id);
      await load();
      if (cloned) selectTemplate(cloned);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to clone');
    }
  };

  const isEditing = selectedId !== null || isCreating;
  const currentTemplate = templates.find((t) => t.id === selectedId);
  const canEdit = isCreating || (currentTemplate && !currentTemplate.is_system && currentTemplate.is_owner !== false);

  return (
    <div className={`flex flex-1 h-full overflow-hidden bg-background ${className ?? ''}`}>
      {/* Left: template list */}
      <div className="w-64 shrink-0 flex flex-col border-r border-border/60 bg-card/30">
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-border/60">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Templates
          </h3>
          <button
            type="button"
            onClick={startCreate}
            title="New template"
            className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground transition hover:bg-primary/90"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-3 space-y-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-9 w-full rounded" />
              ))}
            </div>
          ) : templates.length === 0 ? (
            <div className="px-3 py-4 text-xs text-muted-foreground text-center">
              No templates yet.
            </div>
          ) : (
            <div className="py-1">
              {templates.map((t) => (
                <TemplateListRow
                  key={t.id}
                  template={t}
                  selected={selectedId === t.id}
                  onSelect={() => selectTemplate(t)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-border/60 px-3 py-2 text-[10px] text-muted-foreground">
          {templates.length} template{templates.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Right: editor */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {!isEditing ? (
          <div className="flex flex-1 items-center justify-center">
            <div className="text-center">
              <FileText className="mx-auto h-10 w-10 text-muted-foreground/30" />
              <p className="mt-3 text-sm text-muted-foreground">
                Select a template or create new
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Toolbar */}
            <div className="flex items-center gap-2 px-4 py-2 border-b border-border/60">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={!canEdit}
                placeholder="Template name..."
                className="h-9 flex-1 rounded-md border border-border/60 bg-background px-3 text-sm font-medium text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none disabled:cursor-not-allowed disabled:bg-muted/30"
              />

              {/* Slot-injected actions */}
              {slots?.templateActions?.(selectedId)}

              {/* Clone button */}
              {selectedId && (
                <button
                  type="button"
                  onClick={() => handleClone(selectedId)}
                  title="Clone"
                  className="flex h-8 w-8 items-center justify-center rounded-md border border-border/70 text-muted-foreground transition hover:text-foreground"
                >
                  <Copy className="h-3.5 w-3.5" />
                </button>
              )}

              {canEdit && (
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving || !name.trim() || !templateContent.trim()}
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
                  disabled={saving}
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

            {/* Template textarea */}
            <div className="flex flex-1 flex-col overflow-hidden p-2">
              <textarea
                value={templateContent}
                onChange={(e) => setTemplateContent(e.target.value)}
                disabled={!canEdit}
                placeholder="Enter your prompt template here. Use {{variable}} for interpolation."
                className="flex-1 resize-none rounded-md border border-border/60 bg-background p-3 font-mono text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none disabled:cursor-not-allowed disabled:bg-muted/30 min-h-0"
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
