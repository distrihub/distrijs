import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronRight, Play } from 'lucide-react';
import { useChatStateStore } from '@/stores/chatStateStore';
import { SimulateModal } from './SimulateModal';
import { DistriAnyTool } from '@/types';

interface ToolsPanelProps {
  open: boolean;
  onClose: () => void;
  triggerTool: (toolName: string, input: any) => Promise<void>;
}

export function ToolsPanel({ open, onClose, triggerTool }: ToolsPanelProps) {
  const externalTools: DistriAnyTool[] = useChatStateStore(state => state.externalTools ?? []);
  const [expandedTools, setExpandedTools] = useState<Set<string>>(new Set());
  const [simulateTool, setSimulateTool] = useState<DistriAnyTool | null>(null);

  const toggleExpand = (name: string) => {
    setExpandedTools(prev => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  return (
    <>
      <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
        <SheetContent side="right" className="w-[420px] sm:max-w-[420px] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Tools</SheetTitle>
            <SheetDescription>
              {externalTools.length} external tool{externalTools.length !== 1 ? 's' : ''} available
            </SheetDescription>
          </SheetHeader>

          <div className="mt-4 space-y-2">
            {externalTools.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">
                No external tools registered.
              </p>
            )}
            {externalTools.map((tool) => {
              const isExpanded = expandedTools.has(tool.name);
              const schema = tool.parameters;
              return (
                <div key={tool.name} className="border border-border rounded-lg overflow-hidden">
                  <div
                    className="flex items-center justify-between p-3 cursor-pointer hover:bg-muted/50"
                    onClick={() => toggleExpand(tool.name)}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {isExpanded ? <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" /> : <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />}
                      <span className="text-sm font-mono font-medium truncate">{tool.name}</span>
                      <Badge variant="secondary" className="text-[10px] shrink-0">external</Badge>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-6 text-xs ml-2 shrink-0"
                      onClick={(e) => { e.stopPropagation(); setSimulateTool(tool as DistriAnyTool); }}
                    >
                      <Play className="h-3 w-3 mr-1" /> Simulate
                    </Button>
                  </div>
                  {isExpanded && (
                    <div className="px-3 pb-3 border-t border-border bg-muted/20">
                      {tool.description && (
                        <p className="text-xs text-muted-foreground mt-2 mb-3">{tool.description}</p>
                      )}
                      {schema && (
                        <pre className="text-[10px] bg-background border border-border rounded p-2 overflow-auto max-h-48 text-muted-foreground">
                          {JSON.stringify(schema, null, 2)}
                        </pre>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </SheetContent>
      </Sheet>

      {simulateTool && (
        <SimulateModal
          tool={simulateTool}
          open={true}
          onClose={() => setSimulateTool(null)}
          onSimulate={async (input) => {
            await triggerTool(simulateTool.name, input);
            setSimulateTool(null);
            onClose();
          }}
        />
      )}
    </>
  );
}
