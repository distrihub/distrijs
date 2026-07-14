import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';

export interface TransactionRecord {
  id: string;
  date: string;
  description: string;
  amount: number;
  reference: string;
  source: 'internal' | 'external';
  status?: 'matched' | 'unmatched' | 'discrepancy';
  matchedWith?: string;
  discrepancyNote?: string;
}

export interface ReconciliationResult {
  matched: number;
  unmatched: number;
  discrepancies: number;
  totalInternal: number;
  totalExternal: number;
  amountDifference: number;
}

const sampleInternalData: TransactionRecord[] = [
  { id: 'INT001', date: '2024-01-15', description: 'Office Supplies', amount: 234.50, reference: 'PO-2024-001', source: 'internal' },
  { id: 'INT002', date: '2024-01-16', description: 'Software License', amount: 1500.00, reference: 'PO-2024-002', source: 'internal' },
  { id: 'INT003', date: '2024-01-17', description: 'Consulting Services', amount: 5000.00, reference: 'PO-2024-003', source: 'internal' },
  { id: 'INT004', date: '2024-01-18', description: 'Travel Expenses', amount: 872.30, reference: 'EXP-2024-001', source: 'internal' },
  { id: 'INT005', date: '2024-01-19', description: 'Marketing Campaign', amount: 3200.00, reference: 'MKT-2024-001', source: 'internal' },
  { id: 'INT006', date: '2024-01-20', description: 'Equipment Purchase', amount: 15000.00, reference: 'PO-2024-004', source: 'internal' },
  { id: 'INT007', date: '2024-01-21', description: 'Catering Services', amount: 450.00, reference: 'PO-2024-005', source: 'internal' },
  { id: 'INT008', date: '2024-01-22', description: 'Cloud Hosting', amount: 890.00, reference: 'SUB-2024-001', source: 'internal' },
];

const sampleExternalData: TransactionRecord[] = [
  { id: 'EXT001', date: '2024-01-15', description: 'OFFICE DEPOT', amount: 234.50, reference: 'PO-2024-001', source: 'external' },
  { id: 'EXT002', date: '2024-01-16', description: 'ADOBE SYSTEMS', amount: 1500.00, reference: 'PO-2024-002', source: 'external' },
  { id: 'EXT003', date: '2024-01-17', description: 'ACME CONSULTING', amount: 4800.00, reference: 'PO-2024-003', source: 'external' },
  { id: 'EXT004', date: '2024-01-18', description: 'DELTA AIRLINES', amount: 872.30, reference: 'EXP-2024-001', source: 'external' },
  { id: 'EXT005', date: '2024-01-19', description: 'GOOGLE ADS', amount: 3200.00, reference: 'MKT-2024-001', source: 'external' },
  { id: 'EXT006', date: '2024-01-20', description: 'DELL TECHNOLOGIES', amount: 15000.00, reference: 'PO-2024-004', source: 'external' },
  { id: 'EXT007', date: '2024-01-22', description: 'AWS', amount: 890.00, reference: 'SUB-2024-001', source: 'external' },
  { id: 'EXT008', date: '2024-01-23', description: 'UNKNOWN VENDOR', amount: 125.00, reference: 'UNKNOWN', source: 'external' },
];

/**
 * Angular port of the React sample's DataReconciliationGrid: same
 * hand-rolled table, same sample data, same reconciliation logic. Exposes
 * its API (`runReconciliation`, `getDiscrepancies`, `explainRecord`, …)
 * as public methods for the parent to call via `@ViewChild`, in place of
 * the React version's `useImperativeHandle`.
 */
