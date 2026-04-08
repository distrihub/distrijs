import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';

interface DiagnosePanelProps {
  open: boolean;
  onClose: () => void;
  threadId: string;
}

export function DiagnosePanel({ open, onClose, threadId }: DiagnosePanelProps) {
  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="right" className="w-[480px] sm:max-w-[480px] p-0 flex flex-col">
        <SheetHeader className="px-6 pt-6 pb-4 border-b border-border">
          <SheetTitle>Diagnose</SheetTitle>
          <SheetDescription>
            AI-powered analysis of your agent session
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-muted-foreground">
          <p className="text-sm">Diagnose panel connects to the distri agent with the diagnose skill.</p>
          <p className="text-xs mt-2 font-mono text-muted-foreground/60">thread: {threadId}</p>
          <p className="text-xs mt-4 text-muted-foreground/40">Chat integration coming soon</p>
        </div>
      </SheetContent>
    </Sheet>
  );
}
