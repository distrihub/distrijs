import React, { useEffect } from 'react'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { X, Plus, AtSign, ArrowRight, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ContextRange } from '@/types'
import { rangeToA1, formatRangeDisplay } from '@/utils/sheet'
import { useRangeContextStore } from '@/stores/rangeContext'

interface RangeSelectorProps {
  className?: string
  currentSheetId?: number
  currentSheetTitle?: string
}

export const RangeSelector: React.FC<RangeSelectorProps> = ({
  className,
  currentSheetId,
  currentSheetTitle
}) => {
  const {
    selectedRange,
    isSelecting,
    selectionType,
    contextRanges,
    currentSheetId: storeCurrentSheetId,
    currentSheetTitle: storeCurrentSheetTitle,
    setSelectedRange,
    addContextRange,
    removeContextRange,
    startSelection,
    cancelSelection,
    setCurrentSheet,
  } = useRangeContextStore()

  // Use props if provided, otherwise use store values
  const effectiveCurrentSheetId = currentSheetId ?? storeCurrentSheetId
  const effectiveCurrentSheetTitle = currentSheetTitle ?? storeCurrentSheetTitle

  // Update store with current sheet information when props change
  useEffect(() => {
    if (currentSheetId && currentSheetTitle) {
      setCurrentSheet(currentSheetId, currentSheetTitle)
    }
  }, [currentSheetId, currentSheetTitle, setCurrentSheet])

  const rangeText = selectedRange ? rangeToA1(selectedRange) : ''

  // Handle guided flow - when in selection mode, automatically add the range
  useEffect(() => {
    if (isSelecting && selectedRange && selectionType && effectiveCurrentSheetId && effectiveCurrentSheetTitle) {
      // Check if this range is already in context ranges
      const isAlreadyInContext = contextRanges.some(cr =>
        cr.range.startRow === selectedRange.startRow &&
        cr.range.startCol === selectedRange.startCol &&
        cr.range.endRow === selectedRange.endRow &&
        cr.range.endCol === selectedRange.endCol &&
        cr.sheetId === effectiveCurrentSheetId
      )

      // If not already in context, add it
      if (!isAlreadyInContext) {
        if (selectionType === 'input') {
          const newContextRange: ContextRange = {
            id: `input-${Date.now()}`,
            range: selectedRange,
            type: 'input',
            name: `Input ${contextRanges.filter(cr => cr.type === 'input').length + 1}`,
            a1Notation: rangeToA1(selectedRange),
            sheetId: effectiveCurrentSheetId,
            sheetTitle: effectiveCurrentSheetTitle
          }
          addContextRange(newContextRange)
        } else {
          // Remove existing output range if any
          const existingOutput = contextRanges.find(cr => cr.type === 'output')
          if (existingOutput) {
            removeContextRange(existingOutput.id)
          }

          const newContextRange: ContextRange = {
            id: `output-${Date.now()}`,
            range: selectedRange,
            type: 'output',
            name: 'Output',
            a1Notation: rangeToA1(selectedRange),
            sheetId: effectiveCurrentSheetId,
            sheetTitle: effectiveCurrentSheetTitle
          }
          addContextRange(newContextRange)
        }

        // End selection mode after adding
        cancelSelection()
      }
    }
  }, [selectedRange, isSelecting, selectionType, addContextRange, contextRanges, removeContextRange, cancelSelection, effectiveCurrentSheetId, effectiveCurrentSheetTitle])

  // Handle unguided flow - when not in selection mode, temporarily show the range
  useEffect(() => {
    if (!isSelecting && selectedRange) {
      console.log('RangeSelector: selectedRange changed (unguided mode)', selectedRange)
      // In unguided mode, we don't add to context ranges - just show the selection temporarily
      // The range will be cleared when selection changes or user clicks elsewhere
    }
  }, [selectedRange, isSelecting])

  // Check if selectedRange is already in context ranges
  const isSelectedRangeInContext = selectedRange ? contextRanges.some(cr =>
    cr.range.startRow === selectedRange.startRow &&
    cr.range.startCol === selectedRange.startCol &&
    cr.range.endRow === selectedRange.endRow &&
    cr.range.endCol === selectedRange.endCol &&
    cr.sheetId === effectiveCurrentSheetId
  ) : false

  const handleStartSelection = (type: 'input' | 'output') => {
    console.log('RangeSelector: handleStartSelection called with type', type)
    startSelection(type)
  }

  const handleCancelSelection = () => {
    console.log('RangeSelector: handleCancelSelection called')
    cancelSelection()
  }

  const hasOutputRange = contextRanges.some(cr => cr.type === 'output')
  const currentOutputRange = contextRanges.find(cr => cr.type === 'output')
  const inputRanges = contextRanges.filter(cr => cr.type === 'input')

  return (
    <div className="space-y-3">
      {/* Main Range Selector */}
      <div className={cn(
        "bg-background border border-border rounded-lg p-3 shadow-sm",
        "flex flex-col gap-3",
        className
      )}>
        {/* Header */}
        {/* Two Column Layout */}
        <div className="grid grid-cols-2 gap-4">
          {/* Input Column */}
          <div className="space-y-2">
            <div className="flex items-center justify-start">
              <Badge variant="secondary" className="text-xs">
                <AtSign className="w-3 h-3 mr-1" />
                Context
              </Badge>
              {!isSelecting && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleStartSelection('input')}
                  className="flex items-center gap-1 h-6 px-2"
                  disabled={isSelecting}
                >
                  <Plus className="w-3 h-3" />
                </Button>
              )}
            </div>

            <div className="space-y-1">
              {inputRanges.map((contextRange) => (
                <div
                  key={contextRange.id}
                  className={cn(
                    "inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs",
                    "bg-orange-100 dark:bg-orange-900/20 text-orange-800 dark:text-orange-200",
                    "border border-orange-200 dark:border-orange-800"
                  )}
                >
                  <span className="font-mono">@{formatRangeDisplay(contextRange.a1Notation, contextRange.sheetTitle, effectiveCurrentSheetTitle)}</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      console.log('RangeSelector: remove button clicked for id', contextRange.id)
                      removeContextRange(contextRange.id)
                    }}
                    className="h-4 w-4 p-0 hover:bg-orange-200 dark:hover:bg-orange-800"
                    title={`Remove ${contextRange.name}`}
                  >
                    <X className="w-2 h-2" />
                  </Button>
                </div>
              ))}

              {/* Show temporary selection if not in context and not in selection mode */}
              {!isSelecting && selectedRange && !isSelectedRangeInContext && effectiveCurrentSheetId && effectiveCurrentSheetTitle && (
                <div
                  className={cn(
                    "inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs",
                    "bg-orange-50 dark:bg-orange-900/10 text-orange-700 dark:text-orange-300",
                    "border border-orange-300 dark:border-orange-600 border-dashed"
                  )}
                >
                  <span className="font-mono">@{rangeText}</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      console.log('RangeSelector: make temporary selection permanent')
                      const newContextRange: ContextRange = {
                        id: `input-${Date.now()}`,
                        range: selectedRange,
                        type: 'input',
                        name: `Input ${contextRanges.filter(cr => cr.type === 'input').length + 1}`,
                        a1Notation: rangeText,
                        sheetId: effectiveCurrentSheetId,
                        sheetTitle: effectiveCurrentSheetTitle
                      }
                      addContextRange(newContextRange)
                      setSelectedRange(null)
                    }}
                    className="h-4 w-4 p-0 hover:bg-green-200 dark:hover:bg-green-800 text-green-600 dark:text-green-400"
                    title="Add to permanent context"
                  >
                    <Check className="w-2 h-2" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      console.log('RangeSelector: remove temporary selection')
                      setSelectedRange(null)
                    }}
                    className="h-4 w-4 p-0 hover:bg-orange-200 dark:hover:bg-orange-800"
                    title="Remove temporary selection"
                  >
                    <X className="w-2 h-2" />
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Output Column */}
          <div className="space-y-2">
            <div className="flex items-center justify-end">
              {!isSelecting && !hasOutputRange && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleStartSelection('output')}
                  className="flex items-center gap-1 h-6 px-2"
                  disabled={isSelecting}
                >
                  <Plus className="w-3 h-3" />
                </Button>
              )}
              <Badge variant="default" className="text-xs">
                <ArrowRight className="w-3 h-3 mr-1" />
                Output
              </Badge>

            </div>

            <div className="space-y-1">
              {currentOutputRange && (
                <div
                  className={cn(
                    "inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs",
                    "bg-purple-100 dark:bg-purple-900/20 text-purple-800 dark:text-purple-200",
                    "border border-purple-200 dark:border-purple-800"
                  )}
                >
                  <span className="font-mono">@{formatRangeDisplay(currentOutputRange.a1Notation, currentOutputRange.sheetTitle, effectiveCurrentSheetTitle)}</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      console.log('RangeSelector: remove output button clicked for id', currentOutputRange.id)
                      removeContextRange(currentOutputRange.id)
                    }}
                    className="h-4 w-4 p-0 hover:bg-purple-200 dark:hover:bg-purple-800"
                    title="Remove output range"
                  >
                    <X className="w-2 h-2" />
                  </Button>
                </div>
              )}

            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isSelecting ? (
            <div className="flex items-center gap-2 justify-between">

              <Badge
                variant="default"
                className={cn(
                  "text-xs animate-pulse",
                  selectionType === 'output' ? "bg-purple-500 text-white" : "bg-orange-500 text-white"
                )}
              >
                {selectionType === 'output' ? (
                  <>
                    <AtSign className="w-3 h-3 mr-1" />
                    Selecting Output
                  </>
                ) : (
                  <>
                    <ArrowRight className="w-3 h-3 mr-1" />
                    Selecting Input
                  </>
                )}
              </Badge>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleCancelSelection}
                className="flex items-center gap-1"
              >
                <X className="w-3 h-3" />
                Cancel
              </Button>
            </div>
          ) : (
            <div className="pt-2 border-t border-border">
              <div className="text-xs text-muted-foreground text-center mx-auto">
                Select a range in the table to add context
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  )
} 