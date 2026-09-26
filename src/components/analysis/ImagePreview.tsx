import React from 'react';
import { formatBytes } from '../../lib/utils';
import { X, Maximize2, HardDrive, FileText, Scan } from 'lucide-react';
import { cn } from '../../lib/utils';

interface ImagePreviewProps {
  previewUrl: string;
  filename: string;
  dimensions: [number, number] | null;
  fileSizeBytes: number;
  isAnalyzing: boolean;
  onRemove: () => void;
  className?: string;
}

export const ImagePreview: React.FC<ImagePreviewProps> = ({
  previewUrl,
  filename,
  dimensions,
  fileSizeBytes,
  isAnalyzing,
  onRemove,
  className
}) => {
  return (
    <div className={cn('flex flex-col space-y-3 w-full', className)}>
      {/* Container with hairline border & precision viewport */}
      <div className="relative rounded-xl border border-border bg-surface/50 overflow-hidden group">
        {/* Corner marks */}
        <div className="absolute top-3 left-3 w-3.5 h-3.5 border-t-2 border-l-2 border-foreground/40 pointer-events-none z-10" />
        <div className="absolute top-3 right-3 w-3.5 h-3.5 border-t-2 border-r-2 border-foreground/40 pointer-events-none z-10" />
        <div className="absolute bottom-3 left-3 w-3.5 h-3.5 border-b-2 border-l-2 border-foreground/40 pointer-events-none z-10" />
        <div className="absolute bottom-3 right-3 w-3.5 h-3.5 border-b-2 border-r-2 border-foreground/40 pointer-events-none z-10" />

        {/* Image Display */}
        <div className="relative min-h-[380px] max-h-[520px] w-full flex items-center justify-center p-6 forensic-grid bg-white dark:bg-neutral-950">
          <img
            src={previewUrl}
            alt={filename}
            className="max-h-[460px] max-w-full object-contain rounded-md shadow-sm"
          />

          {/* Scanning Animation */}
          {isAnalyzing && (
            <div className="absolute inset-0 pointer-events-none overflow-hidden bg-background/25 flex flex-col justify-between">
              {/* Scan Line */}
              <div className="w-full h-1 bg-foreground shadow-[0_0_12px_rgba(0,0,0,0.5)] dark:shadow-[0_0_12px_rgba(255,255,255,0.7)] animate-scan" />

              {/* Status Badge */}
              <div className="absolute inset-x-0 bottom-6 flex justify-center">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-md bg-background/95 border border-border text-xs font-mono tracking-widest text-foreground shadow-sm">
                  <Scan size={14} className="animate-spin text-foreground" />
                  <span>SCANNING</span>
                </div>
              </div>
            </div>
          )}

          {/* Remove Button */}
          {!isAnalyzing && (
            <button
              onClick={onRemove}
              className="absolute top-4 right-4 p-2 rounded-full bg-background/90 hover:bg-background border border-border text-muted-foreground hover:text-foreground shadow-sm transition-colors z-20"
              title="Remove"
              aria-label="Remove image"
            >
              <X size={15} />
            </button>
          )}
        </div>
      </div>

      {/* Non-bulky metadata bar with genuine icons */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-1 text-sm font-mono text-muted-foreground">
        <div className="flex items-center gap-2 truncate max-w-[320px]">
          <FileText size={15} className="shrink-0 text-muted-foreground" />
          <span className="truncate text-foreground font-medium">{filename}</span>
        </div>

        <div className="flex items-center gap-4 shrink-0 text-xs">
          {dimensions && (
            <div className="flex items-center gap-1.5">
              <Maximize2 size={14} />
              <span>{dimensions[0]} × {dimensions[1]}</span>
            </div>
          )}
          <div className="flex items-center gap-1.5">
            <HardDrive size={14} />
            <span>{formatBytes(fileSizeBytes)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
