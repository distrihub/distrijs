import { describe, expect, it, vi } from 'vitest';
import { addIncidentFormContext, createIncidentFormTools, createReconciliationTools, emptyIncident } from '../../../../samples/react-native-chat/stories/demoFixtures';

describe('mobile sample workflow tools', () => {
  it('mutates, reads, clears, and submits the incident form using registered handlers', async () => {
    let values = { ...emptyIncident };
    const setValues = vi.fn((next: typeof values) => { values = next; });
    const submit = vi.fn();
    const tools = createIncidentFormTools({ getValues: () => values, setValues, submit });

    await tools.find(tool => tool.name === 'fill_field')!.handler!({ field: 'email', value: 'sam@example.com' });
    await tools.find(tool => tool.name === 'fill_multiple_fields')!.handler!({ values: { fullName: 'Sam Lee', incidentType: 'Outage' } });
    expect(values).toMatchObject({ email: 'sam@example.com', fullName: 'Sam Lee', incidentType: 'Outage' });
    expect(await tools.find(tool => tool.name === 'get_form_values')!.handler!({})).toEqual(values);
    await tools.find(tool => tool.name === 'submit_form')!.handler!({});
    expect(submit).toHaveBeenCalledOnce();
    await tools.find(tool => tool.name === 'clear_form')!.handler!({});
    expect(values).toEqual(emptyIncident);
    expect(await tools.find(tool => tool.name === 'get_field_options')!.handler!({ field: 'impactLevel' })).toEqual(['Low', 'Medium', 'High', 'Critical']);
  });

  it('adds current form context as hidden developer message metadata without mutating the source', () => {
    const message = { id: 'message-1', role: 'user' as const, parts: [{ part_type: 'text' as const, data: 'Fill this form' }], created_at: 1 };
    const withContext = addIncidentFormContext(message, () => ({ ...emptyIncident, fullName: 'Sam Lee' }));

    expect(message.parts).toHaveLength(1);
    expect(withContext.parts[1]).toMatchObject({ data: expect.stringContaining('Sam Lee') });
    expect(withContext.metadata?.parts?.[1]).toEqual({ developer: true });
  });

  it('reads and reconciles only the selected ledger record', async () => {
    let records = [
      { id: 'INV-1', vendor: 'Northstar', amount: 100, status: 'unmatched', note: '' },
      { id: 'INV-2', vendor: 'Papertrail', amount: 200, status: 'unmatched', note: '' },
    ];
    const tools = createReconciliationTools({ getRecords: () => records, setRecords: next => { records = next; } });
    expect(await tools[0].handler!({})).toHaveLength(2);
    await tools[1].handler!({ id: 'INV-1', note: 'Verified' });
    expect(records.map(record => record.status)).toEqual(['matched', 'unmatched']);
    expect(records[0].note).toBe('Verified');
  });
});
