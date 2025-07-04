import React, { useState, useEffect } from 'react';
import { X, Save, Bot, AlertCircle } from 'lucide-react';
import { DistriAgent } from '@distri/react';
import { useAgentSchema } from '../hooks/useAgentSchema';

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

const AgentEditForm: React.FC<AgentEditFormProps> = ({ 
  agent, 
  isOpen, 
  onClose, 
  onSave 
}) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    version: '',
    iconUrl: '',
    documentationUrl: '',
    url: '',
    streaming: false,
    pushNotifications: false,
    stateTransitionHistory: false,
    organization: '',
    providerUrl: ''
  });

  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [loading, setLoading] = useState(false);
  const { schema, validateForm: validateWithSchema } = useAgentSchema(agent?.id || null);

  useEffect(() => {
    if (isOpen && agent) {
      setFormData({
        name: agent.name || '',
        description: agent.description || '',
        version: agent.card?.version || '',
        iconUrl: agent.card?.iconUrl || '',
        documentationUrl: agent.card?.documentationUrl || '',
        url: agent.card?.url || '',
        streaming: agent.card?.capabilities?.streaming || false,
        pushNotifications: agent.card?.capabilities?.pushNotifications || false,
        stateTransitionHistory: agent.card?.capabilities?.stateTransitionHistory || false,
        organization: agent.card?.provider?.organization || '',
        providerUrl: agent.card?.provider?.url || ''
      });
    }
  }, [isOpen, agent]);

  const validateForm = (): boolean => {
    const newErrors: ValidationError[] = [];

    // Use schema-based validation if available
    if (schema && validateWithSchema) {
      const schemaErrors = validateWithSchema(formData);
      for (const [field, message] of Object.entries(schemaErrors)) {
        newErrors.push({ field, message });
      }
    } else {
      // Fall back to manual validation
      if (!formData.name.trim()) {
        newErrors.push({ field: 'name', message: 'Name is required' });
      }

      if (!formData.description.trim()) {
        newErrors.push({ field: 'description', message: 'Description is required' });
      }

      if (formData.url && !isValidUrl(formData.url)) {
        newErrors.push({ field: 'url', message: 'Please enter a valid URL' });
      }

      if (formData.iconUrl && !isValidUrl(formData.iconUrl)) {
        newErrors.push({ field: 'iconUrl', message: 'Please enter a valid icon URL' });
      }

      if (formData.documentationUrl && !isValidUrl(formData.documentationUrl)) {
        newErrors.push({ field: 'documentationUrl', message: 'Please enter a valid documentation URL' });
      }

      if (formData.providerUrl && !isValidUrl(formData.providerUrl)) {
        newErrors.push({ field: 'providerUrl', message: 'Please enter a valid provider URL' });
      }
    }

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
      const updatedAgent: DistriAgent = {
        ...agent,
        name: formData.name,
        description: formData.description,
        card: {
          ...agent.card,
          name: formData.name,
          description: formData.description,
          version: formData.version || undefined,
          iconUrl: formData.iconUrl || undefined,
          documentationUrl: formData.documentationUrl || undefined,
          url: formData.url || undefined,
          capabilities: {
            ...agent.card?.capabilities,
            streaming: formData.streaming,
            pushNotifications: formData.pushNotifications,
            stateTransitionHistory: formData.stateTransitionHistory
          },
          provider: formData.organization || formData.providerUrl ? {
            organization: formData.organization || 'Unknown',
            url: formData.providerUrl || ''
          } : undefined
        }
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
    setFormData(prev => ({ ...prev, [field]: value }));
    setErrors(prev => prev.filter(error => error.field !== field));
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
    const value = (formData as any)[field] || '';

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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <Bot className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Edit Agent</h2>
              <p className="text-sm text-gray-500">Update agent configuration</p>
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
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Basic Information</h3>
            <InputField label="Name" field="name" required placeholder="Enter agent name" />
            <InputField label="Description" field="description" type="textarea" required placeholder="Enter agent description" />
            <InputField label="Version" field="version" placeholder="1.0.0" />
            <InputField label="Icon URL" field="iconUrl" placeholder="https://example.com/icon.png" />
            <InputField label="Documentation URL" field="documentationUrl" placeholder="https://docs.example.com" />
            <InputField label="Agent URL" field="url" placeholder="https://agent.example.com" />
          </div>

          {/* Provider Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Provider Information</h3>
            <InputField label="Organization" field="organization" placeholder="Organization name" />
            <InputField label="Provider URL" field="providerUrl" placeholder="https://provider.example.com" />
          </div>

          {/* Capabilities */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Capabilities</h3>
            <div className="space-y-3">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.streaming}
                  onChange={(e) => handleInputChange('streaming', e.target.checked)}
                  className="mr-2 h-4 w-4 text-blue-600 rounded border-gray-300"
                />
                <span className="text-sm text-gray-700">Streaming</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.pushNotifications}
                  onChange={(e) => handleInputChange('pushNotifications', e.target.checked)}
                  className="mr-2 h-4 w-4 text-blue-600 rounded border-gray-300"
                />
                <span className="text-sm text-gray-700">Push Notifications</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.stateTransitionHistory}
                  onChange={(e) => handleInputChange('stateTransitionHistory', e.target.checked)}
                  className="mr-2 h-4 w-4 text-blue-600 rounded border-gray-300"
                />
                <span className="text-sm text-gray-700">State Transition History</span>
              </label>
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

export default AgentEditForm;