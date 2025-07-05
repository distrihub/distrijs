import React, { useState, useEffect } from 'react';
import { X, Save, Bot, AlertCircle, Image as ImageIcon } from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { DistriAgent } from '@distri/core';

// Extended agent type for form editing
interface AgentFormData {
  system_prompt?: string;
  icon_url?: string;
  sub_agents?: string;
  mcp_servers?: any[];
  model_settings?: any;
  [key: string]: any; // allow dynamic access for read-only rendering
}

interface AgentEditFormProps {
  agent: DistriAgent;
  isOpen: boolean;
  onClose: () => void;
  onSave: (agent: DistriAgent) => Promise<void>;
}

interface ValidationError {
  field: string;
  message: string;
}

const DEFAULT_AVATAR = (
  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
    <Bot className="h-8 w-8 text-blue-500" />
  </div>
);

const getFormData = (agent: DistriAgent) => {
  return {
    ...agent,
    system_prompt: agent.system_prompt || '',
    icon_url: agent.icon_url || '',
    skills: agent.skills?.join('\n') || '',
    name: agent.name || '',
    description: agent.description || '',
    sub_agents: agent.sub_agents?.join('\n') || '',
    mcp_servers: agent.mcp_servers?.map((srv) => ({
      name: srv.name,
      filter: srv.filter?.join('\n') || '',
    })),
    model_settings: agent.model_settings,
  };
};

