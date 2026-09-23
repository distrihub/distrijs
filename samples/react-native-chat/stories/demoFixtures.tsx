import type { Agent, DistriEvent, DistriFnTool, DistriMessage } from '@distri/core';

export type IncidentForm = {
  fullName: string;
  email: string;
  incidentType: string;
  dateOfIncident: string;
  impactLevel: string;
  description: string;
  suggestedActions: string;
};

export const emptyIncident: IncidentForm = {
  fullName: '', email: '', incidentType: '', dateOfIncident: '',
  impactLevel: '', description: '', suggestedActions: '',
};

type FormToolContext = {
  getValues: () => IncidentForm;
  setValues: (values: IncidentForm) => void;
  submit: () => void;
};

const definition = (name: string, description: string, properties: Record<string, unknown>, required: string[] = []) => ({
  name, description, type: 'function' as const, autoExecute: true,
  parameters: { type: 'object', properties, required },
});

export function createIncidentFormTools(context: FormToolContext): DistriFnTool[] {
  return [
    {
      ...definition('fill_field', 'Fill one incident-report field.', { field: { type: 'string' }, value: { type: 'string' } }, ['field', 'value']),
      handler: async ({ field, value }: { field: keyof IncidentForm; value: string }) => {
        if (!(field in emptyIncident)) throw new Error(`Unknown incident field: ${String(field)}`);
        context.setValues({ ...context.getValues(), [field]: value });
        return { field, value, saved: true };
      },
    },
    {
      ...definition('fill_multiple_fields', 'Fill several incident-report fields at once.', { values: { type: 'object' } }, ['values']),
      handler: async ({ values }: { values: Partial<IncidentForm> }) => {
        context.setValues({ ...context.getValues(), ...values });
        return { updated: Object.keys(values), saved: true };
      },
    },
    {
      ...definition('get_form_values', 'Read the current incident-report fields.', {}),
      handler: async () => context.getValues(),
    },
    {
      ...definition('get_field_options', 'Get valid choices for incident report dropdown fields.', { field: { type: 'string' } }, ['field']),
      handler: async ({ field }: { field: string }) => {
        const options: Record<string, string[]> = {
          incidentType: ['Data breach', 'Unauthorized access', 'Malware', 'Phishing', 'Other'],
          impactLevel: ['Low', 'Medium', 'High', 'Critical'],
        };
        if (!options[field]) throw new Error(`No dropdown options are defined for ${field}`);
        return options[field];
      },
    },
    {
      ...definition('clear_form', 'Clear every incident-report field.', {}),
      handler: async () => { context.setValues({ ...emptyIncident }); return { cleared: true }; },
    },
    {
      ...definition('submit_form', 'Submit the incident report.', {}),
      handler: async () => { context.submit(); return { submitted: true }; },
    },
  ];
}

export function addIncidentFormContext(message: DistriMessage, getValues: () => IncidentForm): DistriMessage {
  const context = `Current incident report fields: ${JSON.stringify(getValues())}`;
  const contextIndex = message.parts.length;
  return {
    ...message,
    parts: [...message.parts, { part_type: 'text', data: context }],
    metadata: {
      ...message.metadata,
      parts: { ...message.metadata?.parts, [contextIndex]: { developer: true } },
    },
  };
}

type ReconciliationContext = {
  getRecords: () => Array<{ id: string; vendor: string; amount: number; status: string; note: string }>;
  setRecords: (records: ReconciliationContext['getRecords'] extends () => infer T ? T : never) => void;
};

export function createReconciliationTools(context: ReconciliationContext): DistriFnTool[] {
  return [
    {
      ...definition('get_reconciliation_records', 'Read unmatched reconciliation records.', {}),
      handler: async () => context.getRecords(),
    },
    {
      ...definition('match_reconciliation_record', 'Mark a reconciliation record as matched.', { id: { type: 'string' }, note: { type: 'string' } }, ['id']),
      handler: async ({ id, note = 'Matched by assistant' }: { id: string; note?: string }) => {
        const records = context.getRecords();
        const target = records.find(record => record.id === id);
        if (!target) throw new Error(`Record ${id} was not found`);
        context.setRecords(records.map(record => record.id === id ? { ...record, status: 'matched', note } : record));
        return { id, status: 'matched', note };
      },
    },
  ];
}

type FixtureAction = { tool: string; input: Record<string, unknown>; text: string };

function readPrompt(request: unknown): string {
  const parts = (request as { message?: { parts?: Array<{ text?: string }> } })?.message?.parts ?? [];
  return parts.map(part => part.text ?? '').join(' ').toLowerCase();
}

