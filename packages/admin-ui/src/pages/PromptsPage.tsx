import React, { useState, useEffect } from 'react';
import { Plus, FileText, Edit, Trash2, Save, X } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';

interface PromptTemplate {
  id: string;
  name: string;
  description: string;
  template: string;
  variables: string[];
  type: 'cot' | 'react' | 'default';
  createdAt: string;
  updatedAt: string;
}

// Default prompt templates with common variables
const defaultTemplates: PromptTemplate[] = [
  {
    id: 'cot-default',
    name: 'Chain of Thought (CoT)',
    description: 'Step-by-step reasoning prompt template',
    template: `You are {{agent_name}}, {{agent_description}}.

Think step by step. For each problem:
1. Break it down into smaller parts
2. Solve each part systematically  
3. Combine the solutions

Available tools: {{available_tools}}
Current context: {{context}}

Let's think through this step by step:`,
    variables: ['agent_name', 'agent_description', 'available_tools', 'context'],
    type: 'cot',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'react-default', 
    name: 'ReAct (Reasoning + Acting)',
    description: 'Reasoning and acting prompt template',
    template: `You are {{agent_name}}, {{agent_description}}.

Use this format:
Thought: I need to understand what the user wants and plan my approach
Action: [tool_name] with parameters
Observation: [result from tool]
Thought: Based on the observation, I should...
Action: [next tool or response]

Available tools: {{available_tools}}
Context: {{context}}
User query: {{user_query}}

Let me help you with this:`,
    variables: ['agent_name', 'agent_description', 'available_tools', 'context', 'user_query'],
    type: 'react',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'default-template',
    name: 'Default Assistant',
    description: 'Basic assistant prompt template',
    template: `You are {{agent_name}}, {{agent_description}}.

You are helpful, harmless, and honest. Always:
- Provide accurate information
- Ask clarifying questions when needed
- Use available tools when appropriate
- Be concise but thorough

Available tools: {{available_tools}}
Context: {{context}}

How can I help you today?`,
    variables: ['agent_name', 'agent_description', 'available_tools', 'context'],
    type: 'default',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
];

export function PromptsPage() {
  const [prompts, setPrompts] = useState<PromptTemplate[]>([]);
  const [editingPrompt, setEditingPrompt] = useState<PromptTemplate | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // Load prompts from localStorage on component mount
  useEffect(() => {
    const stored = localStorage.getItem('distri-admin-prompts');
    if (stored) {
      try {
        setPrompts(JSON.parse(stored));
      } catch (error) {
        console.error('Error parsing stored prompts:', error);
        setPrompts(defaultTemplates);
      }
    } else {
      // First time - load default templates
      setPrompts(defaultTemplates);
    }
  }, []);

  // Save prompts to localStorage whenever prompts change
  useEffect(() => {
    localStorage.setItem('distri-admin-prompts', JSON.stringify(prompts));
  }, [prompts]);

  const createNewPrompt = () => {
    const newPrompt: PromptTemplate = {
      id: `prompt-${Date.now()}`,
      name: 'New Prompt',
      description: 'Description of the prompt',
      template: 'You are {{agent_name}}, {{agent_description}}.\n\n{{context}}',
      variables: ['agent_name', 'agent_description', 'context'],
      type: 'default',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setEditingPrompt(newPrompt);
    setIsCreating(true);
  };

  const savePrompt = (prompt: PromptTemplate) => {
    if (isCreating) {
      setPrompts(prev => [...prev, prompt]);
      setIsCreating(false);
    } else {
      setPrompts(prev => prev.map(p => p.id === prompt.id ? { ...prompt, updatedAt: new Date().toISOString() } : p));
    }
    setEditingPrompt(null);
  };

  const deletePrompt = (id: string) => {
    if (window.confirm('Are you sure you want to delete this prompt?')) {
      setPrompts(prev => prev.filter(p => p.id !== id));
    }
  };

  const cancelEdit = () => {
    setEditingPrompt(null);
    setIsCreating(false);
  };

  const parseVariables = (template: string): string[] => {
    const matches = template.match(/\{\{([^}]+)\}\}/g);
    if (!matches) return [];
    return Array.from(new Set(matches.map(match => match.slice(2, -2).trim())));
  };

  if (editingPrompt) {
    return (
      <div className="h-full p-6 bg-background">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold">
              {isCreating ? 'Create New Prompt' : 'Edit Prompt'}
            </h1>
            <div className="flex gap-2">
              <Button onClick={() => savePrompt(editingPrompt)} className="flex items-center gap-2">
                <Save className="h-4 w-4" />
                Save
              </Button>
              <Button variant="outline" onClick={cancelEdit} className="flex items-center gap-2">
                <X className="h-4 w-4" />
                Cancel
              </Button>
            </div>
          </div>

          <div className="grid gap-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Name</label>
                <Input
                  value={editingPrompt.name}
                  onChange={(e) => setEditingPrompt({ ...editingPrompt, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Type</label>
                <select
                  value={editingPrompt.type}
                  onChange={(e) => setEditingPrompt({ ...editingPrompt, type: e.target.value as any })}
                  className="w-full p-2 border border-input bg-background rounded-md"
                >
                  <option value="default">Default</option>
                  <option value="cot">Chain of Thought</option>
                  <option value="react">ReAct</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Description</label>
              <Input
                value={editingPrompt.description}
                onChange={(e) => setEditingPrompt({ ...editingPrompt, description: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Template</label>
              <textarea
                value={editingPrompt.template}
                onChange={(e) => {
                  const newTemplate = e.target.value;
                  const variables = parseVariables(newTemplate);
                  setEditingPrompt({ 
                    ...editingPrompt, 
                    template: newTemplate,
                    variables
                  });
                }}
                className="w-full h-64 p-3 border border-input bg-background rounded-md font-mono text-sm"
                placeholder="Enter your prompt template with variables like {{variable_name}}"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Variables ({editingPrompt.variables.length})
              </label>
              <div className="flex flex-wrap gap-2">
                {editingPrompt.variables.map(variable => (
                  <span
                    key={variable}
                    className="px-2 py-1 bg-muted text-muted-foreground rounded-md text-sm"
                  >
                    {variable}
                  </span>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Variables are automatically detected from {{"{{"}}variable_name{{"}}"}} patterns in the template
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full p-6 bg-background">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Prompt Templates</h1>
          <Button onClick={createNewPrompt} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            New Prompt
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {prompts.map((prompt) => (
            <div
              key={prompt.id}
              className="bg-card border border-border rounded-lg p-4 hover:border-border/80 transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold">{prompt.name}</h3>
                </div>
                <span className={`px-2 py-1 text-xs rounded-md ${
                  prompt.type === 'cot' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                  prompt.type === 'react' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                  'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                }`}>
                  {prompt.type.toUpperCase()}
                </span>
              </div>

              <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                {prompt.description}
              </p>

              <div className="mb-3">
                <p className="text-xs text-muted-foreground mb-1">
                  Variables ({prompt.variables.length}):
                </p>
                <div className="flex flex-wrap gap-1">
                  {prompt.variables.slice(0, 3).map(variable => (
                    <span
                      key={variable}
                      className="px-1.5 py-0.5 bg-muted text-muted-foreground rounded text-xs"
                    >
                      {variable}
                    </span>
                  ))}
                  {prompt.variables.length > 3 && (
                    <span className="px-1.5 py-0.5 bg-muted text-muted-foreground rounded text-xs">
                      +{prompt.variables.length - 3}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
                <span>Updated {new Date(prompt.updatedAt).toLocaleDateString()}</span>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setEditingPrompt(prompt)}
                  className="flex items-center gap-1"
                >
                  <Edit className="h-3 w-3" />
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => deletePrompt(prompt.id)}
                  className="flex items-center gap-1 text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-3 w-3" />
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </div>

        {prompts.length === 0 && (
          <div className="text-center py-12">
            <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No prompts yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first prompt template to get started
            </p>
            <Button onClick={createNewPrompt}>Create New Prompt</Button>
          </div>
        )}
      </div>
    </div>
  );
}