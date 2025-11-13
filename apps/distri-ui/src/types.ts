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
