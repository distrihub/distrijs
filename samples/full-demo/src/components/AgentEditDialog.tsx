import React, { useState, useEffect } from 'react';
import { X, Save, Bot, Plus, Trash2, AlertCircle } from 'lucide-react';
import { DistriAgent } from '@distri/react';
import { AgentCard } from '@distri/core';

interface AgentEditDialogProps {
  agent: DistriAgent;
  isOpen: boolean;
  onClose: () => void;
  onSave: (agent: DistriAgent) => Promise<void>;
}

interface ValidationError {
  field: string;
  message: string;
}

const AgentEditDialog: React.FC<AgentEditDialogProps> = ({ 
  agent, 
  isOpen, 
  onClose, 
  onSave 
}) => {
  const [formData, setFormData] = useState<AgentCard>({
    name: '',
    description: '',
    version: '',
    iconUrl: '',
    documentationUrl: '',
    url: '',
    capabilities: {
      streaming: false,
      pushNotifications: false,
      stateTransitionHistory: false,
      extensions: []
    },
    defaultInputModes: [],
    defaultOutputModes: [],
    skills: [],
    provider: {
      organization: '',
      url: ''
    }
  });

  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [loading, setLoading] = useState(false);
  const [schema, setSchema] = useState<any>(null);

  useEffect(() => {
    if (isOpen && agent) {
      // Initialize form with agent data
      setFormData({
        name: agent.name,
        description: agent.description,
        version: agent.card?.version || '',
        iconUrl: agent.card?.iconUrl || '',
        documentationUrl: agent.card?.documentationUrl || '',
        url: agent.card?.url || '',
        capabilities: {
          streaming: agent.card?.capabilities?.streaming || false,
          pushNotifications: agent.card?.capabilities?.pushNotifications || false,
          stateTransitionHistory: agent.card?.capabilities?.stateTransitionHistory || false,
          extensions: agent.card?.capabilities?.extensions || []
        },
        defaultInputModes: agent.card?.defaultInputModes || [],
        defaultOutputModes: agent.card?.defaultOutputModes || [],
        skills: agent.card?.skills || [],
        provider: {
          organization: agent.card?.provider?.organization || '',
          url: agent.card?.provider?.url || ''
        }
      });
      
      // Fetch schema for validation
      fetchSchema();
    }
  }, [isOpen, agent]);

  const fetchSchema = async () => {
    try {
      const response = await fetch(`/api/v1/agents/${agent.id}/schema`);
      if (response.ok) {
        const agentSchema = await response.json();
        setSchema(agentSchema);
      }
    } catch (error) {
      console.error('Failed to fetch agent schema:', error);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: ValidationError[] = [];

    // Required field validation
    if (!formData.name.trim()) {
      newErrors.push({ field: 'name', message: 'Name is required' });
    }

    if (!formData.description.trim()) {
      newErrors.push({ field: 'description', message: 'Description is required' });
    }

    // URL validation
    if (formData.url && !isValidUrl(formData.url)) {
      newErrors.push({ field: 'url', message: 'Please enter a valid URL' });
    }

    if (formData.iconUrl && !isValidUrl(formData.iconUrl)) {
      newErrors.push({ field: 'iconUrl', message: 'Please enter a valid icon URL' });
    }

    if (formData.documentationUrl && !isValidUrl(formData.documentationUrl)) {
      newErrors.push({ field: 'documentationUrl', message: 'Please enter a valid documentation URL' });
    }

    if (formData.provider?.url && !isValidUrl(formData.provider.url)) {
      newErrors.push({ field: 'provider.url', message: 'Please enter a valid provider URL' });
    }

    // Skills validation
    formData.skills?.forEach((skill, index) => {
      if (!skill.name.trim()) {
        newErrors.push({ field: `skills.${index}.name`, message: `Skill ${index + 1} name is required` });
      }
      if (!skill.description.trim()) {
        newErrors.push({ field: `skills.${index}.description`, message: `Skill ${index + 1} description is required` });
      }
    });

    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const isValidUrl = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const updatedAgent = {
        ...agent,
        name: formData.name,
        description: formData.description,
        card: formData
      };

      await onSave(updatedAgent);
      onClose();
    } catch (error) {
      console.error('Failed to save agent:', error);
      setErrors([{ field: 'general', message: 'Failed to save agent. Please try again.' }]);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => {
      const newData = { ...prev };
      
      // Handle nested field updates
      if (field.includes('.')) {
        const [parent, child] = field.split('.');
        if (parent === 'capabilities') {
          newData.capabilities = { ...newData.capabilities, [child]: value };
        } else if (parent === 'provider') {
          newData.provider = { ...newData.provider, [child]: value };
        }
      } else {
        // Handle top-level fields
        if (field === 'name') newData.name = value;
        else if (field === 'description') newData.description = value;
        else if (field === 'version') newData.version = value;
        else if (field === 'iconUrl') newData.iconUrl = value;
        else if (field === 'documentationUrl') newData.documentationUrl = value;
        else if (field === 'url') newData.url = value;
        else if (field === 'defaultInputModes') newData.defaultInputModes = value;
        else if (field === 'defaultOutputModes') newData.defaultOutputModes = value;
        else if (field === 'skills') newData.skills = value;
      }
      
      return newData;
    });

    // Clear field-specific errors
    setErrors(prev => prev.filter(error => error.field !== field));
  };

  const handleArrayChange = (field: string, values: string[]) => {
    setFormData(prev => ({ ...prev, [field]: values }));
  };

  const addSkill = () => {
    const newSkill: AgentSkill = {
      id: Date.now().toString(),
      name: '',
      description: '',
      tags: [],
      examples: []
    };
    setFormData(prev => ({
      ...prev,
      skills: [...(prev.skills || []), newSkill]
    }));
  };

  const removeSkill = (index: number) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills?.filter((_, i) => i !== index) || []
    }));
  };

  const updateSkill = (index: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills?.map((skill, i) => 
        i === index ? { ...skill, [field]: value } : skill
      ) || []
    }));
  };

  const getFieldError = (field: string) => {
    return errors.find(error => error.field === field)?.message;
  };

  const InputField = ({ label, field, type = 'text', required = false, placeholder = '' }: {
    label: string;
    field: string;
    type?: string;
    required?: boolean;
    placeholder?: string;
  }) => {
    const error = getFieldError(field);
    
    let value = '';
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      if (parent === 'capabilities') {
        const caps = formData.capabilities;
        if (child === 'streaming') value = caps?.streaming?.toString() || '';
        else if (child === 'pushNotifications') value = caps?.pushNotifications?.toString() || '';
        else if (child === 'stateTransitionHistory') value = caps?.stateTransitionHistory?.toString() || '';
      } else if (parent === 'provider') {
        const provider = formData.provider;
        if (child === 'organization') value = provider?.organization || '';
        else if (child === 'url') value = provider?.url || '';
      }
    } else {
      // Handle top-level fields
      if (field === 'name') value = formData.name || '';
      else if (field === 'description') value = formData.description || '';
      else if (field === 'version') value = formData.version || '';
      else if (field === 'iconUrl') value = formData.iconUrl || '';
      else if (field === 'documentationUrl') value = formData.documentationUrl || '';
      else if (field === 'url') value = formData.url || '';
    }

    return (
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
        {type === 'textarea' ? (
          <textarea
            value={value}
            onChange={(e) => handleInputChange(field, e.target.value)}
            placeholder={placeholder}
            rows={3}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              error ? 'border-red-500' : 'border-gray-300'
            }`}
          />
        ) : (
          <input
            type={type}
            value={value}
            onChange={(e) => handleInputChange(field, e.target.value)}
            placeholder={placeholder}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              error ? 'border-red-500' : 'border-gray-300'
            }`}
          />
        )}
        {error && (
          <p className="mt-1 text-sm text-red-600 flex items-center">
            <AlertCircle className="w-4 h-4 mr-1" />
            {error}
          </p>
        )}
      </div>
    );
  };

  const ArrayField = ({ label, field, placeholder = '' }: {
    label: string;
    field: string;
    placeholder?: string;
  }) => {
    let values: string[] = [];
    if (field === 'defaultInputModes') values = formData.defaultInputModes || [];
    else if (field === 'defaultOutputModes') values = formData.defaultOutputModes || [];
    
    const [newValue, setNewValue] = useState('');

    const addValue = () => {
      if (newValue.trim()) {
        handleArrayChange(field, [...values, newValue.trim()]);
        setNewValue('');
      }
    };

    const removeValue = (index: number) => {
      handleArrayChange(field, values.filter((_: any, i: number) => i !== index));
    };

    return (
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            value={newValue}
            onChange={(e) => setNewValue(e.target.value)}
            placeholder={placeholder}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            onKeyPress={(e) => e.key === 'Enter' && addValue()}
          />
          <button
            type="button"
            onClick={addValue}
            className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {values.map((value: string, index: number) => (
            <span
              key={index}
              className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 rounded-md text-sm"
            >
              {value}
              <button
                type="button"
                onClick={() => removeValue(index)}
                className="text-red-500 hover:text-red-700"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <Bot className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Edit Agent</h2>
              <p className="text-sm text-gray-500">Update agent configuration and settings</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* General Errors */}
          {errors.find(e => e.field === 'general') && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex">
                <AlertCircle className="h-5 w-5 text-red-400" />
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Error</h3>
                  <p className="text-sm text-red-700">{getFieldError('general')}</p>
                </div>
              </div>
            </div>
          )}

          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Basic Information</h3>
              <InputField label="Name" field="name" required placeholder="Enter agent name" />
              <InputField label="Description" field="description" type="textarea" required placeholder="Enter agent description" />
              <InputField label="Version" field="version" placeholder="1.0.0" />
              <InputField label="Icon URL" field="iconUrl" placeholder="https://example.com/icon.png" />
              <InputField label="Documentation URL" field="documentationUrl" placeholder="https://docs.example.com" />
              <InputField label="Agent URL" field="url" placeholder="https://agent.example.com" />
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Provider Information</h3>
              <InputField label="Organization" field="provider.organization" placeholder="Organization name" />
              <InputField label="Provider URL" field="provider.url" placeholder="https://provider.example.com" />
              
              <h3 className="text-lg font-medium text-gray-900 mt-6">Capabilities</h3>
              <div className="space-y-3">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.capabilities?.streaming || false}
                    onChange={(e) => handleInputChange('capabilities.streaming', e.target.checked)}
                    className="mr-2 h-4 w-4 text-blue-600 rounded border-gray-300"
                  />
                  <span className="text-sm text-gray-700">Streaming</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.capabilities?.pushNotifications || false}
                    onChange={(e) => handleInputChange('capabilities.pushNotifications', e.target.checked)}
                    className="mr-2 h-4 w-4 text-blue-600 rounded border-gray-300"
                  />
                  <span className="text-sm text-gray-700">Push Notifications</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.capabilities?.stateTransitionHistory || false}
                    onChange={(e) => handleInputChange('capabilities.stateTransitionHistory', e.target.checked)}
                    className="mr-2 h-4 w-4 text-blue-600 rounded border-gray-300"
                  />
                  <span className="text-sm text-gray-700">State Transition History</span>
                </label>
              </div>
            </div>
          </div>

          {/* Input/Output Modes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ArrayField 
              label="Input Modes" 
              field="defaultInputModes" 
              placeholder="text/plain, application/json, etc."
            />
            <ArrayField 
              label="Output Modes" 
              field="defaultOutputModes" 
              placeholder="text/plain, application/json, etc."
            />
          </div>

          {/* Skills */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Skills</h3>
              <button
                type="button"
                onClick={addSkill}
                className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm"
              >
                <Plus className="w-4 h-4" />
                Add Skill
              </button>
            </div>
            <div className="space-y-4">
              {formData.skills?.map((skill, index) => (
                <div key={skill.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-gray-900">Skill {index + 1}</h4>
                    <button
                      type="button"
                      onClick={() => removeSkill(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={skill.name}
                        onChange={(e) => updateSkill(index, 'name', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Skill name"
                      />
                      {getFieldError(`skills.${index}.name`) && (
                        <p className="mt-1 text-sm text-red-600 flex items-center">
                          <AlertCircle className="w-4 h-4 mr-1" />
                          {getFieldError(`skills.${index}.name`)}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Description <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        value={skill.description}
                        onChange={(e) => updateSkill(index, 'description', e.target.value)}
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Skill description"
                      />
                      {getFieldError(`skills.${index}.description`) && (
                        <p className="mt-1 text-sm text-red-600 flex items-center">
                          <AlertCircle className="w-4 h-4 mr-1" />
                          {getFieldError(`skills.${index}.description`)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end space-x-3 pt-6 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
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
        </form>
      </div>
    </div>
  );
};

export default AgentEditDialog;