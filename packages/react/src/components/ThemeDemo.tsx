import React from 'react';
import { ThemeProvider } from './ThemeProvider';
import { ThemeDropdown } from './ThemeDropdown';
import { EmbeddableChat } from './EmbeddableChat';

export const ThemeDemo: React.FC = () => {
  return (
    <ThemeProvider defaultTheme="dark">
      <div className="h-screen flex flex-col">
        {/* Header with theme selector */}
        <div className="p-4 border-b border-gray-700 bg-gray-800">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <h1 className="text-xl font-semibold text-white">Distri Chat - Theme Demo</h1>
            <div className="w-48">
              <ThemeDropdown />
            </div>
          </div>
        </div>

        {/* Chat area */}
        <div className="flex-1">
          <EmbeddableChat
            agentId="demo-agent"
            height="100%"
            showAgentSelector={false}
            placeholder="Try the different themes using the dropdown above!"
          />
        </div>
      </div>
    </ThemeProvider>
  );
}; 