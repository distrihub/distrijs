import { useState, useEffect } from 'react';

interface AgentSchemaField {
  type: string;
  required?: boolean;
  description?: string;
  format?: string;
  enum?: string[];
  properties?: Record<string, AgentSchemaField>;
}

interface AgentSchema {
  type: string;
  properties: Record<string, AgentSchemaField>;
  required?: string[];
}

export const useAgentSchema = (agentId: string | null) => {
  const [schema, setSchema] = useState<AgentSchema | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!agentId) {
      setSchema(null);
      return;
    }

    const fetchSchema = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const response = await fetch(`/api/v1/agents/${agentId}/schema`);
        
        if (!response.ok) {
          // If schema endpoint doesn't exist, return a default schema
          if (response.status === 404) {
            setSchema(getDefaultAgentSchema());
            return;
          }
          throw new Error(`Failed to fetch schema: ${response.statusText}`);
        }

        const fetchedSchema = await response.json();
        setSchema(fetchedSchema);
      } catch (err) {
        console.error('Failed to fetch agent schema:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch schema');
        // Fall back to default schema
        setSchema(getDefaultAgentSchema());
      } finally {
        setLoading(false);
      }
    };

    fetchSchema();
  }, [agentId]);

  const validateField = (fieldName: string, value: any): string | null => {
    if (!schema) return null;

    const field = schema.properties[fieldName];
    if (!field) return null;

    // Check required fields
    if (field.required && (!value || (typeof value === 'string' && !value.trim()))) {
      return `${fieldName} is required`;
    }

    // Check type validation
    if (value && field.type) {
      if (field.type === 'string' && typeof value !== 'string') {
        return `${fieldName} must be a string`;
      }
      if (field.type === 'number' && typeof value !== 'number') {
        return `${fieldName} must be a number`;
      }
      if (field.type === 'boolean' && typeof value !== 'boolean') {
        return `${fieldName} must be a boolean`;
      }
    }

    // Check format validation
    if (value && field.format) {
      if (field.format === 'uri' && typeof value === 'string') {
        try {
          new URL(value);
        } catch {
          return `${fieldName} must be a valid URL`;
        }
      }
      if (field.format === 'email' && typeof value === 'string') {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
          return `${fieldName} must be a valid email`;
        }
      }
    }

    // Check enum validation
    if (value && field.enum && !field.enum.includes(value)) {
      return `${fieldName} must be one of: ${field.enum.join(', ')}`;
    }

    return null;
  };

  const validateForm = (formData: Record<string, any>): Record<string, string> => {
    const errors: Record<string, string> = {};

    if (!schema) return errors;

    for (const [fieldName, value] of Object.entries(formData)) {
      const error = validateField(fieldName, value);
      if (error) {
        errors[fieldName] = error;
      }
    }

    return errors;
  };

  return {
    schema,
    loading,
    error,
    validateField,
    validateForm
  };
};

// Default schema for when the API doesn't provide one
const getDefaultAgentSchema = (): AgentSchema => ({
  type: 'object',
  properties: {
    name: {
      type: 'string',
      required: true,
      description: 'Agent name'
    },
    description: {
      type: 'string',
      required: true,
      description: 'Agent description'
    },
    version: {
      type: 'string',
      description: 'Agent version'
    },
    iconUrl: {
      type: 'string',
      format: 'uri',
      description: 'Agent icon URL'
    },
    documentationUrl: {
      type: 'string',
      format: 'uri',
      description: 'Agent documentation URL'
    },
    url: {
      type: 'string',
      format: 'uri',
      description: 'Agent URL'
    },
    organization: {
      type: 'string',
      description: 'Provider organization'
    },
    providerUrl: {
      type: 'string',
      format: 'uri',
      description: 'Provider URL'
    },
    streaming: {
      type: 'boolean',
      description: 'Streaming capability'
    },
    pushNotifications: {
      type: 'boolean',
      description: 'Push notifications capability'
    },
    stateTransitionHistory: {
      type: 'boolean',
      description: 'State transition history capability'
    }
  },
  required: ['name', 'description']
});