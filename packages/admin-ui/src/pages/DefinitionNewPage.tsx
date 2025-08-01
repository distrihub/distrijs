import React, { useState } from 'react';
import Editor from '@monaco-editor/react';
import { Bot, MessageSquare, Info, Save, Play } from 'lucide-react';
import { Button } from '../components/ui/button';
import * as yaml from 'js-yaml';
import { DistriAgent } from '@distri/core';

const defaultYaml = `name: my-agent
description: "A helpful AI assistant that can perform various tasks"

system_prompt: |
  You are a helpful AI assistant. You can help users with:
  - Answering questions
  - Providing information
  - Performing tasks using available tools
  
  Always be helpful, accurate, and concise in your responses.

llm:
  provider: "openai"
  model: "gpt-4"
  temperature: 0.7
  max_tokens: 1000

tools:
  - name: example_tool
    description: "An example tool"
`;

type ViewMode = 'details' | 'chat';

export function DefinitionNewPage() {
  const [yamlContent, setYamlContent] = useState(defaultYaml);
  const [viewMode, setViewMode] = useState<ViewMode>('details');
  const [parsedAgent, setParsedAgent] = useState<DistriAgent | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);

  const parseYaml = (content: string) => {
    try {
      const parsed = yaml.load(content) as any;
      if (parsed && typeof parsed === 'object') {
        const agent: DistriAgent = {
          id: parsed.name || 'untitled',
          name: parsed.name || 'Untitled Agent',
          description: parsed.description,
          system_prompt: parsed.system_prompt,
          model_settings: parsed.llm ? {
            provider: parsed.llm.provider || 'openai',
            model: parsed.llm.model || 'gpt-4',
            temperature: parsed.llm.temperature || 0.7,
            max_tokens: parsed.llm.max_tokens || 1000,
            top_p: 1,
            frequency_penalty: 0,
            presence_penalty: 0,
            max_iterations: 10,
          } : undefined,
          version: parsed.version,
          mcp_servers: parsed.mcp_servers,
        };
        setParsedAgent(agent);
        setParseError(null);
      } else {
        setParseError('Invalid YAML structure');
        setParsedAgent(null);
      }
    } catch (error) {
      setParseError(error instanceof Error ? error.message : 'YAML parsing error');
      setParsedAgent(null);
    }
  };

  React.useEffect(() => {
    parseYaml(yamlContent);
  }, [yamlContent]);

  const handleSave = () => {
    if (parsedAgent) {
      console.log('Saving agent:', parsedAgent);
      // TODO: Implement save functionality
      alert('Save functionality not implemented yet');
    }
  };

  const renderDetails = () => {
    if (!parsedAgent) {
      return (
        <div className="p-6 text-center">
          <div className="text-destructive mb-2">Invalid YAML</div>
          {parseError && (
            <div className="text-sm text-muted-foreground bg-destructive/10 p-3 rounded-md">
              {parseError}
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="p-6 space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-3">Agent Details</h3>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Name</label>
              <p className="mt-1 text-sm">{parsedAgent.name}</p>
            </div>
            {parsedAgent.description && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Description</label>
                <p className="mt-1 text-sm">{parsedAgent.description}</p>
              </div>
            )}
            {parsedAgent.version && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Version</label>
                <p className="mt-1 text-sm">{parsedAgent.version}</p>
              </div>
            )}
          </div>
        </div>

        {parsedAgent.model_settings && (
          <div>
            <h4 className="font-medium mb-3">Model Configuration</h4>
            <div className="bg-muted/50 p-4 rounded-lg space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Provider</span>
                <span className="text-sm font-mono">{parsedAgent.model_settings.provider}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Model</span>
                <span className="text-sm font-mono">{parsedAgent.model_settings.model}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Temperature</span>
                <span className="text-sm font-mono">{parsedAgent.model_settings.temperature}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Max Tokens</span>
                <span className="text-sm font-mono">{parsedAgent.model_settings.max_tokens}</span>
              </div>
            </div>
          </div>
        )}

        {parsedAgent.system_prompt && (
          <div>
            <h4 className="font-medium mb-3">System Prompt</h4>
            <div className="bg-muted/50 p-4 rounded-lg">
              <pre className="text-sm whitespace-pre-wrap font-mono">
                {parsedAgent.system_prompt}
              </pre>
            </div>
          </div>
        )}

        {parsedAgent.mcp_servers && parsedAgent.mcp_servers.length > 0 && (
          <div>
            <h4 className="font-medium mb-3">Tools & Capabilities</h4>
            <div className="space-y-2">
              {parsedAgent.mcp_servers.map((server, index) => (
                <div key={index} className="bg-muted/50 p-3 rounded-lg">
                  <div className="font-medium text-sm">{server.name || `Tool ${index + 1}`}</div>
                  {server.description && (
                    <div className="text-sm text-muted-foreground mt-1">{server.description}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderChat = () => {
    if (!parsedAgent) {
      return (
        <div className="p-6 text-center">
          <div className="text-muted-foreground">
            Fix YAML errors to enable chat testing
          </div>
        </div>
      );
    }

    return (
      <div className="p-6">
        <div className="text-center py-12">
          <MessageSquare className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">Chat Testing</h3>
          <p className="text-muted-foreground mb-4">
            Chat functionality will be available once the definition is saved
          </p>
          <Button onClick={handleSave} disabled={!parsedAgent}>
            <Save className="h-4 w-4 mr-2" />
            Save Definition First
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="h-full flex">
      {/* Left side - YAML Editor */}
      <div className="w-1/2 border-r border-border flex flex-col">
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Agent Definition (YAML)</h2>
            <Button onClick={handleSave} disabled={!parsedAgent} size="sm">
              <Save className="h-4 w-4 mr-2" />
              Save
            </Button>
          </div>
        </div>
        <div className="flex-1">
          <Editor
            height="100%"
            language="yaml"
            value={yamlContent}
            onChange={(value) => setYamlContent(value || '')}
            theme="vs-dark"
            options={{
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              fontSize: 14,
              lineNumbers: 'on',
              wordWrap: 'on',
              automaticLayout: true,
            }}
          />
        </div>
      </div>

      {/* Right side - Details/Chat */}
      <div className="w-1/2 flex flex-col">
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant={viewMode === 'details' ? 'default' : 'outline'}
              onClick={() => setViewMode('details')}
              className="flex items-center gap-2"
            >
              <Info className="h-4 w-4" />
              Details
            </Button>
            <Button
              size="sm"
              variant={viewMode === 'chat' ? 'default' : 'outline'}
              onClick={() => setViewMode('chat')}
              className="flex items-center gap-2"
            >
              <MessageSquare className="h-4 w-4" />
              Chat
            </Button>
          </div>
        </div>
        <div className="flex-1 overflow-auto">
          {viewMode === 'details' ? renderDetails() : renderChat()}
        </div>
      </div>
    </div>
  );
}