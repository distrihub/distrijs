/**
 * Catalog tab — dense, grouped-by-provider table with capability sub-tabs
 * and per-capability default-model strip at the top.
 *
 * Wired to real `DistriHomeClient` data:
 *   listProviders() → provider/model catalog
 *   listSecrets()   → which providers are configured
 *   getWorkspaceSettings() → default_model / default_tts_model /
 *                            default_stt_model / default_image_model
 */

import { useCallback, useMemo, useState } from 'react';
import {
  ArrowDown,
  ArrowRight,
  ArrowUp,
  Check,
  CheckCircle2,
  ChevronRight,
  Circle,
  Copy,
  Image as ImageIcon,
  Layers,
  Mic,
  Play,
  Plus,
  Search,
  Sparkles,
  Speaker,
  Wrench,
} from 'lucide-react';
import type {
  Model,
  ModelCapability,
  ModelProviderDefinition,
  Secret,
} from '../../DistriHomeClient';
import { CAPABILITY_META, formatContext, providerMonogram } from './data';
import { CapPill, PricingCell } from './primitives';

interface CatalogTabProps {
  providers: ModelProviderDefinition[];
  secrets: Secret[];
  defaults: {
    completion: string;
    tts: string;
    stt: string;
    image: string;
  };
  /** Toggle a model as the workspace default for its capability. Pass
   *  the same `provider/model` id again to clear. */
  onSetDefault: (capability: ModelCapability, fullId: string) => void;
  onOpenModel: (providerId: string, modelId: string) => void;
  onOpenPlayground: (capability: ModelCapability, providerId: string, modelId: string) => void;
  onConfigureProvider: (providerId: string) => void;
}

interface CatalogRow {
  providerId: string;
  providerLabel: string;
  modelId: string;
  capability: ModelCapability;
  model: Model;
}

type SortKey = 'name' | 'context' | 'price';
type CapFilter = 'all' | ModelCapability;

