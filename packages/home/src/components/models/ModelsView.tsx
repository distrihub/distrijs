/**
 * ModelsView — the full-width Models page. Standalone; no settings shell.
 *
 * URL-driven: the consuming app passes `view` + `playgroundMode` and a
 * `navigate` callback. We render the right sub-page:
 *   /models             → CatalogTab
 *   /models/providers   → ProvidersTab
 *   /models/playground  → Voice or Image playground (per `playgroundMode`)
 *
 * Owns:
 *   - server state (providers / secrets / workspace settings),
 *   - the in-page model-detail drawer,
 * and delegates rendering of each view to its dedicated component.
 */

import './models.css';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Beaker, Layers, Loader2, Settings as SettingsIcon, X } from 'lucide-react';
import { useDistriHomeClient } from '../../provider/context';
import type {
  CustomModelEntry,
  ModelCapability,
  ModelProviderDefinition,
  Secret,
} from '../../DistriHomeClient';
import { CAPABILITY_META } from './data';
import { CatalogTab } from './CatalogTab';
import { ImagePlayground } from './ImagePlayground';
import { ModelDetailDrawer } from './ModelDetailDrawer';
import type { AddCustomProviderInput } from './ProvidersTab';
import { ProvidersTab } from './ProvidersTab';
import { VoicePlayground } from './VoicePlayground';

export type ModelsViewMode = 'catalog' | 'providers' | 'playground';
export type PlaygroundCapability = 'tts' | 'image';

export type ModelsNavigateTarget =
  | { view: 'catalog' }
  | { view: 'providers'; providerId?: string }
  | { view: 'playground'; mode: PlaygroundCapability; providerId?: string; modelId?: string };

export interface ModelsViewProps {
  className?: string;
  /** Which sub-page to render. Defaults to `catalog`. */
  view?: ModelsViewMode;
  /** Playground capability (only when `view === 'playground'`). */
  playgroundMode?: PlaygroundCapability;
  /** Initial provider id to focus on the Providers tab. */
  focusProviderId?: string;
  /** Initial model id for the playground. */
  playgroundProviderId?: string;
  playgroundModelId?: string;
  /** Consumer routes to the right URL. */
  navigate?: (target: ModelsNavigateTarget) => void;
}

type DrawerTarget = { providerId: string; modelId: string } | null;

