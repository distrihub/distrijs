import React, { useMemo, useCallback, useRef, useState, useEffect } from 'react'
import { useReactTable, getCoreRowModel, flexRender, ColumnDef, RowSelectionState } from '@tanstack/react-table'
import { useVirtualizer } from '@tanstack/react-virtual'
import { cn } from '@/lib/utils'
import { ContextRange } from '@/types'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { SpreadsheetCell } from '@/lib/database'

interface VirtualizedTableProps {
  data: any[][]
  onCellSelect?: (row: number, col: number, value: any) => void
  onRangeSelect?: (range: { startRow: number; startCol: number; endRow: number; endCol: number } | null) => void
  selectedCell?: { row: number; col: number } | null
  selectedRange?: { startRow: number; startCol: number; endRow: number; endCol: number } | null
  contextRanges?: ContextRange[]
  outputMode?: boolean
  externalIsSelecting?: boolean
  className?: string
  rowSelection?: RowSelectionState
  onRowSelectionChange?: (updater: RowSelectionState | ((old: RowSelectionState) => RowSelectionState)) => void
  onDragFill?: (start: { row: number; col: number }, end: { row: number; col: number }) => void
}

// Helper function to render cell value based on type
const renderCellValue = (cell: SpreadsheetCell): { displayValue: string; tooltipValue: string; type: string; hasTooltip: boolean; hasError: boolean } => {
  // Handle null/undefined cells
  if (!cell) {
    return { displayValue: '', tooltipValue: 'Empty cell', type: 'empty', hasTooltip: false, hasError: false }
  }

  // Check if it's a formula
  if (cell.formula) {
    return {
      displayValue: cell.formattedValue || String(cell.value || ''),
      tooltipValue: `Formula: ${cell.formula}`,
      type: 'formula',
      hasTooltip: true,
      hasError: false
    }
  }

  // Check for error value
  if (cell.errorValue) {
    return {
      displayValue: String(cell.errorValue),
      tooltipValue: `Error: ${cell.errorValue}`,
      type: 'error',
      hasTooltip: true,
      hasError: true
    }
  }

  // Handle different value types
  const cellValue = cell.value;

  if (typeof cellValue === 'number') {
    return {
      displayValue: cell.formattedValue || String(cellValue),
      tooltipValue: '',
      type: 'number',
      hasTooltip: false,
      hasError: false
    }
  }

  if (typeof cellValue === 'boolean') {
    return {
      displayValue: cellValue ? 'TRUE' : 'FALSE',
      tooltipValue: '',
      type: 'boolean',
      hasTooltip: false,
      hasError: false
    }
  }

  if (typeof cellValue === 'string') {
    const cleanValue = cellValue.trim().replace(/\n+/g, '\n').replace(/\n$/, '');
    // Only show tooltip for strings with newlines or very long strings (over 100 chars)
    const hasTooltip = cleanValue.includes('\n') || cleanValue.length > 100;
    // Check for error indicators (like #ERROR!, #N/A, etc.)
    const hasError = /^#[A-Z_]+!?$/.test(cleanValue);

    return {
      displayValue: cleanValue,
      tooltipValue: hasTooltip ? cleanValue : '',
      type: 'string',
      hasTooltip,
      hasError
    }
  }

  // Fallback for other types (including null)
  return {
    displayValue: cell.formattedValue || String(cellValue || ''),
    tooltipValue: '',
    type: cell.valueType || 'unknown',
    hasTooltip: false,
    hasError: false
  }
}

