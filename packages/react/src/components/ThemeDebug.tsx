import React, { useEffect, useState } from 'react';
import { ThemeProvider, useTheme } from './ThemeProvider';
import { ModeToggle } from './ModeToggle';

const ThemeDebugContent: React.FC = () => {
  const { theme, setTheme } = useTheme();
  const [documentClasses, setDocumentClasses] = useState<string>('');
  const [cssVariables, setCssVariables] = useState<Record<string, string>>({});

  useEffect(() => {
    const updateDebugInfo = () => {
      const root = document.documentElement;
      setDocumentClasses(root.className);

      const computedStyle = getComputedStyle(root);
      const variables = {
        '--background': computedStyle.getPropertyValue('--background'),
        '--foreground': computedStyle.getPropertyValue('--foreground'),
        '--card': computedStyle.getPropertyValue('--card'),
        '--muted': computedStyle.getPropertyValue('--muted'),
        '--input': computedStyle.getPropertyValue('--input'),
        '--border': computedStyle.getPropertyValue('--border'),
      };
      setCssVariables(variables);
    };

    updateDebugInfo();
    const interval = setInterval(updateDebugInfo, 100);
    return () => clearInterval(interval);
  }, [theme]);

  return (
    <div className="min-h-screen bg-background text-foreground p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Theme Debug</h1>
          <ModeToggle />
        </div>

        {/* Debug Info */}
        <div className="bg-card p-6 rounded-lg border border-border">
          <h2 className="text-xl font-semibold mb-4">Debug Information</h2>
          <div className="space-y-4">
            <div>
              <strong>Current Theme State:</strong> {theme}
            </div>
            <div>
              <strong>Document Classes:</strong> {documentClasses || '(none)'}
            </div>
            <div>
              <strong>CSS Variables:</strong>
              <div className="mt-2 space-y-1 text-sm">
                {Object.entries(cssVariables).map(([key, value]) => (
                  <div key={key} className="flex justify-between">
                    <span className="font-mono">{key}:</span>
                    <span className="font-mono text-muted-foreground">{value || '(not set)'}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Manual Theme Controls */}
        <div className="bg-card p-6 rounded-lg border border-border">
          <h2 className="text-xl font-semibold mb-4">Manual Theme Controls</h2>
          <div className="flex gap-4">
            <button
              onClick={() => setTheme('light')}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            >
              Force Light
            </button>
            <button
              onClick={() => setTheme('dark')}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            >
              Force Dark
            </button>
            <button
              onClick={() => setTheme('system')}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            >
              System
            </button>
          </div>
        </div>

        {/* Visual Test */}
        <div className="bg-card p-6 rounded-lg border border-border">
          <h2 className="text-xl font-semibold mb-4">Visual Test</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-background p-4 rounded-lg border border-border">
              <h3 className="font-semibold mb-2">Background</h3>
              <p className="text-sm text-muted-foreground">This should change with theme</p>
            </div>
            <div className="bg-muted p-4 rounded-lg border border-border">
              <h3 className="font-semibold mb-2">Muted</h3>
              <p className="text-sm text-muted-foreground">This should change with theme</p>
            </div>
          </div>
        </div>

        {/* CSS Import Check */}
        <div className="bg-card p-6 rounded-lg border border-border">
          <h2 className="text-xl font-semibold mb-4">CSS Import Check</h2>
          <p className="text-muted-foreground">
            Make sure the themes.css file is being imported in your main component or app.
          </p>
          <div className="mt-4 p-4 bg-muted rounded-md">
            <code className="text-sm">
              import '../styles/themes.css';
            </code>
          </div>
        </div>
      </div>
    </div>
  );
};

export const ThemeDebug: React.FC = () => {
  return (
    <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
      <ThemeDebugContent />
    </ThemeProvider>
  );
}; 