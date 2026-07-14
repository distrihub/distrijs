import { forwardRef, useImperativeHandle, useState, useCallback, useMemo } from 'react';

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

export interface DataReconciliationGridRef {
  loadInternalData: (data: TransactionRecord[]) => void;
  loadExternalData: (data: TransactionRecord[]) => void;
  runReconciliation: () => ReconciliationResult;
  getReconciliationStatus: () => ReconciliationResult;
  highlightDiscrepancies: () => string[];
  highlightMatches: () => string[];
  clearHighlights: () => void;
  getUnmatchedRecords: () => TransactionRecord[];
  getDiscrepancies: () => TransactionRecord[];
  explainRecord: (recordId: string) => string;
  addNote: (recordId: string, note: string) => void;
  getAllData: () => { internal: TransactionRecord[]; external: TransactionRecord[] };
  resetData: () => void;
}

// Sample internal data (e.g., company records)
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

// Sample external data (e.g., bank statement) - with some discrepancies
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

const styles = {
  container: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column' as const,
    background: '#0d1117',
    color: '#c9d1d9',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif',
    fontSize: '13px',
  },
  stat: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  tabs: {
    display: 'flex',
    borderBottom: '1px solid #30363d',
    background: '#161b22',
  },
  tab: {
    padding: '10px 16px',
    background: 'transparent',
    border: 'none',
    borderBottom: '2px solid transparent',
    color: '#8b949e',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: 500,
    transition: 'all 0.15s',
  },
  activeTab: {
    color: '#f0f6fc',
    borderBottomColor: '#1f6feb',
  },
  tableWrapper: {
    flex: 1,
    overflow: 'auto',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse' as const,
    fontSize: '12px',
  },
  th: {
    position: 'sticky' as const,
    top: 0,
    background: '#161b22',
    padding: '10px 12px',
    textAlign: 'left' as const,
    fontWeight: 600,
    color: '#8b949e',
    borderBottom: '1px solid #30363d',
    whiteSpace: 'nowrap' as const,
  },
  td: {
    padding: '10px 12px',
    borderBottom: '1px solid #21262d',
    verticalAlign: 'top' as const,
  },
  footer: {
    padding: '12px 20px',
    borderTop: '1px solid #30363d',
    background: '#161b22',
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '12px',
  },
};

const StatusBadge = ({ status }: { status?: string }) => {
  if (!status) return <span style={{ color: '#8b949e' }}>-</span>;

  const colors: Record<string, { bg: string; text: string }> = {
    matched: { bg: '#238636', text: '#3fb950' },
    discrepancy: { bg: '#9e6a03', text: '#d29922' },
    unmatched: { bg: '#da3633', text: '#f85149' },
  };

  const color = colors[status] || { bg: '#30363d', text: '#8b949e' };

  return (
    <span style={{
      display: 'inline-block',
      padding: '2px 8px',
      borderRadius: '12px',
      background: color.bg + '33',
      color: color.text,
      fontSize: '11px',
      fontWeight: 500,
      textTransform: 'capitalize',
    }}>
      {status}
    </span>
  );
};