export const VirtualizedTable: React.FC<VirtualizedTableProps> = ({
  data,
  onCellSelect,
  onRangeSelect,
  selectedCell,
  selectedRange,
  contextRanges,
  outputMode = false,
  externalIsSelecting = false,
  className,
  rowSelection = {},
  onRowSelectionChange,
}) => {
  const tableContainerRef = useRef<HTMLDivElement>(null)
  const [columnWidths, setColumnWidths] = useState<number[]>([])
  const [focusedCell, setFocusedCell] = useState<{ row: number; col: number } | null>(null)
  const [dragStart, setDragStart] = useState<{ row: number; col: number } | null>(null)
  const [hasDragged, setHasDragged] = useState(false)
  const dragFillStartRef = useRef<{ row: number; col: number } | null>(null)
  const dragFillCurrentRef = useRef<{ row: number; col: number } | null>(null)

  // Calculate optimal column widths based on content
  useEffect(() => {
    if (!data.length) return

    const calculateColumnWidths = () => {
      const cols = data[0].length
      const widths: number[] = []

      // Start with minimum width for row header
      widths.push(60)

      // Calculate widths for data columns
      for (let col = 0; col < cols; col++) {
        let maxWidth = 100 // minimum width

        // Check all rows in this column
        for (let row = 0; row < Math.min(data.length, 100); row++) { // Check first 100 rows for performance
          const cellValue = data[row]?.[col]
          if (cellValue !== undefined && cellValue !== null) {
            const { displayValue } = renderCellValue(cellValue)

            // Estimate width based on character count (rough approximation)
            const estimatedWidth = Math.max(displayValue.length * 8 + 20, 100) // 8px per char + padding
            maxWidth = Math.max(maxWidth, estimatedWidth)
          }
        }

        // Cap maximum width
        maxWidth = Math.min(maxWidth, 300)
        widths.push(maxWidth)
      }

      setColumnWidths(widths)
    }

    calculateColumnWidths()
  }, [data])

  // Handle cell click for selection
  const handleCellClick = useCallback((row: number, col: number, event: React.MouseEvent) => {
    // Always set the focused cell when clicking
    setFocusedCell({ row, col })

    if (externalIsSelecting) {
      // In external selection mode, select the row and call onRangeSelect
      onRowSelectionChange?.({ [row.toString()]: true })
      onRangeSelect?.({ startRow: row, startCol: col, endRow: row, endCol: col })
    } else if (event.shiftKey && selectedCell) {
      // Shift+click for range selection
      const startRow = Math.min(selectedCell.row, row)
      const endRow = Math.max(selectedCell.row, row)
      const startCol = Math.min(selectedCell.col, col)
      const endCol = Math.max(selectedCell.col, col)

      onRowSelectionChange?.({ [row.toString()]: true })
      onRangeSelect?.({ startRow, startCol, endRow, endCol })
    } else {
      // Regular click for single cell selection - also call onRangeSelect for unguided flow
      onCellSelect?.(row, col, data[row]?.[col])
      // Call onRangeSelect for unguided flow
      onRangeSelect?.({ startRow: row, startCol: col, endRow: row, endCol: col })
    }
  }, [externalIsSelecting, selectedCell, onCellSelect, data, onRowSelectionChange, onRangeSelect])

  // Handle double click to add to context
  const handleCellDoubleClick = useCallback((_row: number, _col: number, _event: React.MouseEvent) => {
    if (!externalIsSelecting && selectedRange) {
      // This will be handled by the parent component to add the range to context
    }
  }, [externalIsSelecting, selectedRange])

  // Handle mouse down for drag selection
  const handleMouseDown = useCallback((row: number, col: number, _event: React.MouseEvent) => {
    setDragStart({ row, col })
    setHasDragged(false) // Reset drag state
    // Don't immediately call onRangeSelect - wait for mouse enter or mouse up
    onRowSelectionChange?.({ [row.toString()]: true })
  }, [onRowSelectionChange])

  // Handle mouse enter for drag selection
  const handleMouseEnter = useCallback((row: number, col: number) => {
    if (dragFillStartRef.current) {
      dragFillCurrentRef.current = { row, col }
    }
    if (dragStart) {
      setHasDragged(true) // Mark that we've actually dragged
      const startRow = Math.min(dragStart.row, row)
      const endRow = Math.max(dragStart.row, row)
      const startCol = Math.min(dragStart.col, col)
      const endCol = Math.max(dragStart.col, col)

      // Only call onRangeSelect if the range actually changed
      const newRange = { startRow, startCol, endRow, endCol }
      const currentRange = selectedRange

      if (!currentRange ||
        currentRange.startRow !== startRow ||
        currentRange.startCol !== startCol ||
        currentRange.endRow !== endRow ||
        currentRange.endCol !== endCol) {

        // Select the current row
        onRowSelectionChange?.({ [row.toString()]: true })
        // Call onRangeSelect for the range
        onRangeSelect?.(newRange)
      }
    }
  }, [dragStart, onRowSelectionChange, onRangeSelect, selectedRange])

  // Handle copy functionality
  const handleCopy = useCallback((event: KeyboardEvent) => {
    if ((event.ctrlKey || event.metaKey) && event.key === 'c') {
      event.preventDefault()

      if (focusedCell) {
        const { row, col } = focusedCell
        const cellValue = data[row]?.[col]
        const { displayValue } = renderCellValue(cellValue)

        // Copy to clipboard
        navigator.clipboard.writeText(displayValue).catch(_err => {
          // Fallback for older browsers
          const textArea = document.createElement('textarea')
          textArea.value = displayValue
          document.body.appendChild(textArea)
          textArea.select()
          document.execCommand('copy')
          document.body.removeChild(textArea)
        })
      } else if (selectedRange) {
        // Copy range of cells
        const { startRow, endRow, startCol, endCol } = selectedRange
        const rows: string[] = []

        for (let row = startRow; row <= endRow; row++) {
          const rowData: string[] = []
          for (let col = startCol; col <= endCol; col++) {
            const cellValue = data[row]?.[col]
            const { displayValue } = renderCellValue(cellValue)
            rowData.push(displayValue)
          }
          rows.push(rowData.join('\t'))
        }

        const rangeText = rows.join('\n')
        navigator.clipboard.writeText(rangeText).catch(_err => {
          // Fallback for older browsers
          const textArea = document.createElement('textarea')
          textArea.value = rangeText
          document.body.appendChild(textArea)
          textArea.select()
          document.execCommand('copy')
          document.body.removeChild(textArea)
        })
      }
    }
  }, [focusedCell, selectedRange, data])

  // Handle mouse up to clear drag state
  useEffect(() => {
    const handleGlobalMouseUp = (_event: MouseEvent) => {
      if (dragStart) {
        // Only call onRangeSelect if we didn't actually drag
        if (!hasDragged) {
          // This was a click without dragging
          onRangeSelect?.({ startRow: dragStart.row, startCol: dragStart.col, endRow: dragStart.row, endCol: dragStart.col })
        }
        setDragStart(null)
        setHasDragged(false)
      }
    }

    const handleGlobalClick = (_event: MouseEvent) => {
      if (dragStart) {
        setDragStart(null)
        setHasDragged(false)
      }
      if (dragFillStartRef.current) {
        dragFillStartRef.current = null
        dragFillCurrentRef.current = null
      }
    }

    const handleGlobalKeyDown = (event: KeyboardEvent) => {
      // Handle escape key for both drag and selection
      if (event.key === 'Escape') {
        if (dragStart) {
          setDragStart(null)
          setHasDragged(false)
        }
        // Also clear selection and focus
        setFocusedCell(null)
        onRangeSelect?.(null)
        onRowSelectionChange?.({})
        return
      }

      // Handle copy functionality
      handleCopy(event)

      // Handle arrow keys for navigation (only if we have a focused cell)
      if (focusedCell && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) {
        event.preventDefault()
        const { row, col } = focusedCell
        const maxRow = data.length - 1
        const maxCol = data[0]?.length - 1 || 0

        let newRow = row
        let newCol = col

        switch (event.key) {
          case 'ArrowUp':
            if (row > 0) newRow = row - 1
            break
          case 'ArrowDown':
            if (row < maxRow) newRow = row + 1
            break
          case 'ArrowLeft':
            if (col > 0) newCol = col - 1
            break
          case 'ArrowRight':
            if (col < maxCol) newCol = col + 1
            break
        }

        if (newRow !== row || newCol !== col) {
          setFocusedCell({ row: newRow, col: newCol })

          if (event.shiftKey) {
            // Shift+arrow for range selection
            const startRow = Math.min(focusedCell.row, newRow)
            const endRow = Math.max(focusedCell.row, newRow)
            const startCol = Math.min(focusedCell.col, newCol)
            const endCol = Math.max(focusedCell.col, newCol)
            onRangeSelect?.({ startRow, startCol, endRow, endCol })
          } else {
            // Normal arrow navigation
            onCellSelect?.(newRow, newCol, data[newRow]?.[newCol])
          }
        }
      }
    }

    document.addEventListener('mouseup', handleGlobalMouseUp, { capture: true })
    document.addEventListener('click', handleGlobalClick, { capture: true })
    document.addEventListener('keydown', handleGlobalKeyDown, { capture: true })

    return () => {
      document.removeEventListener('mouseup', handleGlobalMouseUp, { capture: true })
      document.removeEventListener('click', handleGlobalClick, { capture: true })
      document.removeEventListener('keydown', handleGlobalKeyDown, { capture: true })
    }
  }, [dragStart, onRangeSelect, focusedCell, data, onCellSelect, onRowSelectionChange, hasDragged, handleCopy])

  // Clear selectedRange when clicking outside the table (unless in external selection mode)
  useEffect(() => {
    const handleGlobalClick = (event: MouseEvent) => {
      // If we're not in external selection mode and the click is outside the table
      if (!externalIsSelecting && tableContainerRef.current && !tableContainerRef.current.contains(event.target as Node)) {
        onRangeSelect?.(null)
        onRowSelectionChange?.({})
      }
    }

    document.addEventListener('click', handleGlobalClick)
    return () => document.removeEventListener('click', handleGlobalClick)
  }, [externalIsSelecting, onRangeSelect, onRowSelectionChange])

  // Handle keyboard navigation
  const handleKeyDown = useCallback((event: React.KeyboardEvent, row: number, col: number) => {
    const maxRow = data.length - 1
    const maxCol = data[0]?.length - 1 || 0

    switch (event.key) {
      case 'ArrowUp':
        event.preventDefault()
        if (row > 0) {
          const newRow = row - 1
          setFocusedCell({ row: newRow, col })

          if (event.shiftKey) {
            // Shift+arrow for range selection
            const startRow = Math.min(focusedCell?.row || newRow, newRow)
            const endRow = Math.max(focusedCell?.row || newRow, newRow)
            const startCol = Math.min(focusedCell?.col || col, col)
            const endCol = Math.max(focusedCell?.col || col, col)
            onRangeSelect?.({ startRow, startCol, endRow, endCol })
          } else {
            // Normal arrow navigation
            onCellSelect?.(newRow, col, data[newRow]?.[col])
          }
        }
        break
      case 'ArrowDown':
        event.preventDefault()
        if (row < maxRow) {
          const newRow = row + 1
          setFocusedCell({ row: newRow, col })

          if (event.shiftKey) {
            // Shift+arrow for range selection
            const startRow = Math.min(focusedCell?.row || newRow, newRow)
            const endRow = Math.max(focusedCell?.row || newRow, newRow)
            const startCol = Math.min(focusedCell?.col || col, col)
            const endCol = Math.max(focusedCell?.col || col, col)
            onRangeSelect?.({ startRow, startCol, endRow, endCol })
          } else {
            // Normal arrow navigation
            onCellSelect?.(newRow, col, data[newRow]?.[col])
          }
        }
        break
      case 'ArrowLeft':
        event.preventDefault()
        if (col > 0) {
          const newCol = col - 1
          setFocusedCell({ row, col: newCol })

          if (event.shiftKey) {
            // Shift+arrow for range selection
            const startRow = Math.min(focusedCell?.row || row, row)
            const endRow = Math.max(focusedCell?.row || row, row)
            const startCol = Math.min(focusedCell?.col || newCol, newCol)
            const endCol = Math.max(focusedCell?.col || newCol, newCol)
            onRangeSelect?.({ startRow, startCol, endRow, endCol })
          } else {
            // Normal arrow navigation
            onCellSelect?.(row, newCol, data[row]?.[newCol])
          }
        }
        break
      case 'ArrowRight':
        event.preventDefault()
        if (col < maxCol) {
          const newCol = col + 1
          setFocusedCell({ row, col: newCol })

          if (event.shiftKey) {
            // Shift+arrow for range selection
            const startRow = Math.min(focusedCell?.row || row, row)
            const endRow = Math.max(focusedCell?.row || row, row)
            const startCol = Math.min(focusedCell?.col || newCol, newCol)
            const endCol = Math.max(focusedCell?.col || newCol, newCol)
            onRangeSelect?.({ startRow, startCol, endRow, endCol })
          } else {
            // Normal arrow navigation
            onCellSelect?.(row, newCol, data[row]?.[newCol])
          }
        }
        break
      case 'Escape':
        event.preventDefault()
        // Clear current selection and focus
        setFocusedCell(null)
        onRangeSelect?.(null)
        onRowSelectionChange?.({})
        break
    }
  }, [data, onCellSelect, focusedCell, onRangeSelect, onRowSelectionChange])

  // Check if a cell is in the current selection range
  const isCellInSelection = useCallback((row: number, _col: number) => {
    return rowSelection[row.toString()] === true
  }, [rowSelection])

  // Check if cell is in selected range
  const isCellInSelectedRange = useCallback((row: number, col: number) => {
    if (!selectedRange) return false
    return row >= selectedRange.startRow &&
      row <= selectedRange.endRow &&
      col >= selectedRange.startCol &&
      col <= selectedRange.endCol
  }, [selectedRange])

  // Check if cell is in any context range
  const isCellInContextRange = useCallback((row: number, col: number) => {
    if (!contextRanges?.length) return null
    return contextRanges.find(cr =>
      row >= cr.range.startRow &&
      row <= cr.range.endRow &&
      col >= cr.range.startCol &&
      col <= cr.range.endCol
    )
  }, [contextRanges])

  // Create columns definition
  const columns = useMemo<ColumnDef<any>[]>(() => {
    if (!data.length) return []

    const cols = data[0].length
    const columnDefs: ColumnDef<any>[] = [
      {
        id: 'rowHeader',
        header: '#',
        accessorFn: (_, index) => index + 1,
        size: columnWidths[0] || 60,
        minSize: 60,
        maxSize: 500,
        cell: ({ getValue }) => (
          <div className="border border-border bg-muted/50 text-xs font-medium p-2 text-center min-h-[40px] flex items-center justify-center">
            {getValue() as number}
          </div>
        )
      }
    ]

    // Add data columns
    for (let i = 0; i < cols; i++) {
      const colLetter = columnToLetter(i)
      const colWidth = columnWidths[i + 1] || 150

      columnDefs.push({
        id: `col_${i}`,
        header: colLetter,
        accessorFn: (row: any[]) => row[i] || '',
        size: colWidth,
        minSize: 100,
        maxSize: 400,
        cell: ({ getValue, row, column }) => {
          const cell = getValue() as SpreadsheetCell
          const rowIndex = row.index
          const colIndex = parseInt(column.id.split('_')[1])
          const isSelected = selectedCell?.row === rowIndex && selectedCell?.col === colIndex
          const isRowSelected = rowSelection[rowIndex.toString()] === true
          const inSelectedRange = isCellInSelectedRange(rowIndex, colIndex)
          const inContextRange = isCellInContextRange(rowIndex, colIndex)
          const isFocused = focusedCell?.row === rowIndex && focusedCell?.col === colIndex

          const { displayValue, tooltipValue, type, hasTooltip, hasError } = renderCellValue(cell)

          // Determine background color based on context
          let bgColor = ''
          let borderColor = ''
          let borderStyle = ''
          let ringAnimation = ''

          if (inContextRange) {
            // Permanent context ranges - solid borders
            if (inContextRange.type === 'input') {
              bgColor = 'bg-orange-50 dark:bg-orange-900/10'
              borderColor = 'border-orange-300 dark:border-orange-700'
            } else {
              bgColor = 'bg-purple-50 dark:bg-purple-900/10'
              borderColor = 'border-purple-300 dark:border-purple-700'
            }
          } else if (inSelectedRange) {
            // Temporary selection - dotted border
            if (outputMode) {
              borderColor = 'border-purple-300 dark:border-purple-600'
            } else {
              borderColor = 'border-orange-300 dark:border-orange-600'
            }
            borderStyle = 'border-dashed'
          } else if (isRowSelected) {
            bgColor = 'bg-blue-50 dark:bg-blue-900/10'
          } else if (isSelected) {
            bgColor = 'bg-blue-100 dark:bg-blue-900/20'
          }

          const cellContent = (
            <div
              className={cn(
                "border border-border p-2 text-sm transition-colors min-h-[40px] flex items-center select-none relative",
                "hover:bg-muted/50 focus:outline-none",
                externalIsSelecting ? "cursor-crosshair" : "cursor-pointer",
                bgColor,
                borderColor,
                borderStyle,
                ringAnimation,
                // Focus indicator - Excel-style thin border
                isFocused && "ring-1 ring-blue-600 dark:ring-blue-400 ring-offset-0"
              )}
              onClick={(e) => handleCellClick(rowIndex, colIndex, e)}
              onDoubleClick={(e) => handleCellDoubleClick(rowIndex, colIndex, e)}
              onMouseDown={(e) => handleMouseDown(rowIndex, colIndex, e)}
              onMouseEnter={() => handleMouseEnter(rowIndex, colIndex)}
              tabIndex={0}
              onKeyDown={(e) => handleKeyDown(e, rowIndex, colIndex)}
              onFocus={() => setFocusedCell({ row: rowIndex, col: colIndex })}
            >
              <span className="truncate block w-full">
                {displayValue}
              </span>
              {/* Visual indicator for cells with errors - small red triangle at bottom right */}
              {hasError && (
                <div className="absolute bottom-0 right-0 w-0 h-0 border-l-[6px] border-l-transparent border-b-[6px] border-b-red-500 opacity-60" />
              )}
            </div>
          )

          // Only wrap with tooltip if hasTooltip is true
          if (hasTooltip) {
            return (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    {cellContent}
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-xs">
                    <div className="text-xs">
                      <div className="font-medium mb-1">Cell {columnToLetter(colIndex)}{rowIndex + 1}</div>
                      <div className="text-muted-foreground mb-1">Type: {type}</div>
                      <div className="break-words">{tooltipValue}</div>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )
          }

          return cellContent
        }
      })
    }

    return columnDefs
  }, [data, selectedCell, onCellSelect, columnWidths, isCellInSelection, isCellInSelectedRange, handleMouseDown, handleMouseEnter, handleKeyDown, focusedCell, isCellInContextRange, outputMode, selectedRange])

  // Create table instance
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    columnResizeMode: 'onChange',
    enableColumnResizing: true,
    enableRowSelection: true,
    enableMultiRowSelection: true,
    onRowSelectionChange: onRowSelectionChange,
    state: {
      rowSelection,
    },
  })

  // Set up row virtualizer
  const { rows } = table.getRowModel()
  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => tableContainerRef.current,
    estimateSize: () => 40,
    overscan: 10,
  })

  if (!data.length) {
    return (
      <div className={cn("flex items-center justify-center h-full text-muted-foreground", className)}>
        No data available
      </div>
    )
  }

  const totalWidth = columnWidths.reduce((sum, width) => sum + width, 0)

  return (
    <div
      ref={tableContainerRef}
      className={cn(
        "h-full w-full overflow-auto",
        externalIsSelecting && "ring-2 ring-orange-500 ring-opacity-50",
        className
      )}
      style={{ height: '100%' }}
      onMouseUp={() => {
        if (dragStart) {
          setDragStart(null)
        }
      }}
    >
      <div style={{ height: `${rowVirtualizer.getTotalSize()}px`, position: 'relative', width: `${totalWidth}px` }}>
        {/* Header */}
        <div className="sticky top-0 z-10 bg-background flex" style={{ width: `${totalWidth}px` }}>
          {table.getHeaderGroups().map(headerGroup => (
            headerGroup.headers.map(header => (
              <div
                key={header.id}
                style={{
                  width: header.getSize(),
                  minWidth: header.getSize(),
                  position: 'relative'
                }}
                className="border border-border bg-muted/50 text-xs font-medium p-2 min-h-[40px] flex items-center justify-center"
              >
                {flexRender(
                  header.column.columnDef.header,
                  header.getContext()
                )}
                {header.column.getCanResize() && (
                  <div
                    onMouseDown={header.getResizeHandler()}
                    onTouchStart={header.getResizeHandler()}
                    className={cn(
                      'absolute right-0 top-0 h-full w-1 cursor-col-resize select-none touch-none',
                      header.column.getIsResizing() ? 'bg-blue-500' : 'bg-transparent hover:bg-blue-300'
                    )}
                  />
                )}
              </div>
            ))
          ))}
        </div>

        {/* Rows */}
        {rowVirtualizer.getVirtualItems().map(virtualRow => {
          const row = rows[virtualRow.index]
          return (
            <div
              key={row.id}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: `${totalWidth}px`,
                height: `${virtualRow.size}px`,
                transform: `translateY(${virtualRow.start}px)`,
                display: 'flex'
              }}
            >
              {row.getVisibleCells().map(cell => (
                <div
                  key={cell.id}
                  style={{
                    width: cell.column.getSize(),
                    minWidth: cell.column.getSize()
                  }}
                >
                  {flexRender(
                    cell.column.columnDef.cell,
                    cell.getContext()
                  )}
                </div>
              ))}
            </div>
          )
        })}
      </div>
    </div>
  )
}

const columnToLetter = (col: number): string => {
  let temp = col + 1
  let letter = ''
  while (temp > 0) {
    const mod = (temp - 1) % 26
    letter = String.fromCharCode(65 + mod) + letter
    temp = Math.floor((temp - 1) / 26)
  }
  return letter
}   