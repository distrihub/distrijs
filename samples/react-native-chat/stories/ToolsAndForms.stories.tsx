import { useMemo, useRef, useState } from 'react';
import type { Agent, DistriChatMessage, DistriEvent, DistriBaseTool } from '@distri/core';
import { DistriClient } from '@distri/core';
import type { Meta, StoryObj } from '@storybook/react-native';
import { Chat, ChatMessageList, createChatStore } from '@distri/react-native';
import type { ChatProps } from '@distri/react-native';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { addIncidentFormContext, createIncidentFormTools, createReconciliationTools, emptyIncident, makeToolFixtureAgent } from './demoFixtures';

const meta: Meta<typeof Chat> = { title: 'Distri Native/Sample workflows', component: Chat, parameters: { layout: 'fullscreen' } };
export default meta;
type Story = StoryObj<typeof Chat>;

function IncidentFormStory() {
  const [values, setValues] = useState({ ...emptyIncident });
  const [submitted, setSubmitted] = useState(false);
  const valuesRef = useRef(values);
  const update = (next: typeof values) => { valuesRef.current = next; setValues(next); };
  const tools = useMemo(() => createIncidentFormTools({ getValues: () => valuesRef.current, setValues: update, submit: () => setSubmitted(true) }), []);
  const agent = useMemo(() => makeToolFixtureAgent(prompt => prompt.includes('clear') ? { tool: 'clear_form', input: {}, text: 'The report is cleared.' } : prompt.includes('submit') ? { tool: 'submit_form', input: {}, text: 'Incident report submitted.' } : prompt.includes('option') || prompt.includes('choice') ? { tool: 'get_field_options', input: { field: 'impactLevel' }, text: 'Here are the allowed impact levels.' } : prompt.includes('show') || prompt.includes('read') ? { tool: 'get_form_values', input: {}, text: 'Here are the current report values.' } : prompt.includes('email') ? { tool: 'fill_field', input: { field: 'email', value: 'sam.lee@example.com' }, text: 'I filled in the contact email.' } : { tool: 'fill_multiple_fields', input: { values: { fullName: 'Sam Lee', email: 'sam.lee@example.com', incidentType: 'Service outage', dateOfIncident: '2026-09-22', impactLevel: 'High', description: 'Checkout was unavailable for 18 minutes.', suggestedActions: 'Add a regional health check and failover alert.' } }, text: 'I filled the report. Review each field below.' }), []);
  return <View style={styles.screen}>
    <Text style={styles.intro}>Try “fill the incident report”, “show the form”, “change the email”, “what impact options are available?”, “clear the form”, or “submit the report”. Current field values are attached as hidden developer context before each send.</Text>
    <View style={styles.body}>
      <ScrollView style={styles.formPanel}>
        <Text style={styles.heading}>Incident report {submitted ? '· submitted ✓' : ''}</Text>
        {Object.entries(values).map(([key, value]) => <View key={key} style={styles.field}><Text style={styles.label}>{key.replace(/[A-Z]/g, c => ` ${c}`).toUpperCase()}</Text><Text style={styles.value}>{value || '—'}</Text></View>)}
      </ScrollView>
      <View style={styles.chatPanel}><Chat agent={agent} threadId="incident-form-story" externalTools={tools} beforeSendMessage={async message => addIncidentFormContext(message, () => valuesRef.current)} rendering="rich" placeholder="Ask the assistant to update the form…" /></View>
    </View>
  </View>;
}

export const FormFiller: Story = { render: () => <IncidentFormStory />, name: 'Form filler · live client tools' };

function makeApprovalAgent(): Agent {
  let finishCheckpoint: (() => void) | undefined;
  return {
    name: 'approval-demo', client: { ensureAccessToken: async () => undefined },
    invokeStream: async () => {
      const checkpoint = new Promise<void>(resolve => { finishCheckpoint = resolve; });
      return (async function* () {
        const toolId = `approval-${Date.now()}`;
        yield { type: 'tool_calls', data: { tool_calls: [{ tool_call_id: toolId, tool_name: 'delete_customer_record', input: { customer: 'C-1042', reason: 'Duplicate account' } }] } } as DistriEvent;
        await checkpoint;
        yield* assistantReply(`approval-done-${Date.now()}`, 'Thanks — the checkpoint is resolved. The agent can continue safely.');
      })();
    },
    completeTool: async () => { finishCheckpoint?.(); },
  } as unknown as Agent;
}

async function* assistantReply(id: string, text: string): AsyncGenerator<DistriChatMessage | DistriEvent> {
  const step = `${id}-step`;
  yield { type: 'text_message_start', data: { message_id: id, step_id: step, role: 'assistant', is_final: true } } as DistriEvent;
  yield { type: 'text_message_content', data: { message_id: id, step_id: step, delta: text } } as DistriEvent;
  yield { type: 'text_message_end', data: { message_id: id, step_id: step } } as DistriEvent;
}

function ApprovalStory() {
  const agent = useMemo(makeApprovalAgent, []);
  const tools = useMemo<DistriBaseTool[]>(() => [{ name: 'delete_customer_record', description: 'Delete a customer record after human approval.', type: 'function', autoExecute: false, parameters: { type: 'object', properties: { customer: { type: 'string' }, reason: { type: 'string' } } }, handler: async (input: Record<string, unknown>) => ({ approvedBy: 'operator', ...input }) }], []);
  return <View style={styles.screen}><Text style={styles.intro}>Send any message. The destructive action pauses for a human decision; Run executes the handler, Decline returns a safe negative result.</Text><Chat agent={agent} threadId="approval-story" externalTools={tools} rendering="rich" placeholder="Ask to remove a duplicate record…" /></View>;
}