const DataReconciliationGrid = forwardRef<DataReconciliationGridRef>((_, ref) => {
  const [internalData, setInternalData] = useState<TransactionRecord[]>(sampleInternalData);
  const [externalData, setExternalData] = useState<TransactionRecord[]>(sampleExternalData);
  const [reconciliationRun, setReconciliationRun] = useState(false);
  const [activeTab, setActiveTab] = useState<'combined' | 'internal' | 'external'>('combined');
  const [statusMessage, setStatusMessage] = useState<string>('Click "Run Reconciliation" in chat to match records');

  const runReconciliation = useCallback((): ReconciliationResult => {
    const updatedInternal = internalData.map(r => ({ ...r }));
    const updatedExternal = externalData.map(r => ({ ...r }));

    let matched = 0;
    let discrepancies = 0;
    let unmatched = 0;

    updatedInternal.forEach(intRecord => {
      const extMatch = updatedExternal.find(ext => ext.reference === intRecord.reference);

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

    updatedExternal.forEach(extRecord => {
      if (!extRecord.status) {
        extRecord.status = 'unmatched';
        extRecord.discrepancyNote = 'No matching internal record found';
        unmatched++;
      }
    });

    setInternalData(updatedInternal);
    setExternalData(updatedExternal);
    setReconciliationRun(true);

    const totalInternal = updatedInternal.reduce((sum, r) => sum + r.amount, 0);
    const totalExternal = updatedExternal.reduce((sum, r) => sum + r.amount, 0);

    setStatusMessage(`Reconciliation complete: ${matched} matched, ${discrepancies} discrepancies, ${unmatched} unmatched`);

    return {
      matched,
      unmatched,
      discrepancies,
      totalInternal,
      totalExternal,
      amountDifference: totalInternal - totalExternal
    };
  }, [internalData, externalData]);

  const combinedData = useMemo(() => [...internalData, ...externalData], [internalData, externalData]);

  const displayData = useMemo(() => {
    switch (activeTab) {
      case 'internal': return internalData;
      case 'external': return externalData;
      default: return combinedData;
    }
  }, [activeTab, internalData, externalData, combinedData]);

  const stats = useMemo(() => {
    const matched = internalData.filter(r => r.status === 'matched').length;
    const discrepancies = internalData.filter(r => r.status === 'discrepancy').length;
    const unmatchedInt = internalData.filter(r => r.status === 'unmatched').length;
    const unmatchedExt = externalData.filter(r => r.status === 'unmatched').length;
    return { matched, discrepancies, unmatched: unmatchedInt + unmatchedExt };
  }, [internalData, externalData]);

  const totals = useMemo(() => ({
    internal: internalData.reduce((sum, r) => sum + r.amount, 0),
    external: externalData.reduce((sum, r) => sum + r.amount, 0),
  }), [internalData, externalData]);

  useImperativeHandle(ref, () => ({
    loadInternalData: (data: TransactionRecord[]) => {
      setInternalData(data.map(d => ({ ...d, source: 'internal' as const, status: undefined })));
      setReconciliationRun(false);
      setStatusMessage('Internal data loaded - ready for reconciliation');
    },
    loadExternalData: (data: TransactionRecord[]) => {
      setExternalData(data.map(d => ({ ...d, source: 'external' as const, status: undefined })));
      setReconciliationRun(false);
      setStatusMessage('External data loaded - ready for reconciliation');
    },
    runReconciliation,
    getReconciliationStatus: () => ({
      ...stats,
      totalInternal: totals.internal,
      totalExternal: totals.external,
      amountDifference: totals.internal - totals.external
    }),
    highlightDiscrepancies: () => {
      const ids = [...internalData, ...externalData]
        .filter(r => r.status === 'discrepancy' || r.status === 'unmatched')
        .map(r => r.id);
      setStatusMessage(`Found ${ids.length} records with issues`);
      return ids;
    },
    highlightMatches: () => {
      const ids = [...internalData, ...externalData]
        .filter(r => r.status === 'matched')
        .map(r => r.id);
      setStatusMessage(`Found ${ids.length} matched records`);
      return ids;
    },
    clearHighlights: () => setStatusMessage(''),
    getUnmatchedRecords: () => [...internalData, ...externalData].filter(r => r.status === 'unmatched'),
    getDiscrepancies: () => [...internalData, ...externalData].filter(r => r.status === 'discrepancy'),
    explainRecord: (recordId: string) => {
      const record = [...internalData, ...externalData].find(r => r.id === recordId);
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
    },
    addNote: (recordId: string, note: string) => {
      setInternalData(prev => prev.map(r => r.id === recordId ? { ...r, discrepancyNote: note } : r));
      setExternalData(prev => prev.map(r => r.id === recordId ? { ...r, discrepancyNote: note } : r));
      setStatusMessage(`Note added to ${recordId}`);
    },
    getAllData: () => ({ internal: internalData, external: externalData }),
    resetData: () => {
      setInternalData(sampleInternalData.map(r => ({ ...r, status: undefined, matchedWith: undefined, discrepancyNote: undefined })));
      setExternalData(sampleExternalData.map(r => ({ ...r, status: undefined, matchedWith: undefined, discrepancyNote: undefined })));
      setReconciliationRun(false);
      setStatusMessage('Data reset - ready for new reconciliation');
    }
  }), [internalData, externalData, runReconciliation, stats, totals]);

  const getRowStyle = (status?: string) => {
    if (!status) return {};
    const colors: Record<string, string> = {
      matched: 'rgba(35, 134, 54, 0.15)',
      discrepancy: 'rgba(158, 106, 3, 0.15)',
      unmatched: 'rgba(218, 54, 51, 0.15)',
    };
    return { background: colors[status] || 'transparent' };
  };

  return (
    <div style={styles.container}>
      {reconciliationRun && (
        <div style={{
          padding: '10px 20px',
          background: '#161b22',
          borderBottom: '1px solid #30363d',
          display: 'flex',
          gap: '24px',
          fontSize: '13px',
        }}>
          <div style={styles.stat}>
            <span style={{ color: '#3fb950' }}>●</span>
            <span>{stats.matched} Matched</span>
          </div>
          <div style={styles.stat}>
            <span style={{ color: '#d29922' }}>●</span>
            <span>{stats.discrepancies} Discrepancies</span>
          </div>
          <div style={styles.stat}>
            <span style={{ color: '#f85149' }}>●</span>
            <span>{stats.unmatched} Unmatched</span>
          </div>
        </div>
      )}

      {statusMessage && (
        <div style={{
          padding: '8px 20px',
          background: '#1f6feb22',
          borderBottom: '1px solid #1f6feb44',
          color: '#58a6ff',
          fontSize: '12px',
        }}>
          {statusMessage}
        </div>
      )}

      <div style={styles.tabs}>
        {(['combined', 'internal', 'external'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              ...styles.tab,
              ...(activeTab === tab ? styles.activeTab : {}),
            }}
          >
            {tab === 'combined' ? 'All Records' : tab === 'internal' ? 'Internal' : 'External'}
            <span style={{ marginLeft: '6px', color: '#8b949e' }}>
              ({tab === 'combined' ? combinedData.length : tab === 'internal' ? internalData.length : externalData.length})
            </span>
          </button>
        ))}
      </div>

      <div style={styles.tableWrapper}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>ID</th>
              <th style={styles.th}>Source</th>
              <th style={styles.th}>Date</th>
              <th style={styles.th}>Description</th>
              <th style={{ ...styles.th, textAlign: 'right' }}>Amount</th>
              <th style={styles.th}>Reference</th>
              <th style={styles.th}>Status</th>
              <th style={styles.th}>Matched With</th>
              <th style={styles.th}>Notes</th>
            </tr>
          </thead>
          <tbody>
            {displayData.map(record => (
              <tr key={record.id} style={getRowStyle(record.status)}>
                <td style={{ ...styles.td, fontFamily: 'monospace', color: '#58a6ff' }}>{record.id}</td>
                <td style={styles.td}>
                  <span style={{
                    display: 'inline-block',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    background: record.source === 'internal' ? '#1f6feb22' : '#8b5cf622',
                    color: record.source === 'internal' ? '#58a6ff' : '#a78bfa',
                    fontSize: '10px',
                    fontWeight: 500,
                    textTransform: 'uppercase',
                  }}>
                    {record.source}
                  </span>
                </td>
                <td style={{ ...styles.td, whiteSpace: 'nowrap' }}>{record.date}</td>
                <td style={styles.td}>{record.description}</td>
                <td style={{ ...styles.td, textAlign: 'right', fontFamily: 'monospace', fontWeight: 500 }}>
                  ${record.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </td>
                <td style={{ ...styles.td, fontFamily: 'monospace', fontSize: '11px' }}>{record.reference}</td>
                <td style={styles.td}><StatusBadge status={record.status} /></td>
                <td style={{ ...styles.td, fontFamily: 'monospace', color: '#8b949e' }}>{record.matchedWith || '-'}</td>
                <td style={{ ...styles.td, maxWidth: '250px', color: record.status === 'discrepancy' ? '#d29922' : '#8b949e' }}>
                  {record.discrepancyNote || '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={styles.footer}>
        <div>
          <span style={{ color: '#8b949e' }}>Internal Total: </span>
          <span style={{ fontWeight: 600, color: '#58a6ff' }}>
            ${totals.internal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </span>
        </div>
        <div>
          <span style={{ color: '#8b949e' }}>External Total: </span>
          <span style={{ fontWeight: 600, color: '#a78bfa' }}>
            ${totals.external.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </span>
        </div>
        <div>
          <span style={{ color: '#8b949e' }}>Difference: </span>
          <span style={{
            fontWeight: 600,
            color: Math.abs(totals.internal - totals.external) < 0.01 ? '#3fb950' : '#f85149',
          }}>
            ${Math.abs(totals.internal - totals.external).toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </span>
        </div>
      </div>
    </div>
  );
});

DataReconciliationGrid.displayName = 'DataReconciliationGrid';

export default DataReconciliationGrid;
