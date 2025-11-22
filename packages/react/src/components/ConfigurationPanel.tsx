import React, { useEffect, useMemo, useState } from 'react';
import { ConfigurationMeta, DistriConfiguration, ModelProviderConfig, ModelProviderName, ModelSettings } from '@distri/core';
import { useConfiguration } from '../hooks/useConfiguration';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Checkbox } from './ui/checkbox';
import { Skeleton } from './ui/skeleton';
import { Badge } from './ui/badge';

type ProviderOption = {
  value: ModelProviderName;
  label: string;
  hint?: string;
};

const providerOptions: ProviderOption[] = [
  { value: 'openai', label: 'OpenAI', hint: 'Hosted' },
  { value: 'openai_compat', label: 'OpenAI Compatible', hint: 'Custom base URL' },
  { value: 'vllora', label: 'VLLora', hint: 'Local' },
];

const defaultModelSettings = (settings?: ModelSettings): ModelSettings => {
  const provider = parseProvider(settings?.provider);
  return {
    model: settings?.model || 'gpt-4.1-mini',
    temperature: settings?.temperature ?? 0.7,
    max_tokens: settings?.max_tokens ?? 1000,
    context_size: settings?.context_size ?? 20000,
    top_p: settings?.top_p ?? 1,
    frequency_penalty: settings?.frequency_penalty ?? 0,
    presence_penalty: settings?.presence_penalty ?? 0,
    provider,
    parameters: settings?.parameters,
    response_format: settings?.response_format,
  };
};

const parseProvider = (provider?: ModelProviderConfig | string): ModelProviderConfig => {
  if (!provider) return { name: 'openai' };
  if (typeof provider === 'string') {
    return { name: provider };
  }
  if (!provider.name) {
    return { ...provider, name: 'openai' };
  }
  return provider;
};

const providerDefaults = (name: ModelProviderName): ModelProviderConfig => {
  switch (name) {
    case 'openai_compat':
      return { name, base_url: 'http://localhost:8080/v1' };
    case 'vllora':
      return { name, base_url: 'http://localhost:9090/v1' };
    default:
      return { name };
  }
};

type ConfigurationPanelProps = {
  className?: string;
  onSaved?: (configuration: DistriConfiguration) => void;
  title?: string;
};

const FieldLabel = ({ children }: { children: React.ReactNode }) => (
  <span className="text-xs font-medium text-muted-foreground">{children}</span>
);

const MetaRow = ({ meta }: { meta: ConfigurationMeta | null }) => {
  if (!meta) return null;
  return (
    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
      <Badge variant={meta.overrides_active ? 'secondary' : 'outline'}>
        {meta.overrides_active ? 'Overrides active' : 'Using base configuration'}
      </Badge>
      <span className="truncate">Base: {meta.base_path}</span>
      <span className="truncate">Overrides: {meta.overrides_path}</span>
    </div>
  );
};