export const ApprovalCheckpoint: Story = { render: () => <ApprovalStory />, name: 'Approval / QA checkpoint' };

type LedgerRecord = { id: string; vendor: string; amount: number; status: string; note: string };
function ReconciliationStory() {
  const [records, setRecords] = useState<LedgerRecord[]>([
    { id: 'INV-2048', vendor: 'Northstar Hosting', amount: 482, status: 'unmatched', note: 'Invoice received' },
    { id: 'INV-2049', vendor: 'Papertrail Design', amount: 1250, status: 'unmatched', note: 'Awaiting approval' },
  ]);
  const recordsRef = useRef(records);
  const update = (next: LedgerRecord[]) => { recordsRef.current = next; setRecords(next); };
  const tools = useMemo(() => createReconciliationTools({ getRecords: () => recordsRef.current, setRecords: update }), []);
  const agent = useMemo(() => makeToolFixtureAgent(prompt => prompt.includes('list') || prompt.includes('show') ? { tool: 'get_reconciliation_records', input: {}, text: 'I found two unmatched invoices in the ledger.' } : { tool: 'match_reconciliation_record', input: { id: 'INV-2048', note: 'Amount verified against the statement' }, text: 'INV-2048 is matched. The other invoice remains untouched.' }), []);
  const renderers: ChatProps['toolRenderers'] = {
    get_reconciliation_records: ({ state }) => <View style={styles.customTool}><Text style={styles.heading}>Ledger lookup · native custom renderer</Text><Text style={styles.value}>{state?.status ?? 'running'} · reading local records</Text></View>,
  };
  return <View style={styles.screen}><Text style={styles.intro}>Try “match the first invoice” or “show the ledger”. This workflow registers two independent client-side functions; only the lookup uses a custom renderer.</Text>
    <View style={styles.body}><ScrollView style={styles.formPanel}><Text style={styles.heading}>Reconciliation ledger</Text>{records.map(record => <View key={record.id} style={styles.record}><Text style={styles.label}>{record.id} · {record.vendor}</Text><Text style={styles.value}>${record.amount} · {record.status}</Text><Text style={styles.value}>{record.note}</Text></View>)}</ScrollView>
      <View style={styles.chatPanel}><Chat agent={agent} threadId="reconciliation-story" externalTools={tools} toolRenderers={renderers} rendering="rich" placeholder="Ask about the ledger…" /></View></View>
  </View>;
}

export const ReconciliationWithRenderers: Story = { render: () => <ReconciliationStory />, name: 'Reconciliation · multiple functions' };

const richMessage = DistriClient.initDistriMessage('assistant', [
  { part_type: 'text', data: 'Rich native content renders through the package defaults.' },
  { part_type: 'data', data: { decision: 'approved', confidence: 0.94, source: 'sample fixture' } },
  { part_type: 'artifact', data: { original_filename: 'incident-summary.json', content_type: 'application/json', file_id: 'demo-artifact-1', size: 164 } },
]);
function RichContentStory() {
  const store = useMemo(() => createChatStore(), []);
  return <View style={styles.screen}><Text style={styles.intro}>Default native renderer for text, structured data, artifact metadata and safe fallbacks.</Text><ChatMessageList messages={[richMessage]} store={store} rendering="rich" /></View>;
}
export const RichContent: Story = { render: () => <RichContentStory />, name: 'Rich content · data and artifacts' };

const runtimeEvents: DistriEvent[] = [
  { type: 'live_view', data: { view_id: 'mobile-preview', url: 'https://distri.dev', title: 'Generated mobile preview' } },
  { type: 'todos_updated', data: { action: 'update', formatted_todos: '', todo_count: 2, todos: [
    { id: '1', content: 'Review the generated screen', status: 'done' },
    { id: '2', content: 'Share the preview with the team', status: 'in_progress' },
  ] } },
  { type: 'context_compaction', data: { tier: 'summarize', tokens_before: 12000, tokens_after: 4500, entries_affected: 8, context_limit: 16000, usage_ratio: 0.75, summary: 'Product decisions and user constraints were preserved.' } },
];
function RuntimeEventsStory() {
  const store = useMemo(() => createChatStore(), []);
  return <View style={styles.screen}>
    <Text style={styles.intro}>Native equivalents for common runtime events: preview links open with the system handler; todos and context status remain in the conversation.</Text>
    <ChatMessageList messages={runtimeEvents} store={store} rendering="rich" />
  </View>;
}
export const RuntimeEvents: Story = { render: () => <RuntimeEventsStory />, name: 'Runtime events · preview and context' };

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f8fafc' }, intro: { padding: 12, color: '#475569', fontSize: 13, lineHeight: 19, backgroundColor: '#eef2ff' }, body: { flex: 1, flexDirection: 'column', gap: 8, padding: 10 }, formPanel: { flexGrow: 0, flexShrink: 1, maxHeight: 270, padding: 12, backgroundColor: '#fff', borderRadius: 12 }, chatPanel: { flex: 1, minHeight: 300, backgroundColor: '#fff', borderRadius: 12, overflow: 'hidden' }, heading: { color: '#0f172a', fontWeight: '700', fontSize: 15, paddingBottom: 8 }, field: { borderBottomWidth: 1, borderColor: '#e2e8f0', paddingVertical: 8, gap: 3 }, label: { color: '#64748b', fontSize: 10, fontWeight: '700' }, value: { color: '#1e293b', fontSize: 13 }, record: { paddingVertical: 12, borderTopWidth: 1, borderColor: '#e2e8f0', gap: 4 }, customTool: { padding: 12, borderRadius: 10, backgroundColor: '#ecfeff', borderWidth: 1, borderColor: '#a5f3fc' },
});
