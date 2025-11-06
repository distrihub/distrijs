import { useEffect, useState, useCallback, useMemo } from "react"
import { useSpreadsheetStoreWithAuth } from "@/hooks/useSpreadsheetStore"
import { loadCachedData } from "@/stores/sheet"
import { Button } from "../ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs"
import { Loader2, RefreshCw } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { VirtualizedTable } from "./VirtualizedTable"
import { useRangeContextStore } from "@/stores/rangeContext"
import { RowSelectionState } from '@tanstack/react-table'
import { useSpreadsheetStore } from "@/stores/sheet"

export interface DataComponentProps {
  setSelectedCell: (cell: string) => void
  spreadsheetId: string
  onCurrentSheetChange?: (sheetId: number, sheetTitle: string) => void
}

export const DataComponent = ({
  setSelectedCell,
  spreadsheetId,
  onCurrentSheetChange
}: DataComponentProps) => {
  const {
    isSyncing,
    error,
    metadata,
    sync,
    get_values,
    addRows,
    addColumns,
  } = useSpreadsheetStoreWithAuth()

  // Use Zustand store for range context
  const {
    selectedRange,
    contextRanges,
    isSelecting,
    setSelectedRange
  } = useRangeContextStore()

  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})

  const [activeTab, setActiveTab] = useState<string | null>(null)
  const [tabs, setTabs] = useState<{ id: string, title: string }[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedCell, setSelectedCellState] = useState<{ row: number; col: number } | null>(null)

  const lastSynced = metadata?.lastSynced || null

  // Load cached data when spreadsheetId changes
  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const loaded = await loadCachedData(spreadsheetId)
        if (!loaded) {
          const lastSynced = getLastSyncedTime()
          if (!lastSynced) {
            await handleSync()
          }
        }
      } catch (error) {
        console.error('Error loading cached data:', error)
      } finally {
        setLoading(false)
      }
    }
    if (spreadsheetId) {
      // Load cached data from IndexedDB or sync if first time
      load()
    }

  }, [spreadsheetId])


  // Set active tab to first sheet when metadata loads
  useEffect(() => {
    if (metadata?.sheets.length && !activeTab) {

      setTabs(metadata.sheets.map(s => ({ id: s.properties.sheetId.toString(), title: s.properties.title })))
      const firstSheetId = metadata.sheets[0].properties.sheetId.toString()
      setActiveTab(firstSheetId)

      // Notify parent component of initial sheet
      if (onCurrentSheetChange) {
        onCurrentSheetChange(metadata.sheets[0].properties.sheetId, metadata.sheets[0].properties.title)
      }
    }
  }, [metadata, onCurrentSheetChange]) // Remove activeTab from dependencies to prevent infinite loops

  const handleSync = async () => {
    // Prevent multiple simultaneous syncs
    if (isSyncing) {
      console.log('Sync already in progress, skipping...')
      return
    }
    await sync()
  }

  const handleAddRow = () => {
    if (!activeTab) return
    addRows(parseInt(activeTab), 1)
  }

  const handleAddColumn = () => {
    if (!activeTab) return
    addColumns(parseInt(activeTab), 1)
  }



  const handleTabChange = (sheetId: string) => {
    setActiveTab(sheetId)
    // Notify parent component of current sheet change
    if (onCurrentSheetChange) {
      const sheet = metadata?.sheets.find(s => s.properties.sheetId.toString() === sheetId)
      if (sheet) {
        onCurrentSheetChange(sheet.properties.sheetId, sheet.properties.title)
      }
    }
  }

  const getLastSyncedTime = (): string | null => {
    return metadata?.lastSynced || null
  }

  const formatTimeAgo = (dateString: string): string => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true })
    } catch (error) {
      console.error('Error formatting date:', error)
      return 'Unknown time'
    }
  }


  const renderTabs = () => {
    if (!metadata?.sheets.length) {
      return null
    }
    if (!activeTab) {
      return null
    }

    return (
      <Tabs
        value={activeTab}
        onValueChange={handleTabChange}
        className="flex-1 flex flex-col min-h-0 h-full"
      >
        <div className="flex-1 overflow-hidden min-h-0">
          <TabsContent
            key={activeTab}
            value={activeTab}
            className="h-full mt-0 overflow-hidden min-h-0"
          >
            <div className="h-full overflow-auto min-h-0">
              {renderSheetContent(activeTab)}
            </div>
          </TabsContent>
        </div>

        <div className="flex items-center flex-shrink-0 justify-between bg-secondary">
          <TabsList className="flex">
            {metadata.sheets.map((sheet) => (
              <TabsTrigger
                key={sheet.properties.sheetId}
                value={sheet.properties.sheetId.toString()}
                className="flex items-center gap-1 text-xs"
              >
                <span className="truncate">{sheet.properties.title}</span>
              </TabsTrigger>
            ))}
          </TabsList>
          <div className="flex items-center gap-2">
            {getLastSyncedTime() && (
              <span className="text-xs text-muted-foreground">
                {formatTimeAgo(getLastSyncedTime()!)}
              </span>
            )}
            <Button
              onClick={handleSync}
              disabled={isSyncing || loading || !spreadsheetId}
              variant={"outline"}
              size="sm"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing || loading ? 'animate-spin' : ''}`} />
            </Button>
            <Button onClick={handleAddRow} variant="outline" size="sm">+Row</Button>
            <Button onClick={handleAddColumn} variant="outline" size="sm">+Col</Button>
          </div>
        </div>


      </Tabs>
    )
  }

  const handleCellSelect = useCallback((row: number, col: number, value: any) => {
    console.log('handleCellSelect', row, col, value)
    setSelectedCellState({ row, col })
    setSelectedCell(toA1(row, col))
  }, [setSelectedCell])

  const handleRangeSelect = useCallback((range: { startRow: number; startCol: number; endRow: number; endCol: number } | null) => {
    console.log('DataComponent: handleRangeSelect called with', range)

    // Check if this is a clear signal (null or all -1 values)
    if (!range || (range.startRow === -1 && range.startCol === -1 && range.endRow === -1 && range.endCol === -1)) {
      console.log('DataComponent: clearing selection')
      setSelectedRange?.(null)
      setSelectedCellState(null) // Clear the local cell selection state
      setSelectedCell('') // Clear the cell string
    } else {
      // Only update if the range actually changed
      const currentRange = selectedRange
      if (!currentRange ||
        currentRange.startRow !== range.startRow ||
        currentRange.startCol !== range.startCol ||
        currentRange.endRow !== range.endRow ||
        currentRange.endCol !== range.endCol) {
        console.log('DataComponent: setting selectedRange to', range)
        setSelectedRange?.(range)
      }
    }
  }, [setSelectedRange, setSelectedCell, selectedRange])

  const renderSheetContent = useMemo(() => {
    return (tab: string) => {
      // Find the actual sheet ID from metadata instead of parsing the tab string
      const sheet = metadata?.sheets.find(s => s.properties.sheetId.toString() === tab)
      const actualSheetId = sheet?.properties.sheetId

      if (isSyncing || loading) return <div className="h-full flex items-center justify-center text-muted-foreground">
        Loading data...
      </div>

      // Get the actual cell objects from the store
      const { sheetData } = useSpreadsheetStore.getState()

      // Handle the case where actualSheetId is 0 but not in store - use first available sheet
      let sheetDataObj = actualSheetId ? sheetData[actualSheetId as any] : null
      if (!sheetDataObj && actualSheetId === 0) {
        // Try to find the first available sheet
        const firstSheetKey = Object.keys(sheetData)[0]
        if (firstSheetKey) {
          sheetDataObj = sheetData[firstSheetKey as any]
        }
      }

      if (!sheetDataObj) {
        return (
          <div className="h-full flex items-center justify-center text-muted-foreground">
            No data available for this sheet
          </div>
        )
      }

      const cellObjects: any[][] = []

      // Create the cell objects array
      for (let row = 0; row <= sheetDataObj.maxRow; row++) {
        const rowData: any[] = []
        for (let col = 0; col <= sheetDataObj.maxCol; col++) {
          const cellKey = `${row}:${col}`
          const cell = sheetDataObj.cellIndex[cellKey]
          rowData.push(cell || null)
        }
        cellObjects.push(rowData)
      }

      // Check if we have any data
      if (cellObjects.length === 0 || (cellObjects.length === 1 && cellObjects[0].length === 0)) {
        return (
          <div className="h-full flex items-center justify-center text-muted-foreground">
            No data available
          </div>
        )
      }

      return (
        <div className="h-full w-full overflow-auto min-h-0" style={{ height: '100%' }}>
          <VirtualizedTable
            data={cellObjects}
            onCellSelect={handleCellSelect}
            onRangeSelect={handleRangeSelect}
            selectedCell={selectedCell}
            selectedRange={selectedRange}
            contextRanges={contextRanges}
            externalIsSelecting={isSelecting}
            rowSelection={rowSelection}
            onRowSelectionChange={setRowSelection}
            className="h-full w-full"
            onDragFill={(start, end) => {
              console.log('Drag fill placeholder', start, end)
            }}
          />
        </div>
      )
    }
  }, [isSyncing, loading, handleCellSelect, handleRangeSelect, selectedCell, selectedRange, contextRanges, isSelecting, rowSelection, setRowSelection])

  const renderError = () => {
    if (!error) return null

    return (
      <div className="p-4 mb-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
        Error: {error}
      </div>
    )
  }

  const renderSyncing = () => {
    if (!isSyncing) return null

    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="flex items-center gap-2">
            <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
            <span className="text-blue-600 font-medium">Syncing spreadsheet data...</span>
          </div>
          <p className="text-sm text-muted-foreground">This may take a few moments</p>
        </div>
      </div>
    )
  }

  const renderNoData = () => {
    if (metadata || isSyncing || loading) return null

    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center space-y-4">
          <Button onClick={handleSync} disabled={!spreadsheetId || isSyncing || loading}>
            Sync Data
          </Button>
        </div>
      </div>
    )
  }

  if (isSyncing) {
    return renderSyncing()
  }
  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
        </div>
      </div>
    )
  }
  return (
    <div className="h-full flex flex-col overflow-hidden">
      {renderError()}

      <div className="flex-1 overflow-hidden min-h-0">
        {renderNoData() || renderTabs()}
      </div>
    </div>
  )
}

const toA1 = (row: number, col: number) => `${columnToLetter(col)}${row + 1}`

const columnToLetter = (col: number) => {
  let temp = col + 1
  let letter = ''
  while (temp > 0) {
    const mod = (temp - 1) % 26
    letter = String.fromCharCode(65 + mod) + letter
    temp = Math.floor((temp - 1) / 26)
  }
  return letter
}
