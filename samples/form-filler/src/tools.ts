import type { RefObject } from 'react';
import type { DistriFnTool } from '@distri/core';
import type { IncidentFormData, IncidentFormRef } from './IncidentForm';

// Field name mapping for user-friendly names
const fieldNameMap: Record<string, keyof IncidentFormData> = {
  'full_name': 'fullName',
  'fullname': 'fullName',
  'name': 'fullName',
  'email': 'email',
  'incident_type': 'incidentType',
  'incidenttype': 'incidentType',
  'type': 'incidentType',
  'date_of_incident': 'dateOfIncident',
  'dateofincident': 'dateOfIncident',
  'date': 'dateOfIncident',
  'impact_level': 'impactLevel',
  'impactlevel': 'impactLevel',
  'impact': 'impactLevel',
  'description': 'description',
  'incident_description': 'description',
  'suggested_actions': 'suggestedActions',
  'suggestedactions': 'suggestedActions',
  'actions': 'suggestedActions',
};

/** Tools the agent can call to read/write the incident report form. */
export const getFormTools = (formRef: RefObject<IncidentFormRef | null>): DistriFnTool[] => [
  {
    name: 'fill_field',
    description: 'Fill a specific field in the security incident report form. Available fields: full_name, email, incident_type (Data Breach, Unauthorized Access, Malware, Phishing, Other), date_of_incident (YYYY-MM-DD format), impact_level (Low, Medium, High, Critical), description, suggested_actions',
    type: 'function',
    parameters: {
      type: 'object',
      properties: {
        field_name: {
          type: 'string',
          description: 'The name of the field to fill (e.g., full_name, email, incident_type, date_of_incident, impact_level, description, suggested_actions)',
        },
        value: {
          type: 'string',
          description: 'The value to set for the field',
        },
      },
      required: ['field_name', 'value'],
    },
    handler: async ({ field_name, value }: { field_name: string; value: string }) => {
      if (!formRef.current) {
        return 'Error: Form not initialized';
      }

      const normalizedFieldName = field_name.toLowerCase().replace(/\s+/g, '_');
      const mappedField = fieldNameMap[normalizedFieldName];

      if (!mappedField) {
        return `Error: Unknown field "${field_name}". Available fields: full_name, email, incident_type, date_of_incident, impact_level, description, suggested_actions`;
      }

      formRef.current.setValue(mappedField, value);
      return `Field "${field_name}" set to "${value}"`;
    },
  },
  {
    name: 'fill_multiple_fields',
    description: 'Fill multiple fields at once in the security incident report form. More efficient than calling fill_field multiple times.',
    type: 'function',
    parameters: {
      type: 'object',
      properties: {
        fields: {
          type: 'array',
          description: 'Array of field-value pairs to fill',
          items: {
            type: 'object',
            properties: {
              field_name: {
                type: 'string',
                description: 'The name of the field (full_name, email, incident_type, date_of_incident, impact_level, description, suggested_actions)',
              },
              value: {
                type: 'string',
                description: 'The value to set for the field',
              },
            },
            required: ['field_name', 'value'],
          },
        },
      },
      required: ['fields'],
    },
    handler: async ({ fields }: { fields?: Array<{ field_name: string; value: string }> }) => {
      if (!formRef.current) {
        return 'Error: Form not initialized';
      }

      if (!fields || !Array.isArray(fields) || fields.length === 0) {
        return 'Error: No fields provided. Please provide an array of {field_name, value} objects.';
      }

      const results: string[] = [];
      const errors: string[] = [];

      for (const { field_name, value } of fields) {
        const normalizedFieldName = field_name.toLowerCase().replace(/\s+/g, '_');
        const mappedField = fieldNameMap[normalizedFieldName];

        if (!mappedField) {
          errors.push(`Unknown field "${field_name}"`);
          continue;
        }

        formRef.current.setValue(mappedField, value);
        results.push(`${field_name}: "${value}"`);
      }

      let response = '';
      if (results.length > 0) {
        response += `Successfully filled ${results.length} field(s):\n${results.join('\n')}`;
      }
      if (errors.length > 0) {
        response += `\n\nErrors:\n${errors.join('\n')}`;
      }

      return response || 'No fields were filled';
    },
  },
  {
    name: 'get_form_values',
    description: 'Get the current values of all fields in the form',
    type: 'function',
    parameters: {
      type: 'object',
      properties: {},
    },
    handler: async () => {
      if (!formRef.current) {
        return 'Error: Form not initialized';
      }

      const values = formRef.current.getValues();
      return JSON.stringify(values, null, 2);
    },
  },
  {
    name: 'clear_form',
    description: 'Clear all fields in the form and reset to default values',
    type: 'function',
    parameters: {
      type: 'object',
      properties: {},
    },
    handler: async () => {
      if (!formRef.current) {
        return 'Error: Form not initialized';
      }

      formRef.current.reset();
      return 'Form cleared successfully';
    },
  },
  {
    name: 'submit_form',
    description: 'Submit the security incident report form. Will validate required fields before submission.',
    type: 'function',
    parameters: {
      type: 'object',
      properties: {},
    },
    handler: async () => {
      if (!formRef.current) {
        return 'Error: Form not initialized';
      }

      const result = await formRef.current.submit();
      return result.message;
    },
  },
  {
    name: 'get_field_options',
    description: 'Get the available options for a select field (incident_type or impact_level)',
    type: 'function',
    parameters: {
      type: 'object',
      properties: {
        field_name: {
          type: 'string',
          description: 'The name of the field (incident_type or impact_level)',
        },
      },
      required: ['field_name'],
    },
    handler: async ({ field_name }: { field_name: string }) => {
      if (!formRef.current) {
        return 'Error: Form not initialized';
      }

      const normalizedFieldName = field_name.toLowerCase().replace(/\s+/g, '_');
      const mappedField = fieldNameMap[normalizedFieldName];

      if (!mappedField) {
        return `Error: Unknown field "${field_name}"`;
      }

      const options = formRef.current.getFieldOptions(mappedField);
      if (!options) {
        return `Field "${field_name}" does not have predefined options`;
      }

      return `Available options for ${field_name}: ${options.join(', ')}`;
    },
  },
];

/** Static HTML snapshot of the form, injected via `beforeSendMessage` so the agent knows what fields/options exist. */
export const getFormHtml = () => {
  return `<form id="incident-form">
  <input name="full_name" type="text" placeholder="Full Name" required />
  <input name="email" type="email" placeholder="Email Address" required />
  <select name="incident_type" required>
    <option value="">Select Incident Type</option>
    <option value="Data Breach">Data Breach</option>
    <option value="Unauthorized Access">Unauthorized Access</option>
    <option value="Malware">Malware</option>
    <option value="Phishing">Phishing</option>
    <option value="Other">Other</option>
  </select>
  <input name="date_of_incident" type="date" required />
  <select name="impact_level" required>
    <option value="">Select Impact Level</option>
    <option value="Low">Low</option>
    <option value="Medium">Medium</option>
    <option value="High">High</option>
    <option value="Critical">Critical</option>
  </select>
  <textarea name="description" placeholder="Incident Description" required></textarea>
  <textarea name="suggested_actions" placeholder="Suggested Actions"></textarea>
  <button type="submit">Submit Report</button>
</form>`;
};