export function ModelsView({
  className,
  view = 'catalog',
  playgroundMode = 'tts',
  focusProviderId,
  playgroundProviderId,
  playgroundModelId,
  navigate,
}: ModelsViewProps) {
  const homeClient = useDistriHomeClient();

  // ── Server state ──
  const [providers, setProviders] = useState<ModelProviderDefinition[]>([]);
  const [secrets, setSecrets] = useState<Secret[]>([]);
  const [defaults, setDefaults] = useState({
    completion: '',
    tts: '',
    stt: '',
    image: '',
  });
  // Kept around; the inline-add-model UI lands later.
  const [customModels, setCustomModels] = useState<CustomModelEntry[]>([]);
  void customModels;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ── Local UI state ──
  const [drawer, setDrawer] = useState<DrawerTarget>(null);
  /** When set, the Add Custom Model modal is open for this provider id. */
  const [addModelFor, setAddModelFor] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!homeClient) return;
    setLoading(true);
    setError(null);
    try {
      const [settings, secs, providerData] = await Promise.all([
        homeClient.getWorkspaceSettings(),
        homeClient.listSecrets(),
        homeClient.listProviders(),
      ]);
      setProviders(providerData);
      setSecrets(secs);
      setDefaults({
        completion: settings?.default_model ?? '',
        tts: settings?.default_tts_model ?? '',
        stt: settings?.default_stt_model ?? '',
        image:
          ((settings as Record<string, unknown> | null)?.default_image_model as
            | string
            | undefined) ?? '',
      });
      setCustomModels(settings?.custom_models ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  }, [homeClient]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ── Derived ──
  const configuredProviders = useMemo(() => {
    const set = new Set<string>();
    for (const p of providers) {
      const required = p.keys.filter((k) => k.required !== false);
      if (required.length === 0) continue;
      if (required.every((k) => secrets.some((s) => s.key === k.key))) set.add(p.id);
    }
    return set;
  }, [providers, secrets]);

  const totalModels = useMemo(
    () => providers.reduce((n, p) => n + p.models.length, 0),
    [providers],
  );

  // ── Navigation ──
  const go = useCallback(
    (target: ModelsNavigateTarget) => {
      if (navigate) navigate(target);
    },
    [navigate],
  );

  // ── Actions wired to providers/playgrounds ──

  const handleOpenModel = (providerId: string, modelId: string) =>
    setDrawer({ providerId, modelId });

  const handleOpenPlayground = (
    capability: ModelCapability,
    providerId: string,
    modelId: string,
  ) => {
    if (capability === 'tts' || capability === 'image') {
      go({ view: 'playground', mode: capability, providerId, modelId });
    } else {
      // Completion / STT playgrounds aren't built yet — fall through to drawer.
      setDrawer({ providerId, modelId });
    }
  };

  const handleConfigureProvider = (providerId: string) =>
    go({ view: 'providers', providerId });

  const handleSetDefaultForModel = async (capability: ModelCapability, fullId: string) => {
    if (!homeClient) return;
    const key =
      capability === 'completion'
        ? 'default_model'
        : capability === 'tts'
        ? 'default_tts_model'
        : capability === 'stt'
        ? 'default_stt_model'
        : 'default_image_model';
    const isCurrent = defaults[capability] === fullId;
    const next = isCurrent ? null : fullId;
    await homeClient.updateWorkspaceSettings({ [key]: next });
    setDefaults((prev) => ({ ...prev, [capability]: next ?? '' }));
  };

  /** Save every entered credential for a provider in a single upsert. The
   *  backend persists the whole `secrets` map (plus any settings) in one
   *  transaction — no per-field round-trips. */
  const handleSaveKeys = async (providerId: string, secrets: Record<string, string>) => {
    if (!homeClient) return;
    if (Object.keys(secrets).length === 0) return;
    await homeClient.upsertProvider({
      provider_id: providerId,
      secrets,
    });
    await loadData();
  };

  const handleDeleteKey = async (key: string) => {
    if (!homeClient) return;
    await homeClient.deleteSecret(key);
    await loadData();
  };

  const handleTestProvider = async (providerId: string) => {
    if (!homeClient) return { ok: false, detail: 'No client' };
    try {
      const result = await homeClient.testProvider(providerId);
      const detail = result.ok
        ? `Connected — ${result.models.length} models reachable`
        : result.error ?? 'Test failed';
      return { ok: result.ok, detail };
    } catch (err) {
      return { ok: false, detail: err instanceof Error ? err.message : 'Test failed' };
    }
  };

  /** Add a custom model to a built-in or custom provider. The backend
   *  replaces the full `custom_models` array on each upsert, so we
   *  send the existing list plus the new entry. */
  const handleAddCustomModel = async (
    providerId: string,
    modelId: string,
    capability: ModelCapability,
  ) => {
    if (!homeClient) return;
    const trimmed = modelId.trim();
    if (!trimmed) return;
    // Avoid creating a duplicate row.
    const exists = customModels.some(
      (m) => m.provider === providerId && m.model === trimmed,
    );
    const next = exists
      ? customModels
      : [...customModels, { provider: providerId, model: trimmed, capability }];
    await homeClient.upsertProvider({
      provider_id: providerId,
      custom_models: next,
    });
    await loadData();
    setAddModelFor(null);
  };

  const handleAddCustomProvider = async (input: AddCustomProviderInput) => {
    if (!homeClient) return;
    const slug = input.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .slice(0, 32);
    const providerId = `custom_${slug || `provider_${Date.now()}`}`;
    const apiKeyName = `${providerId.toUpperCase()}_API_KEY`;
    await homeClient.upsertProvider({
      provider_id: providerId,
      secrets: { [apiKeyName]: input.apiKey },
      config: {
        id: providerId,
        name: input.name,
        base_url: input.baseUrl,
        project_id: input.projectId ?? null,
      },
    });
    await loadData();
    go({ view: 'providers', providerId });
  };

  // ── Drawer resolution ──
  const drawerData = useMemo(() => {
    if (!drawer) return null;
    const provider = providers.find((p) => p.id === drawer.providerId);
    const model = provider?.models.find((m) => m.id === drawer.modelId);
    if (!provider || !model) return null;
    return { provider, model };
  }, [drawer, providers]);

  // ── Render ──
  if (loading) {
    return (
      <div className={`models-shell ${className ?? ''}`}>
        <div className="page" style={{ color: 'var(--m-text-muted)' }}>
          Loading…
        </div>
      </div>
    );
  }
  if (error) {
    return (
      <div className={`models-shell ${className ?? ''}`}>
        <div className="page" style={{ color: '#FDA4AF' }}>
          {error}
        </div>
      </div>
    );
  }

  const isPlayground = view === 'playground';

  return (
    <div className={`models-shell ${className ?? ''}`}>
      <div className="page">
        <div className="toolbar-row">
          {isPlayground ? (
            <>
              <button className="subtab back" onClick={() => go({ view: 'catalog' })}>
                <ArrowLeft size={13} /> Models
              </button>
              <span className="tb-sep" />
              <div className="cap-switcher">
                {(['tts', 'image'] as const).map((c) => {
                  const active = playgroundMode === c;
                  return (
                    <button
                      key={c}
                      className={`cap-switch ${active ? 'active' : ''}`}
                      onClick={() => {
                        const def = defaults[c];
                        const [pid, mid] = (def || '').split('/');
                        go({
                          view: 'playground',
                          mode: c,
                          providerId: pid || undefined,
                          modelId: mid || undefined,
                        });
                      }}
                    >
                      {CAPABILITY_META[c].label}
                    </button>
                  );
                })}
              </div>
              <span style={{ flex: 1 }} />
            </>
          ) : (
            <>
              <div className="subtabs">
                <button
                  className={`subtab ${view === 'catalog' ? 'active' : ''}`}
                  onClick={() => go({ view: 'catalog' })}
                >
                  <Layers size={14} /> Models
                  <span className="subtab-count">{totalModels}</span>
                </button>
                <button
                  className={`subtab ${view === 'providers' ? 'active' : ''}`}
                  onClick={() => go({ view: 'providers' })}
                >
                  <SettingsIcon size={14} /> Providers
                  <span
                    className="subtab-count"
                    style={{
                      color: configuredProviders.size
                        ? '#6EE7B7'
                        : 'var(--m-text-faint)',
                    }}
                  >
                    {configuredProviders.size}/{providers.length}
                  </span>
                </button>
              </div>
              <span style={{ flex: 1 }} />
              <button
                className="btn btn-primary btn-sm"
                onClick={() => {
                  const def = defaults.tts;
                  const [pid, mid] = (def || '').split('/');
                  go({
                    view: 'playground',
                    mode: 'tts',
                    providerId: pid || undefined,
                    modelId: mid || undefined,
                  });
                }}
              >
                <Beaker size={13} /> Playground
              </button>
            </>
          )}
        </div>

        {view === 'catalog' && (
          <CatalogTab
            providers={providers}
            secrets={secrets}
            defaults={defaults}
            onSetDefault={handleSetDefaultForModel}
            onOpenModel={handleOpenModel}
            onOpenPlayground={handleOpenPlayground}
            onConfigureProvider={handleConfigureProvider}
          />
        )}
        {view === 'providers' && (
          <ProvidersTab
            providers={providers}
            secrets={secrets}
            defaults={defaults}
            focusProviderId={focusProviderId}
            onFocusProvider={(id) => go({ view: 'providers', providerId: id })}
            onSaveKeys={handleSaveKeys}
            onDeleteKey={handleDeleteKey}
            onTestProvider={handleTestProvider}
            onAddCustomProvider={handleAddCustomProvider}
            onAddModel={(providerId) => setAddModelFor(providerId)}
          />
        )}
        {isPlayground && playgroundMode === 'tts' && homeClient && (
          <VoicePlayground
            homeClient={homeClient}
            providers={providers}
            configured={configuredProviders}
            initialProviderId={playgroundProviderId}
            initialModelId={playgroundModelId}
            onBack={() => go({ view: 'catalog' })}
          />
        )}
        {isPlayground && playgroundMode === 'image' && homeClient && (
          <ImagePlayground
            homeClient={homeClient}
            providers={providers}
            configured={configuredProviders}
            initialProviderId={playgroundProviderId}
            initialModelId={playgroundModelId}
            onBack={() => go({ view: 'catalog' })}
          />
        )}
      </div>

      {drawerData && (
        <ModelDetailDrawer
          provider={drawerData.provider}
          model={drawerData.model}
          configured={configuredProviders.has(drawerData.provider.id)}
          isDefault={
            defaults[drawerData.model.capability] ===
            `${drawerData.provider.id}/${drawerData.model.id}`
          }
          onClose={() => setDrawer(null)}
          onSetDefault={() =>
            handleSetDefaultForModel(
              drawerData.model.capability,
              `${drawerData.provider.id}/${drawerData.model.id}`,
            )
          }
          onOpenPlayground={() => {
            const cap = drawerData.model.capability;
            handleOpenPlayground(
              cap,
              drawerData.provider.id,
              drawerData.model.id,
            );
            setDrawer(null);
          }}
          onConfigureProvider={() => {
            setDrawer(null);
            handleConfigureProvider(drawerData.provider.id);
          }}
        />
      )}

      {addModelFor && (
        <AddCustomModelModal
          provider={
            providers.find((p) => p.id === addModelFor) ?? null
          }
          onClose={() => setAddModelFor(null)}
          onSubmit={(modelId, capability) =>
            handleAddCustomModel(addModelFor, modelId, capability)
          }
        />
      )}
    </div>
  );
}