export function ConfigurationPanel({ className, title = 'Agent Settings' }: ConfigurationPanelProps) {
  const { configuration, meta, loading, error, } = useConfiguration();
  const [draft, setDraft] = useState<DistriConfiguration | null>(null);
  const [useCustomAnalysis, setUseCustomAnalysis] = useState(false);

  useEffect(() => {
    if (configuration) {
      setDraft({
        ...configuration,
        model_settings: defaultModelSettings(configuration.model_settings),
        analysis_model_settings: configuration.analysis_model_settings
          ? defaultModelSettings(configuration.analysis_model_settings)
          : undefined,
      });
      setUseCustomAnalysis(Boolean(configuration.analysis_model_settings));
    }
  }, [configuration]);

  const providerName = useMemo<ModelProviderName>(() => {
    if (!draft?.model_settings) return 'openai';
    const provider = draft.model_settings.provider as ModelProviderConfig;
    return provider?.name || 'openai';
  }, [draft]);

  const analysisProviderName = useMemo<ModelProviderName>(() => {
    if (!draft?.analysis_model_settings) return providerName;
    return (draft.analysis_model_settings.provider as ModelProviderConfig)?.name || providerName;
  }, [draft, providerName]);

  const updateModelSetting = (
    target: 'model_settings' | 'analysis_model_settings',
    key: keyof ModelSettings,
    value: string | number | ModelProviderConfig,
  ) => {
    setDraft((current) => {
      if (!current) return current;
      const next = { ...current };
      const currentSettings = target === 'model_settings' ? current.model_settings : current.analysis_model_settings;
      const merged = defaultModelSettings(currentSettings || current.model_settings);
      (next as any)[target] = { ...merged, [key]: value };
      return next;
    });
  };

  const updateProvider = (target: 'model_settings' | 'analysis_model_settings', name: ModelProviderName) => {
    setDraft((current) => {
      if (!current) return current;
      const next = { ...current };
      const currentSettings = target === 'model_settings' ? current.model_settings : current.analysis_model_settings;
      const merged = defaultModelSettings(currentSettings || current.model_settings);
      const nextProvider = providerDefaults(name);
      (next as any)[target] = { ...merged, provider: nextProvider };
      return next;
    });
  };

  const renderProviderExtras = (settings?: ModelSettings, fallbackName?: ModelProviderName) => {
    const provider = parseProvider(settings?.provider);
    const activeName = provider.name || fallbackName;
    if (!activeName || (activeName !== 'openai_compat' && activeName !== 'vllora')) {
      return null;
    }
    return (
      <div className="space-y-2 rounded-md border border-dashed border-border/60 p-3">
        <div className="flex items-center justify-between">
          <FieldLabel>Provider details</FieldLabel>
          <Badge variant="outline" className="uppercase">
            {activeName}
          </Badge>
        </div>
        <Input
          value={(provider as any).base_url || ''}
          onChange={(e) =>
            updateModelSetting(
              settings === draft?.analysis_model_settings ? 'analysis_model_settings' : 'model_settings',
              'provider',
              { ...provider, base_url: e.target.value },
            )
          }
          placeholder="https://your-provider/v1"
        />
        {activeName === 'openai_compat' && (
          <p className="text-xs text-muted-foreground">
            Base URL for your compatible gateway. API keys are pulled from the backend environment when available.
          </p>
        )}
      </div>
    );
  };

  const disabled = true;

  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Distri</p>
          <h2 className="text-xl font-semibold">{title}</h2>
        </div>
        <div className="flex items-center gap-2">
          {meta && <MetaRow meta={meta} />}

        </div>
      </div>

      {error && (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      )}

      {!draft && loading && (
        <Card>
          <CardContent className="space-y-3 p-4">
            <Skeleton className="h-6 w-1/3" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </CardContent>
        </Card>
      )}

      {draft && (
        <>
          <Card>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <FieldLabel>Name</FieldLabel>
                <Input
                  value={draft.name}
                  onChange={(e) => setDraft((curr) => (curr ? { ...curr, name: e.target.value } : curr))}
                  placeholder="browsr"
                  disabled={disabled}
                />
              </div>
              <div className="space-y-2">
                <FieldLabel>Version</FieldLabel>
                <Input
                  value={draft.version}
                  onChange={(e) => setDraft((curr) => (curr ? { ...curr, version: e.target.value } : curr))}
                  placeholder="0.1.0"
                  disabled={disabled}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Default model</CardTitle>
              <CardDescription>Used for most agent calls unless a definition overrides it.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <FieldLabel>Provider</FieldLabel>
                <Select
                  value={providerName}
                  onValueChange={(value) => updateProvider('model_settings', value as ModelProviderName)}
                  disabled={disabled}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose provider" />
                  </SelectTrigger>
                  <SelectContent>
                    {providerOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        <div className="flex items-center justify-between gap-2">
                          <span>{option.label}</span>
                          {option.hint && <span className="text-xs text-muted-foreground">{option.hint}</span>}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <FieldLabel>Model ID</FieldLabel>
                <Input
                  value={draft.model_settings?.model || ''}
                  onChange={(e) => updateModelSetting('model_settings', 'model', e.target.value)}
                  placeholder="gpt-4.1-mini"
                  disabled={disabled}
                />
              </div>
              <div className="space-y-2">
                <FieldLabel>Temperature</FieldLabel>
                <Input
                  type="number"
                  step="0.1"
                  min="0"
                  max="2"
                  value={draft.model_settings?.temperature ?? 0}
                  onChange={(e) =>
                    updateModelSetting('model_settings', 'temperature', Number.parseFloat(e.target.value))
                  }
                  disabled={disabled}
                />
              </div>
              <div className="space-y-2">
                <FieldLabel>Max tokens</FieldLabel>
                <Input
                  type="number"
                  min="1"
                  value={draft.model_settings?.max_tokens ?? 0}
                  onChange={(e) => updateModelSetting('model_settings', 'max_tokens', Number(e.target.value))}
                  disabled={disabled}
                />
              </div>
              <div className="space-y-2">
                <FieldLabel>Context size</FieldLabel>
                <Input
                  type="number"
                  min="1024"
                  step="512"
                  value={draft.model_settings?.context_size ?? 0}
                  onChange={(e) => updateModelSetting('model_settings', 'context_size', Number(e.target.value))}
                  disabled={disabled}
                />
              </div>
              <div className="space-y-2">
                <FieldLabel>Top P</FieldLabel>
                <Input
                  type="number"
                  min="0"
                  max="1"
                  step="0.05"
                  value={draft.model_settings?.top_p ?? 1}
                  onChange={(e) => updateModelSetting('model_settings', 'top_p', Number.parseFloat(e.target.value))}
                  disabled={disabled}
                />
              </div>
              {renderProviderExtras(draft.model_settings)}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-3">
              <div>
                <CardTitle>Analysis model</CardTitle>
                <CardDescription>Optional lighter model for planning and summaries.</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="analysis-toggle"
                  checked={useCustomAnalysis}
                  onCheckedChange={(checked) => {
                    const active = Boolean(checked);
                    setUseCustomAnalysis(active);
                    if (!active) {
                      setDraft((current) => (current ? { ...current, analysis_model_settings: undefined } : current));
                    } else {
                      setDraft((current) =>
                        current
                          ? {
                            ...current,
                            analysis_model_settings: defaultModelSettings(
                              current.analysis_model_settings || current.model_settings,
                            ),
                          }
                          : current,
                      );
                    }
                  }}
                  disabled={loading}
                />
                <label htmlFor="analysis-toggle" className="text-sm text-muted-foreground">
                  Use dedicated analysis settings
                </label>
              </div>
            </CardHeader>
            {useCustomAnalysis && (
              <CardContent className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <FieldLabel>Provider</FieldLabel>
                  <Select
                    value={analysisProviderName}
                    onValueChange={(value) => updateProvider('analysis_model_settings', value as ModelProviderName)}
                    disabled={disabled}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose provider" />
                    </SelectTrigger>
                    <SelectContent>
                      {providerOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          <div className="flex items-center justify-between gap-2">
                            <span>{option.label}</span>
                            {option.hint && <span className="text-xs text-muted-foreground">{option.hint}</span>}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <FieldLabel>Model ID</FieldLabel>
                  <Input
                    value={draft.analysis_model_settings?.model || ''}
                    onChange={(e) => updateModelSetting('analysis_model_settings', 'model', e.target.value)}
                    placeholder="gpt-4.1-mini"
                    disabled={disabled}
                  />
                </div>
                <div className="space-y-2">
                  <FieldLabel>Temperature</FieldLabel>
                  <Input
                    type="number"
                    step="0.1"
                    min="0"
                    max="2"
                    value={draft.analysis_model_settings?.temperature ?? 0}
                    onChange={(e) =>
                      updateModelSetting('analysis_model_settings', 'temperature', Number.parseFloat(e.target.value))
                    }
                    disabled={disabled}
                  />
                </div>
                <div className="space-y-2">
                  <FieldLabel>Max tokens</FieldLabel>
                  <Input
                    type="number"
                    min="1"
                    value={draft.analysis_model_settings?.max_tokens ?? 0}
                    onChange={(e) => updateModelSetting('analysis_model_settings', 'max_tokens', Number(e.target.value))}
                    disabled={disabled}
                  />
                </div>
                <div className="space-y-2">
                  <FieldLabel>Context size</FieldLabel>
                  <Input
                    type="number"
                    min="1024"
                    step="512"
                    value={draft.analysis_model_settings?.context_size ?? 0}
                    onChange={(e) =>
                      updateModelSetting('analysis_model_settings', 'context_size', Number(e.target.value))
                    }
                    disabled={disabled}
                  />
                </div>
                <div className="space-y-2">
                  <FieldLabel>Top P</FieldLabel>
                  <Input
                    type="number"
                    min="0"
                    max="1"
                    step="0.05"
                    value={draft.analysis_model_settings?.top_p ?? 1}
                    onChange={(e) =>
                      updateModelSetting('analysis_model_settings', 'top_p', Number.parseFloat(e.target.value))
                    }
                    disabled={disabled}
                  />
                </div>
                {renderProviderExtras(draft.analysis_model_settings, analysisProviderName)}
              </CardContent>
            )}
          </Card>
        </>
      )}
    </div>
  );
}
