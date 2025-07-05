import { useState, useEffect } from 'react';

// Hardcoded agent schema (cached in memory)
const HARDCODED_AGENT_SCHEMA = { "$schema": "http://json-schema.org/draft-07/schema#", "title": "AgentDefinition", "type": "object", "required": ["name"], "properties": { "description": { "description": "A brief description of the agent's purpose.", "default": "", "type": "string" }, "history_size": { "description": "The size of the history to maintain for the agent.", "default": 5, "type": ["integer", "null"], "format": "uint", "minimum": 0.0 }, "icon_url": { "description": "A2A-specific fields", "default": null, "type": ["string", "null"] }, "interval": { "description": "Indicates whether planning is enabled for the agent. How often to replan, specified in steps.", "default": 0, "type": "integer", "format": "int32" }, "max_iterations": { "description": "The maximum number of iterations allowed during planning.", "default": null, "type": ["integer", "null"], "format": "int32" }, "mcp_servers": { "description": "A list of MCP server definitions associated with the agent.", "default": [], "type": "array", "items": { "$ref": "#/definitions/McpDefinition" } }, "model_settings": { "description": "The model settings for the planning agent.", "default": { "model": "openai/gpt-4.1-mini", "temperature": 0.699999988079071, "max_tokens": 1000, "top_p": 1.0, "frequency_penalty": 0.0, "presence_penalty": 0.0, "max_iterations": 10, "model_provider": { "type": "aigateway", "value": { "base_url": null, "api_key": null, "project_id": null } }, "parameters": null, "response_format": null }, "allOf": [{ "$ref": "#/definitions/ModelSettings" }] }, "name": { "description": "The name of the agent.", "type": "string" }, "sub_agents": { "description": "List of sub-agents that this agent can transfer control to", "default": [], "type": "array", "items": { "type": "string" } }, "system_prompt": { "description": "The system prompt for the agent, if any.", "type": ["string", "null"] } }, "definitions": { "McpDefinition": { "type": "object", "required": ["name"], "properties": { "filter": { "description": "The filter applied to the tools in this MCP definition.", "default": null, "type": ["array", "null"], "items": { "type": "string" } }, "name": { "description": "The name of the MCP server.", "type": "string" }, "type": { "description": "The type of the MCP server (Tool or Agent).", "default": "tool", "allOf": [{ "$ref": "#/definitions/McpServerType" }] } }, "additionalProperties": false }, "McpServerType": { "type": "string", "enum": ["tool", "agent"] }, "ModelProvider": { "oneOf": [{ "type": "object", "required": ["type"], "properties": { "type": { "type": "string", "enum": ["openai"] } } }, { "type": "object", "required": ["type", "value"], "properties": { "type": { "type": "string", "enum": ["aigateway"] }, "value": { "type": "object", "properties": { "api_key": { "type": ["string", "null"] }, "base_url": { "type": ["string", "null"] }, "project_id": { "type": ["string", "null"] } } } } }] }, "ModelSettings": { "type": "object", "properties": { "frequency_penalty": { "default": 0.0, "type": "number", "format": "float" }, "max_iterations": { "default": 10, "type": "integer", "format": "uint32", "minimum": 0.0 }, "max_tokens": { "default": 1000, "type": "integer", "format": "uint32", "minimum": 0.0 }, "model": { "default": "gpt-4o-mini", "type": "string" }, "model_provider": { "default": { "type": "aigateway", "value": { "base_url": null, "api_key": null, "project_id": null } }, "allOf": [{ "$ref": "#/definitions/ModelProvider" }] }, "parameters": { "description": "Additional parameters for the agent, if any.", "default": null }, "presence_penalty": { "default": 0.0, "type": "number", "format": "float" }, "response_format": { "description": "The format of the response, if specified.", "default": null }, "temperature": { "default": 0.699999988079071, "type": "number", "format": "float" }, "top_p": { "default": 1.0, "type": "number", "format": "float" } }, "additionalProperties": false } } };

// In-memory cache for the schema
let cachedSchema: any = null;

export const useAgentSchema = () => {
  const [schema, setSchema] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // If already cached, use it
    if (cachedSchema) {
      setSchema(cachedSchema);
      return;
    }

    const fetchSchema = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/v1/schema/agent`);
        if (!response.ok) {
          throw new Error(`Failed to fetch schema: ${response.statusText}`);
        }
        const fetchedSchema = await response.json();
        cachedSchema = fetchedSchema;
        setSchema(fetchedSchema);
      } catch (err) {
        // On any error, use the hardcoded schema and cache it
        cachedSchema = HARDCODED_AGENT_SCHEMA;
        setSchema(HARDCODED_AGENT_SCHEMA);
        setError(err instanceof Error ? err.message : 'Failed to fetch schema');
      } finally {
        setLoading(false);
      }
    };
    fetchSchema();
  }, []);

  const validateField = (fieldName: string, value: any): string | null => {
    if (!schema) return null;
    const field = schema.properties?.[fieldName];
    if (!field) return null;
    // Check required fields
    if (Array.isArray(schema.required) && schema.required.includes(fieldName) && (!value || (typeof value === 'string' && !value.trim()))) {
      return `${fieldName} is required`;
    }
    // Type validation (basic)
    if (value && field.type) {
      const types = Array.isArray(field.type) ? field.type : [field.type];
      if (types.includes('string') && typeof value !== 'string') {
        return `${fieldName} must be a string`;
      }
      if (types.includes('integer') && typeof value !== 'number') {
        return `${fieldName} must be an integer`;
      }
      if (types.includes('number') && typeof value !== 'number') {
        return `${fieldName} must be a number`;
      }
      if (types.includes('boolean') && typeof value !== 'boolean') {
        return `${fieldName} must be a boolean`;
      }
      if (types.includes('array') && !Array.isArray(value)) {
        return `${fieldName} must be an array`;
      }
    }
    // Format validation (uri, email, etc.)
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
    // Enum validation
    if (value && field.enum && !field.enum.includes(value)) {
      return `${fieldName} must be one of: ${field.enum.join(', ')}`;
    }
    // Minimum validation (for numbers)
    if (typeof value === 'number' && typeof field.minimum === 'number' && value < field.minimum) {
      return `${fieldName} must be at least ${field.minimum}`;
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
    // Also check for missing required fields
    if (schema.required) {
      for (const reqField of schema.required) {
        if (!(reqField in formData) || formData[reqField] === undefined || formData[reqField] === null || (typeof formData[reqField] === 'string' && !formData[reqField].trim())) {
          errors[reqField] = `${reqField} is required`;
        }
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