export function CatalogTab({
  providers,
  secrets,
  defaults,
  onSetDefault,
  onOpenModel,
  onOpenPlayground,
  onConfigureProvider,
}: CatalogTabProps) {
  const [search, setSearch] = useState('');
  const [capFilter, setCapFilter] = useState<CapFilter>('all');
  const [sort, setSort] = useState<{ key: SortKey; dir: 'asc' | 'desc' }>({
    key: 'context',
    dir: 'desc',
  });
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Configured = every required secret is present.
  const configuredProviders = useMemo(() => {
    const set = new Set<string>();
    for (const p of providers) {
      const required = p.keys.filter((k) => k.required !== false);
      const allPresent = required.every((k) => secrets.some((s) => s.key === k.key));
      if (required.length > 0 && allPresent) set.add(p.id);
    }
    return set;
  }, [providers, secrets]);

  const [openProviders, setOpenProviders] = useState<Set<string>>(
    () => new Set(providers.filter((p) => configuredProviders.has(p.id)).map((p) => p.id)),
  );

  // Flatten + count
  const flatRows = useMemo<CatalogRow[]>(() => {
    const out: CatalogRow[] = [];
    for (const p of providers) {
      for (const m of p.models) {
        out.push({
          providerId: p.id,
          providerLabel: p.label,
          modelId: m.id,
          capability: m.capability,
          model: m,
        });
      }
    }
    return out;
  }, [providers]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: flatRows.length };
    for (const r of flatRows) c[r.capability] = (c[r.capability] ?? 0) + 1;
    return c;
  }, [flatRows]);

  const filtered = useMemo(() => {
    let rows = flatRows;
    if (capFilter !== 'all') rows = rows.filter((r) => r.capability === capFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      rows = rows.filter(
        (r) =>
          r.model.name.toLowerCase().includes(q) ||
          r.modelId.toLowerCase().includes(q) ||
          r.providerLabel.toLowerCase().includes(q),
      );
    }
    return rows;
  }, [flatRows, capFilter, search]);

  // Group by provider; configured first, then catalog order.
  const grouped = useMemo(() => {
    const byProvider = new Map<string, CatalogRow[]>();
    const order: string[] = [];
    for (const r of filtered) {
      if (!byProvider.has(r.providerId)) {
        byProvider.set(r.providerId, []);
        order.push(r.providerId);
      }
      byProvider.get(r.providerId)!.push(r);
    }
    order.sort((a, b) => {
      const ac = configuredProviders.has(a) ? 0 : 1;
      const bc = configuredProviders.has(b) ? 0 : 1;
      if (ac !== bc) return ac - bc;
      const ai = providers.findIndex((p) => p.id === a);
      const bi = providers.findIndex((p) => p.id === b);
      return ai - bi;
    });
    // Sort within each group.
    for (const pid of order) {
      const list = byProvider.get(pid)!;
      list.sort((a, b) => {
        const dir = sort.dir === 'asc' ? 1 : -1;
        if (sort.key === 'name') return a.model.name.localeCompare(b.model.name) * dir;
        if (sort.key === 'context') {
          return ((a.model.context_window ?? 0) - (b.model.context_window ?? 0)) * dir;
        }
        if (sort.key === 'price') {
          const pa = priceKey(a.model);
          const pb = priceKey(b.model);
          return (pa - pb) * dir;
        }
        return 0;
      });
    }
    return order.map((pid) => ({ providerId: pid, models: byProvider.get(pid)! }));
  }, [filtered, sort, providers, configuredProviders]);

  // Column layout follows the capability filter (defaulting to the
  // completion table for "all").
  const columns: 'completion' | 'voice' | 'image' =
    capFilter === 'image' ? 'image' : capFilter === 'tts' || capFilter === 'stt' ? 'voice' : 'completion';

  const handleCopy = useCallback((id: string) => {
    if (navigator.clipboard) navigator.clipboard.writeText(id).catch(() => {});
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1200);
  }, []);

  const toggleProvider = (id: string) =>
    setOpenProviders((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const sortableHeader = (key: SortKey, label: string, opts?: { num?: boolean }) => {
    const active = sort.key === key;
    return (
      <span
        className={`sortable ${active ? 'active' : ''} ${opts?.num ? 'num' : ''}`}
        onClick={() =>
          setSort((prev) => ({
            key,
            dir: prev.key === key && prev.dir === 'desc' ? 'asc' : 'desc',
          }))
        }
      >
        {label}
        {active && (sort.dir === 'desc' ? <ArrowDown size={11} /> : <ArrowUp size={11} />)}
      </span>
    );
  };

  return (
    <>
      <DefaultStrip defaults={defaults} />

      <div className="toolbar">
        <CapChips active={capFilter} counts={counts} onChange={setCapFilter} />
        <span style={{ flex: 1 }} />
        <div style={{ display: 'flex', gap: 4, marginRight: 8 }}>
          <button
            className="cap-chip"
            title="Expand all providers"
            onClick={() => setOpenProviders(new Set(grouped.map((g) => g.providerId)))}
          >
            Expand all
          </button>
          <button
            className="cap-chip"
            title="Collapse all providers"
            onClick={() => setOpenProviders(new Set())}
          >
            Collapse all
          </button>
        </div>
        <div className="search">
          <Search size={14} />
          <input
            placeholder="Search models, providers, IDs…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <span className="kbd">⌘K</span>
        </div>
      </div>

      <div className="cat-card">
        <div className={`cat-head cat-cols-${columns}`}>
          {sortableHeader('name', 'Model')}
          <span style={{ textAlign: 'left' }}>Capability</span>
          {columns === 'completion' && (
            <>
              {sortableHeader('context', 'Context', { num: true })}
              {sortableHeader('price', 'Cost / 1M', { num: true })}
              <span className="num">Cached</span>
            </>
          )}
          {columns === 'voice' && (
            <>
              <span className="num">{capFilter === 'tts' ? 'Voices' : 'Languages'}</span>
              {sortableHeader('price', 'Price', { num: true })}
            </>
          )}
          {columns === 'image' && (
            <>
              <span className="num">Sizes</span>
              {sortableHeader('price', 'Price', { num: true })}
            </>
          )}
          <span style={{ textAlign: 'center' }}>Default</span>
          <span style={{ textAlign: 'right' }}>Actions</span>
        </div>

        {grouped.length === 0 && (
          <div style={{ padding: '48px 18px', textAlign: 'center', color: 'var(--m-text-muted)' }}>
            No models match — try clearing your search or capability filter.
          </div>
        )}

        {grouped.map((g) => {
          const p = providers.find((x) => x.id === g.providerId);
          if (!p) return null;
          const isOpen = openProviders.has(g.providerId);
          const isConfigured = configuredProviders.has(g.providerId);
          return (
            <ProviderGroupSection
              key={g.providerId}
              provider={p}
              models={g.models}
              open={isOpen}
              configured={isConfigured}
              onToggle={() => toggleProvider(g.providerId)}
              onConfigure={() => onConfigureProvider(g.providerId)}
              renderRow={(row) => {
                const fullId = `${row.providerId}/${row.modelId}`;
                const def = defaults[row.capability];
                return (
                  <CatalogRowView
                    key={fullId}
                    row={row}
                    configured={isConfigured}
                    isDefault={def === fullId}
                    onSetDefault={(r) => onSetDefault(r.capability, `${r.providerId}/${r.modelId}`)}
                    onCopy={handleCopy}
                    copied={copiedId === fullId}
                    onClick={(r) => onOpenModel(r.providerId, r.modelId)}
                    onPlay={(r) => onOpenPlayground(r.capability, r.providerId, r.modelId)}
                    columns={columns}
                  />
                );
              }}
            />
          );
        })}
      </div>
    </>
  );
}

// ── Helpers ──────────────────────────────────────────────────────────

function priceKey(m: Model): number {
  const p = m.pricing;
  if (!p) return 0;
  if (p.type === 'completion') return p.input ?? 0;
  if (p.type === 'tts') return p.per_1m_chars ?? 0;
  if (p.type === 'stt') return p.per_minute ?? 0;
  if (p.type === 'image') return p.per_image ?? 0;
  return 0;
}

function DefaultStrip({ defaults }: { defaults: Record<ModelCapability, string> }) {
  const caps: ModelCapability[] = ['completion', 'tts', 'stt', 'image'];
  return (
    <div className="defaults">
      {caps.map((cap) => {
        const meta = CAPABILITY_META[cap];
        const val = defaults[cap];
        return (
          <div key={cap} className="default-card">
            <div className="row1">
              <CapPill type={cap} />
              <span className="cap-label">Default {meta.short.toLowerCase()}</span>
            </div>
            <div className={`value ${val ? '' : 'empty'}`} title={val || undefined}>
              {val || 'Not set — pick a model'}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function CapChips({
  active,
  counts,
  onChange,
}: {
  active: CapFilter;
  counts: Record<string, number>;
  onChange: (next: CapFilter) => void;
}) {
  const items: { id: CapFilter; label: string; icon: React.ComponentType<{ size?: number }> }[] = [
    { id: 'all', label: 'All models', icon: Layers },
    { id: 'completion', label: 'Completion', icon: Sparkles },
    { id: 'tts', label: 'Text to speech', icon: Speaker },
    { id: 'stt', label: 'Speech to text', icon: Mic },
    { id: 'image', label: 'Image', icon: ImageIcon },
  ];
  return (
    <div className="cap-chips">
      {items.map((it) => {
        const Ic = it.icon;
        return (
          <button
            key={it.id}
            className={`cap-chip ${active === it.id ? 'active' : ''}`}
            onClick={() => onChange(it.id)}
          >
            <Ic size={13} />
            {it.label}
            <span className="count">{counts[it.id] ?? 0}</span>
          </button>
        );
      })}
    </div>
  );
}

function ProviderGroupSection({
  provider,
  models,
  open,
  configured,
  onToggle,
  onConfigure,
  renderRow,
}: {
  provider: ModelProviderDefinition;
  models: CatalogRow[];
  open: boolean;
  configured: boolean;
  onToggle: () => void;
  onConfigure: () => void;
  renderRow: (row: CatalogRow) => React.ReactNode;
}) {
  return (
    <>
      <div className={`cat-provider ${open ? 'open' : ''}`} onClick={onToggle}>
        <ChevronRight size={14} className="chev" />
        <div className="name">
          <span className="mono">{providerMonogram(provider.id)}</span>
          <span>{provider.label}</span>
          <span className="count">
            · {models.length} {models.length === 1 ? 'model' : 'models'}
          </span>
        </div>
        <span className={`status ${configured ? 'ok' : 'bad'}`}>
          {configured ? (
            <>
              <span
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: '50%',
                  background: '#34D399',
                  boxShadow: '0 0 0 3px rgba(16,185,129,.16)',
                }}
              />
              Configured
            </>
          ) : (
            'Not configured'
          )}
        </span>
        <button
          className="quick"
          onClick={(e) => {
            e.stopPropagation();
            onConfigure();
          }}
        >
          <Wrench size={11} />
          {configured ? 'Manage' : 'Configure'}
        </button>
        <span />
      </div>
      {open && models.map(renderRow)}
    </>
  );
}

function CatalogRowView({
  row,
  configured,
  isDefault,
  onSetDefault,
  onCopy,
  copied,
  onClick,
  onPlay,
  columns,
}: {
  row: CatalogRow;
  configured: boolean;
  isDefault: boolean;
  onSetDefault: (row: CatalogRow) => void;
  onCopy: (id: string) => void;
  copied: boolean;
  onClick: (row: CatalogRow) => void;
  onPlay: (row: CatalogRow) => void;
  columns: 'completion' | 'voice' | 'image';
}) {
  const fullId = `${row.providerId}/${row.modelId}`;
  const meta = row.model;

  return (
    <div
      className={`cat-row cat-cols-${columns} ${configured ? '' : 'disabled'}`}
      onClick={() => onClick(row)}
    >
      <div className="model">
        <span className="mono-pill">{providerMonogram(row.providerId)}</span>
        <div>
          <div className="name">
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {meta.name}
            </span>
          </div>
          <div className="id" onClick={(e) => e.stopPropagation()}>
            <span>{fullId}</span>
            <button className="copy" onClick={() => onCopy(fullId)} title="Copy model ID">
              {copied ? <Check size={11} /> : <Copy size={11} />}
            </button>
          </div>
        </div>
      </div>

      <div>
        <CapPill type={row.capability} />
      </div>

      {columns === 'completion' && (
        <>
          <div className="num">
            <strong>{formatContext(meta.context_window)}</strong>
          </div>
          <div>
            <PricingCell pricing={meta.pricing} />
          </div>
          <div>
            <PricingCell pricing={meta.pricing} kind="cached" />
          </div>
        </>
      )}
      {columns === 'voice' && (
        <>
          <div className="num">
            {row.capability === 'tts' && meta.voices?.length ? (
              <span>
                <strong>{meta.voices.length}</strong> <span className="em">voices</span>
              </span>
            ) : (
              <span className="em">—</span>
            )}
          </div>
          <div>
            <PricingCell pricing={meta.pricing} />
          </div>
        </>
      )}
      {columns === 'image' && (
        <>
          <div className="num" style={{ fontSize: 11.5 }}>
            {meta.formats?.length ? meta.formats.slice(0, 3).join(', ') : <span className="em">—</span>}
          </div>
          <div>
            <PricingCell pricing={meta.pricing} />
          </div>
        </>
      )}

      <div style={{ textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
        {/* The Default column IS the toggle. Click flips this model on/off
            as the workspace default for its capability. */}
        <button
          onClick={() => onSetDefault(row)}
          title={isDefault ? 'Clear default for this capability' : 'Set as default for this capability'}
          aria-pressed={isDefault}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '2px 4px',
            borderRadius: 4,
            color: isDefault ? 'var(--m-brand-soft)' : 'var(--m-text-faint)',
          }}
        >
          {isDefault ? (
            <CheckCircle2 size={15} style={{ fill: 'currentColor' }} />
          ) : (
            <Circle size={15} />
          )}
          {isDefault && (
            <span style={{ fontSize: 11, fontWeight: 600 }}>Default</span>
          )}
        </button>
      </div>

      <div className="row-actions" onClick={(e) => e.stopPropagation()}>
        <button className="play" onClick={() => onPlay(row)} title="Open in playground">
          <Play size={13} />
        </button>
        <button onClick={() => onClick(row)} title="Details">
          <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
}

// Unused but explicitly imported to keep tree-shaking aware of usage in JSX above.
export { Plus };
