/**
 * Models settings entry point — shell that routes between
 * Catalog, Providers, the model-detail drawer, and the
 * Voice / Image playgrounds.
 *
 * Wired to the real `DistriHomeClient`:
 *   listProviders / listSecrets / getWorkspaceSettings
 *   updateWorkspaceSettings (defaults)
 *   upsertProvider (save credential)
 *   deleteSecret (remove credential)
 *   testProvider (probe `GET /models`)
 *   generateImage / generateSpeech (playgrounds)
 *
 * Styling is scoped under `.models-shell` (see ./models/models.css).
 * The shell intentionally bypasses the rest of the app's shadcn
 * theming so the dense dark UI lands as designed.
 */

import './models/models.css';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Beaker, Layers, Settings as SettingsIcon } from 'lucide-react';
import { CAPABILITY_META } from './models/data';
import { useDistriHomeClient } from '../provider/context';
import type {
  CustomModelEntry,
  ModelCapability,
  ModelProviderDefinition,
  Secret,
} from '../DistriHomeClient';
import { CatalogTab } from './models/CatalogTab';
import { ImagePlayground } from './models/ImagePlayground';
import { ModelDetailDrawer } from './models/ModelDetailDrawer';
import type { AddCustomProviderInput } from './models/ProvidersTab';
import { ProvidersTab } from './models/ProvidersTab';
import { VoicePlayground } from './models/VoicePlayground';

export interface AgentSettingsViewProps {
  className?: string;
  /** Active tab from URL: 'models' (default) or 'providers'. */
  activeTab?: 'models' | 'providers';
  /** Callback when tab changes — consumer should update URL. */
  onTabChange?: (tab: 'models' | 'providers') => void;
}

type PlaygroundMode = { capability: 'image' | 'tts'; providerId?: string; modelId?: string } | null;
type DrawerTarget = { providerId: string; modelId: string } | null;