function actionFor(prompt: string): FixtureAction {
  if (prompt.includes('options') || prompt.includes('choices')) return { tool: 'get_field_options', input: { field: 'impactLevel' }, text: 'These are the available impact levels.' };
  if (prompt.includes('read') || prompt.includes('show')) return { tool: 'get_form_values', input: {}, text: 'I read the current report fields for you.' };
  if (prompt.includes('clear')) return { tool: 'clear_form', input: {}, text: 'The report is cleared and ready to start again.' };
  if (prompt.includes('submit')) return { tool: 'submit_form', input: {}, text: 'The incident report was submitted successfully.' };
  if (prompt.includes('single') || prompt.includes('email')) return { tool: 'fill_field', input: { field: 'email', value: 'sam.lee@example.com' }, text: 'I updated the contact email in the incident report.' };
  return {
    tool: 'fill_multiple_fields',
    input: { values: { fullName: 'Sam Lee', email: 'sam.lee@example.com', incidentType: 'Service outage', dateOfIncident: '2026-09-22', impactLevel: 'High', description: 'Checkout was unavailable for 18 minutes.', suggestedActions: 'Add a regional health check and failover alert.' } },
    text: 'I filled the incident report with the details provided. You can review or edit every field.',
  };
}

export function makeToolFixtureAgent(action: FixtureAction | ((prompt: string) => FixtureAction), agentName = 'mobile-demo-agent'): Agent {
  return {
    name: agentName,
    client: { ensureAccessToken: async () => undefined },
    invokeStream: async (request: unknown) => {
      const prompt = readPrompt(request);
      const selected = typeof action === 'function' ? action(prompt) : action;
      return (async function* () {
        yield { type: 'tool_calls', data: { tool_calls: [{ tool_call_id: `demo-${Date.now()}`, tool_name: selected.tool, input: selected.input }] } } as DistriEvent;
        yield* assistantText(`reply-${Date.now()}`, selected.text);
      })();
    },
    completeTool: async () => undefined,
  } as unknown as Agent;
}

async function* assistantText(messageId: string, text: string): AsyncGenerator<DistriEvent> {
  const stepId = `${messageId}-step`;
  yield { type: 'text_message_start', data: { message_id: messageId, step_id: stepId, role: 'assistant', is_final: true } };
  for (const delta of text.match(/.{1,38}(?:\s|$)|\S+/g) ?? [text]) {
    await new Promise(resolve => setTimeout(resolve, 90));
    yield { type: 'text_message_content', data: { message_id: messageId, step_id: stepId, delta } };
  }
  yield { type: 'text_message_end', data: { message_id: messageId, step_id: stepId } };
}

export function makeTaskFixtureAgent(): Agent {
  const contextBudget = {
    system_prompt_static_tokens: 400, system_prompt_dynamic_tokens: 180, tool_schema_tokens: 260,
    deferred_tool_tokens: 0, skill_listing_tokens: 80, conversation_tokens: 920,
    tool_result_tokens: 120, context_window_size: 8192, static_prefix_cache_hit: false,
  };
  return {
    name: 'mobile-task-demo',
    client: { ensureAccessToken: async () => undefined },
    resubscribe: () => (async function* () {
      yield { type: 'run_started', taskId: 'research-root', data: { runId: 'run-root', taskId: 'research-root' } } as DistriEvent;
      yield { type: 'todos_updated', taskId: 'research-root', data: { action: 'update', formatted_todos: '', todo_count: 3, todos: [
        { id: '1', content: 'Collect product feedback', status: 'completed' },
        { id: '2', content: 'Compare support themes', status: 'in_progress' },
        { id: '3', content: 'Draft recommendations', status: 'pending' },
      ] } } as DistriEvent;
      yield { type: 'context_budget_update', taskId: 'research-root', data: { budget: contextBudget, is_warning: false, is_critical: false } } as DistriEvent;
      yield { type: 'run_started', taskId: 'research-feedback', parentTaskId: 'research-root', data: { runId: 'run-feedback', taskId: 'research-feedback' } } as DistriEvent;
      yield { type: 'text_message_start', taskId: 'research-feedback', parentTaskId: 'research-root', data: { message_id: 'child-feedback', step_id: 'child-step', role: 'assistant', is_final: true } } as DistriEvent;
      yield { type: 'text_message_content', taskId: 'research-feedback', parentTaskId: 'research-root', data: { message_id: 'child-feedback', step_id: 'child-step', delta: 'Feedback clusters around onboarding and checkout speed.' } } as DistriEvent;
      yield { type: 'text_message_end', taskId: 'research-feedback', parentTaskId: 'research-root', data: { message_id: 'child-feedback', step_id: 'child-step' } } as DistriEvent;
      yield { type: 'run_finished', taskId: 'research-feedback', parentTaskId: 'research-root', data: { runId: 'run-feedback', taskId: 'research-feedback' } } as DistriEvent;
      yield { type: 'text_message_start', taskId: 'research-root', data: { message_id: 'root-summary', step_id: 'root-step', role: 'assistant', is_final: true } } as DistriEvent;
      yield { type: 'text_message_content', taskId: 'research-root', data: { message_id: 'root-summary', step_id: 'root-step', delta: 'Research is underway. The feedback sub-agent found two recurring themes.' } } as DistriEvent;
      yield { type: 'text_message_end', taskId: 'research-root', data: { message_id: 'root-summary', step_id: 'root-step' } } as DistriEvent;
      yield { type: 'run_finished', taskId: 'research-root', data: { runId: 'run-root', taskId: 'research-root' } } as DistriEvent;
    })(),
  } as unknown as Agent;
}
