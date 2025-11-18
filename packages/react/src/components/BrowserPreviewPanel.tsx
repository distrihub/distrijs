import React from 'react';
import { cn } from '@/lib/utils';

interface BrowserPreviewPanelProps {
  frameSrc: string;
  timestampLabel?: string | null;
  className?: string;
}

export const BrowserPreviewPanel: React.FC<BrowserPreviewPanelProps> = ({
  frameSrc,
  timestampLabel,
  className,
}) => {
  return (
    <div
      className={cn(
        'rounded-xl border bg-muted/40 shadow-sm overflow-hidden',
        className,
      )}
    >
      <div className="flex items-center justify-between px-3 py-2 border-b bg-background/70 backdrop-blur text-xs text-muted-foreground">
        <span className="text-xs sm:text-sm font-medium text-foreground">Live browser preview</span>
        {timestampLabel && (
          <span className="text-[11px] text-muted-foreground/80">Updated {timestampLabel}</span>
        )}
      </div>
      <div className="bg-background">
        <img
          src={frameSrc}
          alt="Browser screenshot"
          className="block w-full h-auto object-contain"
        />
      </div>
    </div>
  );
};

export default BrowserPreviewPanel;
