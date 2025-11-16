import { useCallback, useMemo, useRef, useState } from 'react';
import Editor from '@monaco-editor/react';
import type { editor as MonacoEditorNS } from 'monaco-editor';
import { Button, Textarea, useTheme } from '@distri/react';
import { Loader2, Play, Sparkles } from 'lucide-react';
import { TOML_LANGUAGE, TOML_LANGUAGE_CONFIGURATION } from '../monaco/tomlLanguage';
type MonacoType = typeof import('monaco-editor');

type TestStatus = 'idle' | 'running' | 'success' | 'error';

export interface ScriptTestingPanelProps {
  title?: string;
  description?: string;
  defaultPayload?: string;
  resultPlaceholder?: string;
  onGenerate?: (currentPayload: string) => Promise<string | void> | string | void;
  onRun?: (payload: string) => Promise<string | void> | string | void;
  language?: string;
}

export const ScriptTestingPanel = ({
  title = 'Testing',
  description = 'Parameters (JSON)',
  defaultPayload = '{\n  "input": "sample"\n}',
  resultPlaceholder = 'Run a test to view results.',
  onGenerate,
  onRun,
  language = 'json',
}: ScriptTestingPanelProps) => {
  const theme = useTheme();
  const themeSetting = theme?.theme ?? 'system';
  const [payload, setPayload] = useState(defaultPayload);
  const [output, setOutput] = useState(resultPlaceholder);
  const [status, setStatus] = useState<TestStatus>('idle');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const monacoRegistered = useRef(false);

  const editorTheme = useMemo<'vs-dark' | 'vs-light'>(() => {
    if (themeSetting === 'light') return 'vs-light';
    if (themeSetting === 'dark') return 'vs-dark';
    if (typeof window === 'undefined') return 'vs-dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'vs-dark' : 'vs-light';
  }, [themeSetting]);

  const handleEditorBeforeMount = useCallback((monaco: MonacoType) => {
    if (language !== 'toml' || monacoRegistered.current) {
      return;
    }
    const alreadyRegistered = monaco.languages.getLanguages().some((lang) => lang.id === 'toml');
    if (!alreadyRegistered) {
      monaco.languages.register({ id: 'toml' });
    }
    monaco.languages.setMonarchTokensProvider('toml', TOML_LANGUAGE as any);
    monaco.languages.setLanguageConfiguration('toml', TOML_LANGUAGE_CONFIGURATION as any);
    monacoRegistered.current = true;
  }, [language]);

  const handleRun = useCallback(async () => {
    if (!onRun) {
      setStatus('error');
      setOutput('Connect a script runner to execute tests.');
      return;
    }
    setIsRunning(true);
    setError(null);
    setStatus('running');
    try {
      const result = await onRun(payload);
      if (typeof result === 'string') {
        setOutput(result);
      } else if (result === undefined) {
        setOutput('Test execution completed.');
      }
      setStatus('success');
    } catch (err) {
      setOutput('');
      setStatus('error');
      setError(err instanceof Error ? err.message : 'Failed to run test');
    } finally {
      setIsRunning(false);
    }
  }, [onRun, payload]);

  const handleEditorDidMount = useCallback((editor: MonacoEditorNS.IStandaloneCodeEditor, monacoInstance: MonacoType) => {
    editor.addCommand(monacoInstance.KeyMod.CtrlCmd | monacoInstance.KeyCode.KeyS, () => {
      void handleRun();
    });
  }, [handleRun]);

  const handleGenerate = useCallback(async () => {
    if (!onGenerate) {
      return;
    }
    setIsGenerating(true);
    setError(null);
    try {
      const generated = await onGenerate(payload);
      if (typeof generated === 'string') {
        setPayload(generated);
      }
      setStatus('idle');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate payload');
      setStatus('error');
    } finally {
      setIsGenerating(false);
    }
  }, [onGenerate, payload]);

  return (
    <div className="flex h-full flex-col gap-4 text-foreground">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-[0.35em] text-muted-foreground">{description}</p>
          <h3 className="text-base font-semibold">{title}</h3>
        </div>
        <Play className="h-4 w-4 text-muted-foreground" />
      </div>

      <div className="flex flex-col gap-3">
        <div className="overflow-hidden border border-border/70 bg-background">
          {typeof window !== 'undefined' ? (
            <Editor
              value={payload}
              language={language}
              theme={editorTheme}
              onChange={(value) => setPayload(value ?? '')}
              beforeMount={handleEditorBeforeMount}
              onMount={handleEditorDidMount}
              height="220px"
              options={{
                minimap: { enabled: false },
                fontSize: 12,
                scrollBeyondLastLine: false,
                lineNumbers: 'off',
                wordWrap: 'on',
                padding: { top: 12, bottom: 12 },
              }}
            />
          ) : (
            <Textarea
              value={payload}
              onChange={(event: React.ChangeEvent<HTMLTextAreaElement>) => setPayload(event.target.value)}
              rows={10}
              className="bg-transparent font-mono text-xs text-foreground"
            />
          )}
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            className="flex-1 gap-2"
            disabled={!onGenerate || isGenerating}
            onClick={handleGenerate}
          >
            {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {isGenerating ? 'Generating…' : 'Generate'}
          </Button>
          <Button className="flex-1 gap-2" disabled={isRunning} onClick={handleRun}>
            {isRunning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
            {isRunning ? 'Running…' : 'Run test'}
          </Button>
        </div>

        {error ? (
          <div className="border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
            {error}
          </div>
        ) : null}

        <div className="space-y-2">
          <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.25em] text-muted-foreground">
            <span>Output</span>
            <span
              className={[
                'rounded-full px-2 py-0.5 text-[10px] font-semibold',
                status === 'success'
                  ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                  : status === 'error'
                    ? 'bg-red-500/20 text-red-700 dark:text-red-200'
                    : status === 'running'
                      ? 'bg-blue-500/20 text-blue-700 dark:text-blue-300'
                      : 'bg-muted/40 text-muted-foreground',
              ].join(' ')}
            >
              {status === 'success' ? 'Ready' : status === 'error' ? 'Error' : status === 'running' ? 'Running' : 'Idle'}
            </span>
          </div>
          <div className="max-h-40 overflow-y-auto border border-border/70 bg-background p-3 text-[11px] text-muted-foreground">
            <pre className="whitespace-pre-wrap break-words font-mono text-xs">
              {output || resultPlaceholder}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScriptTestingPanel;
