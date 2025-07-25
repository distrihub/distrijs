import React from 'react';
import { ThemeProvider } from './ThemeProvider';
import { ModeToggle } from './ModeToggle';
import { EmbeddableChat } from './EmbeddableChat';

export const DarkModeDemo: React.FC = () => {
  return (
    <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
      <div className="min-h-screen bg-background text-foreground">
        {/* Header with mode toggle */}
        <header className="border-b border-border">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <h1 className="text-2xl font-bold">Distri Chat - Dark Mode Demo</h1>
            <ModeToggle />
          </div>
        </header>

        {/* Main content */}
        <main className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Theme info */}
            <div className="space-y-6">
              <div className="bg-card p-6 rounded-lg border border-border">
                <h2 className="text-xl font-semibold mb-4">Theme System</h2>
                <p className="text-muted-foreground mb-4">
                  This demo showcases the shadcn/ui dark mode implementation with CSS variables.
                </p>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span>Background:</span>
                    <code className="bg-muted px-2 py-1 rounded">bg-background</code>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Card:</span>
                    <code className="bg-muted px-2 py-1 rounded">bg-card</code>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Muted:</span>
                    <code className="bg-muted px-2 py-1 rounded">bg-muted</code>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Input:</span>
                    <code className="bg-muted px-2 py-1 rounded">bg-input</code>
                  </div>
                </div>
              </div>

              <div className="bg-card p-6 rounded-lg border border-border">
                <h3 className="text-lg font-semibold mb-4">Features</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• System theme detection</li>
                  <li>• Persistent theme storage</li>
                  <li>• Smooth transitions</li>
                  <li>• CSS variables based</li>
                  <li>• shadcn/ui compatible</li>
                </ul>
              </div>
            </div>

            {/* Chat demo */}
            <div className="bg-card p-6 rounded-lg border border-border">
              <h2 className="text-xl font-semibold mb-4">Chat Demo</h2>
              <div className="h-96">
                <EmbeddableChat
                  agentId="demo-agent"
                  height="100%"
                  showAgentSelector={false}
                  placeholder="Try the dark mode toggle in the header!"
                />
              </div>
            </div>
          </div>
        </main>
      </div>
    </ThemeProvider>
  );
};
