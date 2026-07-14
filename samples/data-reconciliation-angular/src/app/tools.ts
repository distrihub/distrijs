import type { DistriFnTool } from '@distri/core';
import type { DataReconciliationGridComponent } from './data-reconciliation-grid.component';

/**
 * Tools the agent can call to run and inspect reconciliation over the grid.
 * Takes a getter (not the component directly) since the `@ViewChild` it
 * reads from isn't populated until after the first change-detection pass.
 */
export const getReconciliationTools = (getGrid: () => DataReconciliationGridComponent | undefined): DistriFnTool[] => [
  {
    name: 'run_reconciliation',
    description: 'Execute the reconciliation process to match internal records against external data. Returns summary of matched, unmatched, and discrepancy counts.',
    type: 'function',
    parameters: { type: 'object', properties: {} },
    handler: async () => {
      const grid = getGrid();
      if (!grid) return 'Error: Grid not initialized';
      const result = grid.runReconciliation();
      return JSON.stringify({
        summary: 'Reconciliation complete',
        matched: result.matched,
        discrepancies: result.discrepancies,
        unmatched: result.unmatched,
        totalInternal: `$${result.totalInternal.toFixed(2)}`,
        totalExternal: `$${result.totalExternal.toFixed(2)}`,
        amountDifference: `$${result.amountDifference.toFixed(2)}`,
      }, null, 2);
    },
  },
  {
    name: 'get_status',
    description: 'Get the current reconciliation status including counts and totals',
    type: 'function',
    parameters: { type: 'object', properties: {} },
    handler: async () => {
      const grid = getGrid();
      if (!grid) return 'Error: Grid not initialized';
      const result = grid.getReconciliationStatus();
      return JSON.stringify({
        matched: result.matched,
        discrepancies: result.discrepancies,
        unmatched: result.unmatched,
        totalInternal: `$${result.totalInternal.toFixed(2)}`,
        totalExternal: `$${result.totalExternal.toFixed(2)}`,
        amountDifference: `$${result.amountDifference.toFixed(2)}`,
      }, null, 2);
    },
  },
  {
    name: 'get_unmatched',
    description: 'Get all unmatched records that have no corresponding match in the other data source',
    type: 'function',
    parameters: { type: 'object', properties: {} },
    handler: async () => {
      const grid = getGrid();
      if (!grid) return 'Error: Grid not initialized';
      const records = grid.getUnmatchedRecords();
      if (records.length === 0) return 'No unmatched records found';
      return JSON.stringify(records.map((r) => ({
        id: r.id, source: r.source, date: r.date, description: r.description,
        amount: `$${r.amount.toFixed(2)}`, reference: r.reference, note: r.discrepancyNote,
      })), null, 2);
    },
  },
  {
    name: 'get_discrepancies',
    description: 'Get all records that have discrepancies (mismatched amounts or data)',
    type: 'function',
    parameters: { type: 'object', properties: {} },
    handler: async () => {
      const grid = getGrid();
      if (!grid) return 'Error: Grid not initialized';
      const records = grid.getDiscrepancies();
      if (records.length === 0) return 'No discrepancies found';
      return JSON.stringify(records.map((r) => ({
        id: r.id, source: r.source, date: r.date, description: r.description,
        amount: `$${r.amount.toFixed(2)}`, reference: r.reference, matchedWith: r.matchedWith, issue: r.discrepancyNote,
      })), null, 2);
    },
  },
  {
    name: 'explain_record',
    description: 'Get detailed explanation of a specific record including its reconciliation status',
    type: 'function',
    parameters: {
      type: 'object',
      properties: { record_id: { type: 'string', description: 'The ID of the record to explain (e.g., INT001, EXT003)' } },
      required: ['record_id'],
    },
    handler: async ({ record_id }: { record_id: string }) => {
      const grid = getGrid();
      if (!grid) return 'Error: Grid not initialized';
      return grid.explainRecord(record_id);
    },
  },
  {
    name: 'highlight_discrepancies',
    description: 'Visually highlight all discrepancies and unmatched records in the grid',
    type: 'function',
    parameters: { type: 'object', properties: {} },
    handler: async () => {
      const grid = getGrid();
      if (!grid) return 'Error: Grid not initialized';
      const ids = grid.highlightDiscrepancies();
      return `Highlighted ${ids.length} records with issues: ${ids.join(', ')}`;
    },
  },
  {
    name: 'highlight_matches',
    description: 'Visually highlight all successfully matched records in the grid',
    type: 'function',
    parameters: { type: 'object', properties: {} },
    handler: async () => {
      const grid = getGrid();
      if (!grid) return 'Error: Grid not initialized';
      const ids = grid.highlightMatches();
      return `Highlighted ${ids.length} matched records: ${ids.join(', ')}`;
    },
  },
  {
    name: 'add_note',
    description: 'Add an explanation or resolution note to a specific record',
    type: 'function',
    parameters: {
      type: 'object',
      properties: {
        record_id: { type: 'string', description: 'The ID of the record' },
        note: { type: 'string', description: 'The note to add' },
      },
      required: ['record_id', 'note'],
    },
    handler: async ({ record_id, note }: { record_id: string; note: string }) => {
      const grid = getGrid();
      if (!grid) return 'Error: Grid not initialized';
      grid.addNote(record_id, note);
      return `Note added to ${record_id}: "${note}"`;
    },
  },
  {
    name: 'get_all_data',
    description: 'Get all internal and external data for analysis',
    type: 'function',
    parameters: { type: 'object', properties: {} },
    handler: async () => {
      const grid = getGrid();
      if (!grid) return 'Error: Grid not initialized';
      const data = grid.getAllData();
      return JSON.stringify({
        internalRecords: data.internal.length,
        externalRecords: data.external.length,
        internal: data.internal.map((r) => ({ id: r.id, date: r.date, description: r.description, amount: `$${r.amount.toFixed(2)}`, reference: r.reference })),
        external: data.external.map((r) => ({ id: r.id, date: r.date, description: r.description, amount: `$${r.amount.toFixed(2)}`, reference: r.reference })),
      }, null, 2);
    },
  },
  {
    name: 'reset_data',
    description: 'Reset the grid to sample data for demonstration',
    type: 'function',
    parameters: { type: 'object', properties: {} },
    handler: async () => {
      const grid = getGrid();
      if (!grid) return 'Error: Grid not initialized';
      grid.resetData();
      return 'Data reset to sample data. Ready for new reconciliation.';
    },
  },
];
