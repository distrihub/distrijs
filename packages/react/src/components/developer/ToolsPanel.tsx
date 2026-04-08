import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronRight, Play } from 'lucide-react';
import { useChatStateStore } from '@/stores/chatStateStore';
import { DistriAnyTool } from '@/types';
import { ChatSimulation } from './ChatSimulation';
import { AgentDefinition } from '@distri/core';

interface ToolsPanelProps {
  open: boolean;
  onClose: () => void;
  triggerTool?: (toolName: string, input: any) => Promise<void>;
  threadId?: string;
  agentDefinition?: AgentDefinition | null;
}

export function ToolsPanel({ open, onClose, threadId = 'developer-tools', agentDefinition }: ToolsPanelProps) {
  const externalTools = useChatStateStore(state => state.externalTools);
  const safeExternalTools: DistriAnyTool[] = externalTools ?? [];
  const [expandedTools, setExpandedTools] = useState<Set<string>>(new Set());

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
              {safeExternalTools.length} external tool{safeExternalTools.length !== 1 ? 's' : ''} available
            </SheetDescription>
          </SheetHeader>

          <div className="mt-4 space-y-2">
            {safeExternalTools.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">
                No external tools registered.
              </p>
            )}
            {safeExternalTools.map((tool) => {
              const isExpanded = expandedTools.has(tool.name);
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
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleExpand(tool.name);
                      }}
                    >
                      <Play className="h-3 w-3 mr-1" /> Simulate
                    </Button>
                  </div>
                  {isExpanded && (
                    <div className="px-3 pb-3 border-t border-border bg-muted/20">
                      <div className="pt-3">
                        <ChatSimulation
                          tool={tool}
                          threadId={threadId}
                          agentDefinition={agentDefinition}
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
