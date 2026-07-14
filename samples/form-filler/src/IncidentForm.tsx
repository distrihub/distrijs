import React, { forwardRef, useImperativeHandle, useState, useCallback } from 'react';

export interface IncidentFormData {
  fullName: string;
  email: string;
  incidentType: string;
  dateOfIncident: string;
  impactLevel: string;
  description: string;
  suggestedActions: string;
}

export interface IncidentFormRef {
  setValue: (field: keyof IncidentFormData, value: string) => void;
  getValues: () => IncidentFormData;
  reset: () => void;
  submit: () => Promise<{ success: boolean; message: string }>;
  getFieldOptions: (field: string) => string[] | null;
}

const defaultValues: IncidentFormData = {
  fullName: '',
  email: '',
  incidentType: '',
  dateOfIncident: '',
  impactLevel: '',
  description: '',
  suggestedActions: '',
};

const incidentTypeOptions = [
  'Data Breach',
  'Unauthorized Access',
  'Malware',
  'Phishing',
  'Other',
];

const impactLevelOptions = ['Low', 'Medium', 'High', 'Critical'];

const IncidentForm = forwardRef<IncidentFormRef>((_, ref) => {
  const [formData, setFormData] = useState<IncidentFormData>(defaultValues);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const setValue = useCallback((field: keyof IncidentFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setSubmitStatus('idle');
  }, []);

  const getValues = useCallback(() => formData, [formData]);

  const reset = useCallback(() => {
    setFormData(defaultValues);
    setSubmitStatus('idle');
  }, []);

  const submit = useCallback(async (): Promise<{ success: boolean; message: string }> => {
    const required: (keyof IncidentFormData)[] = ['fullName', 'email', 'incidentType', 'dateOfIncident', 'impactLevel', 'description'];
    const missing = required.filter((field) => !formData[field]);

    if (missing.length > 0) {
      setSubmitStatus('error');
      return {
        success: false,
        message: `Missing required fields: ${missing.join(', ')}`,
      };
    }

    setSubmitStatus('success');
    return {
      success: true,
      message: 'Security incident report submitted successfully!',
    };
  }, [formData]);

  const getFieldOptions = useCallback((field: string): string[] | null => {
    if (field === 'incidentType') return incidentTypeOptions;
    if (field === 'impactLevel') return impactLevelOptions;
    return null;
  }, []);

  useImperativeHandle(ref, () => ({
    setValue,
    getValues,
    reset,
    submit,
    getFieldOptions,
  }), [setValue, getValues, reset, submit, getFieldOptions]);

  const handleChange = (field: keyof IncidentFormData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    setValue(field, e.target.value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await submit();
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.header}>
          <h2 style={styles.title}>Security Incident Report</h2>
          <p style={styles.subtitle}>Please fill out the form below to report an incident</p>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.fieldGroup}>
            <label style={styles.label}>Full Name</label>
            <input
              type="text"
              value={formData.fullName}
              onChange={handleChange('fullName')}
              placeholder="Enter your full name"
              style={styles.input}
            />
          </div>

          <div style={styles.fieldGroup}>
            <label style={styles.label}>Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={handleChange('email')}
              placeholder="your.email@company.com"
              style={styles.input}
            />
          </div>

          <div style={styles.row}>
            <div style={styles.fieldGroupHalf}>
              <label style={styles.label}>Incident Type</label>
              <select
                value={formData.incidentType}
                onChange={handleChange('incidentType')}
                style={styles.select}
              >
                <option value="">Select type...</option>
                {incidentTypeOptions.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>

            <div style={styles.fieldGroupHalf}>
              <label style={styles.label}>Date of Incident</label>
              <input
                type="date"
                value={formData.dateOfIncident}
                onChange={handleChange('dateOfIncident')}
                style={styles.input}
              />
            </div>
          </div>

          <div style={styles.fieldGroup}>
            <label style={styles.label}>Impact Level</label>
            <select
              value={formData.impactLevel}
              onChange={handleChange('impactLevel')}
              style={styles.select}
            >
              <option value="">Select impact level...</option>
              {impactLevelOptions.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>

          <div style={styles.fieldGroup}>
            <label style={styles.label}>Incident Description</label>
            <textarea
              value={formData.description}
              onChange={handleChange('description')}
              placeholder="Describe the incident in detail..."
              rows={4}
              style={styles.textarea}
            />
          </div>

          <div style={styles.fieldGroup}>
            <label style={styles.label}>Suggested Actions</label>
            <textarea
              value={formData.suggestedActions}
              onChange={handleChange('suggestedActions')}
              placeholder="Any recommended actions or remediation steps..."
              rows={3}
              style={styles.textarea}
            />
          </div>

          {submitStatus === 'success' && (
            <div style={styles.successMessage}>
              Report submitted successfully!
            </div>
          )}

          {submitStatus === 'error' && (
            <div style={styles.errorMessage}>
              Please fill in all required fields.
            </div>
          )}

          <button type="submit" style={styles.submitButton}>
            Submit Report
          </button>
        </form>
      </div>
    </div>
  );
});

IncidentForm.displayName = 'IncidentForm';

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'center',
    padding: '24px',
    height: '100%',
    overflow: 'auto',
    background: '#0f0f1a',
  },
  card: {
    width: '100%',
    maxWidth: '480px',
    background: '#ffffff',
    borderRadius: '12px',
    boxShadow: '0 4px 24px rgba(0, 0, 0, 0.3)',
    overflow: 'hidden',
  },
  header: {
    padding: '24px 24px 16px',
    borderBottom: '1px solid #e5e7eb',
  },
  title: {
    margin: 0,
    fontSize: '20px',
    fontWeight: 600,
    color: '#111827',
  },
  subtitle: {
    margin: '6px 0 0',
    fontSize: '14px',
    color: '#6b7280',
  },
  form: {
    padding: '20px 24px 24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  fieldGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  fieldGroupHalf: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  row: {
    display: 'flex',
    gap: '12px',
  },
  label: {
    fontSize: '13px',
    fontWeight: 500,
    color: '#374151',
  },
  input: {
    padding: '10px 12px',
    fontSize: '14px',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    outline: 'none',
    transition: 'border-color 0.15s, box-shadow 0.15s',
    background: '#fff',
    color: '#111827',
  },
  select: {
    padding: '10px 12px',
    fontSize: '14px',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    outline: 'none',
    background: '#fff',
    color: '#111827',
    cursor: 'pointer',
  },
  textarea: {
    padding: '10px 12px',
    fontSize: '14px',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    outline: 'none',
    resize: 'vertical',
    fontFamily: 'inherit',
    background: '#fff',
    color: '#111827',
  },
  submitButton: {
    marginTop: '8px',
    padding: '12px 20px',
    fontSize: '14px',
    fontWeight: 600,
    color: '#fff',
    background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'transform 0.15s, box-shadow 0.15s',
  },
  successMessage: {
    padding: '12px 16px',
    background: '#d1fae5',
    color: '#065f46',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 500,
  },
  errorMessage: {
    padding: '12px 16px',
    background: '#fee2e2',
    color: '#991b1b',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 500,
  },
};

export default IncidentForm;
