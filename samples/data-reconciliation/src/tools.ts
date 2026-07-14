import type { RefObject } from 'react';
import type { DistriFnTool } from '@distri/core';
import type { DataReconciliationGridRef } from './DataReconciliationGrid';

/** Tools the agent can call to run and inspect reconciliation over the grid. */
export const getReconciliationTools = (gridRef: RefObject<DataReconciliationGridRef | null>): DistriFnTool[] => [
  {
    name: 'run_reconciliation',
    description: 'Execute the reconciliation process to match internal records against external data. Returns summary of matched, unmatched, and discrepancy counts.',
    type: 'function',
    parameters: {
      type: 'object',
      properties: {}
    },
    handler: async () => {
      if (!gridRef.current) return 'Error: Grid not initialized';
      const result = gridRef.current.runReconciliation();
      return JSON.stringify({
        summary: `Reconciliation complete`,
        matched: result.matched,
        discrepancies: result.discrepancies,
        unmatched: result.unmatched,
        totalInternal: `$${result.totalInternal.toFixed(2)}`,
        totalExternal: `$${result.totalExternal.toFixed(2)}`,
        amountDifference: `$${result.amountDifference.toFixed(2)}`
      }, null, 2);
    }
  },
  {
    name: 'get_status',
    description: 'Get the current reconciliation status including counts and totals',
    type: 'function',
    parameters: {
      type: 'object',
      properties: {}
    },
    handler: async () => {
      if (!gridRef.current) return 'Error: Grid not initialized';
      const result = gridRef.current.getReconciliationStatus();
      return JSON.stringify({
        matched: result.matched,
        discrepancies: result.discrepancies,
        unmatched: result.unmatched,
        totalInternal: `$${result.totalInternal.toFixed(2)}`,
        totalExternal: `$${result.totalExternal.toFixed(2)}`,
        amountDifference: `$${result.amountDifference.toFixed(2)}`
      }, null, 2);
    }
  },
  {
    name: 'get_unmatched',
    description: 'Get all unmatched records that have no corresponding match in the other data source',
    type: 'function',
    parameters: {
      type: 'object',
      properties: {}
    },
    handler: async () => {
      if (!gridRef.current) return 'Error: Grid not initialized';
      const records = gridRef.current.getUnmatchedRecords();
      if (records.length === 0) return 'No unmatched records found';
      return JSON.stringify(records.map(r => ({
        id: r.id,
        source: r.source,
        date: r.date,
        description: r.description,
        amount: `$${r.amount.toFixed(2)}`,
        reference: r.reference,
        note: r.discrepancyNote
      })), null, 2);
    }
  },
  {
    name: 'get_discrepancies',
    description: 'Get all records that have discrepancies (mismatched amounts or data)',
    type: 'function',
    parameters: {
      type: 'object',
      properties: {}
    },
    handler: async () => {
      if (!gridRef.current) return 'Error: Grid not initialized';
      const records = gridRef.current.getDiscrepancies();
      if (records.length === 0) return 'No discrepancies found';
      return JSON.stringify(records.map(r => ({
        id: r.id,
        source: r.source,
        date: r.date,
        description: r.description,
        amount: `$${r.amount.toFixed(2)}`,
        reference: r.reference,
        matchedWith: r.matchedWith,
        issue: r.discrepancyNote
      })), null, 2);
    }
  },
  {
    name: 'explain_record',
    description: 'Get detailed explanation of a specific record including its reconciliation status',
    type: 'function',
    parameters: {
      type: 'object',
      properties: {
        record_id: {
          type: 'string',
          description: 'The ID of the record to explain (e.g., INT001, EXT003)'
        }
      },
      required: ['record_id']
    },
    handler: async ({ record_id }: { record_id: string }) => {
      if (!gridRef.current) return 'Error: Grid not initialized';
      return gridRef.current.explainRecord(record_id);
    }
  },
  {
    name: 'highlight_discrepancies',
    description: 'Visually highlight all discrepancies and unmatched records in the grid',
    type: 'function',
    parameters: {
      type: 'object',
      properties: {}
    },
    handler: async () => {
      if (!gridRef.current) return 'Error: Grid not initialized';
      const ids = gridRef.current.highlightDiscrepancies();
      return `Highlighted ${ids.length} records with issues: ${ids.join(', ')}`;
    }
  },
  {
    name: 'highlight_matches',
    description: 'Visually highlight all successfully matched records in the grid',
    type: 'function',
    parameters: {
      type: 'object',
      properties: {}
    },
    handler: async () => {
      if (!gridRef.current) return 'Error: Grid not initialized';
      const ids = gridRef.current.highlightMatches();
      return `Highlighted ${ids.length} matched records: ${ids.join(', ')}`;
    }
  },
  {
    name: 'add_note',
    description: 'Add an explanation or resolution note to a specific record',
    type: 'function',
    parameters: {
      type: 'object',
      properties: {
        record_id: {
          type: 'string',
          description: 'The ID of the record'
        },
        note: {
          type: 'string',
          description: 'The note to add'
        }
      },
      required: ['record_id', 'note']
    },
    handler: async ({ record_id, note }: { record_id: string; note: string }) => {
      if (!gridRef.current) return 'Error: Grid not initialized';
      gridRef.current.addNote(record_id, note);
      return `Note added to ${record_id}: "${note}"`;
    }
  },
  {
    name: 'get_all_data',
    description: 'Get all internal and external data for analysis',
    type: 'function',
    parameters: {
      type: 'object',
      properties: {}
    },
    handler: async () => {
      if (!gridRef.current) return 'Error: Grid not initialized';
      const data = gridRef.current.getAllData();
      return JSON.stringify({
        internalRecords: data.internal.length,
        externalRecords: data.external.length,
        internal: data.internal.map(r => ({
          id: r.id,
          date: r.date,
          description: r.description,
          amount: `$${r.amount.toFixed(2)}`,
          reference: r.reference
        })),
        external: data.external.map(r => ({
          id: r.id,
          date: r.date,
          description: r.description,
          amount: `$${r.amount.toFixed(2)}`,
          reference: r.reference
        }))
      }, null, 2);
    }
  },
  {
    name: 'reset_data',
    description: 'Reset the grid to sample data for demonstration',
    type: 'function',
    parameters: {
      type: 'object',
      properties: {}
    },
    handler: async () => {
      if (!gridRef.current) return 'Error: Grid not initialized';
      gridRef.current.resetData();
      return 'Data reset to sample data. Ready for new reconciliation.';
    }
  }
];