// ── AddCustomModelModal ──────────────────────────────────────────────
//
// Simple form: Model ID + Capability. Save calls back into ModelsView
// with the values; ModelsView appends to `custom_models` and upserts.

function AddCustomModelModal({
  provider,
  onClose,
  onSubmit,
}: {
  provider: ModelProviderDefinition | null;
  onClose: () => void;
  onSubmit: (modelId: string, capability: ModelCapability) => Promise<void>;
}) {
  const [modelId, setModelId] = useState('');
  const [capability, setCapability] = useState<ModelCapability>('completion');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!provider) return null;

  const handleSubmit = async () => {
    if (!modelId.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit(modelId.trim(), capability);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add model');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="drawer-backdrop"
      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 440,
          maxWidth: '92vw',
          background: 'var(--m-bg-elev)',
          border: '1px solid var(--m-border)',
          borderRadius: 'var(--m-radius-lg)',
          padding: 20,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 14,
          }}
        >
          <h3 style={{ margin: 0, fontSize: 16, color: 'var(--m-text)' }}>
            Add model to {provider.label}
          </h3>
          <button onClick={onClose} className="btn btn-ghost" style={{ width: 28, height: 28, padding: 0 }}>
            <X size={16} />
          </button>
        </div>
        <p style={{ fontSize: 12.5, color: 'var(--m-text-muted)', margin: '0 0 16px' }}>
          Type the provider-side model id (e.g. <code className="mono-text" style={{ fontSize: 11 }}>gpt-5.4</code>).
          It will be stored in workspace settings and surface in the catalog.
        </p>

        <div style={{ marginBottom: 12 }}>
          <label
            style={{
              display: 'block',
              fontSize: 12,
              color: 'var(--m-text-muted)',
              marginBottom: 5,
            }}
          >
            Model ID
          </label>
          <div className="input">
            <input
              type="text"
              placeholder="gpt-5.4"
              value={modelId}
              onChange={(e) => setModelId(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && modelId.trim()) handleSubmit();
              }}
              autoFocus
              style={{ fontFamily: 'var(--m-font-mono)' }}
            />
          </div>
        </div>

        <div style={{ marginBottom: 12 }}>
          <label
            style={{
              display: 'block',
              fontSize: 12,
              color: 'var(--m-text-muted)',
              marginBottom: 5,
            }}
          >
            Capability
          </label>
          <select
            value={capability}
            onChange={(e) => setCapability(e.target.value as ModelCapability)}
            className="select"
            style={{
              width: '100%',
              background: 'rgba(255,255,255,.02)',
              border: '1px solid var(--m-border)',
              color: 'var(--m-text)',
              borderRadius: 'var(--m-radius-md)',
              padding: '8px 10px',
              fontSize: 13,
            }}
          >
            <option value="completion">Completion</option>
            <option value="tts">Text to speech</option>
            <option value="stt">Speech to text</option>
            <option value="image">Image</option>
          </select>
        </div>

        {error && (
          <div style={{ color: '#FDA4AF', fontSize: 12.5, marginTop: 4 }}>{error}</div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
          <button className="btn btn-secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </button>
          <button
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={!modelId.trim() || submitting}
          >
            {submitting ? (
              <>
                <Loader2 size={13} className="shimmer" /> Adding…
              </>
            ) : (
              'Add model'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
