export interface SpreadSheetEnrichment {
  cell: string
  enrichment_id: string
  input: any
  formula: string
}

export interface ContextRange {
  id: string
  range: { startRow: number; startCol: number; endRow: number; endCol: number }
  type: 'input' | 'output'
  name: string
  a1Notation: string
  sheetId: number
  sheetTitle: string
}

export interface GetEnrichmentsResponse {
  success: boolean
  enrichments: SpreadSheetEnrichment[]
  sheet: string
  sheet_id: string
}

export interface Enrichment {
  id: string
  name: string
  instructions: string
  model?: string
  is_draft: boolean
  created_at: string
}


function uuidv4() {
  if (typeof crypto?.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = Math.random() * 16 | 0;
    const v = c == 'x' ? r : (r & 0x3 | 8);
    return v.toString(16);
  });
}