@Component({
  selector: 'app-data-reconciliation-grid',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="container">
      @if (reconciliationRun()) {
        <div class="stats-bar">
          <div class="stat"><span class="dot dot--matched">●</span><span>{{ stats().matched }} Matched</span></div>
          <div class="stat"><span class="dot dot--discrepancy">●</span><span>{{ stats().discrepancies }} Discrepancies</span></div>
          <div class="stat"><span class="dot dot--unmatched">●</span><span>{{ stats().unmatched }} Unmatched</span></div>
        </div>
      }

      @if (statusMessage()) {
        <div class="status-message">{{ statusMessage() }}</div>
      }

      <div class="tabs">
        @for (tab of tabOptions; track tab) {
          <button class="tab" [class.tab--active]="activeTab() === tab" (click)="activeTab.set(tab)">
            {{ tab === 'combined' ? 'All Records' : tab === 'internal' ? 'Internal' : 'External' }}
            <span class="tab__count">({{ countFor(tab) }})</span>
          </button>
        }
      </div>

      <div class="table-wrapper">
        <table class="table">
          <thead>
            <tr>
              <th>ID</th><th>Source</th><th>Date</th><th>Description</th>
              <th class="text-right">Amount</th><th>Reference</th><th>Status</th>
              <th>Matched With</th><th>Notes</th>
            </tr>
          </thead>
          <tbody>
            @for (record of displayData(); track record.id) {
              <tr [class]="'row row--' + (record.status ?? 'none')">
                <td class="mono id-cell">{{ record.id }}</td>
                <td><span [class]="'source-badge source-badge--' + record.source">{{ record.source }}</span></td>
                <td class="nowrap">{{ record.date }}</td>
                <td>{{ record.description }}</td>
                <td class="text-right mono amount-cell">\${{ record.amount.toLocaleString('en-US', { minimumFractionDigits: 2 }) }}</td>
                <td class="mono ref-cell">{{ record.reference }}</td>
                <td>
                  @if (record.status) {
                    <span [class]="'status-badge status-badge--' + record.status">{{ record.status }}</span>
                  } @else {
                    <span class="muted">-</span>
                  }
                </td>
                <td class="mono muted">{{ record.matchedWith || '-' }}</td>
                <td [class]="'notes-cell ' + (record.status === 'discrepancy' ? 'notes-cell--warning' : 'muted')">
                  {{ record.discrepancyNote || '-' }}
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>

      <div class="footer">
        <div><span class="muted">Internal Total: </span><span class="total total--internal">\${{ totals().internal.toLocaleString('en-US', { minimumFractionDigits: 2 }) }}</span></div>
        <div><span class="muted">External Total: </span><span class="total total--external">\${{ totals().external.toLocaleString('en-US', { minimumFractionDigits: 2 }) }}</span></div>
        <div><span class="muted">Difference: </span><span [class]="'total ' + (Math.abs(totals().internal - totals().external) < 0.01 ? 'total--ok' : 'total--bad')">\${{ Math.abs(totals().internal - totals().external).toLocaleString('en-US', { minimumFractionDigits: 2 }) }}</span></div>
      </div>
    </div>
  `,
  styles: [`
    .container { height: 100%; display: flex; flex-direction: column; background: #0d1117; color: #c9d1d9; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif; font-size: 13px; box-sizing: border-box; }
    .stats-bar { padding: 10px 20px; background: #161b22; border-bottom: 1px solid #30363d; display: flex; gap: 24px; font-size: 13px; }
    .stat { display: flex; align-items: center; gap: 6px; }
    .dot--matched { color: #3fb950; }
    .dot--discrepancy { color: #d29922; }
    .dot--unmatched { color: #f85149; }
    .status-message { padding: 8px 20px; background: #1f6feb22; border-bottom: 1px solid #1f6feb44; color: #58a6ff; font-size: 12px; }
    .tabs { display: flex; border-bottom: 1px solid #30363d; background: #161b22; }
    .tab { padding: 10px 16px; background: transparent; border: none; border-bottom: 2px solid transparent; color: #8b949e; cursor: pointer; font-size: 13px; font-weight: 500; }
    .tab--active { color: #f0f6fc; border-bottom-color: #1f6feb; }
    .tab__count { margin-left: 6px; color: #8b949e; }
    .table-wrapper { flex: 1; overflow: auto; }
    .table { width: 100%; border-collapse: collapse; font-size: 12px; }
    th { position: sticky; top: 0; background: #161b22; padding: 10px 12px; text-align: left; font-weight: 600; color: #8b949e; border-bottom: 1px solid #30363d; white-space: nowrap; }
    td { padding: 10px 12px; border-bottom: 1px solid #21262d; vertical-align: top; }
    .text-right { text-align: right; }
    .nowrap { white-space: nowrap; }
    .mono { font-family: monospace; }
    .id-cell { color: #58a6ff; }
    .amount-cell { font-weight: 500; }
    .ref-cell { font-size: 11px; }
    .muted { color: #8b949e; }
    .notes-cell { max-width: 250px; }
    .notes-cell--warning { color: #d29922; }
    .row--matched { background: rgba(35, 134, 54, 0.15); }
    .row--discrepancy { background: rgba(158, 106, 3, 0.15); }
    .row--unmatched { background: rgba(218, 54, 51, 0.15); }
    .source-badge { display: inline-block; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: 500; text-transform: uppercase; }
    .source-badge--internal { background: #1f6feb22; color: #58a6ff; }
    .source-badge--external { background: #8b5cf622; color: #a78bfa; }
    .status-badge { display: inline-block; padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: 500; text-transform: capitalize; }
    .status-badge--matched { background: #23863633; color: #3fb950; }
    .status-badge--discrepancy { background: #9e6a0333; color: #d29922; }
    .status-badge--unmatched { background: #da363333; color: #f85149; }
    .footer { padding: 12px 20px; border-top: 1px solid #30363d; background: #161b22; display: flex; justify-content: space-between; font-size: 12px; }
    .total { font-weight: 600; }
    .total--internal { color: #58a6ff; }
    .total--external { color: #a78bfa; }
    .total--ok { color: #3fb950; }
    .total--bad { color: #f85149; }
  `],
})
export class DataReconciliationGridComponent {
  readonly Math = Math;
  readonly tabOptions = ['combined', 'internal', 'external'] as const;

  private internalData = signal<TransactionRecord[]>(sampleInternalData);
  private externalData = signal<TransactionRecord[]>(sampleExternalData);
  reconciliationRun = signal(false);
  activeTab = signal<'combined' | 'internal' | 'external'>('combined');
  statusMessage = signal('Click "Run Reconciliation" in chat to match records');

  private combinedData = computed(() => [...this.internalData(), ...this.externalData()]);

  displayData = computed(() => {
    switch (this.activeTab()) {
      case 'internal': return this.internalData();
      case 'external': return this.externalData();
      default: return this.combinedData();
    }
  });

  stats = computed(() => {
    const internal = this.internalData();
    const external = this.externalData();
    return {
      matched: internal.filter((r) => r.status === 'matched').length,
      discrepancies: internal.filter((r) => r.status === 'discrepancy').length,
      unmatched: internal.filter((r) => r.status === 'unmatched').length + external.filter((r) => r.status === 'unmatched').length,
    };
  });

  totals = computed(() => ({
    internal: this.internalData().reduce((sum, r) => sum + r.amount, 0),
    external: this.externalData().reduce((sum, r) => sum + r.amount, 0),
  }));

  countFor(tab: 'combined' | 'internal' | 'external'): number {
    if (tab === 'internal') return this.internalData().length;
    if (tab === 'external') return this.externalData().length;
    return this.combinedData().length;
  }

  runReconciliation(): ReconciliationResult {
    const updatedInternal = this.internalData().map((r) => ({ ...r }));
    const updatedExternal = this.externalData().map((r) => ({ ...r }));

    let matched = 0, discrepancies = 0, unmatched = 0;

    updatedInternal.forEach((intRecord) => {
      const extMatch = updatedExternal.find((ext) => ext.reference === intRecord.reference);
      if (extMatch) {
        if (Math.abs(intRecord.amount - extMatch.amount) < 0.01) {
          intRecord.status = 'matched';
          intRecord.matchedWith = extMatch.id;
          extMatch.status = 'matched';
          extMatch.matchedWith = intRecord.id;
          matched++;
        } else {
          intRecord.status = 'discrepancy';
          intRecord.matchedWith = extMatch.id;
          intRecord.discrepancyNote = `Amount mismatch: Internal $${intRecord.amount.toFixed(2)} vs External $${extMatch.amount.toFixed(2)} (Diff: $${Math.abs(intRecord.amount - extMatch.amount).toFixed(2)})`;
          extMatch.status = 'discrepancy';
          extMatch.matchedWith = intRecord.id;
          extMatch.discrepancyNote = intRecord.discrepancyNote;
          discrepancies++;
        }
      } else {
        intRecord.status = 'unmatched';
        intRecord.discrepancyNote = 'No matching external record found';
        unmatched++;
      }
    });

    updatedExternal.forEach((extRecord) => {
      if (!extRecord.status) {
        extRecord.status = 'unmatched';
        extRecord.discrepancyNote = 'No matching internal record found';
        unmatched++;
      }
    });

    this.internalData.set(updatedInternal);
    this.externalData.set(updatedExternal);
    this.reconciliationRun.set(true);

    const totalInternal = updatedInternal.reduce((sum, r) => sum + r.amount, 0);
    const totalExternal = updatedExternal.reduce((sum, r) => sum + r.amount, 0);
    this.statusMessage.set(`Reconciliation complete: ${matched} matched, ${discrepancies} discrepancies, ${unmatched} unmatched`);

    return { matched, unmatched, discrepancies, totalInternal, totalExternal, amountDifference: totalInternal - totalExternal };
  }

  getReconciliationStatus(): ReconciliationResult {
    const s = this.stats();
    const t = this.totals();
    return { ...s, totalInternal: t.internal, totalExternal: t.external, amountDifference: t.internal - t.external };
  }

  highlightDiscrepancies(): string[] {
    const ids = this.combinedData().filter((r) => r.status === 'discrepancy' || r.status === 'unmatched').map((r) => r.id);
    this.statusMessage.set(`Found ${ids.length} records with issues`);
    return ids;
  }

  highlightMatches(): string[] {
    const ids = this.combinedData().filter((r) => r.status === 'matched').map((r) => r.id);
    this.statusMessage.set(`Found ${ids.length} matched records`);
    return ids;
  }

  getUnmatchedRecords(): TransactionRecord[] {
    return this.combinedData().filter((r) => r.status === 'unmatched');
  }

  getDiscrepancies(): TransactionRecord[] {
    return this.combinedData().filter((r) => r.status === 'discrepancy');
  }

  explainRecord(recordId: string): string {
    const record = this.combinedData().find((r) => r.id === recordId);
    if (!record) return `Record ${recordId} not found`;

    let explanation = `Record: ${record.id}\n`;
    explanation += `Source: ${record.source === 'internal' ? 'Internal (Company)' : 'External (Bank)'}\n`;
    explanation += `Date: ${record.date}\n`;
    explanation += `Description: ${record.description}\n`;
    explanation += `Amount: $${record.amount.toFixed(2)}\n`;
    explanation += `Reference: ${record.reference}\n`;

    if (record.status) {
      explanation += `\nStatus: ${record.status.toUpperCase()}\n`;
      if (record.matchedWith) explanation += `Matched with: ${record.matchedWith}\n`;
      if (record.discrepancyNote) explanation += `Issue: ${record.discrepancyNote}\n`;
    } else {
      explanation += `\nStatus: Not yet reconciled\n`;
    }
    return explanation;
  }

  addNote(recordId: string, note: string): void {
    this.internalData.update((prev) => prev.map((r) => (r.id === recordId ? { ...r, discrepancyNote: note } : r)));
    this.externalData.update((prev) => prev.map((r) => (r.id === recordId ? { ...r, discrepancyNote: note } : r)));
    this.statusMessage.set(`Note added to ${recordId}`);
  }

  getAllData(): { internal: TransactionRecord[]; external: TransactionRecord[] } {
    return { internal: this.internalData(), external: this.externalData() };
  }

  resetData(): void {
    this.internalData.set(sampleInternalData.map((r) => ({ ...r, status: undefined, matchedWith: undefined, discrepancyNote: undefined })));
    this.externalData.set(sampleExternalData.map((r) => ({ ...r, status: undefined, matchedWith: undefined, discrepancyNote: undefined })));
    this.reconciliationRun.set(false);
    this.statusMessage.set('Data reset - ready for new reconciliation');
  }
}