const getAgentData = (agent: DistriAgent, formData: AgentFormData) => {
  const sub_agents = formData.sub_agents
    ? (typeof formData.sub_agents === 'string'
      ? formData.sub_agents.split('\n').map((l: string) => l.trim()).filter(Boolean)
      : formData.sub_agents)
    : [];

  // Prepare mcp_servers filters as arrays
  const mcp_servers = (formData.mcp_servers || []).map((srv: any) => ({
    ...srv,
    filter: srv.filter ? srv.filter.split('\n').map((l: string) => l.trim()).filter(Boolean) : [],
  }));
  // Prepare model_settings
  const model_settings = {
    ...formData.model_settings,
    model_provider: formData.model_settings?.model_provider,
  };
  return {
    ...agent,
    ...formData,
    name: formData.name || '',
    description: formData.description || '',
    system_prompt: formData.system_prompt || '',
    icon_url: formData.icon_url || '',
    sub_agents: sub_agents,
    model_settings: model_settings,
    mcp_servers: mcp_servers,
  };
};
const AgentEditForm: React.FC<AgentEditFormProps> = ({
  agent,
  isOpen,
  onClose,
  onSave,
}) => {
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [agentData, setAgentData] = useState<DistriAgent>(agent);
  const [loading, setLoading] = useState(false);
  const [iconDialogOpen, setIconDialogOpen] = useState(false);
  const [iconInput, setIconInput] = useState(agent.icon_url || '');
  const [mode, setMode] = useState<'ui' | 'raw'>('ui');
  const [rawError, setRawError] = useState<string | null>(null);

  const formData = getFormData(agentData);
  const rawValue = JSON.stringify(agentData, null, 2);

  useEffect(() => {
    if (isOpen) {
      setErrors([]);
      setIconInput(agent.icon_url || '');
      setRawError(null);
      setMode('ui');
    }
  }, [isOpen, agent]);

  const setFormData = ((prev: AgentFormData) => {
    setAgentData(getAgentData(agentData, prev));
  });

  // --- Field Handlers ---
  const handleFieldChange = (field: string, value: any) => {
    setFormData((prev: AgentFormData) => ({ ...prev, [field]: value }));
    setErrors((prev) => prev.filter((e) => e.field !== field));
  };

  // --- Validation ---
  const validate = () => {
    const newErrors: ValidationError[] = [];
    if (!formData.name || typeof formData.name !== 'string' || !formData.name.trim()) {
      newErrors.push({ field: 'name', message: 'Name is required' });
    }
    if (formData.icon_url) {
      try {
        new URL(formData.icon_url);
      } catch {
        newErrors.push({ field: 'icon_url', message: 'Must be a valid URL' });
      }
    }
    if (formData.sub_agents) {
      const lines = formData.sub_agents.split('\n').map((l: string) => l.trim()).filter(Boolean);
      if (lines.some((l: string) => !l)) {
        newErrors.push({ field: 'sub_agents', message: 'Each agent must be a non-empty name' });
      }
    }
    if (Array.isArray(formData.mcp_servers)) {
      formData.mcp_servers.forEach((srv: any, idx: number) => {
        if (!srv.name || typeof srv.name !== 'string') {
          newErrors.push({ field: `mcp_servers.${idx}.name`, message: 'Name is required' });
        }
      });
    }
    if (formData.model_settings) {
      const provider = formData.model_settings?.provider;
      if (!provider || !provider.provider) {
        newErrors.push({ field: 'model_settings.model_provider', message: 'Provider is required' });
      }
      if (provider.provider === 'aigateway') {
        const v = provider.value || {};
        if (!v.base_url) newErrors.push({ field: 'model_settings.model_provider.value.base_url', message: 'Base URL required' });
        if (!v.api_key) newErrors.push({ field: 'model_settings.model_provider.value.api_key', message: 'API Key required' });
        if (!v.project_id) newErrors.push({ field: 'model_settings.model_provider.value.project_id', message: 'Project ID required' });
      }
    }
    setErrors(newErrors);
    return newErrors.length === 0;
  };

  // --- Submit ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);


    try {
      await onSave(agentData);
      onClose();
    } catch (err) {
      setErrors([{ field: 'general', message: 'Failed to save agent. Please try again.' }]);
    } finally {
      setLoading(false);
    }

  };

  // --- Renderers ---
  const getFieldError = (field: string) => errors.find((e) => e.field === field)?.message;

  // --- MCP Servers UI ---
  const handleMcpServerChange = (idx: number, key: string, value: any) => {
    setFormData((prev: AgentFormData) => {
      const mcp_servers = [...(prev.mcp_servers || [])];
      mcp_servers[idx] = { ...mcp_servers[idx], [key]: value };
      return { ...prev, mcp_servers };
    });
    setErrors((prev) => prev.filter((e) => !e.field.startsWith(`mcp_servers.${idx}`)));
  };
  const addMcpServer = () => {
    setFormData((prev: AgentFormData) => ({ ...prev, mcp_servers: [...(prev.mcp_servers || []), { name: '', filter: '' }] }));
  };
  const removeMcpServer = (idx: number) => {
    setFormData((prev: AgentFormData) => {
      const mcp_servers = [...(prev.mcp_servers || [])];
      mcp_servers.splice(idx, 1);
      return { ...prev, mcp_servers };
    });
  };

  // --- Icon Dialog ---
  const openIconDialog = () => {
    setIconInput(formData.icon_url || '');
    setIconDialogOpen(true);
  };
  const closeIconDialog = () => {
    setIconDialogOpen(false);
  };
  const saveIconUrl = () => {
    handleFieldChange('icon_url', iconInput);
    setIconDialogOpen(false);
  };

  // --- Raw mode handlers ---
  const handleRawChange = (value: string) => {
    try {
      const parsed = JSON.parse(value);
      setAgentData(parsed);
      setRawError(null);
    } catch (err) {
      setRawError('Invalid JSON');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-5xl max-h-[96vh] overflow-y-auto flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-8 border-b">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
              <Bot className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-gray-900">Edit Agent</h2>
              <p className="text-base text-gray-500">Update agent configuration</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {/* Mode Toggle */}
            <button
              type="button"
              className={`px-3 py-1 rounded-t-md border-b-2 ${mode === 'ui' ? 'border-blue-600 text-blue-700 font-semibold bg-blue-50' : 'border-transparent text-gray-500 bg-gray-100'}`}
              onClick={() => setMode('ui')}
            >
              UI
            </button>
            <button
              type="button"
              className={`px-3 py-1 rounded-t-md border-b-2 ${mode === 'raw' ? 'border-blue-600 text-blue-700 font-semibold bg-blue-50' : 'border-transparent text-gray-500 bg-gray-100'}`}
              onClick={() => setMode('raw')}
            >
              Raw
            </button>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 ml-4">
              <X className="h-7 w-7" />
            </button>
          </div>
        </div>
        {/* Content */}
        <div className="flex-1 overflow-y-auto min-h-[500px] max-h-[calc(96vh-180px)] px-8 pb-8 pt-6 flex flex-col">
          {mode === 'raw' ? (
            <div className="flex-1 flex flex-col">
              <label className="block text-sm font-medium text-gray-700 mb-2 mt-4">Agent JSON Configuration</label>
              <SyntaxHighlighter language="json" style={oneDark}>
                {rawValue}
              </SyntaxHighlighter>
              {rawError && <p className="text-xs text-red-600 mt-1">{rawError}</p>}
            </div>
          ) : (
            <form className="flex-1 flex flex-col space-y-8" onSubmit={handleSubmit}>
              {errors.find((e) => e.field === 'general') && (
                <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
                  <div className="flex">
                    <AlertCircle className="h-5 w-5 text-red-400" />
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-red-800">Error</h3>
                      <p className="text-sm text-red-700">{getFieldError('general')}</p>
                    </div>
                  </div>
                </div>
              )}
              {/* Row: Avatar, Name, Description */}
              <div className="flex flex-col md:flex-row md:items-center md:space-x-8 space-y-4 md:space-y-0">
                {/* Avatar/Icon */}
                <div className="flex flex-col items-center space-y-2">
                  <button type="button" onClick={openIconDialog} className="focus:outline-none group">
                    {formData.icon_url ? (
                      <img
                        src={formData.icon_url as string}
                        alt="icon preview"
                        className="w-16 h-16 rounded-full border object-cover group-hover:opacity-80"
                        onError={(e) => (e.currentTarget.style.display = 'none')}
                      />
                    ) : (
                      DEFAULT_AVATAR
                    )}
                    <span className="text-xs text-blue-600 mt-1 flex items-center"><ImageIcon className="w-4 h-4 mr-1" />Change</span>
                  </button>
                </div>
                {/* Name and Description */}
                <div className="flex-1 flex flex-col md:flex-row md:space-x-4 space-y-2 md:space-y-0">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700">Name</label>
                    <input
                      type="text"
                      className="mt-1 block w-full border rounded-md p-2"
                      value={formData.name || ''}
                      onChange={(e) => handleFieldChange('name', e.target.value)}
                      required
                    />
                    {getFieldError('name') && <p className="text-xs text-red-600 mt-1">{getFieldError('name')}</p>}
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700">Description</label>
                    <textarea
                      rows={2}
                      className="mt-1 block w-full border rounded-md p-2"
                      value={formData.description || ''}
                      onChange={(e) => handleFieldChange('description', e.target.value)}
                    />
                  </div>
                </div>
              </div>
              {/* Icon URL Dialog */}
              {iconDialogOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
                  <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-xs flex flex-col items-center">
                    <h3 className="text-lg font-semibold mb-2">Set Icon URL</h3>
                    <input
                      type="text"
                      className="w-full border rounded-md p-2 mb-2"
                      value={iconInput}
                      onChange={(e) => setIconInput(e.target.value)}
                      placeholder="https://..."
                    />
                    {iconInput && (
                      <img
                        src={iconInput}
                        alt="icon preview"
                        className="w-16 h-16 rounded-full border object-cover mb-2"
                        onError={(e) => (e.currentTarget.style.display = 'none')}
                      />
                    )}
                    <div className="flex space-x-2 mt-2">
                      <button type="button" className="px-3 py-1 rounded bg-gray-200" onClick={closeIconDialog}>Cancel</button>
                      <button type="button" className="px-3 py-1 rounded bg-blue-600 text-white" onClick={saveIconUrl}>Save</button>
                    </div>
                  </div>
                </div>
              )}
              {/* System Prompt */}
              <div>
                <label className="block text-sm font-medium text-gray-700">System Prompt</label>
                <textarea
                  rows={10}
                  className="mt-1 block w-full border rounded-md p-2 font-mono"
                  value={formData.system_prompt || ''}
                  onChange={(e) => handleFieldChange('system_prompt', e.target.value)}
                />
              </div>
              {/* Skills */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Skills (one per line)</label>
                <textarea
                  rows={6}
                  className="mt-1 block w-full border rounded-md p-2"
                  value={Array.isArray(formData.skills) ? formData.skills.join('\n') : formData.skills || ''}
                  onChange={(e) => handleFieldChange('skills', e.target.value)}
                  placeholder="Define skills one per line"
                />
              </div>
              {/* Sub Agents */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Sub Agents (one per line)</label>
                <textarea
                  rows={3}
                  className="mt-1 block w-full border rounded-md p-2"
                  value={Array.isArray(formData.sub_agents) ? formData.sub_agents.join('\n') : formData.sub_agents || ''}
                  onChange={(e) => handleFieldChange('sub_agents', e.target.value)}
                  placeholder="Define sub-agents one per line"
                />
                {getFieldError('sub_agents') && <p className="text-xs text-red-600 mt-1">{getFieldError('sub_agents')}</p>}
              </div>
              {/* MCP Servers */}
              <div>
                <label className="block text-sm font-medium text-gray-700">MCP Servers</label>
                <div className="space-y-2">
                  {(formData.mcp_servers || []).map((srv: any, idx: number) => (
                    <div key={idx} className="flex items-start space-x-2">
                      <input
                        type="text"
                        className="border rounded-md p-2 w-1/3"
                        placeholder="Name"
                        value={srv.name || ''}
                        onChange={(e) => handleMcpServerChange(idx, 'name', e.target.value)}
                      />
                      <textarea
                        className="border rounded-md p-2 w-2/3"
                        placeholder="Filter (one per line)"
                        rows={2}
                        value={Array.isArray(srv.filter) ? srv.filter.join('\n') : srv.filter || ''}
                        onChange={(e) => handleMcpServerChange(idx, 'filter', e.target.value)}
                      />
                      <button type="button" className="text-red-500" onClick={() => removeMcpServer(idx)}>
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  <button type="button" className="text-blue-600 text-sm" onClick={addMcpServer}>
                    + Add MCP Server
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
        {/* Save/Cancel always visible at bottom */}
        <div className="flex items-center justify-end space-x-3 pt-6 border-t mt-6 px-8 pb-8 bg-white">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={loading || (mode === 'raw' && !!rawError)}
            onClick={async (e: React.MouseEvent<HTMLButtonElement>) => {
              e.preventDefault();
              await handleSubmit(e);
            }}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save Agent</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div >
  );
};

export default AgentEditForm;