export function AgentSettingsView({
  className,
  activeTab: activeTabProp,
  onTabChange,
}: AgentSettingsViewProps) {
  const homeClient = useDistriHomeClient();
  const [activeTabInternal, setActiveTabInternal] = useState<'models' | 'providers'>(
    activeTabProp ?? 'models',
  );
  const activeTab = activeTabProp ?? activeTabInternal;

  const setActiveTab = (t: 'models' | 'providers') => {
    setActiveTabInternal(t);
    onTabChange?.(t);
  };

  // ── Server state ──
  const [providers, setProviders] = useState<ModelProviderDefinition[]>([]);
  const [secrets, setSecrets] = useState<Secret[]>([]);
  const [defaults, setDefaults] = useState({
    completion: '',
    tts: '',
    stt: '',
    image: '',
  });
  const [customModels, setCustomModels] = useState<CustomModelEntry[]>([]); // kept for symmetry; UI lands later
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ── Local UI state ──
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [drawer, setDrawer] = useState<DrawerTarget>(null);
  const [playground, setPlayground] = useState<PlaygroundMode>(null);
  const [focusProviderId, setFocusProviderId] = useState<string | undefined>(undefined);

  // Avoid an unused warning while the field stays on the type.
  void customModels;

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
        image: (settings as Record<string, unknown> | null)?.default_image_model as string | undefined ?? '',
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

  // ── Actions ──
  const toggleFavorite = (fullId: string) =>
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(fullId)) next.delete(fullId);
      else next.add(fullId);
      return next;
    });

  const handleOpenModel = (providerId: string, modelId: string) =>
    setDrawer({ providerId, modelId });

  const handleOpenPlayground = (capability: ModelCapability, providerId: string, modelId: string) => {
    if (capability === 'image' || capability === 'tts') {
      setPlayground({ capability, providerId, modelId });
    } else {
      // No completion/STT playground built yet — fall through to drawer.
      setDrawer({ providerId, modelId });
    }
  };

  const handleConfigureProvider = (providerId: string) => {
    setFocusProviderId(providerId);
    setActiveTab('providers');
  };

  const handleChangeDefault = async (capability: ModelCapability) => {
    // The catalog's default cards trigger this. For now, just jump to
    // the capability-filtered catalog so the user can click a model
    // and use the drawer's "Set as default". The drawer wires the
    // actual updateWorkspaceSettings call.
    setPlayground(null);
    setDrawer(null);
    // No-op aside from filtering would be confusing; keep noop.
    void capability;
  };

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

  const handleSaveKey = async (providerId: string, key: string, value: string) => {
    if (!homeClient) return;
    await homeClient.upsertProvider({
      provider_id: providerId,
      secrets: { [key]: value },
    });
    await loadData();
  };

  const handleDeleteKey = async (key: string) => {
    if (!homeClient) return;
    await homeClient.deleteSecret(key);
    await loadData();
  };

  const handleAddCustomProvider = async (input: AddCustomProviderInput) => {
    if (!homeClient) return;
    // Convention: the backend's `from_provider_model_str` accepts any
    // `custom_*` prefix and routes it to OpenAICompatible. We derive a
    // stable id from the display name to avoid surprise collisions.
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
    setFocusProviderId(providerId);
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

  // ── Renders ──
  const drawerData = useMemo(() => {
    if (!drawer) return null;
    const provider = providers.find((p) => p.id === drawer.providerId);
    const model = provider?.models.find((m) => m.id === drawer.modelId);
    if (!provider || !model) return null;
    return { provider, model };
  }, [drawer, providers]);

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

  return (
    <div className={`models-shell ${className ?? ''}`}>
      <div className="page">
        <div className="toolbar-row">
          {playground ? (
            <>
              <button className="subtab back" onClick={() => setPlayground(null)}>
                <ArrowLeft size={13} /> Models
              </button>
              <span className="tb-sep" />
              <div className="cap-switcher">
                {(['tts', 'image'] as const).map((c) => {
                  const active = playground.capability === c;
                  return (
                    <button
                      key={c}
                      className={`cap-switch ${active ? 'active' : ''}`}
                      onClick={() => {
                        const def = defaults[c];
                        const [pid, mid] = (def || '').split('/');
                        setPlayground({
                          capability: c,
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
                  className={`subtab ${activeTab === 'models' ? 'active' : ''}`}
                  onClick={() => setActiveTab('models')}
                >
                  <Layers size={14} /> Models
                  <span className="subtab-count">
                    {providers.reduce((n, p) => n + p.models.length, 0)}
                  </span>
                </button>
                <button
                  className={`subtab ${activeTab === 'providers' ? 'active' : ''}`}
                  onClick={() => setActiveTab('providers')}
                >
                  <SettingsIcon size={14} /> Providers
                  <span
                    className="subtab-count"
                    style={{
                      color: configuredProviders.size ? '#6EE7B7' : 'var(--m-text-faint)',
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
                  // Open Voice playground by default — Completion has no
                  // playground component built yet; Voice + Image are wired.
                  const def = defaults.tts;
                  const [pid, mid] = (def || '').split('/');
                  setPlayground({
                    capability: 'tts',
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

        {playground?.capability === 'image' && homeClient && (
          <ImagePlayground
            homeClient={homeClient}
            providers={providers}
            configured={configuredProviders}
            initialProviderId={playground.providerId}
            initialModelId={playground.modelId}
            onBack={() => setPlayground(null)}
          />
        )}
        {playground?.capability === 'tts' && homeClient && (
          <VoicePlayground
            homeClient={homeClient}
            providers={providers}
            configured={configuredProviders}
            initialProviderId={playground.providerId}
            initialModelId={playground.modelId}
            onBack={() => setPlayground(null)}
          />
        )}
        {!playground && activeTab === 'models' && (
          <CatalogTab
            providers={providers}
            secrets={secrets}
            defaults={defaults}
            favorites={favorites}
            onToggleFavorite={toggleFavorite}
            onOpenModel={handleOpenModel}
            onOpenPlayground={handleOpenPlayground}
            onConfigureProvider={handleConfigureProvider}
            onChangeDefault={handleChangeDefault}
          />
        )}
        {!playground && activeTab === 'providers' && (
          <ProvidersTab
            providers={providers}
            secrets={secrets}
            focusProviderId={focusProviderId}
            onFocusProvider={setFocusProviderId}
            onSaveKey={handleSaveKey}
            onDeleteKey={handleDeleteKey}
            onTestProvider={handleTestProvider}
            onAddCustomProvider={handleAddCustomProvider}
          />
        )}
      </div>

      {drawerData && (
        <ModelDetailDrawer
          provider={drawerData.provider}
          model={drawerData.model}
          configured={configuredProviders.has(drawerData.provider.id)}
          isDefault={defaults[drawerData.model.capability] === `${drawerData.provider.id}/${drawerData.model.id}`}
          isStarred={favorites.has(`${drawerData.provider.id}/${drawerData.model.id}`)}
          onClose={() => setDrawer(null)}
          onSetDefault={() =>
            handleSetDefaultForModel(
              drawerData.model.capability,
              `${drawerData.provider.id}/${drawerData.model.id}`,
            )
          }
          onToggleStar={() =>
            toggleFavorite(`${drawerData.provider.id}/${drawerData.model.id}`)
          }
          onOpenPlayground={() => {
            const cap = drawerData.model.capability;
            handleOpenPlayground(cap, drawerData.provider.id, drawerData.model.id);
            setDrawer(null);
          }}
          onConfigureProvider={() => {
            setDrawer(null);
            handleConfigureProvider(drawerData.provider.id);
          }}
        />
      )}
    </div>
  );
}
